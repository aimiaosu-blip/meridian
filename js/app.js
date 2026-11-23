import { cities, allCities, cityByName } from './cities.js';
import { createGlobe } from './globe.js?v=2';
import { localParts, localToInstants, buildICS } from './engine.js';
import { evaluateMeeting } from './planner.js';
import { createTimeline } from './timeline.js';
import { languages, isLanguage, localeFor, translate, localizedCity } from './i18n.js';
import { makeCalendarFile, downloadCalendar, canShareCalendar, shareCalendar, googleCalendarUrl } from './calendar.js';
import { calendarText } from './calendar-i18n.js';
import { formText } from './form-i18n.js';
import { pickerText } from './picker-i18n.js';
import { createFormRequest } from './form-request.js';

const STORAGE = 'meridian-globe-v2';
const app = document.getElementById('app');
const modal = document.getElementById('modal');
const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const uid = () => globalThis.crypto?.randomUUID?.() || `m${Date.now()}${Math.random().toString(36).slice(2)}`;
const clockOK = value => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value || '');
const samples = {
  europe: { zh: '欧洲定价团队', en: 'European pricing team', city: 'Stockholm' },
  asia: { zh: '亚洲销售团队', en: 'Asian sales team', city: 'Shanghai' },
  ny: { zh: '纽约定价团队', en: 'New York pricing team', city: 'New York' },
};
const defaults = () => ({ lang: 'en', host: { city: 'Stockholm', workStart: '09:00', workEnd: '18:00' }, teams: Object.entries(samples).map(([key, team]) => ({ id: `example-${key}`, name: team.en, city: team.city, workStart: '09:00', workEnd: '18:00', exampleKey: key })) });
let stored = defaults();
try {
  const raw = JSON.parse(localStorage.getItem(STORAGE) || 'null');
  if (raw && Array.isArray(raw.teams) && raw.teams.length <= 100) {
    const ids = new Set();
    const teams = raw.teams.filter(team => {
      if (!team || typeof team.id !== 'string' || !/^[\w-]{1,100}$/.test(team.id) || ids.has(team.id) || typeof team.name !== 'string' || !team.name.trim() || team.name.length > 80 || !cityByName(team.city) || !clockOK(team.workStart) || !clockOK(team.workEnd) || team.workStart === team.workEnd) return false;
      ids.add(team.id); return true;
    }).map(team => ({ id: team.id, name: team.name, city: team.city, workStart: team.workStart, workEnd: team.workEnd, ...(samples[team.exampleKey] ? { exampleKey: team.exampleKey } : {}) }));
    stored.teams = teams;
    stored.lang = raw.localeVersion === 1 && isLanguage(raw.lang) ? raw.lang : 'en';
    if (raw.host && cityByName(raw.host.city) && clockOK(raw.host.workStart) && clockOK(raw.host.workEnd) && raw.host.workStart !== raw.host.workEnd) stored.host = { city: raw.host.city, workStart: raw.host.workStart, workEnd: raw.host.workEnd };
  }
} catch { /* Browsers with restricted storage still support a complete in-memory session. */ }
const state = { ...stored, request: null, slots: [], selected: null, manual: false, busy: false, reason: '', response: '', warnings: [], error: false, includeWeekends: false, formDate: '', bounds: {}, uid: `${uid()}@meridian` };
let globe, timeline, worker, job = 0, workerTimer, toastTimer, saveWarned = false;
let draftPeople = [];
let pickerTarget = null, pickerLimit = 80, pickerReturnFocus = null;
const tr = text => translate(text, state.lang);
const t = (_zh, en) => tr(en);
const ct = key => calendarText(key, state.lang);
const ft = key => formText(key, state.lang);
const pt = key => pickerText(key, state.lang);
const formMessage = key => ft(key) === key ? tr(key) : ft(key);
const nameFor = team => team.exampleKey && samples[team.exampleKey] ? tr(samples[team.exampleKey].en) : team.name;
const cityName = city => localizedCity(cityByName(city)?.name || city, state.lang);
const countryNames = new Map();
const countryName = city => {
  const key = `${state.lang}:${city.countryCode || city.country}`;
  if (!countryNames.has(key)) {
    let name = city.country;
    try { if (city.countryCode) name = new Intl.DisplayNames([localeFor(state.lang)], {type:'region'}).of(city.countryCode); } catch { /* Preserve the source name. */ }
    countryNames.set(key,name);
  }
  return countryNames.get(key);
};
const personLabel = person => person?.name === cityName(person?.city) ? person.name : `${person?.name || ''} · ${cityName(person?.city)}`;
const availabilityText = status => status === 'extended' ? t('工作时间外 · 早晚时段 07:00–22:00', 'Outside working hours · Early / late, 07:00–22:00') : status === 'unavailable' ? t('休息时段或非工作日', 'Rest hours or a non-working day') : t('工作时间内', 'Within working hours');
const icons = {
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2"/>',
  arrow: '<path d="M12 19V5m-6 6 6-6 6 6"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 3v.1"/>',
  edit: '<path d="m15 5 4 4M4 20l4-1L20 7a3 3 0 0 0-4-4L4 15Z"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor"/><circle cx="15" cy="17" r="3" fill="currentColor"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
};
const icon = (name, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.globe}</svg>`;
const button = (action, text, classes = 'button', attrs = '') => `<button type="button" class="${classes}" data-action="${action}" ${attrs}>${text}</button>`;
function toast(message) {
  const node = $('#toast'); node.textContent = message; node.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 4500);
}
function persist() {
  try { localStorage.setItem(STORAGE, JSON.stringify({ lang: state.lang, localeVersion: 1, host: state.host, teams: state.teams })); }
  catch { if (!saveWarned) { saveWarned = true; toast(t('浏览器无法保存资料，本次仍可使用。', 'Storage unavailable. This session still works.')); } }
}
function dateLabel(date, long = false) {
  const d = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat(localeFor(state.lang), { timeZone: 'UTC', month: long ? 'long' : 'short', day: 'numeric', weekday: 'short' }).format(d);
}
function members() {
  const host = { ...cityByName(state.host.city), ...state.host, id: 'organizer', name: t('我', 'You'), required: true };
  const result = [host, ...(state.request?.participants || []).map(person => {
    const saved = state.teams.find(team => team.id === person.id);
    const name = saved ? nameFor(saved) : person.name === person.city ? cityName(person.city) : person.name;
    return { ...cityByName(person.city), ...person, name, required: true };
  })];
  return result.map(person => ({ ...person, displayCity: cityName(person.city), workDays: state.includeWeekends ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5] }));
}
function previewMembers() {
  return [{ ...cityByName(state.host.city), id: 'organizer', name: t('我', 'You'), displayCity: cityName(state.host.city) }, ...state.teams.map(team => ({ ...cityByName(team.city), id: team.id, name: nameFor(team), displayCity: cityName(team.city) }))];
}
app.innerHTML = '<main class="shell" id="shell"><div class="scene" id="globe"></div><div class="vignette"></div><header class="topbar" id="header"></header><section class="landing-copy" id="landing"></section><div class="timestamp" id="timestamp" hidden></div><section class="timeline-panel" id="timeline-panel" hidden><div id="timeline"></div></section><aside class="results" id="results" hidden aria-label="Meeting time options"></aside><section class="composer-wrap" id="composer-wrap"></section><footer class="globe-caption" id="caption"></footer></main>';

function renderStatic() {
  document.documentElement.lang = localeFor(state.lang);
  document.documentElement.dir = languages.find(item => item.code === state.lang)?.dir || 'ltr';
  $('#results').setAttribute('aria-label', tr('Choose a time'));
  $('#header').innerHTML = `<button class="brand" data-action="home" aria-label="Meridian ${t('首页', 'home')}"><span class="brandmark">${icon('globe', 25)}</span><span class="brand-name">meridian<span class="brand-sub"></span></span></button><div class="top-actions">${button('teams', `${icon('people', 16)}<span class="label">${t('我的团队', 'My teams')}</span><span class="count">${state.teams.length}</span>`, 'button team-button', `aria-label="${t('我的团队', 'My teams')}"`)}${button('language', `${icon('globe', 14)} ${state.lang.toUpperCase()}`, 'button quiet lang-button', `aria-label="${escape(tr('Language'))}" title="${escape(languages.find(item => item.code === state.lang)?.name)}"`)}</div>`;
  $('#landing').innerHTML = `<h1>${tr('Find a time.<br><em>For everyone.</em>')}</h1><p>${tr('Across time zones.')}</p>`;
  $('#caption').innerHTML = button('help', tr('Help'), '');
  renderComposer(); globe?.setLanguage(state.lang);
}
function renderComposer() {
  $('#composer-wrap').hidden = Boolean(state.request);
  $('#composer-wrap').innerHTML = `<div class="start-panel">${button('plan', `${icon('plus', 18)} ${tr('Plan a meeting')}`, 'button primary start-button')}<p>${escape(ft('intro'))}</p></div>`;
}
function candidateMarkup(slot, index, manual = false) {
  const people = members();
  const host = localParts(slot.start, people[0].zone), end = localParts(slot.end, people[0].zone);
  const selected = state.selected?.start === slot.start;
  const outside = slot.statuses.filter(status => status.status !== 'preferred');
  const label = manual ? t('自选时间', 'Your time') : index === 0 ? t('推荐方案', 'Recommended') : t(`方案 ${index + 1}`, `Option ${index + 1}`);
  const reason = outside.length ? t(`${outside.length} 位需要在工作时间外参加`, `${outside.length} joining outside working hours`) : t('每位参会者都在工作时间内', 'Within work hours');
  return `<button type="button" class="candidate ${selected ? 'selected' : ''}" data-action="select-slot" data-index="${manual ? 'manual' : index}" aria-pressed="${selected}"><span class="candidate-top"><span class="${index === 0 || manual ? 'recommend' : ''}">${index === 0 && !manual ? icon('check', 12) : ''}${label}</span><span class="choice-dot"></span></span><span class="candidate-main"><strong>${host.time} <small>— ${end.time}</small></strong><span>${escape(dateLabel(host.date))}</span></span><div class="candidate-reason ${outside.length ? 'amber' : ''}">${reason}</div><div class="local-rows">${slot.statuses.map((status, i) => `<div class="local-row"><span class="person-label"><i class="${status.status}"></i><span class="person-name" title="${escape(people[i]?.name)}">${escape(personLabel(people[i]))}</span></span><span class="local-clock">${status.localTime}–${status.endTime}<small>${escape(status.localDate.slice(5))}${status.endDate !== status.localDate ? ` → ${escape(status.endDate.slice(5))}` : ''}${status.status !== 'preferred' ? ` · ${t('工作外', 'Off hours')}` : ''}</small></span></div>`).join('')}</div></button>`;
}
function renderResults() {
  const panel = $('#results'); panel.hidden = !state.request;
  $('#shell').classList.toggle('has-plan', Boolean(state.request));
  if (!state.request) return;
  const request = state.request;
  const dates = request.dates;
  const range = dates.length === 1 ? dateLabel(dates[0]) : `${dateLabel(dates[0])} — ${dateLabel(dates.at(-1))}`;
  let content = '';
  if (state.busy) content = `<div class="empty-state">${icon('clock', 30)}<h3>${t('正在寻找好时间…', 'Finding a good time…')}</h3><p>${t('比较每位参会者的当地工作时间。', '')}</p></div>`;
  else {
    if (state.manual && state.selected) content += candidateMarkup(state.selected, -1, true);
    content += state.slots.map((slot, index) => candidateMarkup(slot, index)).join('');
    if (!state.slots.length && !state.manual) {
      const past = state.reason === 'no-future-time';
      const failed = state.reason === 'search-failed';
      content += `<div class="empty-state">${icon('clock', 32)}<h3>${failed ? tr('Search failed. Try fewer dates.') : past ? t('这个日期已没有可用的未来时间', 'No future times remain on these dates') : t('暂时没有共同的工作时间', 'No shared working-hours window')}</h3><p>${t('可以调整日期和工作时间，或拖动左侧时间条自行比较。', 'Change the details or drag to explore.')}${!request.allowExtended ? t('也可以考虑早晚时段，系统会明确标出取舍。', '') : ''}</p>${!request.allowExtended ? button('extended', t('考虑早晚时段 07:00–22:00', 'Include 07:00–22:00'), 'button primary full') : ''}${button('adjust', t('调整排会条件', 'Adjust'), 'button quiet full')}</div>`;
    }
  }
  const downloadable = !state.busy && state.selected && (state.manual || state.slots.length > 0) && state.selected.start > Date.now();
  panel.innerHTML = `<div class="results-top"><div class="results-heading"><div><div class="caps">${t('为每个时区考虑', '')}</div><h2>${t('挑一个合适的时间', 'Choose a time')}</h2></div>${button('home', icon('close', 15), 'icon-button', `aria-label="${t('关闭方案', 'Close options')}"`)}</div><div class="request-meta"><span class="meta-chip">${members().length} ${t('位参会者', 'participants')}</span><span class="meta-chip">${request.duration} min</span><span class="meta-chip">${escape(range)}</span>${button('adjust', `${icon('edit', 12)} ${tr('Edit')}`, 'meta-chip', `aria-label="${t('调整条件', 'Adjust details')}"`)}</div></div><div class="results-scroll">${state.manual && state.error ? `<p class="form-error" role="alert">${escape(state.response)}</p>` : ''}<p class="availability-note">${icon('help', 13)}<span>${t('按所设工作时间计算，尚未检查日历冲突或当地节假日。', 'Working hours only. No calendar access.')}</span></p>${content}</div><div class="results-footer"><div class="export-row">${button('export', `${icon('download', 16)}${t('加入我的日历', 'Download .ics')}`, 'button primary', downloadable ? '' : 'disabled')}</div><p>${t('下载 .ics 文件 · 不会向他人发送邀请', 'No invitations sent.')}</p></div>`;
}
function updateVisuals() {
  const selected = state.selected;
  const people = state.request ? members() : previewMembers();
  const mapped = people.map((person, i) => ({ ...person, color: selected?.statuses[i]?.status === 'preferred' ? '#80ecd1' : selected ? '#f2c28b' : '#80ecd1' }));
  globe?.update(mapped, selected?.start || Date.now());
  $('#timeline-panel').hidden = !state.request || !selected;
  if (state.request && selected) timeline.update({ members: people, start: selected.start, duration: state.request.duration, allowExtended: state.request.allowExtended, lang: state.lang });
  const stamp = $('#timestamp'); stamp.hidden = !state.request;
  if (state.request && selected) {
    const local = localParts(selected.start, people[0].zone);
    stamp.innerHTML = `${state.manual ? t('正在比较自选时间', 'Your time') : t('地球时间预览', 'Preview')} · <strong>${escape(dateLabel(local.date))} ${local.time}</strong> · ${escape(cityName(state.host.city))}`;
  }
}
function fallbackStart() {
  const date = state.request.dates.find(date => date >= globalThis.moment.tz(Date.now(), cityByName(state.host.city).zone).format('YYYY-MM-DD')) || state.request.dates[0];
  const instants = localToInstants(date, '12:00', cityByName(state.host.city).zone);
  return Math.max(instants[0] || Date.now(), Math.ceil((Date.now() + 60000) / 900000) * 900000);
}
function searchTimes() {
  if (!state.request) return;
  worker?.terminate(); clearTimeout(workerTimer);
  const id = ++job;
  state.busy = true; state.manual = false; state.selected = null; state.slots = [];
  renderResults(); renderComposer(); updateVisuals();
  const payload = { dates: state.request.dates, zone: cityByName(state.host.city).zone, duration: state.request.duration, members: members(), allowExtended: state.request.allowExtended, now: Date.now(), ...state.bounds };
  const finish = result => {
    if (id !== job) return;
    clearTimeout(workerTimer); worker?.terminate(); worker = null;
    state.busy = false; state.slots = result.slots || []; state.reason = result.reason || '';
    state.selected = state.slots[0] || evaluateMeeting({ start: fallbackStart(), duration: state.request.duration, members: members(), allowExtended: true });
    state.response = state.slots.length ? t(`找到了 ${state.slots.length} 个方案。点击比较，或拖动时间条调整。`, `Found ${state.slots.length} options. Drag to adjust.`) : t('没有找到符合当前条件的时间。你可以放宽早晚时段，或自行拖动比较。', 'No match. Change the details or drag to explore.');
    state.error = !state.slots.length;
    renderResults(); renderComposer(); updateVisuals();
  };
  const fail = () => {
    if (id !== job) return;
    worker?.terminate(); worker = null; clearTimeout(workerTimer); state.busy = false; state.error = true; state.reason = 'search-failed';
    state.response = t('计算暂时未完成，请重试或缩小日期范围。', 'Search failed. Try fewer dates.');
    renderComposer(); renderResults();
  };
  try {
    worker = new Worker(new URL('./planner-worker.js', import.meta.url));
    worker.onmessage = event => { if (event.data.id === id) event.data.error ? fail() : finish(event.data.result); };
    worker.onerror = fail;
    workerTimer = setTimeout(fail, 30000);
    worker.postMessage({ id, request: payload });
  } catch { fail(); }
}
function chooseSlot(index) {
  if (state.busy) return;
  if (index !== 'manual') { state.selected = state.slots[Number(index)]; state.manual = false; }
  if (!state.selected) return;
  renderResults(); updateVisuals();
}
function manualChange(start) {
  if (!state.request || state.busy) return;
  state.selected = evaluateMeeting({ start, duration: state.request.duration, members: members(), allowExtended: true });
  state.manual = true;
  state.error = start <= Date.now();
  state.response = state.error ? t('这个时间已经过去，请向后拖动。', 'Past time. Move it forward.') : t('这是你选择的时间。所有人的当地时刻已同步更新。', 'Times updated.');
  renderResults(); updateVisuals();
}
function openModal(title, subtitle, content, drawer = false) {
  modal.classList.toggle('drawer', drawer);
  modal.innerHTML = `<div class="modal-head"><div><h2 id="modal-title">${escape(title)}</h2>${subtitle ? `<p>${escape(subtitle)}</p>` : ''}</div>${button('close-modal', icon('close', 17), 'icon-button', `aria-label="${t('关闭', 'Close')}"`)}</div><div class="modal-body">${content}</div>`;
  if (!modal.open) modal.showModal();
}
function citySelect(name, value, id = '') {
  return `<input type="hidden" name="${name}" value="${escape(value)}">${button('pick-location', `${icon('pin',16)}<span>${escape(cityName(value))}</span>${icon('edit',14)}`, 'location-choice', `data-field="${name}" ${id ? `id="${id}"` : ''}`)}`;
}
function languageDialog() {
  openModal(tr('Language'), '', `<label class="language-search">${tr('Search languages')}<input id="language-search" type="search" autocomplete="off" placeholder="${escape(tr('Search languages'))}"></label><div class="language-grid">${languages.map(language => {
    const search = `${language.name} ${language.english} ${language.code}`.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return button('select-language', `<span lang="${localeFor(language.code)}" dir="${language.dir}">${escape(language.name)}</span><small>${escape(language.english)}</small>${state.lang === language.code ? icon('check', 14) : ''}`, `language-option ${state.lang === language.code ? 'active' : ''}`, `data-code="${language.code}" data-language-search="${escape(search)}" aria-pressed="${state.lang === language.code}"`);
  }).join('')}</div>`);
}
function teamsDialog() {
  openModal(t('我的团队与联系人', 'My teams'), t('保存名称和所在地，下次直接说团队名称。', 'Save a name and city.'), `<div class="team-list">${state.teams.map(team => `<article class="team-card"><div class="team-card-top"><div><h3>${escape(nameFor(team))}</h3><p>${escape(cityName(team.city))} · ${team.workStart}–${team.workEnd}<br>${t('周一至周五', 'Monday to Friday')}</p></div>${team.exampleKey ? `<span class="sample-tag">${t('示例', 'EXAMPLE')}</span>` : ''}</div><div class="team-actions">${button('use-team', t('和这个团队开会', 'Plan a meeting'), 'text-button', `data-id="${team.id}"`)}${button('edit-team', icon('edit', 15), 'icon-button', `data-id="${team.id}" aria-label="${t('编辑', 'Edit')} ${escape(nameFor(team))}"`)}${button('delete-team', icon('trash', 15), 'icon-button danger', `data-id="${team.id}" aria-label="${t('删除', 'Delete')} ${escape(nameFor(team))}"`)}</div></article>`).join('')}</div>${button('add-team', `${icon('plus', 16)}${t('添加团队或联系人', 'Add a team or person')}`, 'button full add-team')}<p class="storage-note">${t('资料仅保存在这个浏览器中。示例团队均为虚构，可随时编辑或删除。', 'Saved on this device. Examples are editable.')}</p>`, true);
}
function editTeamDialog(id = '') {
  const team = state.teams.find(item => item.id === id) || { name: '', city: state.host.city, workStart: '09:00', workEnd: '18:00' };
  openModal(id ? t('编辑团队或联系人', 'Edit team or person') : t('添加团队或联系人', 'Add team or person'), t('同一团队若分布在不同城市，可以分别保存。', 'One entry per city.'), `<form id="team-form" data-id="${escape(id)}"><label>${t('名称', 'Name')}<input name="name" required maxlength="80" placeholder="${t('例如：亚洲销售团队', 'e.g. Asian sales team')}" value="${escape(id ? nameFor(team) : '')}"></label><label>${t('所在地', 'Location')}${citySelect('city', team.city)}</label><div class="form-row"><label>${t('工作开始', 'Work starts')}<input type="time" name="workStart" required value="${team.workStart}"></label><label>${t('工作结束', 'Work ends')}<input type="time" name="workEnd" required value="${team.workEnd}"></label></div><p class="small muted">${t('默认工作日为周一至周五。夜班可将结束时间设为次日。', 'Mon–Fri. An earlier end means an overnight shift.')}</p><p class="form-error" role="alert"></p><div class="form-actions">${button('teams', t('返回', 'Back'), 'button quiet')}<button class="button primary" type="submit">${t('保存', 'Save')}</button></div></form>`);
}
function locationDialog() {
  openModal(t('我的位置与工作时间', 'My location & working hours'), t('手动选择会议当天所在城市，不会自动定位。', 'Where will you be?'), `<form id="location-form"><label>${t('会议当天我在', 'I will be in')}${citySelect('city', state.host.city)}</label><div class="form-row"><label>${t('工作开始', 'Work starts')}<input type="time" name="workStart" required value="${state.host.workStart}"></label><label>${t('工作结束', 'Work ends')}<input type="time" name="workEnd" required value="${state.host.workEnd}"></label></div><p class="form-error" role="alert"></p><div class="form-actions"><button type="submit" class="button primary">${t('保存位置', 'Save location')}</button></div></form>`);
}
function draftName(person) {
  const saved = state.teams.find(team => team.id === person.id);
  return saved ? nameFor(saved) : cityName(person.city);
}
function captureDraftHours() {
  const form = $('#meeting-form'); if (!form) return;
  for (const row of form.querySelectorAll('[data-hours-person]')) {
    const person = draftPeople.find(item => item.id === row.dataset.hoursPerson);
    if (person) { person.workStart = row.querySelector('[data-hour="start"]').value; person.workEnd = row.querySelector('[data-hour="end"]').value; }
  }
}
function paintDraftPeople() {
  $('#meeting-people').innerHTML = draftPeople.map(person => `<span class="place-chip"><span>${escape(draftName(person))}</span>${button('remove-place', icon('close', 12), 'chip-remove', `data-id="${escape(person.id)}" aria-label="${escape(tr('Remove'))} ${escape(draftName(person))}"`)}</span>`).join('');
  $('#meeting-person-hours').innerHTML = draftPeople.map(person => `<div class="person-hours" data-hours-person="${escape(person.id)}"><strong>${escape(draftName(person))}</strong><div class="form-row"><label>${tr('Work starts')}<input type="time" data-hour="start" value="${person.workStart}"></label><label>${tr('Work ends')}<input type="time" data-hour="end" value="${person.workEnd}"></label></div></div>`).join('');
  document.querySelectorAll('[data-action="toggle-saved-person"]').forEach(node => {
    node.setAttribute('aria-pressed', String(draftPeople.some(person => person.id === node.dataset.id)));
  });
  document.querySelectorAll('[data-action="quick-place"]').forEach(node => {
    const selected = draftPeople.some(person => person.city === node.dataset.city && !state.teams.some(team => team.id === person.id));
    node.setAttribute('aria-pressed', String(selected));
  });
}
function addDraftPlace(cityKey, teamId = '') {
  const form = $('#meeting-form'), city = cityByName(cityKey);
  const team = teamId ? state.teams.find(item => item.id === teamId) : null;
  if (!city || (teamId && !team)) { formError(form, ft('invalidCity')); return false; }
  if (draftPeople.length >= 19) { formError(form, tr('Add up to 19 other participants.')); return false; }
  if (draftPeople.some(person => team ? person.id === team.id : person.city === city.city && !state.teams.some(saved => saved.id === person.id))) {
    formError(form, ft('sameCity')); return false;
  }
  captureDraftHours();
  draftPeople.push({ id: team?.id || uid(), name: team ? nameFor(team) : cityName(city.city), city: city.city, workStart: team?.workStart || '09:00', workEnd: team?.workEnd || '18:00' });
  formError(form, ''); paintDraftPeople(); return true;
}
function closeCityPicker() {
  $('#city-picker')?.remove();
  modal.querySelector('form').hidden = false;
  pickerTarget = null;
  pickerReturnFocus?.focus();
}
function paintPickerCities() {
  const country = $('#picker-country').value;
  const clean = value => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase(state.lang);
  const query = clean($('#picker-search').value.trim());
  const list = (!country && !query ? cities : allCities).filter(city => (!country || city.countryCode === country) && (!query || clean([cityName(city.city), city.name, city.country, countryName(city), city.admin, ...(city.aliases || [])].join(' ')).includes(query)));
  if (country) list.sort((a,b) => cityName(a.city).localeCompare(cityName(b.city),localeFor(state.lang)));
  $('#picker-city-list').innerHTML = list.slice(0,pickerLimit).map(city => {
    const selected = pickerTarget === 'participant' && draftPeople.some(person => person.city === city.city && !state.teams.some(team => team.id === person.id));
    return button('choose-place', `<span><strong>${escape(cityName(city.city))}</strong><small>${escape([city.admin, countryName(city)].filter(Boolean).join(' · '))}</small></span>${icon(selected ? 'check' : 'plus',16)}`, 'picker-city', `data-city="${escape(city.city)}" ${selected ? 'disabled' : ''}`);
  }).join('') || `<p class="small muted">${escape(pt('noResults'))}</p>`;
  $('#picker-more').hidden = list.length <= pickerLimit;
}
function openCityPicker(target, trigger) {
  pickerTarget = target; pickerLimit = 80; pickerReturnFocus = trigger;
  const countries = new Map();
  allCities.forEach(city => { if (city.countryCode && !countries.has(city.countryCode)) countries.set(city.countryCode, countryName(city)); });
  const teams = target === 'participant' ? state.teams : [];
  modal.querySelector('form').hidden = true;
  modal.querySelector('.modal-body').insertAdjacentHTML('beforeend', `<section id="city-picker">
    ${button('picker-back', `‹ ${escape(tr('Back'))}`, 'button quiet picker-back')}
    ${teams.length ? `<details class="picker-teams"><summary>${escape(pt('savedTeams'))}</summary><div class="picker-team-list">${teams.map(team => button('choose-place', `<span><strong>${escape(nameFor(team))}</strong><small>${escape(cityName(team.city))}</small></span>${icon('plus',16)}`, 'picker-city', `data-city="${escape(team.city)}" data-team="${escape(team.id)}" ${draftPeople.some(person => person.id === team.id) ? 'disabled' : ''}`)).join('')}</div></details>` : ''}
    <label>${escape(pt('country'))}<select id="picker-country"><option value="">${escape(pt('chooseCountry'))}</option>${[...countries].sort((a,b)=>a[1].localeCompare(b[1],localeFor(state.lang))).map(([code,name])=>`<option value="${escape(code)}">${escape(name)}</option>`).join('')}</select></label>
    <details class="picker-search-wrap"><summary>${escape(pt('search'))}</summary><input id="picker-search" type="search" aria-label="${escape(pt('search'))}" autocomplete="off"></details>
    <div id="picker-city-list" class="picker-city-list"></div>${button('picker-more', escape(pt('showMore')), 'button full', 'id="picker-more" hidden')}
    </section>`);
  paintPickerCities();
  $('#city-picker .picker-back').focus();
  modal.scrollTop = 0;
}
function selectPickerCity(cityKey, teamId) {
  const city = cityByName(cityKey); if (!city) return;
  if (pickerTarget === 'participant') {
    closeCityPicker(); addDraftPlace(cityKey,teamId); return;
  }
  const field = modal.querySelector(`form input[name="${pickerTarget}"]`);
  field.value = cityKey;
  const trigger = pickerReturnFocus;
  trigger.querySelector('span').textContent = cityName(cityKey);
  if (pickerTarget === 'host') $('#meeting-form').elements.date.min = globalThis.moment.tz(Date.now(), city.zone).format('YYYY-MM-DD');
  closeCityPicker();
}
function savedContactsMarkup() {
  if (!state.teams.length) return '';
  return `<div class="saved-contacts" role="group" aria-label="${escape(t('已保存的团队与联系人', 'Saved teams & contacts'))}"><p class="small muted">${escape(t('从已保存的联系人中选择参会者（不会自动添加）。', 'Choose saved contacts to join. None are added automatically.'))}</p><div class="quick-places">${state.teams.map(team => button('toggle-saved-person', escape(nameFor(team)) + ' · ' + escape(cityName(team.city)), 'button quick-city', `data-id="${escape(team.id)}" aria-pressed="${draftPeople.some(person => person.id === team.id)}"`)).join('')}</div></div>`;
}
function planDialog({ team = null, fresh = false } = {}) {
  const request = fresh ? null : state.request;
  draftPeople = team ? [{...team, name:nameFor(team)}] : (request?.participants || []).map(person => ({...person}));
  const date = request ? state.formDate : '';
  const zone = cityByName(state.host.city).zone;
  const today = globalThis.moment.tz(Date.now(), zone).format('YYYY-MM-DD');
  const durations = [...new Set([15,30,45,60,90,120,request?.duration || 45])].sort((a,b)=>a-b);
  openModal(tr('Plan a meeting'), '', `<form id="meeting-form" data-new="${!request}" novalidate>
    <label>${tr('My location')}${citySelect('host',state.host.city,'meeting-host')}</label>
    <label id="meet-with-label">${escape(ft('with'))}</label><div class="quick-places" role="group" aria-labelledby="meet-with-label">${['London','Shanghai','New York'].map(city=>button('quick-place',escape(cityName(city)), 'button quick-city', `data-city="${city}" aria-pressed="false"`)).join('')}${button('pick-place', `${icon('plus',14)} ${escape(pt('moreCities'))}`, 'button quiet', 'id="meeting-place"')}</div>${savedContactsMarkup()}<div class="place-chips" id="meeting-people" aria-live="polite"></div>
    <div class="form-row meeting-when"><label id="meeting-date-wrap">${escape(ft('chooseDate'))}<input name="date" type="date" value="${escape(date)}" min="${today}"></label><label>${tr('Duration (minutes)')}<select name="duration">${durations.map(n=>`<option value="${n}" ${n === (request?.duration || 45) ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
    <details class="meeting-more"><summary>${escape(ft('more'))}</summary><div class="more-body"><p class="small muted">${escape(ft('workdays'))}</p><label class="check-line"><input type="checkbox" name="extended" ${request?.allowExtended ? 'checked' : ''}><span>${tr('Include early / late hours (07:00–22:00)')}</span></label><label class="check-line"><input type="checkbox" name="weekends" ${request && state.includeWeekends ? 'checked' : ''}><span>${tr('Include weekends')}</span></label><div class="person-hours"><strong>${tr('You')}</strong><div class="form-row"><label>${tr('Work starts')}<input type="time" name="hostStart" value="${state.host.workStart}"></label><label>${tr('Work ends')}<input type="time" name="hostEnd" value="${state.host.workEnd}"></label></div></div><div id="meeting-person-hours"></div></div></details>
    <p class="form-error" role="alert"></p><div class="form-actions"><button type="submit" class="button primary full">${tr('Find times')} ${icon('arrow', 15)}</button></div></form>`);
  paintDraftPeople();
}
function calendarPayload(title) {
  const people = members();
  const slot = state.selected;
  const description = slot.statuses.map((status, index) => `${people[index].name} · ${cityName(status.city)}: ${status.localDate} ${status.localTime} – ${status.endDate} ${status.endTime} (${status.offset})${status.status !== 'preferred' ? ` · ${availabilityText(status.status)}` : ''}`).join('\n') + `\n\n${tr('Calendar conflicts not checked. No invitations sent.')}`;
  const contents = buildICS({ title, start: slot.start, end: slot.end, uid: state.uid, description });
  const filename = `Meridian-${localParts(slot.start, cityByName(state.host.city).zone).date}.ics`;
  return { file: makeCalendarFile({ contents, filename }), title, start: slot.start, end: slot.end, description, zone: cityByName(state.host.city).zone };
}
function exportDialog() {
  const slot = state.selected;
  if (!slot || slot.start <= Date.now()) { toast(tr('Choose a future meeting time.')); return; }
  const people = members();
  const outside = slot.statuses.some(status => status.status === 'unavailable');
  const title = state.request.title || tr('Cross-time-zone meeting');
  const shareSupported = canShareCalendar(calendarPayload(title).file);
  openModal(tr('Save to calendar'), '', `<form id="export-form"><label>${tr('Meeting title')}<input name="title" maxlength="150" required value="${escape(title)}"></label><div>${slot.statuses.map((status, index) => `<div class="modal-local-row"><span>${escape(people[index].name)}<br><span class="muted">${escape(cityName(status.city))}</span></span><span dir="ltr">${escape(status.localDate)}<br>${status.localTime}–${status.endTime}${status.endDate !== status.localDate ? ` (${escape(status.endDate)})` : ''}<br><span class="muted">${escape(status.offset)}</span>${status.status !== 'preferred' ? `<br><span class="small" style="color:var(--amber)">${escape(availabilityText(status.status))}</span>` : ''}</span></div>`).join('')}</div>${outside ? `<label class="check-line" style="margin-top:18px"><input name="confirmRest" type="checkbox" required><span>${tr('Includes rest hours. Save anyway.')}</span></label>` : ''}<p class="small muted">${tr('Adds an event only. No invitations or video link.')}</p><div class="form-actions calendar-actions"><button type="submit" name="format" value="download" class="button primary">${icon('download', 16)} <span>${tr('Download .ics')}</span></button><button type="submit" name="format" value="google" class="button">Google Calendar</button>${shareSupported ? `<button type="submit" name="format" value="share" class="button">${escape(ct('share'))}</button>` : ''}</div><p id="export-status" class="small download-status" role="status" aria-live="polite" hidden></p><details class="import-help"><summary>${escape(ct('importHelp'))}</summary><p>${escape(ct('downloadHelp'))}</p><p>${escape(ct('googleHelp'))}</p></details></form>`);
}
function helpDialog() {
  openModal(tr('Quick guide'), '', `<ol class="help-list"><li>${escape(ft('help1'))}</li><li>${escape(ft('help2'))}</li><li>${escape(ft('help3'))}</li></ol><p class="small muted">${tr('Working hours only. No calendar access.')} ${tr('No invitations sent.')}</p><p class="small muted"><a href="https://www.geonames.org/" target="_blank" rel="noopener">GeoNames</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></p>`);
}
function home() {
  ++job; worker?.terminate(); clearTimeout(workerTimer); state.request = null; state.slots = []; state.selected = null; state.manual = false; state.busy = false;
  state.response = ''; state.warnings = []; state.bounds = {}; state.includeWeekends = false; state.formDate = '';
  renderStatic(); renderResults(); updateVisuals(); window.scrollTo({ top: 0, behavior: 'auto' });
}

function formError(form, message) { const node = form.querySelector('.form-error'); if (node) node.textContent = message; }
function checkHours(form, start, end) {
  if (!clockOK(start) || !clockOK(end) || start === end) { formError(form, t('请填写不同的工作开始和结束时间。', 'Choose valid and different work start and end times.')); return false; }
  return true;
}
document.addEventListener('submit', async event => {
  const form = event.target;
  if (!['meeting-form', 'team-form', 'location-form', 'export-form'].includes(form.id)) return;
  event.preventDefault();
  const data = new FormData(form);
  if (form.id === 'meeting-form') {
    captureDraftHours();
    const host = cityByName(String(data.get('host') || ''));
    if (!host) { formError(form, ft('invalidCity')); $('#meeting-host').focus(); return; }
    if (!checkHours(form, data.get('hostStart'), data.get('hostEnd'))) { form.querySelector('details').open = true; return; }
    const result = createFormRequest({ hostCity:host.city, participants:draftPeople, when:'date', date:data.get('date'), duration:Number(data.get('duration')), includeWeekends:data.has('weekends'), allowExtended:data.has('extended') });
    if (!result.ok) { formError(form, formMessage(result.error)); if (result.error === 'includesWeekend' || /work start|hours/.test(result.error)) form.querySelector('details').open = true; return; }
    result.request.title = form.dataset.new === 'true' ? '' : (state.request?.title || '');
    if (form.dataset.new === 'true') state.uid = `${uid()}@meridian`;
    state.host = {city:host.city, workStart:data.get('hostStart'), workEnd:data.get('hostEnd')};
    state.request = result.request; state.includeWeekends = data.has('weekends'); state.formDate = data.get('date');
    state.bounds = {}; state.warnings = []; state.response = ''; state.error = false;
    persist(); modal.close(); renderStatic(); searchTimes(); return;
  }
  if (form.id === 'team-form') {
    const name = String(data.get('name') || '').trim();
    if (!name || name.length > 80 || !cityByName(data.get('city'))) return formError(form, t('请填写名称并选择城市。', 'Enter a name and choose a city.'));
    if (!checkHours(form, data.get('workStart'), data.get('workEnd'))) return;
    if (state.teams.some(team => team.id !== form.dataset.id && nameFor(team).toLowerCase() === name.toLowerCase())) return formError(form, t('这个名称已经存在，请使用不同的名称。', 'That name already exists. Choose a different name.'));
    if (!form.dataset.id && state.teams.length >= 100) return formError(form, t('最多保存 100 个团队或联系人。', 'You can save up to 100 teams or people.'));
    const value = { id: form.dataset.id || uid(), name, city: data.get('city'), workStart: data.get('workStart'), workEnd: data.get('workEnd') };
    const index = state.teams.findIndex(team => team.id === value.id);
    if (index >= 0) state.teams[index] = value; else state.teams.push(value);
    persist(); renderStatic(); updateVisuals(); teamsDialog(); return;
  }
  if (form.id === 'location-form') {
    if (!cityByName(data.get('city')) || !checkHours(form, data.get('workStart'), data.get('workEnd'))) return;
    state.host = { city: data.get('city'), workStart: data.get('workStart'), workEnd: data.get('workEnd') };
    if (state.request) { state.request.organizerCity = state.host.city; state.bounds = {}; }
    persist(); modal.close(); renderStatic(); state.request ? searchTimes() : updateVisuals(); return;
  }
  if (form.id === 'export-form') {
    if (!state.selected || state.selected.start <= Date.now()) return toast(t('请选择一个未来的会议时间。', 'Choose a future meeting time.'));
    if (state.selected.statuses.some(status => status.status === 'unavailable') && !data.has('confirmRest')) return;
    const title = String(data.get('title') || '').trim();
    if (!title) return;
    const payload = calendarPayload(title);
    state.request.title = title;
    const format = event.submitter?.value || 'download';
    if (format === 'google') {
      window.open(googleCalendarUrl(payload), '_blank', 'noopener,noreferrer');
      return;
    }
    if (format === 'share') {
      try { await shareCalendar(payload.file); }
      catch (error) { if (error?.name !== 'AbortError') toast(ct('shareFailed')); }
      return;
    }
    try {
      downloadCalendar(payload.file);
      const status = $('#export-status');
      status.textContent = ct('downloadStarted'); status.hidden = false;
      form.querySelector('.import-help').open = true;
      form.querySelector('[value="download"] span').textContent = ct('downloadAgain');
    } catch { toast(ct('shareFailed')); }

  }
});
document.addEventListener('input', event => {
  if (event.target.id === 'picker-search') { pickerLimit = 80; paintPickerCities(); }
  if (event.target.id === 'language-search') {
    const query = event.target.value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    modal.querySelectorAll('[data-language-search]').forEach(node => { node.hidden = !node.dataset.languageSearch.includes(query); });
  }
});
document.addEventListener('change', event => {
  if (event.target.id === 'picker-country') { pickerLimit = 80; paintPickerCities(); }
});
document.addEventListener('click', event => {
  const node = event.target.closest('[data-action]'); if (!node || node.disabled) return;
  const action = node.dataset.action;
  if (action === 'close-modal') modal.close();
  if (action === 'home') home();
  if (action === 'help') helpDialog();
  if (action === 'teams') teamsDialog();
  if (action === 'location') locationDialog();
  if (action === 'plan' || action === 'adjust') planDialog();
  if (action === 'pick-location') openCityPicker(node.dataset.field,node);
  if (action === 'pick-place') openCityPicker('participant',node);
  if (action === 'picker-back') closeCityPicker();
  if (action === 'picker-more') { pickerLimit += 80; paintPickerCities(); }
  if (action === 'choose-place') selectPickerCity(node.dataset.city,node.dataset.team);
  if (action === 'toggle-saved-person') {
    const team = state.teams.find(item => item.id === node.dataset.id);
    if (!team) return;
    if (draftPeople.some(person => person.id === team.id)) {
      captureDraftHours();
      draftPeople = draftPeople.filter(person => person.id !== team.id);
      paintDraftPeople();
      formError($('#meeting-form'), '');
    } else addDraftPlace(team.city, team.id);
  }
  if (action === 'quick-place') {
    const existing = draftPeople.find(person => person.city === node.dataset.city && !state.teams.some(team => team.id === person.id));
    if (existing) { captureDraftHours(); draftPeople = draftPeople.filter(person => person.id !== existing.id); paintDraftPeople(); formError($('#meeting-form'),''); }
    else addDraftPlace(node.dataset.city);
  }
  if (action === 'remove-place') { captureDraftHours(); draftPeople = draftPeople.filter(person => person.id !== node.dataset.id); paintDraftPeople(); }
  if (action === 'export') exportDialog();
  if (action === 'language') {
    languageDialog();
  }
  if (action === 'select-language' && isLanguage(node.dataset.code)) {
    state.lang = node.dataset.code;
    state.response = state.manual && state.error ? tr('Past time. Move it forward.') : '';
    persist(); modal.close(); renderStatic(); renderResults(); updateVisuals();
  }
  if (action === 'select-slot') chooseSlot(node.dataset.index);
  if (action === 'extended' && state.request) { state.request.allowExtended = true; state.error = false; searchTimes(); }
  if (action === 'add-team') editTeamDialog();
  if (action === 'edit-team') editTeamDialog(node.dataset.id);
  if (action === 'delete-team') {
    state.teams = state.teams.filter(team => team.id !== node.dataset.id); persist(); renderStatic(); updateVisuals(); teamsDialog();
    toast(t('已删除保存的团队。当前会议的参会者不受影响。', 'Saved team removed.'));
  }
  if (action === 'use-team') {
    const team = state.teams.find(item => item.id === node.dataset.id); if (!team) return;
    planDialog({team, fresh:true});
  }

});
modal.addEventListener('cancel', event => { if ($('#city-picker')) { event.preventDefault(); closeCityPicker(); } });
modal.addEventListener('click', event => { if (event.target === modal) { const b = modal.getBoundingClientRect(); if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) modal.close(); } });
timeline = createTimeline($('#timeline'), { onChange: manualChange, onWarning: message => { if (message) toast(message); } });
renderStatic(); renderResults();
createGlobe($('#globe'), { onSelect: id => { const person = (state.request ? members() : previewMembers()).find(person => person.id === id); if (person) toast(`${person.name} · ${cityName(person.city)} · ${localParts(state.selected?.start || Date.now(), person.zone).time}`); } }).then(instance => { globe = instance; globe.setLanguage(state.lang); updateVisuals(); }).catch(() => toast(t('地球暂时无法加载，排会功能仍可使用。', 'Globe unavailable. Planning still works.')));
setInterval(() => { if (!state.request && !document.hidden) updateVisuals(); }, 60000);
