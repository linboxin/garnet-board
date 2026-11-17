// Runs importers by hand, without waiting for the server's schedule.
//
//   npm run import            every importer
//   npm run import news       just one (events, news, dining or hours)

require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const { IMPORTERS, runImporter } = require('./index');

async function main() {
  const wanted = process.argv[2];
  const chosen = wanted ? IMPORTERS.filter((importer) => importer.name === wanted) : IMPORTERS;

  if (chosen.length === 0) {
    const names = IMPORTERS.map((importer) => importer.name).join(', ');
    console.error(`No importer called "${wanted}". Choose from: ${names}`);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  for (const importer of chosen) {
    await runImporter(importer);
  }
  await mongoose.disconnect();
}

main();
