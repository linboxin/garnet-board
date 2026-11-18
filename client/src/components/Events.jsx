// "Events": today and the next six days, each day split into the same three
// groups the Union Daily Digest email uses.

import { Link } from 'react-router-dom';
import { campusDate, campusNow, toCampusTime } from '../time.js';
import './Events.css';

const EVENT_GROUPS = [
  { category: 'signup', title: 'Sign ups' },
  { category: 'event', title: 'Events' },
  { category: 'meeting', title: 'Meetings & practices' },
];

// "7:00 PM – 8:30 PM", or "Until Wed, Nov 18" for something that runs over
// several days, like an application window.
function timeText(event) {
  const start = toCampusTime(event.start);
  if (!event.end) return start.toFormat('h:mm a');

  const end = toCampusTime(event.end);
  const startedBeforeToday = start < campusNow().startOf('day');
  const longerThanADay = end.diff(start, 'hours').hours > 24;
  if (startedBeforeToday || longerThanADay) return `Until ${end.toFormat('ccc, LLL d')}`;

  return `${start.toFormat('h:mm a')} – ${end.toFormat('h:mm a')}`;
}

// Sorts events into days: { "2026-11-17": [event, …], "2026-11-18": […] }.
// Anything that started before today and is still going goes under today.
function groupByDay(events) {
  const today = campusNow().toISODate();
  const days = { [today]: [] }; // today is always shown, even if empty

  for (const event of events) {
    let day = toCampusTime(event.start).toISODate();
    if (day < today) day = today;
    if (!days[day]) days[day] = [];
    days[day].push(event);
  }
  return days;
}

function EventRow({ event }) {
  return (
    <li className="timed-row">
      <span className="time">{timeText(event)}</span>
      <div>
        {event.link ? (
          <a className="name" href={event.link} target="_blank" rel="noreferrer">
            {event.title}
          </a>
        ) : (
          <span className="name">{event.title}</span>
        )}
        <span className="sub">
          {event.location} · {event.organizer}
        </span>
        {event.description && <span className="sub">{event.description}</span>}
      </div>
    </li>
  );
}

// One day: its heading, then each group that has something in it.
function Day({ date, events }) {
  const day = campusDate(date);
  const isToday = date === campusNow().toISODate();
  const heading = (isToday ? 'Today, ' : '') + day.toFormat('cccc, LLLL d');

  return (
    <div className="day">
      <h3>{heading}</h3>
      {events.length === 0 && <p className="muted">Nothing on the calendar.</p>}

      {EVENT_GROUPS.map(({ category, title }) => {
        const inGroup = events.filter((event) => event.category === category);
        if (inGroup.length === 0) return null;
        return (
          <div key={category}>
            <h4 className="group-title">{title}</h4>
            <ul className="rows">
              {inGroup.map((event) => (
                <EventRow key={event._id} event={event} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default function Events({ data, error }) {

  return (
    <section id="events">
      <div className="heading-row">
        <h2>Events</h2>
        <Link to="/post">Post an event</Link>
      </div>

      {error && <p className="muted">Could not load events. Try refreshing.</p>}
      {!data && !error && <p className="muted">Loading events…</p>}

      {data &&
        Object.entries(groupByDay(data.events)).map(([date, events]) => (
          <Day key={date} date={date} events={events} />
        ))}

      <p className="more">
        <a href="https://union.presence.io/events" target="_blank" rel="noreferrer">
          All events on U-Engage
        </a>
      </p>
    </section>
  );
}
