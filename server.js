// Garnet Board's server: connects to MongoDB, serves the website and the
// API, and keeps the data fresh by running the importers.

require('dotenv').config({ quiet: true });

const express = require('express');
const mongoose = require('mongoose');
const apiRoutes = require('./routes/api');
const { startImporters } = require('./importers');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json()); // read JSON sent by the "Post an event" form
app.use(express.static('public')); // the website itself
app.use('/api', apiRoutes); // the data the website asks for

// Errors end up here. A 400 means the request itself was bad (for example,
// JSON that can't be read). Anything else is a problem on our side: log it.
app.use((error, req, res, next) => {
  if (error.status === 400) {
    return res.status(400).json({ error: 'The request could not be read.' });
  }
  console.error(error);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

async function start() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  app.listen(PORT, () => console.log(`Garnet Board is running at http://localhost:${PORT}`));
  startImporters();
}

start().catch((error) => {
  console.error('Could not start:', error.message);
  process.exit(1);
});
