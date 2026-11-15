import { memberStatus } from './engine.js';

const QUARTER_HOUR = 15 * 60 * 1000;
const LOOKBACK = 30 * 24 * 60 * 60 * 1000;

/**
 * Reserve preparation effort backwards from a meeting, in task order.
 *
 * Working effort may be spread over several days. `start` / `end` describe the
 * overall window; `segments` contain the actual reserved working intervals.
 * Steps are sequential, even if they have different owners. Completed steps
 * consume no future time. This is a proposed plan based on the availability
 * supplied by the user, not a reservation or an approval.
 *
 * @param {Array<{id:string,title:string,ownerId:string,hours:number,done:boolean}>} tasks
 * @param {Array<object>} members
 * @param {number} meetingStart UTC timestamp in milliseconds
 * @returns {Array<object>}
 */
export function planPreparation(tasks, members, meetingStart) {
  if (!Array.isArray(tasks)) return [];
  const result = tasks.map(task => ({
    ...task,
    start: null,
    end: null,
    error: null,
    segments: [],
    scheduledHours: 0,
  }));
  if (!Number.isFinite(meetingStart) || !Number.isFinite(new Date(meetingStart).getTime())) {
    return result.map(task => task.done ? task : {
      ...task,
      error: 'Choose a meeting time to plan this step.',
    });
  }

  const owners = new Map((Array.isArray(members) ? members : []).map(member => [member.id, member]));
  // Finish at the last whole quarter-hour at or before the meeting. Never use
  // a partial interval that overlaps the meeting or a following task.
  let cursor = Math.floor(meetingStart / QUARTER_HOUR) * QUARTER_HOUR;
  const earliest = meetingStart - LOOKBACK;
  let blockingTitle = null;

  for (let index = result.length - 1; index >= 0; index--) {
    const task = result[index];
    if (task.done) continue;
    if (blockingTitle !== null) {
      task.error = `Cannot plan until the following step is resolved: ${blockingTitle}.`;
      continue;
    }

    const fail = message => {
      task.error = message;
      blockingTitle = task.title || 'Untitled step';
    };
    const owner = owners.get(task.ownerId);
    if (!owner) {
      fail('Assign an existing team member to this step.');
      continue;
    }
    const hours = typeof task.hours === 'number' ? task.hours : Number(task.hours);
    if (!Number.isFinite(hours) || hours <= 0) {
      fail('Enter a positive number of working hours.');
      continue;
    }

    let remaining = Math.max(1, Math.ceil(hours * 4 - 1e-9));
    const backwards = [];
    let end = cursor;
    let availabilityError = false;
    while (remaining > 0 && end - QUARTER_HOUR >= earliest) {
      const start = end - QUARTER_HOUR;
      try {
        if (memberStatus(owner, start, 15, false).status === 'preferred') {
          backwards.push({ start, end });
          remaining--;
        }
      } catch {
        availabilityError = true;
        break;
      }
      end = start;
    }

    if (availabilityError) {
      fail('Check this owner’s time zone and working hours.');
      continue;
    }
    if (remaining > 0) {
      fail('Not enough available working time in the 30 days before this meeting.');
      continue;
    }

    const segments = [];
    for (const interval of backwards.reverse()) {
      const previous = segments[segments.length - 1];
      if (previous && previous.end === interval.start) previous.end = interval.end;
      else segments.push({ ...interval });
    }
    task.segments = segments;
    task.start = segments[0].start;
    task.end = segments[segments.length - 1].end;
    task.scheduledHours = segments.reduce((sum, segment) => sum + segment.end - segment.start, 0) / 3600000;
    cursor = task.start;
  }
  return result;
}
