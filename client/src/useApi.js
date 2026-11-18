// A React hook that loads data from our API.
//
//   const { data, error } = useApi('/api/news');
//
// `data` is empty until the server answers. If `refreshMinutes` is given,
// it loads the data again on that schedule, so the page stays current.

import { useEffect, useState } from 'react';

export default function useApi(path, refreshMinutes) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`The server answered ${response.status}`);
        setData(await response.json());
        setError(null);
      } catch (err) {
        setError(err);
      }
    }

    load();
    if (!refreshMinutes) return;

    const timer = setInterval(load, refreshMinutes * 60 * 1000);
    return () => clearInterval(timer); // stop when the component goes away
  }, [path, refreshMinutes]);

  return { data, error };
}
