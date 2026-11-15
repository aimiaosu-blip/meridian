/** Validate untrusted backups and return a fresh, allowlisted workspace object. */
const SAFE_ID = /^[A-Za-z0-9_-]{1,80}$/;
const SAFE_UID = /^[A-Za-z0-9][A-Za-z0-9_.@-]{0,179}$/;
const CLOCK = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const DURATIONS = [15, 30, 45, 60, 90, 120];

function fail(message) { throw new Error(message); }
function record(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${field} must be an object.`);
  return value;
}
function text(value, field, max, { optional = false, multiline = false } = {}) {
  if (optional && value === undefined) return '';
  if (typeof value !== 'string' || value.length > max) fail(`${field} must be text of ${max} characters or fewer.`);
  const forbidden = multiline ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/ : /[\u0000-\u001f\u007f]/;
  if (forbidden.test(value)) fail(`${field} contains unsupported control characters.`);
  const clean = value.trim();
  if (!optional && !clean) fail(`${field} cannot be empty.`);
  return clean;
}
function id(value, field) {
  if (typeof value !== 'string' || !SAFE_ID.test(value)) fail(`${field} has an invalid identifier.`);
  return value;
}
function boolean(value, field) {
  if (typeof value !== 'boolean') fail(`${field} must be true or false.`);
  return value;
}
function list(value, field, max, optional = false) {
  if (optional && value === undefined) return [];
  if (!Array.isArray(value) || value.length > max) fail(`${field} must contain at most ${max} items.`);
  return value;
}
function uniqueIds(items, field) {
  const ids = new Set();
  for (const item of items) {
    if (ids.has(item.id)) fail(`${field} contains duplicate identifiers.`);
    ids.add(item.id);
  }
  return items;
}
function timestamp(value, field) {
  if (!Number.isSafeInteger(value) || !Number.isFinite(new Date(value).getTime())) fail(`${field} must be a valid UTC timestamp in milliseconds.`);
  return value;
}
function range(value, field) {
  const start = timestamp(value.start, `${field} start`);
  const end = timestamp(value.end, `${field} end`);
  if (end <= start) fail(`${field} must end after it starts.`);
  return { start, end };
}
function zone(value, field) {
  if (typeof value !== 'string' || value.length > 100 || !globalThis.moment?.tz?.zone(value)) fail(`${field} has an unknown time zone.`);
  return value;
}
function location(value, field) {
  const city = text(value.city, `${field} city`, 100);
  const country = text(value.country, `${field} country`, 100, { optional: true });
  const label = value.label === undefined ? (country ? `${city}, ${country}` : city) : text(value.label, `${field} city label`, 220);
  const tz = zone(value.zone, field);
  if (!Number.isFinite(value.lat) || Math.abs(value.lat) > 90 || !Number.isFinite(value.lon) || Math.abs(value.lon) > 180) fail(`${field} has invalid map coordinates.`);
  return { city, country, label, zone: tz, lat: value.lat, lon: value.lon };
}
function stays(value, field) {
  const trips = list(value, `${field} trips`, 100, true).map((item, index) => {
    const label = `${field} trip ${index + 1}`;
    record(item, label);
    return { id: id(item.id, label), ...location(item, label), ...range(item, label) };
  }).sort((a, b) => a.start - b.start);
  uniqueIds(trips, `${field} trips`);
  for (let index = 1; index < trips.length; index++) {
    if (trips[index].start < trips[index - 1].end) fail(`${field} has overlapping trips. Adjust their dates before importing.`);
  }
  return trips;
}
function unavailable(value, field) {
  const blocks = list(value, `${field} unavailable periods`, 200, true).map((item, index) => {
    const label = `${field} unavailable period ${index + 1}`;
    record(item, label);
    return { id: id(item.id, label), label: text(item.label, `${label} label`, 100), ...range(item, label) };
  }).sort((a, b) => a.start - b.start);
  return uniqueIds(blocks, `${field} unavailable periods`);
}
function member(value, index) {
  const field = `Person ${index + 1}`;
  record(value, field);
  if (typeof value.workStart !== 'string' || !CLOCK.test(value.workStart) || typeof value.workEnd !== 'string' || !CLOCK.test(value.workEnd) || value.workEnd <= value.workStart) {
    fail(`${field} needs valid work hours ending later on the same day.`);
  }
  const workDays = list(value.workDays, `${field} working days`, 7);
  if (!workDays.length || workDays.some(day => !Number.isInteger(day) || day < 0 || day > 6) || new Set(workDays).size !== workDays.length) fail(`${field} needs distinct working days from 0 (Sunday) to 6 (Saturday).`);
  return {
    id: id(value.id, field),
    name: text(value.name, `${field} name`, 70),
    role: text(value.role, `${field} role`, 70, { optional: true }),
    ...location(value, field),
    required: boolean(value.required, `${field} required flag`),
    workStart: value.workStart,
    workEnd: value.workEnd,
    workDays: [...workDays],
    trips: stays(value.trips, field),
    blocks: unavailable(value.blocks, field),
  };
}
function task(value, index) {
  const field = `Preparation step ${index + 1}`;
  record(value, field);
  if (typeof value.hours !== 'number' || !Number.isFinite(value.hours) || value.hours < 0.25 || value.hours > 40 || !Number.isInteger(value.hours * 4)) fail(`${field} effort must be 0.25–40 hours in quarter-hour increments.`);
  return {
    id: id(value.id, field),
    title: text(value.title, `${field} title`, 140),
    // Removed owners are intentionally retained so the UI can ask for reassignment.
    ownerId: id(value.ownerId, `${field} owner`),
    hours: value.hours,
    done: boolean(value.done, `${field} completion flag`),
    notes: text(value.notes, `${field} notes`, 1200, { optional: true, multiline: true }),
  };
}
function meetingUID(value) {
  if (value === undefined) return `${globalThis.crypto?.randomUUID?.() || `meeting-${Date.now()}-${Math.random().toString(36).slice(2)}`}@meridian`;
  if (typeof value !== 'string' || !SAFE_UID.test(value)) fail('The meeting calendar identifier is invalid.');
  return value;
}

export function validateWorkspace(value) {
  record(value, 'Workspace');
  if (value.version !== 1) fail('This workspace version is not supported.');
  const title = text(value.title, 'Meeting title', 160);
  if (typeof value.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.date) || !globalThis.moment(value.date, 'YYYY-MM-DD', true).isValid()) fail('The meeting date is invalid.');
  if (typeof value.duration !== 'number' && typeof value.duration !== 'string') fail('Choose a supported meeting duration.');
  const duration = Number(value.duration);
  if (!DURATIONS.includes(duration)) fail('Choose a supported meeting duration.');
  return {
    version: 1,
    meetingUID: meetingUID(value.meetingUID),
    title,
    date: value.date,
    zone: zone(value.zone, 'Meeting'),
    duration,
    allowExtended: boolean(value.allowExtended, 'Extended-hours option'),
    selectedStart: value.selectedStart === null ? null : timestamp(value.selectedStart, 'Selected meeting time'),
    objective: text(value.objective, 'Meeting objective', 1500, { optional: true, multiline: true }),
    members: uniqueIds(list(value.members, 'Team', 30).map(member), 'Team'),
    tasks: uniqueIds(list(value.tasks, 'Preparation sequence', 50).map(task), 'Preparation sequence'),
  };
}
