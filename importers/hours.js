// Imports the office hours of Union's offices and buildings from union.edu.
//
// Each office page has a contact box like this:
//
//   <section class="contact">
//     <h2>Silliman Hall, 1st Floor</h2>
//     <div class="office-hours__item">
//       <span class="office-hours__item-label">Mon - Fri: </span>
//       <span class="office-hours__item-slots">8:30 am-4:30 pm</span>
//     </div>
//   </section>
//
// The list of pages to read is in officePages.js.

const cheerio = require('cheerio');
const Location = require('../models/Location');
const { getPage, wait } = require('./fetch');
const { parseHours } = require('../lib/hours');
const { OFFICE_PAGES, TYPED_IN } = require('./officePages');

const SITE = 'https://www.union.edu';

async function importHours() {
  let saved = 0;

  for (const page of OFFICE_PAGES) {
    const url = SITE + page.path;
    const $ = cheerio.load(await getPage(url));

    // Each row is one line of hours, e.g. "Mon - Fri:" and "8:30 am-4:30 pm".
    const hours = [];
    $('.office-hours__item').each((index, row) => {
      const days = $(row).find('.office-hours__item-label').text();
      const times = $(row).find('.office-hours__item-slots').text();
      hours.push(...parseHours(days, times));
    });

    if (hours.length === 0) {
      console.log(`  No hours found on ${url}`);
    } else {
      const name = page.name || $('h1').first().text().trim();
      const building = $('section.contact h2').first().text().trim();
      await Location.updateOne(
        { name },
        { name, category: page.category, building, pageUrl: url, hours },
        { upsert: true }
      );
      saved += 1;
    }

    await wait(1000);
  }

  // The places whose hours are typed in by hand.
  for (const place of TYPED_IN) {
    const hours = place.hours.flatMap(([days, times]) => parseHours(days, times));
    await Location.updateOne(
      { name: place.name },
      { name: place.name, category: place.category, pageUrl: SITE + place.path, hours },
      { upsert: true }
    );
    saved += 1;
  }

  return `${saved} places`;
}

module.exports = importHours;
