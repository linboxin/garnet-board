// Connects to MongoDB once and reuses that connection.
//
// On your computer the server connects at startup. On Vercel each request
// may start a fresh copy of the app, so every request calls this; after the
// first time it returns straight away.

const mongoose = require('mongoose');

let connection = null;

function connectToDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Add it to .env (or to Vercel).');
  }
  if (!connection) {
    connection = mongoose.connect(process.env.MONGODB_URI).catch((error) => {
      connection = null; // let the next request try again
      throw error;
    });
  }
  return connection;
}

module.exports = connectToDatabase;
