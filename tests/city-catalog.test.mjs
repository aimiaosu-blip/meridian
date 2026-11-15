import test from 'node:test';
import assert from 'node:assert/strict';
import { allCities, cities, cityByName } from '../dist/js/cities.js';
import { createFormRequest } from '../dist/js/form-request.js';

test('large location catalog preserves unique identities, valid time zones and bounded globe lights', () => {
  assert.ok(allCities.length > 30000);
  assert.equal(new Set(allCities.map(city => city.city)).size, allCities.length);
  assert.ok(new Set(allCities.map(city => city.countryCode)).size > 200);
  assert.equal(cities.length, 80);
  for (const city of allCities) {
    assert.equal(cityByName(city.city), city);
    assert.ok(Number.isFinite(city.lat) && Math.abs(city.lat) <= 90);
    assert.ok(Number.isFinite(city.lon) && Math.abs(city.lon) <= 180);
  }
  for (const zone of new Set(allCities.map(city => city.zone))) {
    assert.doesNotThrow(() => new Intl.DateTimeFormat('en', {timeZone:zone}));
  }
});

test('same-named locations retain their own coordinates and time zones in a meeting', () => {
  const matches = allCities.filter(city => city.name === 'Springfield' && city.countryCode === 'US');
  const byZone = [...new Map(matches.map(city => [city.zone,city])).values()];
  assert.ok(byZone.length >= 3);
  const participants = byZone.slice(0,3).map((city,index)=>({id:`person-${index}`,city:city.city,name:city.name,zone:'Etc/UTC',lat:0}));
  const result = createFormRequest({hostCity:'Stockholm',participants,when:'nextWeek',now:Date.parse('2026-11-15T00:00:00Z')});
  assert.equal(result.ok,true);
  result.request.participants.forEach((person,index)=> {
    assert.equal(person.city,byZone[index].city);
    assert.equal(person.zone,byZone[index].zone);
    assert.equal(person.lat,byZone[index].lat);
  });
  assert.equal(cityByName('Springfield'),undefined);
});
