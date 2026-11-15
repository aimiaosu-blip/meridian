import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePlace, createFormRequest } from '../dist/js/form-request.js';

const now = Date.parse('2026-11-14T14:30:00Z');
const person = (id, city = 'London', extra = {}) => ({ id, city, name: city, ...extra });
const build = options => createFormRequest({ now, hostCity: 'Stockholm', participants: [person('london')], ...options });
const request = options => { const result = build(options); assert.equal(result.ok, true, result.error); return result.request; };

test('whole city values, aliases, localized cities and exact saved names resolve without sentence parsing', () => {
  assert.deepEqual(resolvePlace('  NYC  '), { city: 'New York' });
  assert.deepEqual(resolvePlace('斯德哥尔摩'), { city: 'Stockholm' });
  assert.deepEqual(resolvePlace('Montréal, Canada'), { city: 'Montréal' });
  assert.deepEqual(resolvePlace('لندن', { lang: 'ar' }), { city: 'London' });
  const team = { id: 'sales', name: 'Asia sales', city: 'Shanghai', workStart: '10:00', workEnd: '19:00' };
  assert.deepEqual(resolvePlace('asia SALES', { teams: [team] }), { city: 'Shanghai', team });
  assert.equal(resolvePlace('Meet London next week'), null);
  assert.equal(resolvePlace('New York team'), null);
  assert.equal(resolvePlace('Lon'), null);
  assert.equal(resolvePlace('Asia sales', { teams: [team, { ...team, id: 'another', city: 'Tokyo' }] }), null);
});

test('form fields produce independent same-city participants and authoritative timezone metadata', () => {
  const source = [person('sales', 'Shanghai', { name: 'Sales', workStart: '08:00', workEnd: '16:00', zone: 'America/New_York', lat: 0 }), person('pricing', 'Shanghai', { name: 'Pricing' })];
  const copy = structuredClone(source);
  const result = request({ participants: source, duration: '30', allowExtended: true });
  assert.deepEqual(result.dates, ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20']);
  assert.equal(result.duration, 30);
  assert.equal(result.allowExtended, true);
  assert.equal(result.participants.length, 2);
  assert.equal(result.participants[0].zone, 'Asia/Shanghai');
  assert.equal(result.participants[0].workStart, '08:00');
  assert.equal(result.participants[1].workEnd, '18:00');
  assert.notEqual(result.participants[0].lat, 0);
  assert.deepEqual(source, copy);
  assert.equal(build({ participants: [person('same'), person('same', 'Tokyo')] }).error, 'sameCity');
  assert.equal(build({ participants: [person('organizer')] }).error, 'sameCity');
});

test('tomorrow and past-date validation use the organizer calendar across the date line', () => {
  const boundary = Date.parse('2026-11-16T00:30:00Z');
  assert.deepEqual(request({ now: boundary, hostCity: 'Honolulu', when: 'tomorrow' }).dates, ['2026-11-16']);
  assert.deepEqual(request({ now: boundary, hostCity: 'Tokyo', when: 'tomorrow' }).dates, ['2026-11-17']);
  assert.equal(build({ now: boundary, hostCity: 'Tokyo', when: 'date', date: '2026-11-15', includeWeekends: true }).error, 'datePast');
  assert.deepEqual(request({ now: boundary, hostCity: 'Honolulu', when: 'date', date: '2026-11-15', includeWeekends: true }).dates, ['2026-11-15']);
});

test('calendar date arithmetic stays correct over DST and next week always starts next Monday', () => {
  assert.deepEqual(request({ hostCity: 'New York', now: Date.parse('2026-03-08T06:30:00Z'), when: 'tomorrow' }).dates, ['2026-03-09']);
  assert.deepEqual(request({ hostCity: 'New York', now: Date.parse('2026-11-01T05:30:00Z'), when: 'tomorrow' }).dates, ['2026-11-02']);
  assert.equal(request({ now: Date.parse('2026-11-16T12:00:00Z'), when: 'nextWeek' }).dates[0], '2026-11-23');
  assert.deepEqual(request({ includeWeekends: true }).dates.slice(-2), ['2026-11-21', '2026-11-22']);
});

test('weekend dates require explicit opt-in while weekday ranges preserve their exact dates', () => {
  assert.equal(build({ when: 'tomorrow' }).error, 'includesWeekend');
  assert.deepEqual(request({ when: 'tomorrow', includeWeekends: true }).dates, ['2026-11-15']);
  assert.equal(build({ when: 'date', date: '2026-11-21' }).error, 'includesWeekend');
  const dates = ['2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23'];
  assert.deepEqual(request({ when: 'range', dates }).dates, dates);
  assert.equal(build({ when: 'range', dates: ['2026-11-21', '2026-11-22'] }).error, 'includesWeekend');
  assert.equal(build({ when: 'range', dates: ['2026-11-16', '2026-11-18'] }).error, 'noDates');
  assert.equal(build({ when: 'range', dates: ['2026-11-18', '2026-11-17'] }).error, 'noDates');
  assert.equal(build({ when: 'range', dates: ['2026-11-13', '2026-11-14'] }).error, 'datePast');
});

test('invalid or incomplete form values fail without guessed dates, locations or duration', () => {
  assert.equal(build({ participants: [] }).error, 'needCity');
  assert.equal(build({ hostCity: 'somewhere' }).error, 'invalidCity');
  assert.equal(build({ participants: [person('x', 'Mars')] }).error, 'invalidCity');
  assert.equal(build({ participants: [person('x', 'London', { workStart: '25:00' })] }).error, 'Choose valid and different work start and end times.');
  assert.equal(build({ participants: [person('x', 'London', { workStart: '09:00', workEnd: '09:00' })] }).ok, false);
  assert.equal(request({ participants: [person('x', 'London', { workStart: '22:00', workEnd: '06:00' })] }).participants[0].workEnd, '06:00');
  for (const duration of [0, 481, 1.5, true, '', '45 minutes', NaN]) assert.equal(build({ duration }).error, 'Use a duration from 1 to 480 minutes.');
  assert.equal(build({ when: 'date', date: '2026-02-30' }).error, 'noDates');
  assert.equal(build({ when: 'date', date: '' }).error, 'noDates');
  assert.equal(build({ when: 'unknown' }).error, 'noDates');
  assert.equal(build({ now: Infinity }).error, 'noDates');
  assert.equal(build({ participants: Array.from({ length: 20 }, (_, i) => person(String(i))) }).error, 'Use up to 20 people and 14 dates.');
});
