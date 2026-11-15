import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRequest, resolveCity, cityDisplay } from '../dist/js/request.js';

const now = Date.parse('2026-11-14T14:30:00Z');
const parse = (text, options = {}) => parseRequest(text, { now, ...options });
const value = (text, options) => {
  const result = parse(text, options);
  assert.equal(result.ok, true, result.error);
  return result.request;
};

test('original Chinese request resolves host, multiple cities and next-week dates', () => {
  const text = '我在斯德哥尔摩，想下周和上海、纽约的定价团队开一场 45 分钟的会。';
  const request = value(text);
  assert.deepEqual(parse(text).warnings, []);
  assert.equal(request.organizerCity, 'Stockholm');
  assert.deepEqual(request.participants.map(p => p.city), ['Shanghai', 'New York']);
  assert.deepEqual(request.dates, ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20']);
  assert.equal(request.duration, 45);
  assert.equal(request.allowExtended, false);
  assert.equal(request.participants[0].workEnd, '18:00');
});

test('English city aliases and word boundaries work without guessing countries', () => {
  const request = value("I'm in London. Meet NYC, Tokyo and Dubai next week for 1 hour");
  assert.equal(request.organizerCity, 'London');
  assert.deepEqual(request.participants.map(p => p.city), ['New York', 'Tokyo', 'Dubai']);
  assert.equal(request.duration, 60);
  assert.equal(parse('Meet New Yorkshire tomorrow').ok, false);
  assert.equal(parse('Meet the USA tomorrow').ok, false);
  assert.equal(resolveCity('Montréal').city, 'Montréal');
  assert.equal(resolveCity('蒙特利尔').city, 'Montréal');
  assert.deepEqual(parse("I'm in Stockholm, I want to meet Shanghai next week for 45 minutes").warnings, []);
  assert.equal(cityDisplay('Shanghai', 'zh'), '上海');
  assert.equal(cityDisplay({ city: 'Shanghai' }, 'en'), 'Shanghai');
});

test('relative dates use organizer local calendar, never host computer timezone', () => {
  const boundary = Date.parse('2026-11-16T00:30:00Z');
  const honolulu = value('I am in Honolulu. Meet Tokyo tomorrow for 30 minutes', { now: boundary });
  assert.deepEqual(honolulu.dates, ['2026-11-16']);
  const tokyo = value('我在东京，明天和纽约开半小时会', { now: boundary });
  assert.deepEqual(tokyo.dates, ['2026-11-17']);
  assert.equal(tokyo.duration, 30);
});

test('calendar arithmetic stays on correct dates across DST transitions', () => {
  const request = value("I'm in New York, meet London next week for 45 minutes", { now: Date.parse('2026-03-06T18:00:00Z') });
  assert.deepEqual(request.dates, ['2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13']);
  const autumn = value('我在纽约，下周三和伦敦开会', { now: Date.parse('2026-10-30T18:00:00Z') });
  assert.deepEqual(autumn.dates, ['2026-11-04']);
});

test('saved teams preserve independent identities even when located in one city', () => {
  const savedTeams = [
    { id: 'asia-sales', name: '亚洲销售团队', city: 'Shanghai', workStart: '08:00', workEnd: '16:00' },
    { id: 'china-pricing', name: '中国定价团队', city: 'Shanghai', workStart: '10:00', workEnd: '18:00' },
    { id: 'europe', name: '欧洲定价团队', city: 'Stockholm', workStart: '09:00', workEnd: '17:00' },
  ];
  const request = value('下周和亚洲销售团队、中国定价团队、欧洲定价团队开四十五分钟会', { savedTeams });
  assert.deepEqual(request.participants.map(p => p.id), ['asia-sales', 'china-pricing', 'europe']);
  assert.equal(request.participants[0].workStart, '08:00');
  assert.equal(request.participants[1].workStart, '10:00');
  assert.equal(request.participants[2].city, 'Stockholm');
  assert.equal(request.duration, 45);
});

test('city in saved team name does not create a duplicate city participant', () => {
  const savedTeams = [{ id: 'team', name: '上海定价团队', city: 'Shanghai' }];
  const request = value('下周和上海定价团队开30分钟的会', { savedTeams });
  assert.equal(request.participants.length, 1);
  assert.equal(request.participants[0].id, 'team');
});

test('city-qualified generic team names cannot silently select a different location', () => {
  const savedTeams = [{ id: 'generic', name: '定价团队', city: 'Shanghai' }];
  assert.equal(parse('下周和纽约的定价团队开会', { savedTeams }).ok, false);
  const matched = value('下周和上海的定价团队开会', { savedTeams });
  assert.deepEqual(matched.participants.map(p => p.id), ['generic']);
  const duplicateNames = [...savedTeams, { id: 'ny', name: '定价团队', city: 'New York' }];
  assert.equal(parse('下周和定价团队开会', { savedTeams: duplicateNames }).ok, false);
  assert.deepEqual(value('下周和纽约的定价团队开会', { savedTeams: duplicateNames }).participants.map(p => p.id), ['ny']);
  const unbound = parse('下周和纽约的定价团队开会', { savedTeams: [{ id: 'china', name: '上海定价团队', city: 'Shanghai' }] });
  assert.deepEqual(unbound.request.participants.map(p => p.city), ['New York']);
  assert.deepEqual(unbound.warnings, []);
});

test('follow-up changes retain previous people and dates and apply relative offsets', () => {
  const first = value('下周和上海开45分钟会');
  const shorter = value('改成30分钟', { previous: first });
  assert.equal(shorter.duration, 30);
  assert.deepEqual(shorter.participants, first.participants);
  assert.deepEqual(shorter.dates, first.dates);
  const later = value('再晚一点', { previous: shorter });
  assert.equal(later.duration, 30);
  assert.equal(later.shiftMinutes, 60);
  const earlier = value('earlier by 30 minutes', { previous: later });
  assert.equal(earlier.shiftMinutes, 30);
  assert.equal(earlier.duration, 30);
  const late30 = value('晚30分钟', { previous: first });
  assert.equal(late30.shiftMinutes, 30);
  assert.equal(late30.duration, 45);
  const specific = value('下周三', { previous: earlier });
  assert.deepEqual(specific.dates, ['2026-11-18']);
  assert.equal(parse('I like blue', { previous: first }).ok, false);
});

test('add and remove cities without merging distinct cities in the same timezone', () => {
  const first = value('下周和上海开会');
  const added = value('再加北京和东京', { previous: first });
  assert.deepEqual(added.participants.map(p => p.city), ['Shanghai', 'Beijing', 'Tokyo']);
  assert.equal(added.participants[0].zone, added.participants[1].zone);
  const removed = value('去掉北京', { previous: added });
  assert.deepEqual(removed.participants.map(p => p.city), ['Shanghai', 'Tokyo']);
});

test('extended hours are opt-in and do not overwrite meeting duration', () => {
  const first = value('下周和上海纽约开45分钟会');
  const extended = value('允许早晚2小时', { previous: first });
  assert.equal(extended.allowExtended, true);
  assert.equal(extended.duration, 45);
  const strict = value('只限工作时间', { previous: extended });
  assert.equal(strict.allowExtended, false);
});

test('invalid dates, unknown locations, excessive durations and unsupported constraints fail clearly', () => {
  for (const text of [
    '我在火星，想和上海开会', '明天和火星开会', '2026-02-30 和上海开会',
    '2026-11-13 和上海开会', '下个月和上海开会', '明天和上海开0分钟会',
    '明天和上海开-5分钟会', '明天和上海开2000分钟会', '明天下午3点和上海开会',
    'Meet Shanghai tomorrow at 3pm', '每周和上海开30分钟会',
  ]) {
    const result = parse(text);
    assert.equal(result.ok, false, text);
    assert.equal(typeof result.error, 'string');
    assert.ok(result.error.length);
  }
});

test('explicit date ranges have a bounded end and never silently reverse', () => {
  const request = value('2026-11-16 到 2026-11-18 和上海开会');
  assert.deepEqual(request.dates, ['2026-11-16', '2026-11-17', '2026-11-18']);
  assert.equal(parse('2026-11-18 到 2026-11-16 和上海开会').ok, false);
  assert.equal(parse('2026-11-16 到 2027-01-16 和上海开会').ok, false);
  assert.equal(value('2026-11-16 到 2026-11-29 和上海开会').dates.length, 14);
  assert.equal(parse('2026-11-16 到 2026-11-30 和上海开会').ok, false);
});

test('duration boundary matches the 480-minute editor limit', () => {
  assert.equal(value('明天和上海开480分钟会').duration, 480);
  assert.equal(parse('明天和上海开481分钟会').ok, false);
});

test('unknown important preferences are surfaced instead of claiming full understanding', () => {
  const result = parse('明天和上海开45分钟的会，尽量避开午饭');
  assert.equal(result.ok, true);
  assert.ok(result.warnings.length);
  assert.ok(parse('明天和上海和火星开会').warnings.length);
  for (const text of ['Meet Shanghai and Atlantis for 30 minutes', 'Meet Atlantis and Shanghai for 30 minutes', 'Meet Shanghai, Atlantis for 30 minutes', '下周和上海纽约开会然后再加火星', '下周和上海以及火星开45分钟会']) {
    const unknown = parse(text);
    assert.ok(!unknown.ok || unknown.warnings.length, text);
  }
});

test('changing organizer across the date line never retains entirely past search dates', () => {
  const boundary = Date.parse('2026-11-16T00:30:00Z');
  const first = value('我在檀香山，今天和上海开会', { now: boundary });
  assert.deepEqual(first.dates, ['2026-11-15']);
  const moved = parse('我在东京', { now: boundary, previous: first });
  assert.equal(moved.ok, false);
  assert.match(moved.error, /日期/);
  const mixed = value('我在檀香山，2026-11-15 到 2026-11-17 和上海开会', { now: boundary });
  const partial = parse('我在东京', { now: boundary, previous: mixed });
  assert.equal(partial.ok, true);
  assert.deepEqual(partial.request.dates, ['2026-11-16', '2026-11-17']);
  assert.ok(partial.warnings.length);
  const explicit = parse('我在东京，2026-11-15和上海开会', { now: boundary, previous: first });
  assert.equal(explicit.ok, false);
});

test('next week applies even if weekday is separated by another phrase', () => {
  const monday = Date.parse('2026-11-16T10:00:00Z');
  assert.deepEqual(value('Meet Shanghai next week on Wednesday for a 30-minute meeting', { now: monday }).dates, ['2026-11-25']);
  assert.equal(value('Meet Shanghai next week on Wednesday for a 30-minute meeting', { now: monday }).duration, 30);
  assert.deepEqual(value('下周和上海开会，周三', { now: monday }).dates, ['2026-11-25']);
});
