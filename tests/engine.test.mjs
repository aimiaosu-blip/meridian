import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { localToInstants, localParts, effectiveZone, memberStatus, findSlots, buildICS } from '../dist/js/engine.js';

const sandbox = vm.createContext({ console });
for (const filename of ['moment.min.js', 'moment-timezone.min.js']) {
  vm.runInContext(fs.readFileSync(new URL(`../dist/vendor/${filename}`, import.meta.url), 'utf8'), sandbox);
}
globalThis.moment = sandbox.moment;
const utc = value => Date.parse(value);
const member = (overrides = {}) => ({ id: 'one', name: 'Test colleague', city: 'Stockholm', zone: 'Europe/Stockholm', required: true, workStart: '09:00', workEnd: '17:00', workDays: [1, 2, 3, 4, 5], trips: [], blocks: [], ...overrides });

test('DST spring gap is rejected and autumn repetition has two explicit choices', () => {
  assert.deepEqual(localToInstants('2026-03-08', '02:30', 'America/New_York'), []);
  assert.deepEqual(localToInstants('2026-11-01', '01:30', 'America/New_York'), [utc('2026-11-01T05:30:00Z'), utc('2026-11-01T06:30:00Z')]);
  assert.deepEqual(localToInstants('2026-02-30', '12:00', 'UTC'), []);
  assert.deepEqual(localToInstants('2026-11-01', '24:00', 'UTC'), []);
});

test('fractional offsets and previous/next calendar dates are preserved', () => {
  const t = utc('2026-11-16T20:00:00Z');
  assert.equal(localParts(t, 'Asia/Kathmandu').time, '01:45');
  assert.equal(localParts(t, 'Asia/Kathmandu').date, '2026-11-17');
  assert.equal(localParts(t, 'Asia/Kathmandu').offset, 'UTC+05:45');
  assert.deepEqual(localToInstants('2026-11-17', '01:45', 'Asia/Kathmandu'), [t]);
  assert.equal(localParts(t, 'Pacific/Honolulu').date, '2026-11-16');
});

test('the full meeting must fit within working hours; flexibility is opt-in', () => {
  const person = member();
  assert.equal(memberStatus(person, utc('2026-11-16T15:30:00Z'), 30).status, 'preferred');
  assert.equal(memberStatus(person, utc('2026-11-16T15:30:00Z'), 90).status, 'unavailable');
  assert.equal(memberStatus(person, utc('2026-11-16T15:30:00Z'), 90, true).status, 'extended');
  assert.equal(memberStatus(person, utc('2026-11-16T17:30:00Z'), 45, true).status, 'unavailable');
  assert.equal(memberStatus(person, utc('2026-11-15T10:00:00Z'), 30, true).status, 'unavailable');
});

test('travel changes the location at the exact boundary and blocks cannot be relaxed', () => {
  const start = utc('2026-11-16T10:00:00Z');
  const person = member({ trips: [{ id: 'trip', city: 'Singapore', zone: 'Asia/Singapore', start, end: utc('2026-11-20T10:00:00Z') }] });
  assert.equal(effectiveZone(person, start - 1), 'Europe/Stockholm');
  assert.equal(effectiveZone(person, start), 'Asia/Singapore');
  assert.equal(memberStatus(person, start - 15 * 60000, 30, true).status, 'unavailable');
  assert.match(memberStatus(person, start - 15 * 60000, 30, true).reason, /location changes/);
  assert.equal(memberStatus(person, utc('2026-11-17T02:00:00Z'), 30).city, 'Singapore');
  person.blocks.push({ start: utc('2026-11-17T02:10:00Z'), end: utc('2026-11-17T04:00:00Z'), label: 'In flight' });
  assert.equal(memberStatus(person, utc('2026-11-17T02:00:00Z'), 30, true).reason, 'In flight');
});

test('overnight shifts retain the workday on which they started', () => {
  const person = member({ zone: 'UTC', workStart: '22:00', workEnd: '06:00', workDays: [1] });
  assert.equal(memberStatus(person, utc('2026-11-17T01:00:00Z'), 60).status, 'preferred');
  assert.equal(memberStatus(person, utc('2026-11-18T01:00:00Z'), 60).status, 'unavailable');
});

test('search returns ranked distinct usable options and does not block on optional guests', () => {
  const required = member();
  const optional = member({ id: 'optional', required: false, blocks: [{ start: utc('2026-11-16T00:00:00Z'), end: utc('2026-11-17T00:00:00Z'), label: 'Away' }] });
  const slots = findSlots({ date: '2026-11-16', zone: 'Europe/Stockholm', duration: 45, members: [required, optional] });
  assert.ok(slots.length > 0 && slots.length <= 6);
  for (const slot of slots) {
    assert.equal(slot.statuses[0].status, 'preferred');
    assert.equal(slot.statuses[1].status, 'unavailable');
    assert.equal(slot.end - slot.start, 45 * 60000);
    assert.equal(localParts(slot.start, 'Europe/Stockholm').date, '2026-11-16');
  }
  for (let i = 0; i < slots.length; i++) for (let j = i + 1; j < slots.length; j++) assert.ok(Math.abs(slots[i].start - slots[j].start) >= 3600000);
  assert.deepEqual(findSlots({ date: '2026-11-16', zone: 'Europe/Stockholm', duration: 45, members: [required, { ...optional, required: true }] }), []);
});

test('search respects 23/25-hour calendar days without midnight overflow', () => {
  const person = member({ zone: 'America/New_York', workStart: '00:00', workEnd: '24:00', workDays: [0,1,2,3,4,5,6] });
  for (const date of ['2026-03-08', '2026-11-01']) {
    const slots = findSlots({ date, zone: person.zone, duration: 30, members: [person] });
    assert.ok(slots.length);
    for (const slot of slots) assert.equal(localParts(slot.start, person.zone).date, date);
  }
});

test('ICS uses UTC, escapes text, folds UTF-8 by octet count, and retains a stable UID', () => {
  const output = buildICS({ title: 'Review, pricing; next\\step\nNew line ' + '跨国会议'.repeat(30), start: utc('2026-11-16T10:00:00Z'), end: utc('2026-11-16T10:45:00Z'), description: 'A\nB', uid: 'plan-123@meridian' });
  assert.ok(output.includes('DTSTART:20261116T100000Z\r\n'));
  assert.ok(output.includes('DTEND:20261116T104500Z\r\n'));
  assert.ok(output.includes('UID:plan-123@meridian\r\n'));
  const unfolded = output.replace(/\r\n /g, '');
  assert.ok(unfolded.includes('SUMMARY:Review\\, pricing\\; next\\\\step\\nNew line'));
  assert.ok(output.endsWith('END:VCALENDAR\r\n'));
  for (const line of output.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
  assert.throws(() => buildICS({ start: 1, end: 0 }), RangeError);
});
