import { cities } from './cities.js';

// Deliberately bounded, on-device parsing. No input is sent to an AI service.
export const cityAliases = {
  Stockholm: ['斯德哥尔摩', '斯德哥爾摩'], 'Örebro': ['厄勒布鲁', 'Orebro'], London: ['伦敦', '倫敦'], Berlin: ['柏林'], Paris: ['巴黎'], Amsterdam: ['阿姆斯特丹'], Copenhagen: ['哥本哈根'], Oslo: ['奥斯陆'], Helsinki: ['赫尔辛基'], Madrid: ['马德里'], Rome: ['罗马'], Zurich: ['苏黎世', 'Zürich'], Warsaw: ['华沙'], Prague: ['布拉格'], Lisbon: ['里斯本'], Istanbul: ['伊斯坦布尔'], Athens: ['雅典'], Reykjavik: ['雷克雅未克'],
  Singapore: ['新加坡'], Shanghai: ['上海'], Beijing: ['北京'], Shenzhen: ['深圳'], 'Hong Kong': ['香港'], Taipei: ['台北', '臺北'], Tokyo: ['东京', '東京'], Seoul: ['首尔', '首爾'], Bangkok: ['曼谷'], 'Ho Chi Minh City': ['胡志明市', '胡志明'], Jakarta: ['雅加达'], Manila: ['马尼拉'], 'Kuala Lumpur': ['吉隆坡'], Mumbai: ['孟买'], 'New Delhi': ['新德里', 'Delhi'], Bengaluru: ['班加罗尔', 'Bangalore'], Kathmandu: ['加德满都'], Dubai: ['迪拜'], Riyadh: ['利雅得'], Doha: ['多哈'], Karachi: ['卡拉奇'], Dhaka: ['达卡'],
  Santiago: ['圣地亚哥'], Lima: ['利马'], 'Bogotá': ['波哥大', 'Bogota'], 'São Paulo': ['圣保罗', 'Sao Paulo'], 'Buenos Aires': ['布宜诺斯艾利斯'], 'Mexico City': ['墨西哥城'], 'New York': ['纽约', '紐約', 'NYC'], 'Washington DC': ['华盛顿', 'Washington D.C.', 'Washington, DC'], Chicago: ['芝加哥'], Dallas: ['达拉斯'], Denver: ['丹佛'], Phoenix: ['菲尼克斯', '凤凰城'], 'Los Angeles': ['洛杉矶', '洛杉磯'], 'San Francisco': ['旧金山', '舊金山'], Seattle: ['西雅图'], Anchorage: ['安克雷奇'], Honolulu: ['檀香山', '火奴鲁鲁'], Toronto: ['多伦多'], 'Montréal': ['蒙特利尔', 'Montreal'], Vancouver: ['温哥华'], Calgary: ['卡尔加里'], 'St. John’s': ['圣约翰斯', "St. John's", 'St Johns'],
  Johannesburg: ['约翰内斯堡'], 'Cape Town': ['开普敦'], Nairobi: ['内罗毕'], Cairo: ['开罗'], Accra: ['阿克拉'], Lagos: ['拉各斯'], Casablanca: ['卡萨布兰卡'], Lusaka: ['卢萨卡'], Lubumbashi: ['卢本巴希'], Perth: ['珀斯'], Sydney: ['悉尼'], Melbourne: ['墨尔本'], Brisbane: ['布里斯班'], Adelaide: ['阿德莱德'], Darwin: ['达尔文'], Auckland: ['奥克兰'], Wellington: ['惠灵顿'], Suva: ['苏瓦'],
};

const normalize = value => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[’‘]/g, "'").toLowerCase();
const isLatin = value => /^[a-z0-9]/i.test(value);
const words = value => /[a-z0-9]/i.test(value || '');
const dayMS = 86_400_000;
const dateMS = date => Date.parse(`${date}T12:00:00Z`);
const plusDays = (date, days) => new Date(dateMS(date) + days * dayMS).toISOString().slice(0, 10);
const weekday = date => new Date(dateMS(date)).getUTCDay();
const validDate = date => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(dateMS(date)) && new Date(dateMS(date)).toISOString().slice(0, 10) === date;
const serial = text => normalize(text).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function aliasesFor(city) { return [city.city, ...(cityAliases[city.city] || [])]; }

export function cityDisplay(city, lang = 'zh') {
  const name = typeof city === 'string' ? city : city?.city;
  return lang === 'zh' ? (cityAliases[name]?.[0] || name || '') : (name || '');
}

export function resolveCity(text) {
  const key = normalize(text).trim();
  return cities.find(city => aliasesFor(city).some(alias => normalize(alias) === key) || normalize(city.label) === key) || null;
}

function findNames(text, items, namesFor) {
  const found = [];
  for (const item of items) {
    for (const name of namesFor(item).filter(Boolean)) {
      const alias = normalize(name);
      let from = 0;
      while (from < text.length) {
        const index = text.indexOf(alias, from);
        if (index < 0) break;
        from = index + alias.length;
        if (isLatin(alias) && (words(text[index - 1]) || words(text[index + alias.length]))) continue;
        found.push({ item, index, end: index + alias.length, alias });
      }
    }
  }
  // Prefer complete names over aliases embedded inside another name.
  const accepted = [];
  for (const match of found.sort((a, b) => (b.end - b.index) - (a.end - a.index))) {
    if (!accepted.some(other => match.index < other.end && match.end > other.index)) accepted.push(match);
  }
  return accepted.sort((a, b) => a.index - b.index);
}

function localDate(now, zone) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(now));
  const part = type => parts.find(p => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function chineseNumber(text) {
  if (/^[+-]?\d+(?:\.\d+)?$/.test(text)) return Number(text);
  const digit = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  let total = 0, current = 0;
  for (const char of text) {
    if (char in digit) current = digit[char];
    else if (char === '十' || char === '百') { total += (current || 1) * (char === '十' ? 10 : 100); current = 0; }
    else return NaN;
  }
  return total + current;
}

function parseDates(text, today) {
  const explicit = [...text.matchAll(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/g)].map(m => `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`);
  if (explicit.length) {
    if (explicit.some(date => !validDate(date))) return { error: 'invalid' };
    if (explicit.length === 2 && /(?:至|到|\bto\b|through|\.\.)/.test(text)) {
      const count = Math.round((dateMS(explicit[1]) - dateMS(explicit[0])) / dayMS);
      if (count < 0 || count > 13) return { error: 'range' };
      return { dates: Array.from({ length: count + 1 }, (_, i) => plusDays(explicit[0], i)) };
    }
    return { dates: [...new Set(explicit)] };
  }
  const monthDay = text.match(/(\d{1,2})月(\d{1,2})[日号]?/);
  if (monthDay) {
    const date = `${today.slice(0, 4)}-${monthDay[1].padStart(2, '0')}-${monthDay[2].padStart(2, '0')}`;
    return validDate(date) ? { dates: [date] } : { error: 'invalid' };
  }
  if (/(?:下个月|下月|月底|明年|圣诞|next month|next year|christmas|end of (?:the )?month)/i.test(text)) return { error: 'unsupported' };
  const monday = plusDays(today, -((weekday(today) + 6) % 7));
  const zhDay = text.match(/(下下|下|本|这)?(?:周|星期|礼拜)([一二三四五六日天])/);
  if (zhDay) {
    const offset = '一二三四五六日'.indexOf(zhDay[2] === '天' ? '日' : zhDay[2]);
    const week = zhDay[1] || (/(?:下下周|下下星期)/.test(text) ? '下下' : /(?:下周|下星期)/.test(text) ? '下' : '');
    let date = plusDays(monday, (week === '下下' ? 14 : week === '下' ? 7 : 0) + offset);
    if (!week && date < today) date = plusDays(date, 7);
    return { dates: [date] };
  }
  const enDay = text.match(/\b(?:(next week|next|this)\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (enDay) {
    const offset = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(enDay[2]);
    const nextWeek = /\bnext week\b/.test(text);
    let date = plusDays(monday, offset + (nextWeek ? 7 : 0));
    if (enDay[1] !== 'this' && !nextWeek && (date < today || (date === today && enDay[1] === 'next'))) date = plusDays(date, 7);
    return { dates: [date] };
  }
  if (/(?:下下周|下下星期)/.test(text)) return { dates: Array.from({ length: 5 }, (_, i) => plusDays(monday, 14 + i)) };
  if (/(?:下周|下星期|下礼拜|\bnext week\b)/.test(text)) return { dates: Array.from({ length: 5 }, (_, i) => plusDays(monday, 7 + i)) };
  if (/(?:本周|这周|这星期|\bthis week\b)/.test(text)) return { dates: Array.from({ length: 5 }, (_, i) => plusDays(monday, i)).filter(date => date >= today) };
  if (/(?:后天|day after tomorrow)/.test(text)) return { dates: [plusDays(today, 2)] };
  if (/(?:明天|\btomorrow\b)/.test(text)) return { dates: [plusDays(today, 1)] };
  if (/(?:今天|\btoday\b)/.test(text)) return { dates: [today] };
  return { dates: null };
}

function participant(city, team = null) {
  return {
    id: team?.id || `city-${serial(city.city)}`,
    name: team?.name || city.city,
    city: city.city, zone: city.zone, lat: city.lat, lon: city.lon,
    workStart: team?.workStart || '09:00', workEnd: team?.workEnd || '18:00',
  };
}

function unknownParticipantMention(text, knownMatches) {
  let marked = text;
  for (const match of [...knownMatches].sort((a, b) => b.index - a.index)) {
    marked = marked.slice(0, match.index) + ' @ ' + marked.slice(match.end);
  }
  // These anchors introduce a person or location. A known entity is represented
  // by @, so the same checks also work after commas and in mixed-language input.
  const starts = /\b(?:meet|with|and|add|include)\s+|(?:和|与|以及|及|、|再加|加上|增加|加入|还有)\s*|[,，&]\s*/g;
  for (const match of marked.matchAll(starts)) {
    let tail = marked.slice(match.index + match[0].length).trimStart();
    if (!tail || tail.startsWith('@')) continue;
    if (/^(?:我|我们|想|希望|请|能否|麻烦|i\b|we\b|please\b|can\b|could\b|would\b|let's\b)/.test(tail)) continue;
    tail = tail.replace(/^(?:the|my|our|your|their)\s+/, '');
    if (/^[a-z]/.test(tail)) {
      const phrase = tail.split(/\b(?:for|tomorrow|today|next|this|on|at|in|with|and|then|please|to|allow|consider|include|meeting|meet|schedule|book|working|work|business|early|late|earlier|later|only)\b|[,.;!?@]/)[0].trim();
      if (phrase && !/^(?:a|an|half|one|two|three|four|five|six|seven|eight|nine|ten)(?:\s|$)/.test(phrase) && !/^i(?:'m| am| will)\b/.test(phrase)) return true;
    } else if (/^[\u3400-\u9fff]/.test(tail)) {
      const phrase = tail.split(/开|安排|约|聊|讨论|下下?周|本周|这周|今天|明天|后天|允许|可以|考虑|只限|仅限|再晚|再早|改成|改为|我在|我想|\d|[,，。;；!?？！@]|和|与|以及|及|、/)[0].trim();
      if (phrase && !/^(?:半小时|一个小时|一小时|两小时|三小时|四小时|五小时|六小时|七小时|八小时)/.test(phrase)) return true;
    }
  }
  return false;
}

export function parseRequest(input, { now = Date.now(), organizerCity = 'Stockholm', savedTeams = [], previous = null } = {}) {
  const raw = String(input ?? '').trim();
  const text = normalize(raw);
  const zh = /[\u3400-\u9fff]/.test(raw);
  const say = (cn, en) => zh ? cn : en;
  const fail = (cn, en) => ({ ok: false, request: null, warnings: [], error: say(cn, en) });
  if (!raw || raw.length > 1500) return fail('请输入一句不超过 1500 字的排会需求。', 'Enter a meeting request of up to 1,500 characters.');
  if (!Number.isFinite(now)) return fail('当前日期不可用，请刷新页面。', 'The current date is unavailable. Please reload.');
  if (/(?:每周|每星期|每月|每两周|\bweekly\b|\brecurring\b|\bevery (?:week|day|month)\b)/.test(text)) return fail('这个 demo 先安排单次会议，请给出具体日期或“下周”。', 'This demo schedules one meeting at a time. Use a date or “next week”.');
  // A precise time constraint must never silently become an unconstrained search.
  if (/(?:\d{1,2}:\d{2}|(?:上午|下午|晚上|早上|中午)\s*[零一二两三四五六七八九十\d]+\s*(?:点|时)|\b\d{1,2}(?:\.\d{2})?\s*(?:am|pm)\b|(?:不早于|不晚于|最晚|最早)\s*\d)/.test(text)) return fail('请先用日期和时长生成方案，再拖动时间条精确调整；聊天暂不支持具体几点的限制。', 'Generate options with a date and duration first, then drag the timeline to adjust the exact time. Clock-time constraints are not supported in chat yet.');

  const validTeams = savedTeams.filter(t => t?.name && resolveCity(t.city));
  const teamMatches = findNames(text, validTeams, team => [team.name]);
  let cityMatches = findNames(text, cities, aliasesFor).filter(match => !teamMatches.some(team => match.index < team.end && match.end > team.index));
  for (const match of teamMatches) {
    const qualifier = [...cityMatches].reverse().find(city => city.end <= match.index && /^\s*(?:的\s*)?$/.test(text.slice(city.end, match.index)));
    const sameNames = validTeams.filter(team => normalize(team.name) === match.alias);
    const candidates = qualifier ? sameNames.filter(team => resolveCity(team.city).city === qualifier.item.city) : sameNames;
    if (candidates.length !== 1) return fail('这个团队名称或所在地有歧义，请使用唯一的已保存团队名称，或只输入城市名称。', 'That team name or location is ambiguous. Use a unique saved team name, or enter only the city.');
    match.item = candidates[0];
    if (qualifier) cityMatches = cityMatches.filter(city => city !== qualifier);
  }
  const hostMention = cityMatches.find(match => /(?:我(?:现在|目前|下周|届时)?在\s*|\bi(?:'m| am| will be)(?:\s+based)?\s+in\s*)$/.test(text.slice(Math.max(0, match.index - 40), match.index)));
  const host = hostMention?.item || resolveCity(previous?.organizerCity || organizerCity);
  if (!host) return fail('请先选择你所在的城市。', 'Choose your own city first.');
  // Do not quietly use the saved home city when a different, unsupported home was typed.
  const hostPhrase = text.match(/(?:我(?:现在|目前|下周|届时)?在|\bi(?:'m| am| will be)(?:\s+based)?\s+in)\s*([^，,。.!?？\n]+)/);
  if (hostPhrase && !hostMention) return fail('没有识别出你所在的城市，请使用支持的城市名称或在位置选择器中设置。', 'Your location was not recognized. Use a supported city or choose it in the location selector.');
  const today = localDate(now, host.zone);
  const dateResult = parseDates(text, today);
  if (dateResult.error) return fail(dateResult.error === 'range' ? '日期范围请控制在 14 天内，并按先后顺序填写。' : '没有识别出有效日期，请使用 YYYY-MM-DD、明天或下周。', dateResult.error === 'range' ? 'Use a chronological date range of at most 14 days.' : 'Use a valid date such as YYYY-MM-DD, tomorrow, or next week.');
  if (dateResult.dates?.some(date => date < today)) return fail('这个日期已经过去，请选择今天或之后的日期。', 'That date is in the past. Choose today or a future date.');
  if (dateResult.dates?.length === 0) return fail('本周已没有剩余工作日，可以试试“下周”。', 'There are no remaining weekdays this week. Try “next week”.');

  const warnings = [];
  const extendedOn = /(?:允许|可以|考虑|接受)(?:.{0,4})(?:早晚|加班|早起|晚间)|\b(?:allow|include|consider) (?:early|late|extended|evening|overtime)/.test(text);
  const extendedOff = /(?:只限|仅限|只要|严格|只在)(?:.{0,4})(?:工作时间|上班时间)|不(?:要|能|允许)加班|\b(?:only|strict(?:ly)?) (?:working|work|business) hours\b/.test(text);
  const actionText = text.replace(/(?:允许|可以|考虑|接受).{0,4}(?:早晚|加班|早起|晚间)(?:.{0,3}\d+\s*小时)?/g, ' ');
  const shiftMatch = actionText.match(/(?:(?:再|稍微)?(?:晚|早)(?:一点|一些|点)?(?=\s*\d)|(?:再|稍微)?(?:晚|早)(?:一点|一些|点)|推迟|提前|\b(?:later|earlier)\b)(?:\s*(?:by\s+)?([零一二两三四五六七八九十百\d.]+)\s*(分钟|小时|minutes?|mins?|hours?|hrs?))?/);
  const numericShift = shiftMatch ? ((shiftMatch[1] ? chineseNumber(shiftMatch[1]) * (/小时|hour|hr/.test(shiftMatch[2]) ? 60 : 1) : 60) * (/早|提前|earlier/.test(shiftMatch[0]) ? -1 : 1)) : 0;
  let durationText = actionText;
  if (shiftMatch) durationText = durationText.replace(shiftMatch[0], ' ');
  durationText = durationText.replace(/(?:一个|an? )小时|\ban? hour\b/g, '1小时');
  const durationMatches = [...durationText.matchAll(/([+-]?\d+(?:\.\d+)?|[零一二两三四五六七八九十百]+)[ -]*(分钟|分(?:钟)?|mins?\b|minutes?\b|小时|hours?\b|hrs?\b)/g)];
  let duration = previous?.duration || 45;
  if (/半(?:个)?小时|half (?:an? )?hour/.test(durationText)) duration = 30;
  if (durationMatches.length) {
    const values = durationMatches.map(match => chineseNumber(match[1]) * (/小时|hour|hr/.test(match[2]) ? 60 : 1));
    if (new Set(values).size > 1) return fail('请指定一个会议时长，例如“45 分钟”。', 'Choose one meeting duration, for example “45 minutes”.');
    duration = values[0];
  }
  if (!Number.isInteger(duration) || duration < 1 || duration > 480) return fail('会议时长应为 1 至 480 分钟的整数。', 'Meeting duration must be a whole number from 1 to 480 minutes.');

  const mentioned = [...teamMatches.map(match => ({ ...match, value: participant(resolveCity(match.item.city), match.item) })),
    ...cityMatches.filter(match => match !== hostMention && match.item.city !== host.city).map(match => ({ ...match, value: participant(match.item) }))].sort((a, b) => a.index - b.index);
  const additions = /(?:再加|加上|增加|加入|还有|也和|\badd\b|\balso\b|\binclude\b)/.test(text);
  const removals = /(?:去掉|移除|删掉|不和|不用.{0,4}参加|\bremove\b|\bwithout\b)/.test(text);
  let participants = mentioned.length ? mentioned.map(match => match.value) : (previous?.participants || []).map(person => ({ ...person }));
  if (previous && (additions || removals)) {
    const old = previous.participants.map(person => ({ ...person }));
    participants = removals ? old.filter(person => !mentioned.some(m => m.value.id === person.id || (m.value.id?.startsWith('city-') && m.value.city === person.city))) : [...old, ...participants];
  }
  participants = [...new Map(participants.map(person => [person.id || `${person.name}:${person.city}`, person])).values()];
  if (!participants.length) return fail('请告诉我想和哪个城市或已保存的团队开会，例如“明天和上海开 30 分钟的会”。', 'Name a city or saved team, for example “Meet Shanghai tomorrow for 30 minutes”.');

  const changed = mentioned.length || hostMention || dateResult.dates || durationMatches.length || /半(?:个)?小时|half (?:an? )?hour/.test(text) || shiftMatch || extendedOn || extendedOff;
  if (!changed) return fail('没有识别出新的排会要求。可以说“改成 30 分钟”“下周三”或“再加东京”。', 'No scheduling change was recognized. Try “30 minutes”, “next Wednesday”, or “add Tokyo”.');
  if (/(?:不想|不要|避免|尽量|prefer|avoid|except|after|before)/.test(text) && !extendedOff) warnings.push(say('这句里的额外偏好尚未全部应用，请核对参会者、日期和工作时间后再选方案。', 'Additional preferences may not be applied. Review the people, dates, and working hours before selecting a time.'));

  // Unknown names beside a recognized participant are surfaced for review.
  if (unknownParticipantMention(text, [...teamMatches, ...findNames(text, cities, aliasesFor).filter(city => !teamMatches.some(team => city.index < team.end && city.end > team.index))])) warnings.push(say('部分参会者或地点未被识别，尚未纳入方案。请补充支持的城市名称，或先保存团队名称和城市。', 'Some people or places were not recognized and are not included. Specify a supported city, or save a team name and city first.'));

  let dates = dateResult.dates || previous?.dates?.slice() || Array.from({ length: 7 }, (_, i) => plusDays(today, i)).filter(date => ![0, 6].includes(weekday(date)));
  if (!dateResult.dates && dates.some(date => date < today)) {
    dates = dates.filter(date => date >= today);
    if (!dates.length) return fail('之前选择的日期在你当前所在地已经过去，请补充新的日期，例如“明天”或“下周”。', 'The previous dates have passed in your current location. Give a new date, such as “tomorrow” or “next week”.');
    warnings.push(say('之前的部分日期在你当前所在地已经过去，已移除；其余日期保持不变，请核对。', 'Some previous dates have passed in your current location and were removed. The remaining dates are unchanged; please review them.'));
  }
  const titleMatch = raw.match(/(?:主题(?:是|为|：|:)|(?:titled|subject[: ]))\s*[“"']?([^”"'\n，,。]{1,100})/i);
  const request = {
    organizerCity: host.city, participants, dates, duration,
    shiftMinutes: (previous?.shiftMinutes || 0) + numericShift,
    allowExtended: extendedOff ? false : extendedOn ? true : (previous?.allowExtended || false),
    title: titleMatch?.[1]?.trim() || previous?.title || say('跨时区会议', 'Cross-time-zone meeting'),
  };
  return { ok: true, request, warnings, error: '' };
}
