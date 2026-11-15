import test from 'node:test';
import assert from 'node:assert/strict';
import {languages,isLanguage,localeFor,translate,normalizeQuery,localizeParserMessage,examplesFor,localizedCity} from '../dist/js/i18n.js';
import {localesA} from '../dist/js/locales-a.js';
import {localesB} from '../dist/js/locales-b.js';
import {parseRequest} from '../dist/js/request.js';

const now=Date.parse('2026-11-14T12:00:00Z');
const catalogs={...localesA,...localesB};
test('all 30 selectable languages have complete catalogs and usable Intl locales', () => {
  assert.equal(languages.length,30);
  assert.equal(new Set(languages.map(item=>item.code)).size,30);
  for(const lang of languages){
    assert.ok(isLanguage(lang.code));
    assert.ok(new Intl.DateTimeFormat(localeFor(lang.code)).format(new Date(now)));
    for(const key of Object.keys(localesA.en)) assert.ok(typeof catalogs[lang.code][key]==='string' && catalogs[lang.code][key].length,`${lang.code}: ${key}`);
    assert.equal(lang.dir,['ar','he'].includes(lang.code)?'rtl':'ltr');
  }
  assert.equal(isLanguage('__proto__'),false);
  assert.equal(localeFor('xx'),'en-GB');
});
test('dynamic numbers and DST offsets survive translation without English templates', () => {
  for(const lang of languages){
    assert.equal(translate('Option 3',lang.code),catalogs[lang.code]['Option {n}'].replace('{n}','3'));
    assert.equal(translate('This clock time occurs twice; using +05:30.',lang.code),catalogs[lang.code]['This clock time occurs twice; using {n}.'].replace('{n}','+05:30'));
  }
  assert.equal(translate('', 'ja'),'');
  assert.equal(translate('untouched custom label', 'ar'),'untouched custom label');
});
test('localized examples submit valid requests for every language',()=>{
  for(const language of languages){
    const examples=examplesFor(language.code);
    assert.equal(examples.length,3);
    for(const example of examples){
      assert.ok(example.label && example.text && example.query);
      const result=parseRequest(example.query,{now});
      assert.ok(result.ok,`${language.code}: ${result.error}`);
      assert.ok(result.request.participants.length>0);
    }
  }
});
test('bounded German, Spanish, Japanese and Arabic requests retain dates and durations',()=>{
  for(const [lang,input,duration] of [
    ['de','Ich bin in Stockholm, Shanghai nächste Woche 30 Minuten',30],
    ['es','Estoy en Estocolmo, Shanghái la próxima semana 60 minutos',60],
    ['ja','私はストックホルム、上海と来週30分の会議',30],
    ['ar','أنا في ستوكهولم، شنغهاي الأسبوع القادم ٣٠ دقيقة',30],
  ]){
    const normalized=normalizeQuery(input,lang);
    const result=parseRequest(normalized,{now});
    assert.ok(result.ok,`${lang}: ${normalized} ${result.error}`);
    assert.equal(result.request.organizerCity,'Stockholm');
    assert.equal(result.request.participants[0].city,'Shanghai');
    assert.equal(result.request.duration,duration);
    assert.equal(result.request.dates[0],'2026-11-16');
  }
});
test('unknown wording and saved names are preserved instead of invented',()=>{
  assert.equal(normalizeQuery('ask the Mars team to join','en'),'ask the Mars team to join');
  assert.equal(normalizeQuery('Morgen Team morgen 30 Minuten','de',['Morgen Team']),'Morgen Team tomorrow 30 minutes');
  assert.equal(normalizeQuery('demain inconnue','fr'),'tomorrow inconnue');
  assert.equal(localizedCity('Stockholm','es'),'Estocolmo');
  assert.equal(localizedCity('Lagos','es'),'Lagos');
});
test('parser messages keep actionable language and do not leak Chinese into other locales',()=>{
  for(const lang of languages.filter(item=>item.code!=='zh')){
    const message=localizeParserMessage('这个日期已经过去，请选择今天或之后的日期。',lang.code);
    assert.equal(message,translate('Choose a future meeting time.',lang.code));
  }
  assert.equal(localizeParserMessage('Some people or places were not recognized and are not included.','de'),translate('Some people were not recognized. Review the list.','de'));
});
