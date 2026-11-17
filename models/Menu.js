const mongoose = require('mongoose');

// One meal at one café on one day, e.g. Lunch at Reamer Dining Hall today.

const menuSchema = new mongoose.Schema(
  {
    cafe: { type: String, required: true }, // "Reamer Dining Hall"
    date: { type: String, required: true }, // "2026-11-17"
    meal: { type: String, required: true }, // "Lunch"
    start: { type: String, required: true }, // "11:00"
    end: { type: String, required: true }, // "14:00"

    stations: [
      {
        _id: false,
        name: { type: String, required: true }, // "Market Grill"
        items: [
          {
            _id: false,
            name: { type: String, required: true }, // "Black Bean Burger"
            tags: [String], // "vegan", "vegetarian", "gluten-free", "halal"
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Menu', menuSchema);
