/** File export and user-confirmed calendar handoff. These functions never send invitations. */
export function makeCalendarFile({ contents, filename = 'Meridian.ics' }) {
  if (typeof contents !== 'string' || !contents) throw new TypeError('Calendar contents are required.');
  const name = String(filename || 'Meridian.ics').replace(/[\/\\\u0000-\u001f\u007f]/g, '_');
  return new File([contents], /\.ics$/i.test(name) ? name : `${name}.ics`, { type: 'text/calendar;charset=utf-8' });
}

/** Start a browser download. The browser does not report whether the user saves the file. */
export function downloadCalendar(file) {
  const url = URL.createObjectURL(file);
  let anchor;
  try {
    anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.name;
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor?.remove();
    // Allow the browser time to consume the Blob before releasing its URL.
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
}

/** Probe this exact file: file sharing support does not imply support for .ics files. */
export function canShareCalendar(file) {
  const nav = globalThis.navigator;
  if (typeof nav?.share !== 'function' || typeof nav?.canShare !== 'function') return false;
  try { return nav.canShare({ files: [file] }) === true; }
  catch { return false; }
}

export async function shareCalendar(file) {
  if (!canShareCalendar(file)) throw new Error('Calendar file sharing is unavailable.');
  // Must be called from a user gesture. Preserve AbortError so callers can handle cancellation.
  await globalThis.navigator.share({ files: [file] });
}

/** Open a prefilled Google Calendar form; only the user can save the event there. */
export function googleCalendarUrl({ title, start, end, description = '', zone = 'UTC' }) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new RangeError('A valid meeting start and end are required.');
  }
  // Reject invalid time zones instead of silently substituting the device's zone.
  new Intl.DateTimeFormat('en', { timeZone: zone }).format(start);
  const stamp = ms => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const url = new URL('https://calendar.google.com/calendar/r/eventedit');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('dates', `${stamp(start)}/${stamp(end)}`);
  url.searchParams.set('stz', zone);
  url.searchParams.set('etz', zone);
  url.searchParams.set('text', String(title || 'Cross-time-zone meeting'));
  url.searchParams.set('details', String(description));
  return url.href;
}
