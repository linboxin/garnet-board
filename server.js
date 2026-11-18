// Runs Garnet Board on your own computer.
//
//   npm run dev     while working: the API here on port 3000, and the React
//                   app on port 5173 (open that one), which reloads as you edit
//   npm start       the finished site: run `npm run build` first, then open
//                   port 3000
//
// Vercel doesn't use this file; it uses api/index.js.

const path = require('path');
const express = require('express');
const app = require('./app');
const connectToDatabase = require('./lib/db');
const { startImporters } = require('./importers');

const PORT = 3000; // vite.config.mjs sends /api requests here
const WEBSITE = path.join(__dirname, 'dist'); // made by `npm run build`

// Serve the built React app. Any address that isn't a file (like /post)
// gets index.html, and React shows the right page.
app.use(express.static(WEBSITE));
app.get('/{*page}', (req, res) => res.sendFile(path.join(WEBSITE, 'index.html')));

async function start() {
  await connectToDatabase();
  console.log('Connected to MongoDB.');

  app.listen(PORT, () => console.log(`Garnet Board's server is running on port ${PORT}`));
  startImporters();
}

start().catch((error) => {
  console.error('Could not start:', error.message);
  process.exit(1);
});
