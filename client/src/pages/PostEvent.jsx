// The "Post an event" page: a form that sends the event to the server.
//
// The server checks every field (the rules are in models/Event.js). If
// something is wrong it answers with a message for each field, and we show
// each message under its input.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { campusNow } from '../time.js';
import './PostEvent.css';

const EMPTY_FORM = {
  title: '',
  category: 'event',
  date: campusNow().toISODate(),
  startTime: '',
  endTime: '',
  location: '',
  organizer: '',
  link: '',
  description: '',
};

// A red message under a field, if the server sent one for it.
function ErrorFor({ field, errors }) {
  return errors[field] ? <span className="field-error">{errors[field]}</span> : null;
}

export default function PostEvent() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({}); // e.g. { title: "Give the event a title." }
  const [message, setMessage] = useState(null); // { ok: true/false, text: "…" }
  const [saving, setSaving] = useState(false);

  // Keeps `form` in step with whatever the user types.
  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault(); // stop the browser from reloading the page
    setSaving(true);
    setErrors({});
    setMessage(null);

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (response.ok) {
        setMessage({ ok: true, text: `Saved "${result.event.title}".` });
        setForm({ ...EMPTY_FORM, date: form.date }); // keep the date for the next one
      } else {
        setErrors(result.fields || {});
        setMessage({ ok: false, text: result.error });
      }
    } catch {
      setMessage({ ok: false, text: 'Could not reach the server. Try again.' });
    }

    setSaving(false);
  }

  return (
    <section>
      <h2>Post an event</h2>
      <p className="lead">Your event shows up on the dashboard as soon as it is saved.</p>

      <form className="event-form" onSubmit={handleSubmit} noValidate>
        <label>
          Title
          <input name="title" value={form.title} onChange={handleChange} />
          <ErrorFor field="title" errors={errors} />
        </label>

        <label>
          Type
          <select name="category" value={form.category} onChange={handleChange}>
            <option value="event">Event</option>
            <option value="meeting">Meeting or practice</option>
            <option value="signup">Sign up</option>
          </select>
          <ErrorFor field="category" errors={errors} />
        </label>

        <div className="field-row">
          <label>
            Date
            <input name="date" type="date" value={form.date} onChange={handleChange} />
          </label>
          <label>
            Starts
            <input name="startTime" type="time" value={form.startTime} onChange={handleChange} />
          </label>
          <label>
            Ends <span className="optional">(optional)</span>
            <input name="endTime" type="time" value={form.endTime} onChange={handleChange} />
          </label>
        </div>
        <ErrorFor field="start" errors={errors} />
        <ErrorFor field="end" errors={errors} />

        <label>
          Location
          <input name="location" value={form.location} onChange={handleChange} />
          <ErrorFor field="location" errors={errors} />
        </label>

        <label>
          Hosted by
          <input name="organizer" value={form.organizer} onChange={handleChange} />
          <ErrorFor field="organizer" errors={errors} />
        </label>

        <label>
          Link <span className="optional">(optional)</span>
          <input name="link" type="url" placeholder="https://" value={form.link} onChange={handleChange} />
          <ErrorFor field="link" errors={errors} />
        </label>

        <label>
          Description <span className="optional">(optional)</span>
          <textarea name="description" rows="4" value={form.description} onChange={handleChange} />
          <ErrorFor field="description" errors={errors} />
        </label>

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Post event'}
          </button>
          <Link to="/">Back to the dashboard</Link>
        </div>

        {message && <p className={message.ok ? 'form-ok' : 'form-bad'}>{message.text}</p>}
      </form>
    </section>
  );
}
