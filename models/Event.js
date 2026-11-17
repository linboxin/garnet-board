const mongoose = require('mongoose');

// A campus event. Events come from two places: the U-Engage importer and the
// "Post an event" form. The messages below are shown on that form when a
// field fails its rule.

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Give the event a title.'],
      trim: true,
      maxlength: [120, 'Keep the title under 120 characters.'],
    },

    // The three groups the Union Daily Digest email uses.
    category: {
      type: String,
      enum: { values: ['event', 'meeting', 'signup'], message: 'Pick a valid category.' },
      default: 'event',
    },

    start: { type: Date, required: [true, 'Pick a date and start time.'] },
    end: {
      type: Date,
      validate: {
        validator(end) {
          return !end || end > this.start;
        },
        message: 'The end time has to be after the start time.',
      },
    },

    location: {
      type: String,
      required: [true, 'Say where it is happening.'],
      trim: true,
      maxlength: [120, 'Keep the location under 120 characters.'],
    },
    organizer: {
      type: String,
      required: [true, 'Say who is hosting it.'],
      trim: true,
      maxlength: [120, 'Keep the organizer under 120 characters.'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [600, 'Keep the description under 600 characters.'],
    },

    // Only web links are allowed, which keeps out "javascript:" links.
    link: {
      type: String,
      trim: true,
      match: [/^https?:\/\/\S+$/i, 'Links have to start with http:// or https://.'],
    },

    // Where the event came from: the form, or U-Engage.
    source: { type: String, enum: ['form', 'uengage'], default: 'form' },

    // The event's id on U-Engage. Importing again updates the same event
    // instead of adding a copy. Posted events don't have one.
    uengageId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
