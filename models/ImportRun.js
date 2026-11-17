const mongoose = require('mongoose');

// Remembers when each importer last finished, so the server knows which
// ones are due to run again. One document per importer.

const importRunSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // "news", "dining", …
  finishedAt: { type: Date, required: true },
});

module.exports = mongoose.model('ImportRun', importRunSchema);
