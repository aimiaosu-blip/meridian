import test from 'node:test';
import assert from 'node:assert/strict';
import { makeCalendarFile, downloadCalendar, canShareCalendar, shareCalendar, googleCalendarUrl } from '../dist/js/calendar.js';
import { calendarText } from '../dist/js/calendar-i18n.js';

const sample = 'BEGIN:VCALENDAR\r\nSUMMARY:跨时区会议\r\nEND:VCALENDAR\r\n';

test('calendar files preserve UTF-8 contents and use a safe .ics filename and calendar MIME type', async () => {
  const file = makeCalendarFile({ contents: sample, filename: 'Meridian-2026-11-16.ics' });
  assert.equal(await file.text(), sample);
  assert.equal(file.type, 'text/calendar;charset=utf-8');
  assert.equal(file.name, 'Meridian-2026-11-16.ics');
  assert.equal(makeCalendarFile({ contents: sample, filename: 'folder/meeting' }).name, 'folder_meeting.ics');
  assert.throws(() => makeCalendarFile({ contents: '' }), TypeError);
});

test('Google Calendar handoff preserves UTC instants and encodes user text without extra actions or attendees', () => {
  const title = 'Pricing & review? add=guest@example.com / 上海';
  const description = 'New York → Stockholm\n45 min; <details> + #1';
  const url = new URL(googleCalendarUrl({ title, description, start: Date.parse('2026-11-01T05:45:00Z'), end: Date.parse('2026-11-01T06:30:00Z'), zone: 'America/New_York' }));
  assert.equal(url.origin, 'https://calendar.google.com');
  assert.equal(url.pathname, '/calendar/r/eventedit');
  assert.equal(url.searchParams.get('dates'), '20261101T054500Z/20261101T063000Z');
  assert.equal(url.searchParams.get('stz'), 'America/New_York');
  assert.equal(url.searchParams.get('etz'), 'America/New_York');
  assert.equal(url.searchParams.get('text'), title);
  assert.equal(url.searchParams.get('details'), description);
  assert.equal(url.searchParams.get('action'), 'TEMPLATE');
  assert.deepEqual([...url.searchParams.keys()].sort(), ['action', 'dates', 'details', 'etz', 'stz', 'text']);
  assert.throws(() => googleCalendarUrl({ start: NaN, end: 2 }), RangeError);
  assert.throws(() => googleCalendarUrl({ start: 2, end: 1 }), RangeError);
  assert.throws(() => googleCalendarUrl({ start: 1, end: 2, zone: 'not/a-zone' }), RangeError);
});

test('download starts using the file name and retains its Blob URL until the browser can consume it', t => {
  const file = makeCalendarFile({ contents: sample, filename: 'meeting.ics' });
  const anchor = { click: () => { clicked = true; }, remove: () => { removed = true; } };
  let clicked = false, removed = false, appended = false, revoke, delayed;
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    createElement: tag => { assert.equal(tag, 'a'); return anchor; },
    body: { appendChild: element => { assert.equal(element, anchor); appended = true; } },
  } });
  t.after(() => previous ? Object.defineProperty(globalThis, 'document', previous) : delete globalThis.document);
  t.mock.method(URL, 'createObjectURL', blob => { assert.equal(blob, file); return 'blob:calendar'; });
  t.mock.method(URL, 'revokeObjectURL', url => { revoke = url; });
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => { delayed = callback; assert.ok(delay >= 10000); });
  downloadCalendar(file);
  assert.equal(anchor.href, 'blob:calendar');
  assert.equal(anchor.download, 'meeting.ics');
  assert.ok(appended && clicked && removed);
  assert.equal(revoke, undefined);
  delayed();
  assert.equal(revoke, 'blob:calendar');
});

test('file sharing checks the exact ICS file, handles unsupported sharing, and preserves cancellation', async t => {
  const file = makeCalendarFile({ contents: sample });
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const nav = {};
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: nav });
  t.after(() => previous ? Object.defineProperty(globalThis, 'navigator', previous) : delete globalThis.navigator);
  assert.equal(canShareCalendar(file), false);
  nav.canShare = () => false;
  nav.share = async () => { throw new Error('must not share unsupported files'); };
  await assert.rejects(shareCalendar(file), /unavailable/);
  nav.canShare = () => { throw new Error('blocked'); };
  assert.equal(canShareCalendar(file), false);
  nav.canShare = data => { assert.deepEqual(data, { files: [file] }); return true; };
  let shared = false;
  nav.share = async data => { assert.deepEqual(data, { files: [file] }); shared = true; };
  await shareCalendar(file);
  assert.equal(shared, true);
  nav.share = async () => { throw new DOMException('Canceled', 'AbortError'); };
  await assert.rejects(shareCalendar(file), { name: 'AbortError' });
});

test('calendar help covers all 30 languages and falls back safely', () => {
  const languages = ['en','zh','es','fr','de','sv','da','no','fi','nl','it','pt','pl','cs','tr','el','ro','hu','uk','ru','ar','he','hi','bn','id','ms','th','vi','ja','ko'];
  const keys = ['downloadStarted','downloadHelp','googleHelp','share','shareFailed','downloadAgain','importHelp','google'];
  for (const language of languages) {
    for (const key of keys) assert.ok(calendarText(key, language) && calendarText(key, language) !== key, `${language}: ${key}`);
    assert.equal(calendarText('google', language), 'Google Calendar');
    if (language !== 'en') assert.notEqual(calendarText('downloadStarted', language), calendarText('downloadStarted', 'en'));
    assert.ok(calendarText('downloadHelp', language).includes('.ics'));
  }
  assert.equal(calendarText('downloadStarted', 'unknown'), calendarText('downloadStarted', 'en'));
  assert.equal(calendarText('downloadStarted', 'zh-CN'), calendarText('downloadStarted', 'zh'));
});
