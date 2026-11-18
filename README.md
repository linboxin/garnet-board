# Garnet Board

A student dashboard for Union College: campus news, dining menus, what's open
right now, and events, on one page. CSC 240 final project (backend track).

**Stack:** a React front end (built with Vite), a Node.js and Express API,
and MongoDB Atlas (through Mongoose). Hosted on Vercel.

## How it works

```
Union websites ──► importers ──► MongoDB ──► Express API ──► React page
                                    ▲
                   "Post an event" form
```

1. **Importers** fetch data from Union's websites and save it to MongoDB.
2. The **API** (`/api/...`) reads from MongoDB and answers the page.
3. The **React app** asks the API for data and draws it.

## Run it on your computer

1. Copy `.env.example` to `.env` and paste in your Atlas connection string as
   `MONGODB_URI`. In Atlas, your current IP address must be allowed under
   **Network Access**.
2. Install and start:

   ```bash
   npm install
   npm run dev
   ```

3. Open http://localhost:5173.

`npm run dev` starts two things at once:
- **the API** on port 3000 (`server.js`), which also runs the importers on a
  schedule;
- **the React app** on port 5173 (Vite). It reloads as soon as you save a
  file, and sends `/api` requests to port 3000.

## Put it on Vercel

Vercel builds the React app into plain files and runs the API as a
"serverless function" (`api/index.js`). The settings are in `vercel.json`.

1. **Atlas → Network Access → Add IP Address → Allow access from anywhere**
   (`0.0.0.0/0`). Vercel's servers don't have fixed addresses.
2. **Vercel → your project → Settings → Environment Variables**, add:
   - `MONGODB_URI`: the same connection string as in your `.env`
   - `CRON_SECRET`: any long random text
3. Push to GitHub. Vercel builds and deploys `main` on its own.

**Imports on Vercel:** there is no always-running server, so a Vercel
"cron job" calls `/api/import` once a day (at 10:00 UTC, about 5 AM on
campus), which runs whatever importers are due. That's the most often the
free plan allows. To refresh sooner, run `npm run import` on your computer:
it writes to the same database.

## The files

```
client/                    the React app
  index.html                 the page React draws into
  src/main.jsx               starts React
  src/App.jsx                layout: sidebar plus the current page
  src/styles.css             colours and styles shared by every part
  src/useApi.js              loads data from the API (and reloads it)
  src/time.js                dates and times in campus time
  src/components/            one file per part of the page, each with its .css
    Sidebar.jsx  News.jsx  Menus.jsx  Hours.jsx  Events.jsx
  src/pages/
    Dashboard.jsx            the main page: loads the data, shows the sections
    PostEvent.jsx            the "Post an event" form

app.js                     the Express app (the API)
server.js                  runs the API on your computer
api/index.js               runs the API on Vercel
routes/api.js              the API endpoints
lib/hours.js               opening hours: reading them, and "is it open now?"
lib/db.js                  connects to MongoDB

models/                    what each kind of document looks like in MongoDB
  Location.js  Menu.js  Event.js  News.js  ImportRun.js

importers/                 fetch data from Union's websites into MongoDB
  index.js                   which importer runs how often
  news.js                    news stories from union.edu
  events.js                  events from U-Engage
  dining.js                  café hours and menus from Bon Appétit
  hours.js                   office hours from union.edu
  officePages.js             the list of office pages hours.js reads
  fetch.js                   helpers for downloading pages
  run.js                     run importers by hand

vite.config.mjs            settings for Vite
vercel.json                settings for Vercel
```

## Editing the look

- **Colours** are at the top of `client/src/styles.css`. Change `--garnet` and
  every garnet thing on the site changes.
- **Each part of the page** has its own `.jsx` file (what's shown) and `.css`
  file (how it looks) in `client/src/components/`.

## The importers

| Importer | Source | Runs every | Saves to |
| --- | --- | --- | --- |
| `events` | U-Engage's public JSON feed | 2 hours | `events` |
| `news` | union.edu/news/stories/all | 6 hours | `news` |
| `dining` | each café's page on union.cafebonappetit.com | 3 hours | `locations`, `menus` |
| `hours` | 34 office pages on union.edu | 7 days | `locations` |

These are the schedules on your computer. On Vercel they all run once a day
(see above). To run them by hand:

```bash
npm run import
```

Or just one, for example `npm run import news`.

HTML pages are read with [cheerio](https://cheerio.js.org/), which finds parts
of a page with CSS selectors. Dates and times use
[luxon](https://moment.github.io/luxon/), which handles Union's time zone.

Notes:

- The dining site's `robots.txt` asks automated programs not to fetch it. The
  dining importer makes 8 requests per run, one at a time with a pause.
- The U-Engage feed includes organizers' names and emails. They are not saved.
- Schaffer Library and the Writing Center describe their hours in a paragraph,
  so their term hours are typed in by hand in `importers/officePages.js`.
- One-off dining changes (a holiday, a break) appear as a note under the café,
  and a café serving nothing today shows as "Closed today".

## The API

| Method | Path | What it returns |
| --- | --- | --- |
| GET | `/api/news` | The 8 latest headlines |
| GET | `/api/menus` | Today's meals at every café |
| GET | `/api/locations` | Every place, with its hours and whether it is open now |
| GET | `/api/events` | Events from today through the next week |
| POST | `/api/events` | Saves an event from the form |
| GET | `/api/import` | Runs due importers; needs the `CRON_SECRET` (used by Vercel's cron job) |

`POST /api/events` takes JSON with `title`, `category` (`event`, `meeting` or
`signup`), `date`, `startTime`, `endTime`, `location`, `organizer`, `link` and
`description`. If a field breaks a rule in `models/Event.js`, it answers `400`
with a message for each field; otherwise `201` with the saved event.

"Open until 8:00 PM" is never stored. `getStatus()` in `lib/hours.js` works it
out on each request from the place's weekly hours and the current time on
campus.
