// The main page. It loads the data for all four sections and passes each
// section its part. Each section only draws what it's given.

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useApi from '../useApi.js';
import News from '../components/News.jsx';
import Menus from '../components/Menus.jsx';
import Hours from '../components/Hours.jsx';
import Events from '../components/Events.jsx';

export default function Dashboard() {
  // The number is how many minutes until the data is loaded again.
  const news = useApi('/api/news');
  const menus = useApi('/api/menus', 15);
  const hours = useApi('/api/locations', 1); // every minute, so "Open" turns to "Closed" on time
  const events = useApi('/api/events', 5);

  // When the page opens at a section (like /#events), scroll to it once all
  // the data has arrived. Before that, the sections above aren't full height
  // yet, so we'd land in the wrong place.
  const { hash } = useLocation();
  const allLoaded = Boolean(news.data && menus.data && hours.data && events.data);
  useEffect(() => {
    if (hash && allLoaded) document.querySelector(hash)?.scrollIntoView({ behavior: 'instant' });
  }, [hash, allLoaded]);

  return (
    <>
      <News data={news.data} error={news.error} />
      <Menus data={menus.data} error={menus.error} />
      <Hours data={hours.data} error={hours.error} />
      <Events data={events.data} error={events.error} />
    </>
  );
}
