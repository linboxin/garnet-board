// The API: every address under /api that the website asks for data.

const express = require('express');
const { DateTime } = require('luxon');
const Location = require('../models/Location');
const Menu = require('../models/Menu');
const Event = require('../models/Event');
const News = require('../models/News');
const { ZONE, campusNow, getStatus, weekSchedule } = require('../lib/hours');

const router = express.Router();

// GET /api/news — the latest headlines, newest first.
router.get('/news', async (req, res) => {
  const news = await News.find().sort({ publishedAt: -1 }).limit(8);
  res.json({ news });
});

// GET /api/menus — today's meals at every café, in the order they're served.
router.get('/menus', async (req, res) => {
  const today = campusNow().toISODate();
  const menus = await Menu.find({ date: today }).sort({ cafe: 1, start: 1 });
  res.json({ menus });
});

// GET /api/locations — every place, with whether it is open right now.
// The open/closed status isn't stored: it is worked out here on each request
// from the place's hours and the current time on campus.
router.get('/locations', async (req, res) => {
  const now = campusNow();
  const locations = await Location.find().sort({ name: 1 });

  res.json({
    locations: locations.map((location) => ({
      id: location.id,
      name: location.name,
      category: location.category,
      building: location.building,
      note: location.note,
      pageUrl: location.pageUrl,
      status: getStatus(location, now),
      schedule: weekSchedule(location.hours, now),
    })),
  });
});

// GET /api/events — events from today through the next week.
// It includes events that started earlier and are still going on, such as
// an application that stays open for two weeks.
router.get('/events', async (req, res) => {
  const startOfToday = campusNow().startOf('day');
  const oneWeekLater = startOfToday.plus({ days: 7 });

  const events = await Event.find({
    start: { $lt: oneWeekLater.toJSDate() },
    $or: [
      { end: { $gte: startOfToday.toJSDate() } },
      { end: null, start: { $gte: startOfToday.toJSDate() } },
    ],
  }).sort({ start: 1 });

  res.json({ events });
});

// Turns the form's date ("2026-11-17") and time ("19:00") into the exact
// moment the clock on campus reads that time.
function campusDateTime(date, time) {
  const moment = DateTime.fromISO(`${date}T${time}`, { zone: ZONE });
  return moment.isValid ? moment.toJSDate() : undefined;
}

// POST /api/events — saves an event from the "Post an event" form.
router.post('/events', async (req, res) => {
  const form = req.body;

  const event = new Event({
    title: form.title,
    category: form.category,
    start: campusDateTime(form.date, form.startTime),
    end: campusDateTime(form.date, form.endTime),
    location: form.location,
    organizer: form.organizer,
    description: form.description || undefined,
    link: form.link || undefined,
    source: 'form',
  });

  try {
    await event.save(); // checks the rules in models/Event.js first
    res.status(201).json({ event });
  } catch (error) {
    if (error.name !== 'ValidationError') throw error;

    // Send back one message per broken field, e.g.
    // { title: "Give the event a title." }
    const fields = {};
    for (const field in error.errors) {
      fields[field] = error.errors[field].message;
    }
    res.status(400).json({ error: 'Please fix the highlighted fields.', fields });
  }
});

module.exports = router;
