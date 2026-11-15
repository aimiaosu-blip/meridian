import { localesA } from './locales-a.js';
import { localesB } from './locales-b.js';
import { inputLocales, cityLabels } from './input-locales.js';

const catalogs = { ...localesA, ...localesB };
export const languages = [
  ['en','English','English'],['zh','中文','Chinese'],['es','Español','Spanish'],['fr','Français','French'],
  ['de','Deutsch','German'],['sv','Svenska','Swedish'],['da','Dansk','Danish'],['no','Norsk','Norwegian'],
  ['fi','Suomi','Finnish'],['nl','Nederlands','Dutch'],['it','Italiano','Italian'],['pt','Português','Portuguese'],
  ['pl','Polski','Polish'],['cs','Čeština','Czech'],['tr','Türkçe','Turkish'],['el','Ελληνικά','Greek'],
  ['ro','Română','Romanian'],['hu','Magyar','Hungarian'],['uk','Українська','Ukrainian'],['ru','Русский','Russian'],
  ['ar','العربية','Arabic'],['he','עברית','Hebrew'],['hi','हिन्दी','Hindi'],['bn','বাংলা','Bengali'],
  ['id','Bahasa Indonesia','Indonesian'],['ms','Bahasa Melayu','Malay'],['th','ไทย','Thai'],
  ['vi','Tiếng Việt','Vietnamese'],['ja','日本語','Japanese'],['ko','한국어','Korean'],
].map(([code,name,english]) => Object.freeze({code,name,english,dir: ['ar','he'].includes(code) ? 'rtl' : 'ltr'}));
const languageCodes = new Set(languages.map(language => language.code));
export const isLanguage = code => languageCodes.has(code);
export const localeFor = code => code === 'zh' ? 'zh-CN' : code === 'no' ? 'nb' : isLanguage(code) ? code : 'en-GB';
const escapePattern = text => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = Object.keys(localesA.en).filter(key => key.includes('{n}')).map(key => ({ key, pattern: new RegExp('^' + key.split('{n}').map(escapePattern).join('(.+?)') + '$', 'u') }));

/** Translate an English source key or a populated {n} template. */
export function translate(text, lang = 'en') {
  const value = String(text ?? '');
  if (!value) return '';
  const catalog = catalogs[isLanguage(lang) ? lang : 'en'];
  if (typeof catalog[value] === 'string') return catalog[value];
  for (const {key,pattern} of patterns) {
    const match = value.match(pattern);
    if (match && typeof catalog[key] === 'string') return catalog[key].replace('{n}', () => match[1]);
  }
  return value;
}

const canonicalCities = ['Stockholm','Shanghai','New York','London','Tokyo'];
export function localizedCity(city, lang = 'en') {
  const index = canonicalCities.indexOf(city);
  return index < 0 ? city : (cityLabels[lang] || cityLabels.en)[index];
}
function vocabulary(lang) { return catalogs[lang]?.input || inputLocales[lang] || inputLocales.en; }

// Match complete words in spaced scripts. East Asian / Thai phrases also occur
// without spaces; explicitly known city aliases and keywords still match there.
function phrasePattern(phrase) {
  const compact = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\u0e00-\u0e7f]/u.test(phrase);
  return new RegExp((compact ? '' : '(?<![\\p{L}\\p{N}])') + escapePattern(phrase).replace(/\s+/g,'\\s+') + (compact ? '' : '(?![\\p{L}])'), 'giu');
}
function replacePhrases(text, entries) {
  const unique = [...new Map(entries.filter(([phrase]) => phrase).map(entry => [entry[0].toLowerCase(),entry])).values()];
  // A single replacement pass prevents translated output from matching another
  // source keyword (e.g. Norwegian "time" means "hour").
  const matches = [];
  for (const [phrase,replacement] of unique.sort((a,b) => b[0].length - a[0].length)) {
    for (const match of text.matchAll(phrasePattern(phrase))) {
      const start=match.index,end=start+match[0].length;
      if (!matches.some(old => start < old.end && end > old.start)) matches.push({start,end,replacement});
    }
  }
  for (const match of matches.sort((a,b) => b.start-a.start)) text=text.slice(0,match.start)+' '+match.replacement+' '+text.slice(match.end);
  return text;
}
function asciiDigits(text) {
  return text.normalize('NFKC').replace(/[٠-٩۰-۹०-९০-৯]/gu, digit => {
    const n = digit.codePointAt(0);
    return String(n >= 0x9e6 ? n-0x9e6 : n >= 0x966 ? n-0x966 : n >= 0x6f0 ? n-0x6f0 : n-0x660);
  });
}

/** Only known scheduling words are normalized. Unknown wording is preserved.
 * Optional protectedNames prevents rewriting words inside saved team names.
 */
export function normalizeQuery(text, lang = 'en', protectedNames = []) {
  let value = String(text ?? '');
  if (!isLanguage(lang) || lang === 'en' || lang === 'zh') return value;
  const protectedValues = [];
  for (const name of [...new Set(protectedNames.filter(name => typeof name === 'string' && name))].sort((a,b) => b.length-a.length)) {
    value = value.replace(phrasePattern(name), match => { const marker=`\uE000${protectedValues.length}\uE001`; protectedValues.push(match); return marker; });
  }
  value = asciiDigits(value);
  const input = vocabulary(lang);
  const aliases = {...input.cities};
  cityLabels[lang]?.forEach((label,index) => { aliases[label]=canonicalCities[index]; });
  value = replacePhrases(value, Object.entries(aliases));
  const mapping = { today:'today',tomorrow:'tomorrow',nextWeek:'next week',host:'I am in',later:'later',earlier:'earlier',add:'add',remove:'remove',allowExtended:'allow extended hours',workingOnly:'only working hours' };
  const entries = Object.entries(mapping).flatMap(([key,target]) => (input[key] || []).map(phrase => [phrase,target]));
  (input.weekdays || []).forEach((day,index) => entries.push([day,['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][index]]));
  value = replacePhrases(value, entries);
  // Units are changed only after numbers. Ordinary prose containing words like
  // "time", "hour" or "ora" is left untouched.
  for (const [key,target] of [['minutes','minutes'],['hours','hours']]) {
    for (const unit of [...(input[key] || [])].sort((a,b) => b.length-a.length)) {
      const compact=/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\u0e00-\u0e7f]/u.test(unit);
      const pattern = new RegExp('(\\d+(?:[.,]\\d+)?)[ \\-]*'+escapePattern(unit)+(compact?'':'(?![\\p{L}])'),'giu');
      value = value.replace(pattern, (_,number) => number.replace(',','.')+' '+target);
    }
  }
  value=value.replace(/\uE000(\d+)\uE001/g,(_,index) => protectedValues[Number(index)]);
  return value.replace(/\s+/g,' ').trim();
}

/** Stable, concise messages for the existing English/Chinese local parser. */
export function localizeParserMessage(text, lang = 'en') {
  const value=String(text ?? '');
  if (!value) return '';
  const direct=translate(value,lang);
  if (direct !== value) return direct;
  const mappings = [
    [/Some previous dates|部分日期.*过去/, 'Local dates changed. Check the date range.'],
    [/Some people or places|部分参会者或地点/, 'Some people were not recognized. Review the list.'],
    [/Additional preferences|额外偏好/, 'Common meeting phrases only. Review the details.'],
    [/one meeting at a time|安排单次会议/, 'Schedule one meeting at a time.'],
    [/exact time|Clock-time constraints|具体几点|拖动时间条精确/, 'Generate options first, then drag to set an exact time.'],
    [/duration must|whole number|时长应为/, 'Use a duration from 1 to 480 minutes.'],
    [/one meeting duration|指定一个会议时长/, 'Use a duration from 1 to 480 minutes.'],
    [/date.*past|dates have passed|日期.*已经过去/, 'Choose a future meeting time.'],
    [/chronological date range|日期范围/, 'Choose a duration of 1–480 minutes and a date range of up to 14 days.'],
    [/valid date|remaining weekdays|有效日期|剩余工作日/, 'Invalid date. Try tomorrow or next week.'],
    [/own city|location was not recognized|team name or location is ambiguous|Name a city or saved team|选择你所在的城市|所在的城市|团队名称或所在地有歧义|哪个城市或已保存/, 'Choose a supported city or saved team.'],
    [/scheduling change|新的排会要求/, 'Common meeting phrases only. Review the details.'],
    [/1,500 characters|1500 字/, 'Enter cities, a date and duration.'],
    [/current date is unavailable|当前日期不可用/, 'Invalid date. Try tomorrow or next week.'],
  ];
  const matched=mappings.find(([pattern]) => pattern.test(value));
  if (matched) return translate(matched[1],lang);
  // Unknown future parser messages must not leak a different interface language.
  return lang === 'en' && !/[\u3400-\u9fff]/u.test(value) ? value : translate('Common meeting phrases only. Review the details.',lang);
}

/** Display localized examples; submit query directly so every language can try it. */
export function examplesFor(lang = 'en') {
  const city=name => localizedCity(name,lang);
  const phrase=translate('Stockholm → Shanghai, next week, 45 min…',lang);
  const input=vocabulary(lang);
  const minutes=input.minutes?.[0] || 'min';
  return [
    {label:`${city('Stockholm')} → ${city('Shanghai')}`,text:phrase,query:"I'm in Stockholm, meet Shanghai next week for 45 minutes"},
    {label:`${city('Shanghai')} + ${city('New York')}`,text:`${city('Stockholm')} → ${city('Shanghai')} + ${city('New York')} · ${input.nextWeek?.[0] || 'next week'} · 45 ${minutes}`,query:"I'm in Stockholm, meet Shanghai and New York next week for 45 minutes"},
    {label:`${city('London')} + ${city('New York')}`,text:`${city('London')} → ${city('New York')} · ${input.tomorrow?.[0] || 'tomorrow'} · 30 ${minutes}`,query:"I'm in London, meet New York tomorrow for 30 minutes"},
  ];
}
