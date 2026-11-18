// Date and time helpers. Everything is shown in Union's time zone, whatever
// time zone the visitor's computer is in.

import { DateTime } from 'luxon';

const ZONE = 'America/New_York';

// The current date and time on campus.
export function campusNow() {
  return DateTime.now().setZone(ZONE);
}

// A date from the API ("2026-11-17T23:00:00.000Z") in campus time.
export function toCampusTime(isoString) {
  return DateTime.fromISO(isoString).setZone(ZONE);
}

// A calendar date ("2026-11-17") as that day on campus.
export function campusDate(isoDate) {
  return DateTime.fromISO(isoDate, { zone: ZONE });
}

// "07:30" -> "7:30 AM"
export function formatClockTime(time) {
  return DateTime.fromFormat(time, 'HH:mm').toFormat('h:mm a');
}
