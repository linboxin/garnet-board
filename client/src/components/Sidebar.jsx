// The sidebar: site name, links to each section, and a clock.

import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { campusNow } from '../time.js';
import './Sidebar.css';

// Shows the date and time on campus, updated every 15 seconds.
function Clock() {
  const [now, setNow] = useState(campusNow());

  useEffect(() => {
    const timer = setInterval(() => setNow(campusNow()), 15 * 1000);
    return () => clearInterval(timer);
  }, []);

  return <p className="clock">{now.toFormat('cccc, LLLL d, h:mm a')}</p>;
}

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <a className="brand" href="/">
        Garnet Board
        <span>Union College</span>
      </a>

      {/* Plain <a> links jump to a section of the dashboard. */}
      <nav aria-label="Sections">
        <a href="/#news">Around Union</a>
        <a href="/#menus">Menus</a>
        <a href="/#hours">Hours</a>
        <a href="/#events">Events</a>
        <NavLink to="/post">Post an event</NavLink>
      </nav>

      <Clock />
    </aside>
  );
}
