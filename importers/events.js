// Imports upcoming events from U-Engage (union.presence.io).
//
// U-Engage has a public JSON feed listing every event, so there is no HTML
// to read. One event in the feed looks like this (only the fields we use):
//
//   {
//     "eventNoSqlId": "9a1473e3-…",
//     "eventName": "Spanish Club Meeting",
//     "organizationName": "Spanish Club",
//     "location": "Messa House Great Room",
//     "startDateTimeUtc": "2026-11-12T17:50:00Z",
//     "endDateTimeUtc": "2026-11-12T18:50:00Z",
//     "uri": "spanish-club-meeting",
//     "tags": ["Sign Ups Required"]
//   }
//
// The feed also has organizers' names and emails. We don't save those.

const Event = require('../models/Event');
const { getJson } = require('./fetch');

const FEED = 'https://api.presence.io/union/v1/events';
const EVENT_PAGE = 'https://union.presence.io/event/';

// Sorts an event into one of the Daily Digest's three groups.
function categoryOf(event) {
  const title = event.eventName.toLowerCase();
  const tags = event.tags.join(' ').toLowerCase();

  if (tags.includes('sign up') || title.includes('sign up') || title.includes('apply')) {
    return 'signup';
  }
  if (title.includes('meeting') || title.includes('practice') || title.includes('rehearsal')) {
    return 'meeting';
  }
  return 'event';
}

async function importEvents() {
  const feed = await getJson(FEED);
  const now = new Date();

  // Keep only events that haven't finished yet.
  const upcoming = feed.filter((event) => new Date(event.endDateTimeUtc) > now);

  for (const event of upcoming) {
    // Some events put a video-call link where the room should be.
    const isLink = event.location.startsWith('http');

    await Event.updateOne(
      { uengageId: event.eventNoSqlId },
      {
        title: event.eventName,
        category: categoryOf(event),
        start: new Date(event.startDateTimeUtc),
        end: new Date(event.endDateTimeUtc),
        location: isLink ? 'Online' : event.location || 'See event page',
        organizer: event.organizationName,
        link: EVENT_PAGE + event.uri,
        source: 'uengage',
      },
      { upsert: true }
    );
  }

  // Remove imported events that are over or were taken off U-Engage.
  // Events posted through our own form are never touched.
  const upcomingIds = upcoming.map((event) => event.eventNoSqlId);
  await Event.deleteMany({ source: 'uengage', uengageId: { $nin: upcomingIds } });

  return `${upcoming.length} upcoming events`;
}

module.exports = importEvents;
