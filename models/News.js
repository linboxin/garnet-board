const mongoose = require('mongoose');

// A news story from union.edu.

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    // The story's web address. It is unique, so a story is never saved twice.
    link: { type: String, required: true, unique: true },
    publishedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('News', newsSchema);
