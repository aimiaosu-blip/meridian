import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { planMeeting, evaluateMeeting } from '../dist/js/planner.js';
import { localParts } from '../dist/js/engine.js';

const sandbox = vm.createContext({ console });
for (const name of ['moment.min.js', 'moment-timezone.min.js']) {
  vm.runInContext(fs.readFileSync(new URL(`../dist/vendor/${name}`, import.meta.url), 'utf8'), sandbox);
}
globalThis.moment = sandbox.moment;
const utc = Date.parse;
const person = (id, zone, more = {}) => ({ id, name: id, city: id, zone, required: true,
  workStart: '09:00', workEnd: '18:00', workDays: [1, 2, 3, 4, 5], trips: [], blocks: [], ...more });
const defaults = { dates: ['2026-11-16', '2026-11-17'], zone: 'Europe/Stockholm', duration: 45, now: utc('2026-11-14T00:00Z') };

test('two-person and four-person plans expose complete, diverse usable options', () => {
  const members = [person('Stockholm', 'Europe/Stockholm'), person('London', 'Europe/London')];
  for (const group of [members, [...members, person('Berlin', 'Europe/Berlin'), person('Paris', 'Europe/Paris')]]) {
    const result = planMeeting({ ...defaults, members: group });
    assert.equal(result.reason, null);
    assert.equal(result.slots.length, 3);
    assert.equal(new Set(result.slots.map(s => localParts(s.start, defaults.zone).date)).size, 2);
    for (const slot of result.slots) {
      assert.equal(slot.statuses.length, group.length);
      assert.equal(slot.preferredCount, group.length);
      assert.equal(slot.end - slot.start, 45 * 60000);
    }
  }
});

test('Asia/Europe/America require explicit flexibility; 07:00–22:00 opens a real 45-minute window', () => {
  const members = [person('Stockholm', 'Europe/Stockholm'), person('Shanghai', 'Asia/Shanghai'), person('New York', 'America/New_York')];
  const strict = planMeeting({ ...defaults, members });
  assert.deepEqual(strict, { slots: [], reason: 'no-common-time' });
  const flexible = planMeeting({ ...defaults, members, allowExtended: true });
  assert.ok(flexible.slots.length);
  const best = flexible.slots[0];
  assert.equal(best.statuses[1].localTime, '20:00');
  assert.equal(best.statuses[2].localTime, '07:00');
  assert.equal(best.statuses[0].status, 'preferred');
  assert.equal(best.statuses[1].status, 'extended');
  assert.equal(best.statuses[2].status, 'extended');
  for (const slot of flexible.slots) for (const status of slot.statuses) {
    assert.ok(status.localTime >= '07:00');
    assert.ok(status.endTime <= '22:00');
  }
});

test('no past times are offered and follow-up UTC boundaries are inclusive', () => {
  const members = [person('Stockholm', 'Europe/Stockholm')];
  const now = utc('2026-11-16T11:08Z');
  const result = planMeeting({ ...defaults, dates: ['2026-11-16'], members, now });
  assert.ok(result.slots.length);
  assert.ok(result.slots.every(s => s.start >= now));
  const exact = utc('2026-11-16T15:45Z');
  const bounded = planMeeting({ ...defaults, members, after: exact, before: exact });
  assert.equal(bounded.slots.length, 1);
  assert.equal(bounded.slots[0].start, exact);
  assert.equal(planMeeting({ ...defaults, members, now: utc('2026-11-20T00:00Z') }).reason, 'no-future-time');
});

test('DST skipped and repeated hours use actual UTC instants', () => {
  const members = [person('New York', 'America/New_York', { workStart: '00:00', workEnd: '04:00', workDays: [0] })];
  const shared = { zone: 'America/New_York', duration: 15, members, now: utc('2026-01-01T00:00Z') };
  for (const instant of ['2026-11-01T05:30Z', '2026-11-01T06:30Z']) {
    const ms = utc(instant);
    const result = planMeeting({ ...shared, dates: ['2026-11-01'], after: ms, before: ms });
    assert.equal(result.slots[0].start, ms);
    assert.equal(result.slots[0].statuses[0].localTime, '01:30');
  }
  const spring = planMeeting({ ...shared, dates: ['2026-03-08'], after: utc('2026-03-08T06:30Z'), before: utc('2026-03-08T07:30Z') });
  assert.ok(spring.slots.length);
  assert.ok(spring.slots.every(s => !s.statuses[0].localTime.startsWith('02:')));
});

test('flexibility never overrides explicit blocks or nonworking weekdays', () => {
  const members = [person('UTC', 'UTC', { blocks: [{ start: utc('2026-11-16T00:00Z'), end: utc('2026-11-17T00:00Z'), label: 'In flight' }] })];
  assert.equal(planMeeting({ ...defaults, dates: ['2026-11-16'], members, allowExtended: true }).slots.length, 0);
  assert.equal(planMeeting({ ...defaults, dates: ['2026-11-15'], members, allowExtended: true }).slots.length, 0);
});

test('overnight hours are unioned with flexibility without filling rest-time gaps', () => {
  const members = [person('UTC', 'UTC', { workStart: '23:00', workEnd: '06:00' })];
  const base = { ...defaults, zone: 'UTC', dates: ['2026-11-17'], members, allowExtended: true, duration: 30 };
  for (const instant of ['2026-11-17T06:00Z', '2026-11-17T22:00Z']) {
    const ms = utc(instant);
    assert.equal(planMeeting({ ...base, after: ms, before: ms }).slots.length, 0);
  }
  const ms = utc('2026-11-17T05:00Z');
  assert.equal(planMeeting({ ...base, after: ms, before: ms }).slots[0].statuses[0].status, 'preferred');
});

test('disjoint early shifts do not silently extend across a rest gap', () => {
  const instant = utc('2026-11-17T05:30Z');
  for (const blocks of [[], [{ start: utc('2026-11-17T12:00Z'), end: utc('2026-11-17T13:00Z') }]]) {
    const members = [person('UTC', 'UTC', { workStart: '05:00', workEnd: '06:00', blocks })];
    const result = planMeeting({ ...defaults, zone: 'UTC', dates: ['2026-11-17'], duration: 120,
      members, allowExtended: true, after: instant, before: instant });
    assert.equal(result.slots.length, 0);
  }
});

test('invalid date/zone inputs produce a bounded error instead of normalized guesses', () => {
  const members = [person('Stockholm', 'Europe/Stockholm')];
  for (const change of [{ dates: ['2026-02-30'] }, { duration: 0 }, { zone: 'Mars' }, { members: [] }]) {
    assert.equal(planMeeting({ ...defaults, members, ...change }).reason, 'invalid-request');
  }
});

test('manual selections retain every participant and clearly describe outside-hours time', () => {
  const members = [person('Stockholm', 'Europe/Stockholm'), person('Shanghai', 'Asia/Shanghai'), person('New York', 'America/New_York')];
  const start = utc('2026-11-16T12:00Z');
  const strict = evaluateMeeting({ start, duration: 45, members });
  assert.equal(strict.statuses.length, 3);
  assert.equal(strict.unavailableCount, 2);
  const flexible = evaluateMeeting({ start, duration: 45, members, allowExtended: true });
  assert.equal(flexible.statuses.length, 3);
  assert.equal(flexible.preferredCount, 1);
  assert.equal(flexible.extendedCount, 2);
  const night = evaluateMeeting({ start: utc('2026-11-16T20:00Z'), duration: 45, members, allowExtended: true });
  assert.equal(night.statuses.length, 3);
  assert.ok(night.unavailableCount > 0);
});
