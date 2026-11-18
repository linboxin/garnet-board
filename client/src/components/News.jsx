// "Around Union": the latest news stories from union.edu.

import { toCampusTime } from '../time.js';

export default function News({ data, error }) {

  return (
    <section id="news">
      <h2>Around Union</h2>

      {error && <p className="muted">Could not load the news. Try refreshing.</p>}
      {!data && !error && <p className="muted">Loading news…</p>}

      {data && (
        <ul className="rows">
          {data.news.map((story) => (
            <li key={story._id} className="timed-row">
              <span className="time">{toCampusTime(story.publishedAt).toFormat('LLL d, yyyy')}</span>
              <a className="name" href={story.link} target="_blank" rel="noreferrer">
                {story.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
