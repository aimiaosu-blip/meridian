import { effectiveZone, localParts, memberStatus } from './engine.js';

const MINUTE = 60_000;
const STEP = 15 * MINUTE;
const DEFAULT_DAYS = [1, 2, 3, 4, 5];
const minutes = value => {
  if (value === '24:00') return 1440;
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value || '')) return NaN;
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
};

function settings(member) {
  return {
    start: minutes(member.workStart || '09:00'),
    end: minutes(member.workEnd || '17:00'),
    days: Array.isArray(member.workDays) ? member.workDays : DEFAULT_DAYS,
  };
}

// Overnight work belongs to the weekday on which the shift starts.
function workDistance(local, schedule) {
  const minute = minutes(local.time);
  const finish = schedule.end < schedule.start ? schedule.end + 1440 : schedule.end;
  let distance = Infinity;
  for (const delta of [-1, 0, 1]) {
    if (!schedule.days.includes((local.weekday + delta + 7) % 7)) continue;
    const from = delta * 1440 + schedule.start;
    const to = delta * 1440 + finish;
    if (minute >= from && minute < to) return 0;
    distance = Math.min(distance, Math.max(from - minute, minute - to, 0));
  }
  return distance;
}

function inWork(local, schedule) {
  const minute = minutes(local.time);
  const finish = schedule.end < schedule.start ? schedule.end + 1440 : schedule.end;
  return [-1, 0, 1].some(delta => schedule.days.includes((local.weekday + delta + 7) % 7)
    && minute >= delta * 1440 + schedule.start && minute < delta * 1440 + finish);
}

function inExtended(local, schedule) {
  const minute = minutes(local.time);
  return inWork(local, schedule) || (schedule.days.includes(local.weekday) && minute >= 7 * 60 && minute < 22 * 60);
}

function containsInterval(local, duration, schedule, extended) {
  const start = minutes(local.time);
  const finish = schedule.end < schedule.start ? schedule.end + 1440 : schedule.end;
  const windows = [];
  for (const delta of [-1, 0, 1]) {
    if (!schedule.days.includes((local.weekday + delta + 7) % 7)) continue;
    windows.push([delta * 1440 + schedule.start, delta * 1440 + finish]);
    if (extended) windows.push([delta * 1440 + 420, delta * 1440 + 1320]);
  }
  windows.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const window of windows) {
    const previous = merged.at(-1);
    if (previous && window[0] <= previous[1]) previous[1] = Math.max(previous[1], window[1]);
    else merged.push([...window]);
  }
  return merged.some(([from, to]) => start >= from && start + duration <= to);
}

function stableOffset(zone, start, end) {
  const rules = globalThis.moment.tz.zone(zone);
  let low = 0, high = rules.untils.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (rules.untils[mid] <= start) low = mid + 1;
    else high = mid;
  }
  return rules.untils[low] >= end;
}

function statusFor(member, start, duration, allowExtended) {
  const end = start + duration * MINUTE;
  const zone = effectiveZone(member, start);
  const first = localParts(start, zone);
  const last = localParts(end - 1, effectiveZone(member, end - 1));
  const finish = localParts(end, zone);
  const schedule = settings(member);
  const base = {
    memberId: member.id, zone, city: member.city || zone,
    localDate: first.date, localTime: first.time, endDate: finish.date, endTime: finish.time,
    offset: first.offset, abbr: first.abbr,
  };
  // On an ordinary, fixed-offset day a continuous interval check is exact.
  // Retain the minute-level engine for DST transitions, travel and blocked time.
  if (!(member.trips?.length || member.blocks?.length) && stableOffset(zone, start, end)) {
    if (containsInterval(first, duration, schedule, false)) return { ...base, status: 'preferred', reason: 'Within working hours' };
    if (allowExtended && containsInterval(first, duration, schedule, true)) {
      return { ...base, status: 'extended', reason: 'Outside working hours; within the allowed 07:00–22:00 window' };
    }
    return { ...base, status: 'unavailable', reason: 'Outside available working hours' };
  }
  // Reject obviously impossible windows before the engine checks every minute.
  const check = allowExtended ? inExtended : inWork;
  if (!check(first, schedule) || !check(last, schedule)) {
    return { ...base, status: 'unavailable', reason: 'Outside available working hours' };
  }
  const normal = { memberId: member.id, ...memberStatus(member, start, duration, false) };
  if (normal.status === 'preferred' || !allowExtended) return normal;
  // Flights, overlapping trips and explicit calendar blocks are never relaxed.
  if (normal.reason !== 'Outside available working hours') return normal;

  if (schedule.start < schedule.end && schedule.start <= 1320 && schedule.end >= 420) {
    const toClock = value => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
    const relaxed = memberStatus({
      ...member,
      workStart: toClock(Math.min(schedule.start, 7 * 60)),
      workEnd: toClock(Math.max(schedule.end, 22 * 60)),
    }, start, duration, false);
    if (relaxed.status !== 'preferred') return { memberId: member.id, ...relaxed };
  } else {
    // An overnight shift and 07:00–22:00 may form two disjoint intervals.
    // Check their union instead of accidentally filling the intervening gap.
    for (let ms = start; ms < end; ms = Math.floor(ms / MINUTE) * MINUTE + MINUTE) {
      if (!inExtended(localParts(ms, zone), schedule)) return normal;
    }
  }
  return { ...normal, status: 'extended', reason: 'Outside working hours; within the allowed 07:00–22:00 window' };
}

function rank(slot, members) {
  let totalWeight = 0, quality = 0, worst = 0, overtime = 0, comfort = 0;
  slot.statuses.forEach((status, i) => {
    const member = members[i];
    const weight = member.required === false ? 0.35 : 1;
    totalWeight += weight;
    quality += weight * ({ preferred: 1, extended: 0.65, unavailable: 0 }[status.status]);
    if (status.status === 'unavailable') return;
    const schedule = settings(member);
    const first = localParts(slot.start, status.zone);
    const last = localParts(slot.end - 1, status.zone);
    const beyond = Math.max(workDistance(first, schedule), workDistance(last, schedule));
    worst = Math.max(worst, beyond);
    overtime += beyond * weight;
    const middle = minutes(localParts((slot.start + slot.end) / 2, status.zone).time);
    const workMiddle = (schedule.start + ((schedule.end - schedule.start + 1440) % 1440) / 2) % 1440;
    const gap = Math.abs(middle - workMiddle);
    comfort += Math.min(gap, 1440 - gap) * weight;
  });
  return { ...slot, score: Math.round(quality / totalWeight * 1000) / 10,
    _worst: worst, _overtime: overtime / totalWeight, _comfort: comfort / totalWeight };
}

const compare = (a, b) => b.score - a.score || a._worst - b._worst
  || a._overtime - b._overtime || a._comfort - b._comfort || a.start - b.start;

/** Describe a manually selected instant without rejecting out-of-hours attendees. */
export function evaluateMeeting({ start, duration, members, allowExtended = false } = {}) {
  if (!Number.isFinite(start) || !Number.isInteger(duration) || duration < 1 || duration > 1440
      || !Array.isArray(members) || !members.length || members.length > 20) {
    throw new RangeError('A valid meeting time, duration and participant list are required.');
  }
  const statuses = members.map(member => statusFor(member, start, duration, allowExtended));
  const { _worst, _overtime, _comfort, ...slot } = rank({
    start, end: start + duration * MINUTE, statuses,
    preferredCount: statuses.filter(status => status.status === 'preferred').length,
    extendedCount: statuses.filter(status => status.status === 'extended').length,
    unavailableCount: statuses.filter(status => status.status === 'unavailable').length,
  }, members);
  return slot;
}

/**
 * Search organizer-local calendar dates in real UTC instants, including DST days.
 * `after` and `before` are inclusive UTC bounds on the meeting start.
 * `allowExtended` explicitly permits 07:00–22:00 on each person's workdays,
 * plus their original working window. It does not read external calendars.
 */
export function planMeeting({ dates, zone, duration, members, allowExtended = false, now = Date.now(), after = null, before = null } = {}) {
  const m = globalThis.moment;
  if (!m?.tz) throw new Error('Time-zone data is not available.');
  if (!Array.isArray(dates) || !dates.length || dates.length > 31 || !m.tz.zone(zone)
      || !Number.isInteger(duration) || duration < 1 || duration > 1440
      || !Array.isArray(members) || !members.length || members.length > 20 || !Number.isFinite(now)
      || (after !== null && !Number.isFinite(after)) || (before !== null && !Number.isFinite(before))) {
    return { slots: [], reason: 'invalid-request' };
  }
  if (members.some(member => !member || !m.tz.zone(member.zone)
      || !Number.isFinite(settings(member).start) || !Number.isFinite(settings(member).end)
      || settings(member).start >= 1440 || settings(member).start === settings(member).end)) return { slots: [], reason: 'invalid-request' };
  const days = [...new Set(dates)].sort().map(date => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const day = m.tz(date, 'YYYY-MM-DD', true, zone);
    return day.isValid() && day.format('YYYY-MM-DD') === date ? day : null;
  });
  if (days.some(day => !day)) return { slots: [], reason: 'invalid-request' };
  const earliest = Math.max(now, after ?? -Infinity);
  const latest = before ?? Infinity;
  let futureExists = false, boundedExists = false;
  const candidates = [];
  for (const day of days) {
    const from = day.clone().startOf('day').valueOf();
    const until = day.clone().add(1, 'day').startOf('day').valueOf();
    if (until > now) futureExists = true;
    for (let start = Math.ceil(Math.max(from, earliest) / STEP) * STEP; start < until && start <= latest; start += STEP) {
      boundedExists = true;
      const statuses = [];
      let usable = true;
      for (const member of members) {
        const status = statusFor(member, start, duration, allowExtended);
        if (status.status === 'unavailable' && member.required !== false) { usable = false; break; }
        statuses.push(status);
      }
      if (!usable || statuses.every(status => status.status === 'unavailable')) continue;
      candidates.push(rank({ start, end: start + duration * MINUTE, statuses,
        preferredCount: statuses.filter(status => status.status === 'preferred').length,
        extendedCount: statuses.filter(status => status.status === 'extended').length,
        unavailableCount: statuses.filter(status => status.status === 'unavailable').length,
      }, members));
    }
  }
  if (!candidates.length) return { slots: [], reason: !futureExists ? 'no-future-time' : !boundedExists ? 'no-matches' : 'no-common-time' };
  candidates.sort(compare);
  const selected = [candidates[0]];
  const first = localParts(selected[0].start, zone);
  const firstClock = minutes(first.time);
  // Offer a different hour and a different day when equally useful choices exist.
  // Never trade away someone else's working-hours status merely for variety.
  const comparable = candidates.filter(c => c.score >= selected[0].score && c._worst <= selected[0]._worst + 60);
  const isDistinct = c => selected.every(s => Math.abs(s.start - c.start) >= 60 * MINUTE);
  const alternateHour = comparable.find(c => isDistinct(c) && Math.abs(minutes(localParts(c.start, zone).time) - firstClock) >= 60);
  if (alternateHour) selected.push(alternateHour);
  const alternateDay = comparable.find(c => isDistinct(c) && localParts(c.start, zone).date !== first.date);
  if (alternateDay && selected.length < 3) selected.push(alternateDay);
  for (const candidate of candidates) {
    if (selected.length >= 3) break;
    if (isDistinct(candidate)) selected.push(candidate);
  }
  return { slots: selected.map(({ _worst, _overtime, _comfort, ...slot }) => slot), reason: null };
}
