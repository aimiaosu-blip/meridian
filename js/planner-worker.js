/* Time-zone search runs off the main thread so the globe and local clocks stay responsive. */
importScripts('../vendor/moment.min.js', '../vendor/moment-timezone.min.js');
const planner = import('./planner.js');
self.onmessage = async event => {
  const { id, request } = event.data || {};
  try {
    const { planMeeting } = await planner;
    self.postMessage({ id, result: planMeeting(request) });
  } catch (error) {
    self.postMessage({ id, error: String(error?.message || error) });
  }
};
