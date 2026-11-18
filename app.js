// The Express app: the API under /api. It is used in two places:
//   - server.js, when you run the site on your computer
//   - api/index.js, when Vercel runs it

require('dotenv').config({ quiet: true });

const express = require('express');
const connectToDatabase = require('./lib/db');
const apiRoutes = require('./routes/api');

const app = express();

app.use(express.json()); // read JSON sent by the "Post an event" form

// Make sure we're connected to MongoDB before any API request.
app.use('/api', async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api', apiRoutes);

// Errors end up here. A 400 means the request itself was bad (for example,
// JSON that can't be read). Anything else is a problem on our side: log it.
app.use((error, req, res, next) => {
  if (error.status === 400) {
    return res.status(400).json({ error: 'The request could not be read.' });
  }
  console.error(error);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

module.exports = app;
