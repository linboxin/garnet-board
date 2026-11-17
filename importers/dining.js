// Imports each dining café's hours and today's menu from Union's
// Bon Appétit site (union.cafebonappetit.com).
//
// Each café has its own page. This reads three things from it:
//
// 1. The weekly schedule, a list of rows like
//      Breakfast      Mon-Fri, 7:00 am - 10:00 am
//    Rows without weekdays ("Café Closed  Nov 18 - Jan 4") are kept as a note.
//
// 2. Today's serving times. If there are none, the café is closed today.
//
// 3. Today's menu. The page keeps it as data inside a <script> tag:
//      Bamco.menu_items = { "123": { "label": "Oatmeal", "cor_icon": {…} }, … };
//      Bamco.dayparts['1'] = { "label": "Breakfast", "starttime": "07:00",
//                              "endtime": "10:00", "stations": [
//                                { "label": "Kettles", "items": ["123", …] } ] };
//    A "daypart" is a meal. Its stations list dishes by id, and menu_items
//    says what each id is.

const cheerio = require('cheerio');
const Location = require('../models/Location');
const Menu = require('../models/Menu');
const { getPage, wait } = require('./fetch');
const { campusNow, parseHours, parseTimeRanges } = require('../lib/hours');

const SITE = 'https://union.cafebonappetit.com';

const CAFE_PAGES = [
  'upperclass-dining-hall',
  'dutch-hollow',
  'rathskeller',
  'starbucks-at-wold',
  '807-deli',
  'c-store',
  'garlic-nott',
  'ozone-cafe',
];

// Bon Appétit's dietary icons, and the shorter tags we save for them.
const DIET_TAGS = {
  Vegetarian: 'vegetarian',
  Vegan: 'vegan',
  'Made without Gluten-Containing Ingredients': 'gluten-free',
  Halal: 'halal',
};

// Dish names can contain HTML such as "Mac &amp; Cheese". This returns the
// plain text: "Mac & Cheese".
function plainText(html) {
  return cheerio.load(html).text().trim();
}

// Reads today's meals out of the page's <script> data (see the top of the file).
function readMenus(html) {
  const itemsLine = html.match(/Bamco\.menu_items = (.*);/);
  if (!itemsLine) return []; // cafés like Starbucks don't post a menu
  const items = JSON.parse(itemsLine[1]);

  const mealLines = [...html.matchAll(/Bamco\.dayparts\['\d+'\] = (.*);/g)];
  const meals = mealLines.map((line) => JSON.parse(line[1]));

  return meals.map((meal) => ({
    meal: meal.label,
    start: meal.starttime,
    end: meal.endtime,
    stations: meal.stations.map((station) => ({
      name: plainText(station.label),
      items: station.items
        .filter((id) => items[id])
        .map((id) => ({
          name: plainText(items[id].label),
          tags: Object.values(items[id].cor_icon)
            .map((icon) => DIET_TAGS[icon])
            .filter(Boolean),
        })),
    })),
  }));
}

async function importDining() {
  const today = campusNow().toISODate(); // "2026-11-17"

  for (const slug of CAFE_PAGES) {
    const url = `${SITE}/cafe/${slug}/`;
    const html = await getPage(url);
    const $ = cheerio.load(html);

    // The page title is "Dutch Hollow – Union College Dining".
    const name = $('title').text().split('–')[0].trim();

    // 1. Weekly schedule.
    const hours = [];
    const notes = [];
    $('li.day-part.dotted-leader-container').each((index, row) => {
      const [label, when] = $(row)
        .find('span')
        .map((i, span) => $(span).text().trim())
        .get();
      const periods = parseHours(when, when);
      if (periods.length > 0) {
        hours.push(...periods);
      } else {
        notes.push(`${label}: ${when}`);
      }
    });

    // 2. Closed today if the "today" box lists no serving times.
    const todayBox = $('.site-panel__cafeinfo-hours').text();
    const closedToday = parseTimeRanges(todayBox).length === 0;

    await Location.updateOne(
      { name },
      { name, category: 'dining', pageUrl: url, hours, note: notes.join('. '), closedToday },
      { upsert: true }
    );

    // 3. Replace this café's saved menu with today's.
    const menus = readMenus(html).map((menu) => ({ ...menu, cafe: name, date: today }));
    await Menu.deleteMany({ cafe: name });
    await Menu.insertMany(menus);

    await wait(1500);
  }

  return `${CAFE_PAGES.length} cafés`;
}

module.exports = importDining;
