import { localParts, localToInstants, memberStatus, effectiveZone } from './engine.js';
import { translate, localeFor, isLanguage } from './i18n.js';

const MINUTE = 60_000;
const unitFormatters = new Map();
const dateFormatters = new Map();
const CSS = `
.mtl{color:#d9e9ed;font:inherit;--mtl-line:rgba(164,198,207,.13)}
.mtl-track,.mtl-cells,.mtl-ticks,.mtl-tools,.mtl-local{direction:ltr;unicode-bidi:isolate}
.mtl-name,.mtl-place{unicode-bidi:plaintext}
.mtl-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 13px}
.mtl-title{font-size:12px;font-weight:600;color:#c6dbdf;margin:0;min-width:0}.mtl-tools{display:flex;gap:5px;flex-shrink:0}
.mtl-step{border:1px solid var(--mtl-line);background:rgba(255,255,255,.035);color:#bad0d7;font:inherit;font-size:10px;border-radius:7px;padding:5px 8px;cursor:pointer;min-height:28px}
.mtl-step:hover{background:rgba(105,224,206,.10);color:#aff6e8}.mtl-step:focus-visible,.mtl-window:focus-visible{outline:2px solid #8ef4db;outline-offset:3px}
.mtl-rows{display:flex;flex-direction:column;gap:15px}.mtl-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:8px}
.mtl-head>div:first-child{min-width:0;overflow-wrap:anywhere}
.mtl-name{display:block;font-size:12px;font-weight:600;line-height:1.4}.mtl-place{display:block;font-size:10px;color:#829da7;line-height:1.5;margin-top:2px}.mtl-local{text-align:right;font-size:12px;white-space:nowrap;font-variant-numeric:tabular-nums}.mtl-local small{display:block;font-size:10px;color:#829da7;margin-top:3px}
.mtl-track{height:35px;position:relative;touch-action:none;border:1px solid rgba(153,194,201,.13);border-radius:6px;background:#091019;cursor:crosshair;user-select:none;isolation:isolate}
.mtl-cells{position:absolute;inset:0;display:flex;overflow:hidden;border-radius:5px;pointer-events:none}
.mtl-cell{flex:1;min-width:0;height:100%;background:#101925}.mtl-cell.work{background:#235c4c}.mtl-cell.flex{background:#66552d}.mtl-cell.gap{background:repeating-linear-gradient(135deg,#19232e 0 3px,#34404a 3px 5px)}.mtl-cell.fold{background-image:repeating-linear-gradient(135deg,transparent 0 5px,rgba(255,255,255,.15) 5px 7px)}.mtl-cell:nth-child(4n){border-right:1px solid rgba(4,12,19,.25)}
.mtl-window{position:absolute;top:-4px;bottom:-4px;box-sizing:border-box;border:2px solid #d4fff3;background:rgba(161,255,222,.13);border-radius:5px;box-shadow:0 0 13px rgba(130,243,207,.17);z-index:2;cursor:ew-resize;touch-action:none;min-width:7px}
.mtl-window::before{content:'';position:absolute;left:50%;top:50%;width:2px;height:12px;background:#d4fff3;opacity:.8;transform:translate(-50%,-50%);border-radius:1px}.mtl-window.continuation{pointer-events:none;border-style:dashed;opacity:.55}
.mtl-ticks{display:flex;justify-content:space-between;font-size:9px;color:#69808e;font-variant-numeric:tabular-nums;margin-top:6px;user-select:none}.mtl-legend{display:flex;gap:12px;flex-wrap:wrap;margin-top:17px;font-size:10px;color:#8ca4af}.mtl-legend span{display:inline-flex;align-items:center;gap:5px}.mtl-dot{width:7px;height:7px;border-radius:2px;display:inline-block}.mtl-dot.work{background:#38896e}.mtl-dot.flex{background:#a18a45}.mtl-dot.rest{background:#243342}.mtl-help{margin:8px 0 0;color:#728e9c;font-size:10px;line-height:1.6}.mtl-warning{font-size:11px;color:#ebcb8f;line-height:1.5;margin:9px 0 0;min-height:0}.mtl-warning:empty{display:none}.mtl-row[data-status="extended"] .mtl-local{color:#e6cf94}.mtl-row[data-status="unavailable"] .mtl-local{color:#e6b7b4}
@media(prefers-reduced-motion:reduce){.mtl *{scroll-behavior:auto}}
`;

function create(tag, className, text, parent) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  parent?.appendChild(element);
  return element;
}
const minuteOf = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

/** Resolve a 15-minute wall-clock selection without silently normalizing DST gaps. */
export function resolveTimelineTime({ date, minutes, zone, reference }) {
  if (!Number.isFinite(minutes) || !Number.isFinite(reference)) return { instant: null, reason: 'invalid-time' };
  const total = Math.round(minutes / 15) * 15;
  const dayOffset = Math.floor(total / 1440);
  const localMinute = ((total % 1440) + 1440) % 1440;
  const calendar = globalThis.moment.utc(date, 'YYYY-MM-DD', true);
  if (!calendar.isValid()) return { instant: null, reason: 'invalid-time' };
  const localDate = calendar.add(dayOffset, 'days').format('YYYY-MM-DD');
  const time = `${String(Math.floor(localMinute / 60)).padStart(2, '0')}:${String(localMinute % 60).padStart(2, '0')}`;
  let choices;
  try { choices = localToInstants(localDate, time, zone); } catch { return { instant: null, reason: 'invalid-time' }; }
  if (!choices.length) return { instant: null, reason: 'dst-gap', date: localDate, time };
  choices.sort((a, b) => Math.abs(a - reference) - Math.abs(b - reference) || a - b);
  return { instant: choices[0], reason: null, ambiguous: choices.length > 1, date: localDate, time,
    offset: localParts(choices[0], zone).offset };
}

function inWork(minute, weekday, member) {
  const from = minuteOf(member.workStart || '09:00');
  let to = minuteOf(member.workEnd || '17:00');
  if (to < from) to += 1440;
  const days = member.workDays || [1, 2, 3, 4, 5];
  return [-1, 0, 1].some(delta => days.includes((weekday + delta + 7) % 7)
    && minute >= from + delta * 1440 && minute < to + delta * 1440);
}

/** A draggable local 00–24 clock per attendee, all sharing one UTC meeting instant. */
export function createTimeline(container, { onChange, onWarning } = {}) {
  if (!document.getElementById('meridian-timeline-styles')) {
    const style = create('style', '', CSS, document.head);
    style.id = 'meridian-timeline-styles';
  }
  const root = create('section', 'mtl', undefined, container);
  const top = create('div', 'mtl-top', undefined, root);
  const title = create('h3', 'mtl-title', undefined, top);
  const tools = create('div', 'mtl-tools', undefined, top);
  const back = create('button', 'mtl-step', '−15 min', tools);
  const next = create('button', 'mtl-step', '+15 min', tools);
  back.type = next.type = 'button';
  const rowsContainer = create('div', 'mtl-rows', undefined, root);
  const legend = create('div', 'mtl-legend', undefined, root);
  const legendLabels = ['work', 'flex', 'rest'].map(type => {
    const label = create('span', '', undefined, legend);
    create('i', `mtl-dot ${type}`, undefined, label);
    return create('span', '', undefined, label);
  });
  const help = create('p', 'mtl-help', undefined, root);
  const warning = create('p', 'mtl-warning', undefined, root);
  warning.setAttribute('role', 'status');
  warning.setAttribute('aria-live', 'polite');
  let state = { members: [], start: Date.now(), duration: 45, lang: 'en', allowExtended: false };
  const rows = new Map();
  let active = null;
  let destroyed = false;
  let lastWarning = { source: '', prefix: '' };
  const t = (zh, en) => translate(en, state.lang);
  const unit = (value, name) => {
    const locale = localeFor(state.lang), key = `${locale}/${name}`;
    if (!unitFormatters.has(key)) unitFormatters.set(key, new Intl.NumberFormat(locale, { style: 'unit', unit: name, unitDisplay: 'short', numberingSystem: 'latn' }));
    return unitFormatters.get(key).format(value);
  };
  const dateText = date => {
    const locale = localeFor(state.lang);
    if (!dateFormatters.has(locale)) dateFormatters.set(locale, new Intl.DateTimeFormat(locale, { timeZone: 'UTC', month: 'short', day: 'numeric' }));
    return dateFormatters.get(locale).format(new Date(`${date}T12:00:00Z`));
  };

  function announce(source, prefix = '') {
    lastWarning = { source, prefix };
    const message = source ? `${prefix}${translate(source, state.lang)}` : '';
    if (warning.textContent === message) return;
    warning.textContent = message;
    onWarning?.(message);
  }
  function commit(instant) {
    if (!Number.isFinite(instant) || instant === state.start || destroyed) return;
    onChange?.(instant);
  }
  function choose(row, minute, date = row.date, reference = state.start) {
    const result = resolveTimelineTime({ date, minutes: minute, zone: row.zone, reference });
    if (result.instant === null) {
      announce(result.reason === 'dst-gap'
        ? 'This time does not exist during a daylight-saving change. Choose another time.'
        : 'Choose a future meeting time.', result.reason === 'dst-gap' ? `${result.time} · ` : '');
      return;
    }
    announce(result.ambiguous ? `This clock time occurs twice; using ${result.offset}.` : '');
    commit(result.instant);
  }
  function pointerMinute(event) {
    const bounds = active.bounds;
    return ((event.clientX - bounds.left) / bounds.width) * 1440 - active.grabOffset;
  }
  function pointerDown(event, row) {
    if (event.button !== 0 || !Number.isFinite(state.start)) return;
    event.preventDefault();
    const bounds = row.track.getBoundingClientRect();
    if (!bounds.width) return;
    const onHandle = event.target === row.window;
    active = { row, id: event.pointerId, bounds, date: row.date, reference: state.start,
      grabOffset: onHandle ? ((event.clientX - bounds.left) / bounds.width) * 1440 - minuteOf(localParts(state.start, row.zone).time) : 0 };
    row.track.setPointerCapture(event.pointerId);
    row.window.focus({ preventScroll: true });
    if (!onHandle) choose(row, pointerMinute(event), active.date, active.reference);
  }
  function pointerMove(event) {
    if (!active || active.id !== event.pointerId) return;
    event.preventDefault();
    // Permit a short move across midnight without unbounded off-screen dates.
    const minute = Math.max(-180, Math.min(1620, pointerMinute(event)));
    choose(active.row, minute, active.date, active.reference);
  }
  function pointerUp(event) {
    if (!active || active.id !== event.pointerId) return;
    if (active.row.track.hasPointerCapture(event.pointerId)) active.row.track.releasePointerCapture(event.pointerId);
    active = null;
  }
  function keyDown(event, row) {
    const step = event.shiftKey ? 60 : 15;
    const delta = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step }[event.key];
    if (delta !== undefined) {
      event.preventDefault();
      announce('');
      // Real-time steps preserve both occurrences of a repeated local hour.
      commit(state.start + delta * MINUTE);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      choose(row, event.key === 'Home' ? 0 : 1425);
    }
  }
  function makeRow(member, key) {
    const element = create('div', 'mtl-row', undefined, rowsContainer);
    const header = create('div', 'mtl-head', undefined, element);
    const identity = create('div', '', undefined, header);
    const name = create('span', 'mtl-name', undefined, identity);
    const place = create('span', 'mtl-place', undefined, identity);
    const local = create('div', 'mtl-local', undefined, header);
    const clock = create('span', '', undefined, local);
    const dateLabel = create('small', '', undefined, local);
    const track = create('div', 'mtl-track', undefined, element);
    const cells = create('div', 'mtl-cells', undefined, track);
    const handle = create('div', 'mtl-window', undefined, track);
    handle.tabIndex = 0;
    handle.setAttribute('role', 'slider');
    handle.setAttribute('aria-valuemin', '0');
    handle.setAttribute('aria-valuemax', '1439');
    const continuation = create('div', 'mtl-window continuation', undefined, track);
    continuation.setAttribute('aria-hidden', 'true');
    const ticks = create('div', 'mtl-ticks', undefined, element);
    for (const hour of [0, 4, 8, 12, 16, 20, 24]) create('span', '', String(hour).padStart(2, '0'), ticks);
    const row = { key, element, name, place, clock, dateLabel, track, cells, window: handle, continuation, member, pattern: '' };
    track.addEventListener('pointerdown', e => pointerDown(e, row));
    track.addEventListener('pointermove', pointerMove);
    track.addEventListener('pointerup', pointerUp);
    track.addEventListener('pointercancel', pointerUp);
    handle.addEventListener('keydown', e => keyDown(e, row));
    return row;
  }
  function paintRow(row, member) {
    row.member = member;
    row.zone = effectiveZone(member, state.start);
    const first = localParts(state.start, row.zone);
    const end = localParts(state.start + state.duration * MINUTE, row.zone);
    const offsetDays = globalThis.moment.utc(end.date).diff(globalThis.moment.utc(first.date), 'days');
    row.date = first.date;
    const displayCity = member.displayCity || member.city || row.zone;
    row.name.textContent = member.name || displayCity;
    row.place.textContent = `${displayCity} · ${first.offset}`;
    const endSuffix = offsetDays ? ` +${unit(offsetDays, 'day')}` : '';
    row.clock.textContent = `${first.time}–${end.time}${endSuffix}`;
    row.dateLabel.textContent = `${dateText(first.date)} · ${unit(state.duration, 'minute')}${first.offset !== end.offset ? ` · ${first.offset} → ${end.offset}` : ''}`;
    const status = memberStatus(member, state.start, state.duration, false);
    if (status.status === 'preferred') row.element.dataset.status = 'preferred';
    else {
      const firstMinute = minuteOf(first.time), endMinute = minuteOf(end.time);
      row.element.dataset.status = status.reason === 'Outside available working hours' && first.date === end.date && firstMinute >= 420 && endMinute <= 1320
        && (member.workDays || [1, 2, 3, 4, 5]).includes(first.weekday) ? 'extended' : 'unavailable';
    }
    const pattern = `${first.date}|${row.zone}|${member.workStart}|${member.workEnd}|${member.workDays}`;
    if (row.pattern !== pattern) {
      row.pattern = pattern;
      row.cells.replaceChildren();
      const day = globalThis.moment.tz(first.date, 'YYYY-MM-DD', true, row.zone);
      const dayHours = day.clone().add(1, 'day').valueOf() - day.valueOf();
      for (let minute = 0; minute < 1440; minute += 15) {
        let type = inWork(minute, first.weekday, member) ? 'work'
          : (member.workDays || [1, 2, 3, 4, 5]).includes(first.weekday) && minute >= 420 && minute < 1320 ? 'flex' : 'rest';
        if (dayHours !== 86400000) {
          const time = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
          const count = localToInstants(first.date, time, row.zone).length;
          if (count === 0) type += ' gap';
          if (count > 1) type += ' fold';
        }
        create('i', `mtl-cell ${type}`, undefined, row.cells);
      }
    }
    const startMinute = minuteOf(first.time);
    let endMinute = minuteOf(end.time);
    endMinute += offsetDays * 1440;
    let handleEnd = endMinute;
    let tailStart = 0, tailWidth = Math.min(1440, Math.max(0, endMinute - 1440));
    const rules = globalThis.moment.tz.zone(row.zone);
    const fold = rules.untils.find(instant => instant > state.start && instant < state.start + state.duration * MINUTE
      && rules.utcOffset(instant) > rules.utcOffset(instant - 1));
    if (fold) {
      // A repeated hour has two ranges on a 00–24 wall-clock axis.
      const before = localParts(fold - 1, row.zone);
      const after = localParts(fold, row.zone);
      handleEnd = minuteOf(before.time) + 1;
      tailStart = minuteOf(after.time);
      tailWidth = Math.max(0, endMinute - tailStart);
    }
    const visualWidth = Math.max(15, handleEnd - startMinute);
    row.window.style.left = `${startMinute / 1440 * 100}%`;
    row.window.style.width = `${Math.min(visualWidth, 1440 - startMinute) / 1440 * 100}%`;
    row.window.setAttribute('aria-label', `${t('会议时间', 'Meeting time')} · ${row.name.textContent}`);
    row.window.setAttribute('aria-valuenow', String(startMinute));
    row.window.setAttribute('aria-valuetext', `${first.date} ${first.time} ${first.offset}, ${unit(state.duration, 'minute')}`);
    row.window.title = t('拖动调整。方向键每次 15 分钟。', 'Drag to adjust. Arrow keys move 15 minutes.');
    row.continuation.style.display = tailWidth > 0 ? 'block' : 'none';
    row.continuation.style.left = `${tailStart / 1440 * 100}%`;
    row.continuation.style.width = `${Math.min(1440 - tailStart, tailWidth) / 1440 * 100}%`;
  }
  back.onclick = () => { announce(''); commit(state.start - 15 * MINUTE); };
  next.onclick = () => { announce(''); commit(state.start + 15 * MINUTE); };
  function update(nextState) {
    if (destroyed || !Number.isFinite(nextState?.start)) return;
    state = { ...state, ...nextState };
    if (!isLanguage(state.lang)) state.lang = 'en';
    root.lang = localeFor(state.lang);
    announce(lastWarning.source, lastWarning.prefix);
    back.textContent = `−${unit(15, 'minute')}`;
    next.textContent = `+${unit(15, 'minute')}`;
    title.textContent = t('拖动时间，看看每个人的当地时刻', 'Move the meeting across local clocks');
    back.setAttribute('aria-label', t('会议提前 15 分钟', 'Move meeting 15 minutes earlier'));
    next.setAttribute('aria-label', t('会议推后 15 分钟', 'Move meeting 15 minutes later'));
    [t('工作时间', 'Working hours'), t('早晚时段', 'Early / late'), t('休息时间', 'Rest hours')].forEach((value, i) => legendLabels[i].textContent = value);
    help.textContent = t('拖动任一行的浅色会议框，所有人的时间会同步变化。方向键可微调 15 分钟。', 'Drag a meeting window to update everyone’s time. Use arrow keys for 15-minute steps.');
    const desired = new Set();
    state.members.forEach((member, i) => {
      const key = member.id || `row-${i}`;
      desired.add(key);
      let row = rows.get(key);
      if (!row) { row = makeRow(member, key); rows.set(key, row); }
      paintRow(row, member);
      // Existing nodes remain attached during a pointer drag, preserving capture.
      if (!active && rowsContainer.children[i] !== row.element) rowsContainer.insertBefore(row.element, rowsContainer.children[i] || null);
    });
    for (const [key, row] of rows) if (!desired.has(key)) {
      if (active?.row === row) active = null;
      row.element.remove();
      rows.delete(key);
    }
  }
  return { update, destroy() { destroyed = true; active = null; rows.clear(); root.remove(); } };
}
