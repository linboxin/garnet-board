// Vercel runs every file in the api/ folder as a "serverless function".
// This one hands every /api request to our Express app (see vercel.json).

module.exports = require('../app');
