import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { resolveTimelineTime } from '../dist/js/timeline.js';

const sandbox = vm.createContext({ console });
for (const name of ['moment.min.js', 'moment-timezone.min.js']) {
  vm.runInContext(fs.readFileSync(new URL(`../dist/vendor/${name}`, import.meta.url), 'utf8'), sandbox);
}
globalThis.moment = sandbox.moment;
const utc = Date.parse;

test('dragging snaps to a quarter hour in the selected participant’s time zone', () => {
  const result = resolveTimelineTime({ date: '2026-11-16', minutes: 9 * 60 + 8, zone: 'Asia/Kathmandu', reference: utc('2026-11-16T00:00Z') });
  assert.equal(result.time, '09:15');
  assert.equal(result.instant, utc('2026-11-16T03:30Z'));
  assert.equal(result.offset, 'UTC+05:45');
});

test('dragging across midnight advances or retreats the local calendar date', () => {
  const shared = { date: '2026-11-16', zone: 'Asia/Shanghai', reference: utc('2026-11-16T15:30Z') };
  assert.equal(resolveTimelineTime({ ...shared, minutes: 1440 }).instant, utc('2026-11-16T16:00Z'));
  const previous = resolveTimelineTime({ ...shared, minutes: -15 });
  assert.equal(previous.date, '2026-11-15');
  assert.equal(previous.time, '23:45');
});

test('a missing DST hour is reported instead of moved silently', () => {
  const result = resolveTimelineTime({ date: '2026-03-08', minutes: 150, zone: 'America/New_York', reference: utc('2026-03-08T06:30Z') });
  assert.equal(result.instant, null);
  assert.equal(result.reason, 'dst-gap');
  assert.equal(result.time, '02:30');
});

test('a repeated DST time follows the nearest existing instant and reports its offset', () => {
  const shared = { date: '2026-11-01', minutes: 90, zone: 'America/New_York' };
  const first = resolveTimelineTime({ ...shared, reference: utc('2026-11-01T05:20Z') });
  const second = resolveTimelineTime({ ...shared, reference: utc('2026-11-01T06:20Z') });
  assert.equal(first.instant, utc('2026-11-01T05:30Z'));
  assert.equal(second.instant, utc('2026-11-01T06:30Z'));
  assert.equal(first.ambiguous, true);
  assert.equal(first.offset, 'UTC-04:00');
  assert.equal(second.offset, 'UTC-05:00');
});

test('invalid dates are rejected without calendar overflow', () => {
  assert.equal(resolveTimelineTime({ date: '2026-02-30', minutes: 540, zone: 'UTC', reference: utc('2026-01-01T00:00Z') }).reason, 'invalid-time');
});
