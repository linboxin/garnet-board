const mongoose = require('mongoose');

// A place with opening hours: a dining café, the library, an office.

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['dining', 'study', 'health', 'services', 'offices'],
    },
    building: { type: String, trim: true }, // "Silliman Hall, 1st Floor"
    note: { type: String, trim: true }, // "Café Closed: Nov 18 - Jan 4"
    pageUrl: { type: String, trim: true }, // the page the hours came from

    // Weekly opening periods. See lib/hours.js for how they are read.
    hours: [
      {
        _id: false,
        day: { type: Number, required: true, min: 0, max: 6 }, // 0 = Sunday
        open: { type: String, required: true }, // "07:30"
        close: { type: String, required: true }, // "20:00"
      },
    ],

    // Set by the dining importer when a café is serving nothing today
    // (a holiday or break), whatever its weekly hours say.
    closedToday: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Location', locationSchema);
