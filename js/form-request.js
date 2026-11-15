import { cities, cityByName } from './cities.js';
import { resolveCity } from './request.js';
import { localizedCity } from './i18n.js';

const DAY = 86400000;
const LIMIT_ERROR = 'Use up to 20 people and 14 dates.';
const DURATION_ERROR = 'Use a duration from 1 to 480 minutes.';
const HOURS_ERROR = 'Choose valid and different work start and end times.';
const fail = error => ({ ok: false, error });
const nameKey = value => value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('en');
const cityKey = value => nameKey(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
const clockOK = value => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
const civilMs = date => Date.parse(`${date}T12:00:00Z`);
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(civilMs(value)) && new Date(civilMs(value)).toISOString().slice(0, 10) === value;
const plusDays = (date, days) => new Date(civilMs(date) + days * DAY).toISOString().slice(0, 10);
const weekday = date => new Date(civilMs(date)).getUTCDay();
const isWeekend = date => [0, 6].includes(weekday(date));

/** Resolve a whole field value. A sentence or partial city name is never guessed.
 * `city` is the canonical city name; a matched saved team is returned unchanged.
 */
export function resolvePlace(value, { lang = 'en', teams = [] } = {}) {
  if (typeof value !== 'string' || !value.trim() || value.length > 200) return null;
  const key = nameKey(value);
  const saved = (Array.isArray(teams) ? teams : []).filter(team => typeof team?.name === 'string' && nameKey(team.name) === key);
  if (saved.length) {
    const ids = new Set(saved.map(team => team.id));
    const locations = new Set(saved.map(team => team.city));
    if (ids.size !== 1 || locations.size !== 1) return null;
    const city = cityByName(saved[0].city);
    return city ? { city: city.city, team: saved[0] } : null;
  }
  const direct = resolveCity(value);
  if (direct) return { city: direct.city };
  const localized = cities.filter(city => cityKey(localizedCity(city.city, lang)) === cityKey(value));
  return localized.length === 1 ? { city: localized[0].city } : null;
}

function localToday(now, zone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone, calendar: 'gregory', numberingSystem: 'latn',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(now));
  const get = type => parts.find(part => part.type === type)?.value;
  return `${get('year')?.padStart(4, '0')}-${get('month')}-${get('day')}`;
}

/** Build a bounded request directly from explicit form fields, without chat parsing.
 * For `range`, pass `dates`: consecutive ascending ISO calendar dates (max 14).
 * includeWeekends controls the date shortcuts; the caller also sets member workDays.
 */
export function createFormRequest({
  hostCity, participants, when = 'nextWeek', date = '', dates: rangeDates,
  duration = 45, includeWeekends = false, allowExtended = false, now = Date.now(),
} = {}) {
  const host = cityByName(hostCity);
  if (!host) return fail('invalidCity');
  if (!Array.isArray(participants) || participants.length === 0) return fail('needCity');
  if (participants.length > 19) return fail(LIMIT_ERROR);
  const minutes = typeof duration === 'number' ? duration
    : typeof duration === 'string' && /^\d+$/.test(duration.trim()) ? Number(duration.trim()) : NaN;
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 480) return fail(DURATION_ERROR);
  if (!Number.isFinite(now)) return fail('noDates');

  let today;
  try { today = localToday(now, host.zone); }
  catch { return fail('noDates'); }
  if (!validDate(today)) return fail('noDates');

  // The host already occupies this identity in the timeline and map.
  const ids = new Set(['organizer']);
  const people = [];
  for (const person of participants) {
    const city = cityByName(person?.city);
    if (!city || typeof person?.id !== 'string' || !person.id.trim() || person.id.length > 100
      || /[\u0000-\u001f\u007f]/.test(person.id)) return fail('invalidCity');
    if (ids.has(person.id)) return fail('sameCity');
    ids.add(person.id);
    const name = person.name === undefined ? city.city : typeof person.name === 'string' ? person.name.trim() : '';
    if (!name || name.length > 80) return fail('invalidCity');
    const workStart = person.workStart ?? '09:00';
    const workEnd = person.workEnd ?? '18:00';
    if (!clockOK(workStart) || !clockOK(workEnd) || workStart === workEnd) return fail(HOURS_ERROR);
    // Only the bundled city record supplies timezone and coordinates. User fields
    // cannot move a city to a different timezone or overwrite its map position.
    try { new Intl.DateTimeFormat('en', { timeZone: city.zone }).format(now); }
    catch { return fail('invalidCity'); }
    people.push({ ...city, id: person.id, name, workStart, workEnd });
  }

  let dates;
  if (when === 'tomorrow') dates = [plusDays(today, 1)];
  else if (when === 'nextWeek') {
    const nextMonday = plusDays(today, ((8 - weekday(today)) % 7) || 7);
    dates = Array.from({ length: includeWeekends === true ? 7 : 5 }, (_, index) => plusDays(nextMonday, index));
  } else if (when === 'date') {
    if (!validDate(date)) return fail('noDates');
    dates = [date];
  } else if (when === 'range') {
    if (!Array.isArray(rangeDates) || !rangeDates.length) return fail('noDates');
    if (rangeDates.length > 14) return fail(LIMIT_ERROR);
    if (!rangeDates.every(validDate)) return fail('noDates');
    if (rangeDates.some((day, index) => index > 0 && day !== plusDays(rangeDates[index - 1], 1))) return fail('noDates');
    dates = [...rangeDates];
  } else return fail('noDates');

  if (dates.some(day => day < today)) return fail('datePast');
  if (includeWeekends !== true && dates.every(isWeekend)) return fail('includesWeekend');
  return {
    ok: true,
    request: { organizerCity: host.city, participants: people, dates, duration: minutes,
      allowExtended: allowExtended === true, shiftMinutes: 0, title: '' },
  };
}
