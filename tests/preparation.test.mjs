import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { planPreparation } from '../dist/js/preparation.js';
import { memberStatus } from '../dist/js/engine.js';

// Run the exact browser bundles in a browser-like global environment. There
// are no separately installed time-zone dependencies in this application.
const browser = { console };
vm.createContext(browser);
for (const file of ['moment.min.js', 'moment-timezone.min.js']) {
  vm.runInContext(fs.readFileSync(new URL(`../dist/vendor/${file}`, import.meta.url), 'utf8'), browser);
}
globalThis.moment = browser.moment;

const stamp = value => Date.parse(value);
const owner = (overrides = {}) => ({
  id: 'owner', name: 'Alex', city: 'London', zone: 'Europe/London',
  role: 'Pricing', required: true,
  workStart: '09:00', workEnd: '17:00', workDays: [1, 2, 3, 4, 5],
  trips: [], blocks: [], ...overrides,
});
const step = (overrides = {}) => ({
  id: 'step', title: 'Internal review', ownerId: 'owner', hours: 2,
  done: false, notes: '', ...overrides,
});

test('finishes at a workday boundary and counts only actual working effort', () => {
  const person = owner();
  const [plan] = planPreparation([step()], [person], stamp('2026-11-16T18:00:00Z'));
  assert.equal(plan.error, null);
  assert.equal(plan.start, stamp('2026-11-16T15:00:00Z'));
  assert.equal(plan.end, stamp('2026-11-16T17:00:00Z'));
  assert.equal(plan.scheduledHours, 2);
  assert.equal(plan.segments.length, 1);
});

test('skips nights and weekend while spanning several working shifts', () => {
  const [plan] = planPreparation([step({ hours: 10 })], [owner()], stamp('2026-11-16T10:00:00Z'));
  assert.equal(plan.error, null);
  assert.equal(plan.start, stamp('2026-11-12T16:00:00Z'));
  assert.equal(plan.end, stamp('2026-11-16T10:00:00Z'));
  assert.deepEqual(plan.segments, [
    { start: stamp('2026-11-12T16:00:00Z'), end: stamp('2026-11-12T17:00:00Z') },
    { start: stamp('2026-11-13T09:00:00Z'), end: stamp('2026-11-13T17:00:00Z') },
    { start: stamp('2026-11-16T09:00:00Z'), end: stamp('2026-11-16T10:00:00Z') },
  ]);
  assert.equal(plan.scheduledHours, 10);
});

test('preserves sequential dependency order across owners in different zones', () => {
  const people = [owner(), owner({ id: 'singapore', city: 'Singapore', zone: 'Asia/Singapore' })];
  const plans = planPreparation([
    step({ id: 'data', title: 'Regional input', ownerId: 'singapore', hours: 3 }),
    step({ id: 'review', hours: 2 }),
  ], people, stamp('2026-11-16T16:00:00Z'));
  assert.ok(plans.every(plan => plan.error === null));
  assert.ok(plans[0].end <= plans[1].start);
  assert.equal(plans[0].end, stamp('2026-11-16T09:00:00Z'));
  assert.equal(plans[1].start, stamp('2026-11-16T14:00:00Z'));
});

test('invalid downstream owner blocks earlier pending steps', () => {
  const plans = planPreparation([
    step({ id: 'data', title: 'Collect data' }),
    step({ id: 'review', ownerId: 'missing' }),
  ], [owner()], stamp('2026-11-16T16:00:00Z'));
  assert.match(plans[1].error, /Assign an existing/);
  assert.match(plans[0].error, /following step/);
  assert.equal(plans[0].start, null);
  assert.equal(plans[1].end, null);
});

test('completed tasks consume no future capacity and can have a retired owner', () => {
  const plans = planPreparation([
    step({ id: 'done', ownerId: 'retired', hours: 100, done: true }),
    step({ id: 'pending' }),
  ], [owner()], stamp('2026-11-16T16:00:00Z'));
  assert.equal(plans[0].error, null);
  assert.equal(plans[0].start, null);
  assert.deepEqual(plans[0].segments, []);
  assert.equal(plans[1].start, stamp('2026-11-16T14:00:00Z'));
});

test('respects blocked time and gives every allocated quarter preferred availability', () => {
  const person = owner({ blocks: [{ id: 'flight', label: 'In transit', start: stamp('2026-11-16T14:30:00Z'), end: stamp('2026-11-16T15:30:00Z') }] });
  const meeting = stamp('2026-11-16T16:00:00Z');
  const [plan] = planPreparation([step({ hours: 1.1 })], [person], meeting);
  assert.equal(plan.error, null);
  assert.equal(plan.scheduledHours, 1.25);
  assert.ok(plan.end <= meeting);
  for (const segment of plan.segments) {
    for (let instant = segment.start; instant < segment.end; instant += 15 * 60000) {
      assert.equal(memberStatus(person, instant, 15, false).status, 'preferred');
    }
  }
});

test('travel changes the local working window used to schedule preparation', () => {
  const person = owner({ trips: [{ id: 'trip', city: 'Singapore', zone: 'Asia/Singapore', start: stamp('2026-11-16T00:00:00Z'), end: stamp('2026-11-20T00:00:00Z') }] });
  const [plan] = planPreparation([step()], [person], stamp('2026-11-16T16:00:00Z'));
  assert.equal(plan.error, null);
  assert.equal(plan.start, stamp('2026-11-16T07:00:00Z'));
  assert.equal(plan.end, stamp('2026-11-16T09:00:00Z'));
});

test('reports insufficient capacity without assigning misleading partial dates', () => {
  const [plan] = planPreparation([step()], [owner({ workDays: [] })], stamp('2026-11-16T16:00:00Z'));
  assert.match(plan.error, /Not enough available/);
  assert.equal(plan.start, null);
  assert.equal(plan.end, null);
  assert.deepEqual(plan.segments, []);
});

test('validates effort and meeting timestamp', () => {
  for (const hours of [0, -1, NaN, Infinity, 'abc']) {
    const [plan] = planPreparation([step({ hours })], [owner()], stamp('2026-11-16T16:00:00Z'));
    assert.match(plan.error, /positive number/);
  }
  const [invalid, completed] = planPreparation([step(), step({ done: true })], [owner()], NaN);
  assert.match(invalid.error, /Choose a meeting time/);
  assert.equal(completed.error, null);
});

test('very small positive effort still reserves a complete quarter-hour', () => {
  const [plan] = planPreparation([step({ hours: 1e-12 })], [owner()], stamp('2026-11-16T16:00:00Z'));
  assert.equal(plan.error, null);
  assert.equal(plan.scheduledHours, 0.25);
  assert.equal(plan.start, stamp('2026-11-16T15:45:00Z'));
});
