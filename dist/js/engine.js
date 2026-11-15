/** Meridian time engine. All persisted trip/block boundaries are UTC epoch ms. */
const MINUTE = 60_000;
const QUARTER = 15 * MINUTE;
const WEEKDAYS = [1, 2, 3, 4, 5];

function timeLib() {
  const m = globalThis.moment;
  if (!m?.tz) throw new Error('Time-zone data is not available. Reload the app.');
  return m;
}

function assertZone(zone) {
  if (!timeLib().tz.zone(zone)) throw new RangeError(`Unknown time zone: ${zone}`);
}

function clockMinutes(value, allow24 = false) {
  if (allow24 && value === '24:00') return 1440;
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value || '')) return NaN;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Return every matching instant, never silently move a DST gap or pick a fold. */
export function localToInstants(date, time, zone) {
  assertZone(zone);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !Number.isFinite(clockMinutes(time))) return [];
  const m = timeLib();
  const text = `${date}T${time}`;
  const wall = m.utc(text, 'YYYY-MM-DDTHH:mm', true);
  if (!wall.isValid() || wall.format('YYYY-MM-DDTHH:mm') !== text) return [];
  const rules = m.tz.zone(zone);
  return [...new Set(rules.offsets)].map(offset => wall.valueOf() + offset * MINUTE)
    .filter(ms => m.tz(ms, zone).format('YYYY-MM-DDTHH:mm') === text)
    .filter((ms, index, all) => all.indexOf(ms) === index)
    .sort((a, b) => a - b);
}

export function localParts(ms, zone) {
  assertZone(zone);
  if (!Number.isFinite(ms)) throw new RangeError('A valid UTC timestamp is required.');
  const local = timeLib().tz(ms, zone);
  return {
    date: local.format('YYYY-MM-DD'),
    time: local.format('HH:mm'),
    weekday: local.day(),
    offset: `UTC${local.format('Z')}`,
    abbr: local.zoneAbbr(),
  };
}

function validRange(range) {
  return Number.isFinite(range.start) && Number.isFinite(range.end) && range.end > range.start;
}

function locationAt(member, ms) {
  const trip = (member.trips || []).filter(t => validRange(t) && t.start <= ms && ms < t.end)
    .sort((a, b) => b.start - a.start)[0];
  return trip ? { zone: trip.zone, city: trip.city || trip.zone, trip } : { zone: member.zone, city: member.city || member.zone, trip: null };
}

export function effectiveZone(member, ms) {
  return locationAt(member, ms).zone;
}

function windowStatus(local, start, end, days, allowExtended) {
  const minute = local.hours() * 60 + local.minutes() + local.seconds() / 60 + local.milliseconds() / MINUTE;
  const finish = end < start ? end + 1440 : end;
  let extended = false;
  // Overnight shifts and extensions may belong to the previous or next workday.
  for (const delta of [-1, 0, 1]) {
    if (!days.includes((local.day() + delta + 7) % 7)) continue;
    const from = delta * 1440 + start;
    const to = delta * 1440 + finish;
    if (minute >= from && minute < to) return 'preferred';
    if (allowExtended && minute >= from - 120 && minute < to + 120) extended = true;
  }
  return extended ? 'extended' : 'unavailable';
}

/** Evaluate the whole half-open meeting interval, including every minute boundary. */
export function memberStatus(member, startMs, durationMin, allowExtended = false) {
  if (!Number.isFinite(startMs) || !Number.isFinite(durationMin) || durationMin <= 0 || durationMin > 1440) {
    throw new RangeError('Meeting duration must be between 1 and 1440 minutes.');
  }
  const endMs = startMs + durationMin * MINUTE;
  const place = locationAt(member, startMs);
  const first = localParts(startMs, place.zone);
  const last = localParts(endMs, place.zone);
  const base = { zone: place.zone, city: place.city, localDate: first.date, localTime: first.time, endTime: last.time, endDate: last.date, offset: first.offset, abbr: first.abbr };
  const unavailable = reason => ({ ...base, status: 'unavailable', reason });
  const block = (member.blocks || []).find(b => validRange(b) && b.start < endMs && b.end > startMs);
  if (block) return unavailable(block.label || 'Marked unavailable');

  const trips = (member.trips || []).filter(validRange);
  const relevantTrips = trips.filter(t => t.start < endMs && t.end > startMs);
  for (let i = 0; i < relevantTrips.length; i++) {
    for (let j = i + 1; j < relevantTrips.length; j++) {
      const a = relevantTrips[i], b = relevantTrips[j];
      if (a.start < b.end && b.start < a.end && (a.zone !== b.zone || a.city !== b.city)) {
        return unavailable('Overlapping travel locations need checking');
      }
    }
  }
  for (const trip of trips) {
    for (const boundary of [trip.start, trip.end]) {
      if (boundary <= startMs || boundary >= endMs) continue;
      const next = locationAt(member, boundary);
      if (next.zone !== place.zone || next.city !== place.city) return unavailable('Travel location changes during this meeting');
    }
  }

  const workStart = clockMinutes(member.workStart || '09:00');
  const workEnd = clockMinutes(member.workEnd || '17:00', true);
  const days = Array.isArray(member.workDays) ? member.workDays : WEEKDAYS;
  if (!Number.isFinite(workStart) || !Number.isFinite(workEnd) || workStart === workEnd) return unavailable('Working hours need checking');
  let status = 'preferred';
  const check = ms => windowStatus(timeLib().tz(ms, place.zone), workStart, workEnd, days, allowExtended);
  const samples = [startMs, endMs - 1];
  for (let ms = Math.floor(startMs / MINUTE) * MINUTE + MINUTE; ms < endMs; ms += MINUTE) samples.push(ms);
  for (const ms of samples) {
    const at = check(ms);
    if (at === 'unavailable') return unavailable('Outside available working hours');
    if (at === 'extended') status = 'extended';
  }
  return { ...base, status, reason: status === 'preferred' ? 'Within working hours' : 'Uses up to 2 hours outside working hours' };
}

/** Find up to six distinct options on the organizer's calendar date. */
export function findSlots({ date, zone, duration, members, allowExtended = false }) {
  assertZone(zone);
  if (!Number.isInteger(duration) || duration < 1 || duration > 1440) throw new RangeError('Choose a valid meeting duration.');
  if (!Array.isArray(members) || members.length === 0) return [];
  const m = timeLib();
  const day = m.tz(date, 'YYYY-MM-DD', true, zone);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !day.isValid() || day.format('YYYY-MM-DD') !== date) return [];
  const from = day.clone().startOf('day').valueOf();
  const until = day.clone().add(1, 'day').startOf('day').valueOf();
  const candidates = [];
  for (let start = Math.ceil(from / QUARTER) * QUARTER; start < until; start += QUARTER) {
    if (localParts(start, zone).date !== date) continue;
    const statuses = members.map(member => ({ memberId: member.id, ...memberStatus(member, start, duration, allowExtended) }));
    if (statuses.some((s, i) => s.status === 'unavailable' && members[i].required !== false)) continue;
    if (statuses.every(s => s.status === 'unavailable')) continue;
    let quality = 0, weight = 0, comfort = 0;
    statuses.forEach((s, i) => {
      const w = members[i].required === false ? 0.35 : 1;
      weight += w;
      quality += w * ({ preferred: 1, extended: 0.6, unavailable: 0 }[s.status]);
      if (s.status !== 'unavailable') {
        const midpoint = m.tz(start + duration * MINUTE / 2, s.zone);
        const clock = midpoint.hour() + midpoint.minute() / 60;
        comfort += Math.abs(clock - 13) * w;
      }
    });
    candidates.push({
      start, end: start + duration * MINUTE,
      score: Math.round((quality / weight) * 1000) / 10,
      statuses,
      preferredCount: statuses.filter(s => s.status === 'preferred').length,
      extendedCount: statuses.filter(s => s.status === 'extended').length,
      unavailableCount: statuses.filter(s => s.status === 'unavailable').length,
      _comfort: comfort / weight,
    });
  }
  candidates.sort((a, b) => b.score - a.score || a._comfort - b._comfort || a.start - b.start);
  const picked = [];
  for (const candidate of candidates) {
    if (picked.every(other => Math.abs(other.start - candidate.start) >= 60 * MINUTE)) {
      const { _comfort, ...slot } = candidate;
      picked.push(slot);
      if (picked.length === 6) break;
    }
  }
  return picked;
}

function icsText(value = '') {
  return String(value).replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function foldLine(line) {
  const encoder = new TextEncoder();
  const lines = [];
  let part = '', bytes = 0;
  for (const character of line) {
    const length = encoder.encode(character).length;
    if (bytes + length > 75) {
      lines.push(part);
      part = ' ';
      bytes = 1;
    }
    part += character;
    bytes += length;
  }
  lines.push(part);
  return lines.join('\r\n');
}

/** Calendar exports encode a fixed, unambiguous UTC instant, without inviting anyone. */
export function buildICS({ title, start, end, description = '', location = '', uid }) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new RangeError('A valid meeting start and end are required.');
  const stamp = ms => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const unique = uid || `${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}@meridian`;
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Meridian//Global Coordination//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:${icsText(unique)}`, `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${icsText(title || 'Global coordination meeting')}`, `DESCRIPTION:${icsText(description)}`, `LOCATION:${icsText(location)}`,
    'STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR',
  ].map(foldLine).join('\r\n') + '\r\n';
}
