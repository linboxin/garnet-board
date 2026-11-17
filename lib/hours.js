// Everything to do with opening hours.
//
// Hours are stored as a list of opening periods:
//
//   { day: 1, open: "08:00", close: "17:00" }     day 0 = Sunday … 6 = Saturday
//
// A close time at or before the open time means the place closes after
// midnight, so { open: "08:00", close: "02:00" } runs until 2 AM the next day.

const { DateTime } = require('luxon');

const ZONE = 'America/New_York'; // Union's time zone
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MINUTES_IN_DAY = 24 * 60;

// The current date and time on campus, wherever the server is running.
function campusNow() {
  return DateTime.now().setZone(ZONE);
}

// ---------- reading hours written as text ----------

// "Mon-Fri" -> [1, 2, 3, 4, 5]     "Sat - Sun" -> [6, 0]     "Friday" -> [5]
// Text with no weekday in it ("November 17", "Nov 18 - Jan 4") -> []
function parseDays(text) {
  const words = text.match(/\b(sun|mon|tue|wed|thu|fri|sat)/gi) || [];
  const days = words.map((word) =>
    DAY_NAMES.findIndex((name) => name.toLowerCase().startsWith(word.toLowerCase()))
  );

  // Two days with a dash between them is a range: count from first to last.
  const isRange = days.length === 2 && /-|–|through/i.test(text);
  if (!isRange) return days;

  const range = [];
  let day = days[0];
  while (day !== days[1]) {
    range.push(day);
    day = (day + 1) % 7;
  }
  range.push(days[1]);
  return range;
}

// "7:30 am" -> "07:30"     "8am" -> "08:00"
function parseTime(text) {
  const clean = text.replace(/\./g, '').replace(/\s+/g, ' ').trim().toUpperCase();
  for (const format of ['h:mm a', 'h:mma', 'h a', 'ha']) {
    const time = DateTime.fromFormat(clean, format);
    if (time.isValid) return time.toFormat('HH:mm');
  }
  return null;
}

// "8:30 am-12:00 pm, 1:00 pm-5:00 pm" -> [{ open: "08:30", close: "12:00" }, …]
// Text with no times in it ("closed") -> []
function parseTimeRanges(text) {
  const times = text.match(/\d{1,2}(:\d{2})?\s*[ap]\.?m\.?/gi) || [];
  const ranges = [];
  for (let i = 0; i + 1 < times.length; i += 2) {
    const open = parseTime(times[i]);
    const close = parseTime(times[i + 1]);
    if (open && close) ranges.push({ open, close });
  }
  return ranges;
}

// Puts the two together:
// parseHours("Mon-Fri", "8:30 am - 5:00 pm") -> one period for each weekday.
function parseHours(daysText, timesText) {
  const hours = [];
  for (const day of parseDays(daysText)) {
    for (const range of parseTimeRanges(timesText)) {
      hours.push({ day, open: range.open, close: range.close });
    }
  }
  return hours;
}

// ---------- working with stored hours ----------

// "07:30" -> 450 (minutes after midnight)
function toMinutes(time) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

// 450 -> "7:30 AM"
function formatMinutes(minutes) {
  return DateTime.fromObject({ hour: 0 }).plus({ minutes }).toFormat('h:mm a');
}

// One day's opening periods as { open, close } in minutes, earliest first.
// Periods that touch or overlap are joined, so Breakfast 7–10 followed by
// Lunch 10–2 counts as open 7–2. Closing after midnight gives a close past
// 1440, e.g. 8 AM – 2 AM is { open: 480, close: 1560 }.
function periodsFor(hours, day) {
  const periods = hours
    .filter((period) => period.day === day)
    .map((period) => {
      const open = toMinutes(period.open);
      let close = toMinutes(period.close);
      if (close <= open) close += MINUTES_IN_DAY;
      return { open, close };
    })
    .sort((a, b) => a.open - b.open);

  const joined = [];
  for (const period of periods) {
    const last = joined[joined.length - 1];
    if (last && period.open <= last.close) {
      last.close = Math.max(last.close, period.close);
    } else {
      joined.push(period);
    }
  }
  return joined;
}

// Is this place open right now?
// Returns { isOpen, closingSoon, detail }, e.g.
//   { isOpen: true, closingSoon: false, detail: "Open until 8:00 PM" }
function getStatus(location, now = campusNow()) {
  if (location.closedToday) {
    return { isOpen: false, closingSoon: false, detail: 'Closed today' };
  }

  const today = now.weekday % 7; // luxon counts Monday = 1 … Sunday = 7
  const yesterday = (today + 6) % 7;
  const minutes = now.hour * 60 + now.minute;

  // Open now: inside one of today's periods, or one of yesterday's that runs
  // past midnight (shifted back a day so it lines up with today's clock).
  const candidates = [
    ...periodsFor(location.hours, today),
    ...periodsFor(location.hours, yesterday).map((period) => ({
      open: period.open - MINUTES_IN_DAY,
      close: period.close - MINUTES_IN_DAY,
    })),
  ];
  const current = candidates.find((period) => period.open <= minutes && minutes < period.close);
  if (current) {
    return {
      isOpen: true,
      closingSoon: current.close - minutes <= 30,
      detail: `Open until ${formatMinutes(current.close)}`,
    };
  }

  // Closed: look for the next opening, today first and then up to a week on.
  for (let daysAhead = 0; daysAhead <= 7; daysAhead += 1) {
    const day = (today + daysAhead) % 7;
    const next = periodsFor(location.hours, day).find(
      (period) => daysAhead > 0 || period.open > minutes
    );
    if (next) {
      let when = '';
      if (daysAhead === 1) when = 'tomorrow ';
      if (daysAhead > 1) when = `${DAY_NAMES[day].slice(0, 3)} `;
      return {
        isOpen: false,
        closingSoon: false,
        detail: `Opens ${when}${formatMinutes(next.open)}`,
      };
    }
  }

  return { isOpen: false, closingSoon: false, detail: 'No hours listed' };
}

// The week's hours as text, Monday first, for the page to list:
//   [{ label: "Monday", text: "8:00 AM – 5:00 PM", isToday: false }, …]
function weekSchedule(hours, now = campusNow()) {
  if (hours.length === 0) return [];
  const today = now.weekday % 7;

  return [1, 2, 3, 4, 5, 6, 0].map((day) => {
    const periods = periodsFor(hours, day);
    const text = periods
      .map((period) => `${formatMinutes(period.open)} – ${formatMinutes(period.close)}`)
      .join(', ');
    return { label: DAY_NAMES[day], text: text || 'Closed', isToday: day === today };
  });
}

module.exports = { ZONE, campusNow, parseDays, parseTimeRanges, parseHours, getStatus, weekSchedule };
