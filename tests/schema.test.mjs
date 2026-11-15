import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { validateWorkspace } from '../dist/js/schema.js';

const sandbox = vm.createContext({ console });
for (const filename of ['moment.min.js', 'moment-timezone.min.js']) vm.runInContext(fs.readFileSync(new URL(`../dist/vendor/${filename}`, import.meta.url), 'utf8'), sandbox);
globalThis.moment = sandbox.moment;
const location = { city: 'Stockholm', country: 'Sweden', label: 'Stockholm, Sweden', zone: 'Europe/Stockholm', lat: 59.33, lon: 18.07 };
function fixture() {
  return { version: 1, title: 'Commercial review', date: '2026-11-18', zone: 'Europe/Stockholm', duration: '45', allowExtended: false, selectedStart: null, objective: 'Resolve open questions.', members: [{ id: 'pricing', name: 'Alex Morgan', role: 'Global pricing', ...location, required: true, workStart: '09:00', workEnd: '17:00', workDays: [1,2,3,4,5], trips: [], blocks: [] }], tasks: [{ id: 'review', title: 'Review proposal', ownerId: 'pricing', hours: 1.5, done: false, notes: 'Line one\nLine two' }] };
}
const stay = (id, start, end) => ({ id, ...location, start, end });

test('valid backups are normalized, deeply cloned, and preserve only supported fields', () => {
  const input = fixture();
  input.extra = 'discard';
  input.members[0].hidden = 'discard';
  const clean = validateWorkspace(input);
  assert.equal(clean.duration, 45);
  assert.match(clean.meetingUID, /^[A-Za-z0-9_.@-]+@meridian$/);
  assert.equal(clean.members[0].country, 'Sweden');
  assert.equal(clean.members[0].label, 'Stockholm, Sweden');
  assert.equal(clean.extra, undefined);
  assert.equal(clean.members[0].hidden, undefined);
  clean.members[0].workDays.push(6);
  assert.equal(input.members[0].workDays.length, 5);
  assert.equal(clean.tasks[0].notes, 'Line one\nLine two');
  assert.equal(validateWorkspace(clean).meetingUID, clean.meetingUID);
});

test('legacy version-one data gets optional defaults, and removed owners remain visible', () => {
  const input = fixture();
  delete input.objective;
  delete input.members[0].role;
  delete input.members[0].trips;
  delete input.members[0].blocks;
  delete input.members[0].label;
  input.tasks[0].ownerId = 'removed-colleague';
  const clean = validateWorkspace(input);
  assert.equal(clean.objective, '');
  assert.equal(clean.members[0].role, '');
  assert.equal(clean.members[0].label, 'Stockholm, Sweden');
  assert.deepEqual(clean.members[0].trips, []);
  assert.equal(clean.tasks[0].ownerId, 'removed-colleague');
});

test('unsafe and duplicate identifiers cannot enter unescaped HTML attributes', () => {
  for (const unsafe of ['\" onclick=\"alert(1)', '<img>', 'space id', 'x'.repeat(81), '']) {
    const input = fixture(); input.members[0].id = unsafe;
    assert.throws(() => validateWorkspace(input), /identifier/);
  }
  const input = fixture(); input.members.push({ ...input.members[0] });
  assert.throws(() => validateWorkspace(input), /duplicate/);
  const task = fixture(); task.tasks[0].ownerId = 'x\" data-action=\"reset';
  assert.throws(() => validateWorkspace(task), /identifier/);
  const uid = fixture(); uid.meetingUID = 'valid\r\nATTENDEE:someone';
  assert.throws(() => validateWorkspace(uid), /calendar identifier/);
});

test('missing critical fields, wrong text types, and truthy strings are rejected', () => {
  for (const change of [s => delete s.members[0].name, s => {s.members[0].name = {text: 'Alex'};}, s => delete s.selectedStart, s => {s.allowExtended = 'false';}, s => {s.members[0].required = 1;}, s => {s.tasks[0].done = 'false';}]) {
    const input = fixture(); change(input);
    assert.throws(() => validateWorkspace(input));
  }
});

test('invalid dates, clocks, coordinates, zones and arrays are rejected', () => {
  for (const change of [s => {s.date = '2026-02-30';}, s => {s.members[0].workStart = '99:00';}, s => {s.members[0].workEnd = '17:99';}, s => {s.members[0].workEnd = '08:00';}, s => {s.members[0].lat = 91;}, s => {s.members[0].lon = Infinity;}, s => {s.zone = 'Fake/Zone';}, s => {s.members[0].workDays = [1,1];}, s => {s.members[0].workDays = [];}, s => {s.tasks[0].hours = 0.1;}, s => {s.members = Array(31).fill(s.members[0]);}]) {
    const input = fixture(); change(input);
    assert.throws(() => validateWorkspace(input));
  }
});

test('travel is sorted, adjacent stays are allowed, overlaps and invalid ranges are rejected', () => {
  const input = fixture();
  input.members[0].trips = [stay('later', 2000, 3000), stay('earlier', 1000, 2000)];
  assert.equal(validateWorkspace(input).members[0].trips[0].id, 'earlier');
  input.members[0].trips[1].end = 2001;
  assert.throws(() => validateWorkspace(input), /overlapping/);
  const badCoordinate = fixture(); badCoordinate.members[0].trips = [{ ...stay('trip', 1000, 2000), lon: 181 }];
  assert.throws(() => validateWorkspace(badCoordinate), /coordinates/);
  const badBlock = fixture(); badBlock.members[0].blocks = [{ id: 'flight', label: 'Flight', start: 2000, end: 1000 }];
  assert.throws(() => validateWorkspace(badBlock), /end after/);
});

test('unknown prototype keys are stripped instead of merged into trusted state', () => {
  const input = JSON.parse(JSON.stringify(fixture()).replace('"version":1', '"version":1,"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}'));
  const clean = validateWorkspace(input);
  assert.equal(Object.hasOwn(clean, '__proto__'), false);
  assert.equal(Object.hasOwn(clean, 'constructor'), false);
  assert.equal({}.polluted, undefined);
});
