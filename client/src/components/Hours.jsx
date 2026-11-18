// "Hours": every place, grouped by type, with whether it's open right now.
// Click a place to see its week of hours.

import './Hours.css';

const GROUP_NAMES = {
  dining: 'Dining',
  study: 'Libraries & study',
  health: 'Health & wellness',
  services: 'Services',
  offices: 'Offices',
};

// Which groups go in which column. Offices is a long list, so it gets the
// right column to itself and the columns come out about the same height.
const LEFT_COLUMN = ['dining', 'study', 'health', 'services'];
const RIGHT_COLUMN = ['offices'];

// One place: a row you can click open (a <details> element does the
// opening and closing for us).
function Place({ place }) {
  let statusClass = 'closed';
  if (place.status.isOpen) statusClass = place.status.closingSoon ? 'soon' : 'open';

  return (
    <details className="place">
      <summary>
        <span className="name">{place.name}</span>
        <span className={`status ${statusClass}`}>{place.status.detail}</span>
      </summary>

      <div className="place-body">
        {place.building && <p>{place.building}</p>}
        {place.note && <p>{place.note}</p>}

        {place.schedule.length > 0 ? (
          <dl className="week">
            {place.schedule.map((day) => (
              <div key={day.label} className={day.isToday ? 'today' : ''}>
                <dt>{day.label}</dt>
                <dd>{day.text}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>No hours listed.</p>
        )}

        {place.pageUrl && (
          <a href={place.pageUrl} target="_blank" rel="noreferrer">
            Source page
          </a>
        )}
      </div>
    </details>
  );
}

// One group, e.g. "Dining" and its places.
function Group({ category, locations }) {
  const places = locations.filter((place) => place.category === category);
  if (places.length === 0) return null;

  return (
    <div>
      <h3>{GROUP_NAMES[category]}</h3>
      {places.map((place) => (
        <Place key={place.id} place={place} />
      ))}
    </div>
  );
}

export default function Hours({ data, error }) {

  return (
    <section id="hours">
      <h2>Hours</h2>

      {error && <p className="muted">Could not load hours. Try refreshing.</p>}
      {!data && !error && <p className="muted">Loading hours…</p>}

      {data && (
        <div className="hours-columns">
          <div className="hours-column">
            {LEFT_COLUMN.map((category) => (
              <Group key={category} category={category} locations={data.locations} />
            ))}
          </div>
          <div className="hours-column">
            {RIGHT_COLUMN.map((category) => (
              <Group key={category} category={category} locations={data.locations} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
