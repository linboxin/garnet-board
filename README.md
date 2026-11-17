# Garnet Board

A student dashboard for Union College: campus news, dining menus, what's open
right now, and events, on one page. CSC 240 final project (backend track).

**Stack:** Node.js and Express, MongoDB Atlas (through Mongoose), and a plain
HTML, CSS and JavaScript front end.

## How it works

```
Union websites ──► importers ──► MongoDB ──► API ──► the page
                                    ▲
                   "Post an event" form
```

1. **Importers** fetch data from Union's websites every few hours and save it
   to MongoDB.
2. The **API** reads from MongoDB and answers the page's requests.
3. The **page** asks the API for data and draws it.

The page never talks to Union's sites directly, so it stays fast and keeps
working when one of them is down.

## Run it

```bash
npm install
npm start
```

Then open http://localhost:3000.

The server needs a MongoDB connection string. Copy `.env.example` to `.env`
and paste your Atlas connection string in as `MONGODB_URI`. In Atlas, your
current IP address must be allowed under **Network Access**.

On its first start the server runs every importer, which takes about a minute.

## The files

```
server.js              starts everything: database, website, API, importers
routes/api.js          the API endpoints
lib/hours.js           opening hours: reading them as text, and "is it open now?"

models/                what each kind of document looks like in MongoDB
  Location.js            a café, library or office, with its weekly hours
  Menu.js                one meal at one café today
  Event.js               one event
  News.js                one news story
  ImportRun.js           when each importer last ran

importers/             fetch data from Union's websites into MongoDB
  index.js               the schedule: which importer runs how often
  news.js                news stories from union.edu
  events.js              events from U-Engage
  dining.js              café hours and menus from Bon Appétit
  hours.js               office hours from union.edu
  officePages.js         the list of office pages hours.js reads
  fetch.js               helpers for downloading pages
  run.js                 run importers by hand

public/                the website: index.html, post.html, styles.css, app.js
```

## The importers

| Importer | Source | Runs every | Saves to |
| --- | --- | --- | --- |
| `events` | U-Engage's public JSON feed | 2 hours | `events` |
| `news` | union.edu/news/stories/all | 6 hours | `news` |
| `dining` | each café's page on union.cafebonappetit.com | 3 hours | `locations`, `menus` |
| `hours` | 34 office pages on union.edu | 7 days | `locations` |

Every 15 minutes the server checks which importers are due and runs them. If
one fails (a site is down, a page changed), the error is logged and the old
data stays.

To run them by hand:

```bash
npm run import
```

Or just one of them, for example `npm run import news`.

HTML pages are read with [cheerio](https://cheerio.js.org/), which finds parts
of a page with CSS selectors. Dates and times use
[luxon](https://moment.github.io/luxon/), which handles Union's time zone.

Notes:

- The dining site's `robots.txt` asks automated programs not to fetch it. The
  dining importer makes 8 requests every 3 hours, one at a time with a pause.
- The U-Engage feed includes organizers' names and emails. They are not saved.
- Schaffer Library and the Writing Center describe their hours in a paragraph,
  so their term hours are typed in by hand in `importers/officePages.js`.
- Dining hours come from each café's weekly schedule. One-off changes (a
  holiday, a break) appear as a note under the café, and a café serving
  nothing today shows as "Closed today".

## The API

| Method | Path | What it returns |
| --- | --- | --- |
| GET | `/api/news` | The 8 latest headlines |
| GET | `/api/menus` | Today's meals at every café |
| GET | `/api/locations` | Every place, with its hours and whether it is open now |
| GET | `/api/events` | Events from today through the next week |
| POST | `/api/events` | Saves an event from the form |

`POST /api/events` takes JSON with `title`, `category` (`event`, `meeting` or
`signup`), `date`, `startTime`, `endTime`, `location`, `organizer`, `link` and
`description`. If a field breaks a rule in `models/Event.js`, it answers `400`
with a message for each field; otherwise `201` with the saved event.

## Open or closed

"Open until 8:00 PM" is never stored. `getStatus()` in `lib/hours.js` works it
out on each request from the place's weekly hours and the current time on
campus (not the server's or the visitor's time zone). It handles places that
close after midnight and meals that run back to back.
