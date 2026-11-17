// Runs the importers on a schedule while the server is up.
//
// Each importer is one function that fetches data from a Union website and
// saves it to MongoDB. The list below says how often each should run.

const ImportRun = require('../models/ImportRun');
const importNews = require('./news');
const importEvents = require('./events');
const importDining = require('./dining');
const importHours = require('./hours');

const IMPORTERS = [
  { name: 'events', everyHours: 2, run: importEvents },
  { name: 'news', everyHours: 6, run: importNews },
  { name: 'dining', everyHours: 3, run: importDining },
  { name: 'hours', everyHours: 24 * 7, run: importHours }, // office hours rarely change
];

const HOUR = 60 * 60 * 1000;

// Runs one importer and records when it finished. If it fails (the site is
// down, the page changed), the error is logged and the old data stays.
async function runImporter(importer) {
  try {
    const summary = await importer.run();
    await ImportRun.updateOne(
      { name: importer.name },
      { name: importer.name, finishedAt: new Date() },
      { upsert: true }
    );
    console.log(`Imported ${importer.name}: ${summary}`);
  } catch (error) {
    console.error(`Import of ${importer.name} failed: ${error.message}`);
  }
}

// Runs every importer whose data is older than its `everyHours`.
async function runDueImporters() {
  for (const importer of IMPORTERS) {
    const lastRun = await ImportRun.findOne({ name: importer.name });
    const isDue = !lastRun || Date.now() - lastRun.finishedAt > importer.everyHours * HOUR;
    if (isDue) await runImporter(importer);
  }
}

// Called once when the server starts: import anything that's due now, then
// check again every 15 minutes.
function startImporters() {
  runDueImporters();
  setInterval(runDueImporters, 15 * 60 * 1000);
}

module.exports = { IMPORTERS, runImporter, startImporters };
