import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../dist/js/app.js', import.meta.url), 'utf8');

test('saved contacts are offered directly in the meeting form', () => {
  assert.match(app, /function savedContactsMarkup\(\)/);
  assert.match(app, /\$\{savedContactsMarkup\(\)\}/);
  assert.match(app, /state\.teams\.map\(team => button\('toggle-saved-person'/);
});

test('new meetings do not automatically select saved contacts', () => {
  assert.match(app, /draftPeople = team \? \[\{\.\.\.team, name:nameFor\(team\)\}\] : \(request\?\.participants \|\| \[\]\)/);
  assert.doesNotMatch(app, /draftPeople\s*=\s*state\.teams/);
});

test('saved contacts reuse the existing participant model', () => {
  assert.match(app, /else addDraftPlace\(team\.city, team\.id\)/);
  assert.match(app, /draftPeople\.filter\(person => person\.id !== team\.id\)/);
  assert.match(app, /captureDraftHours\(\)/);
});

test('selection is accessible and reflects current meeting participants', () => {
  assert.match(app, /aria-pressed=/);
  assert.match(app, /\[data-action="toggle-saved-person"\]/);
  assert.match(app, /draftPeople\.some\(person => person\.id === node\.dataset\.id\)/);
});
