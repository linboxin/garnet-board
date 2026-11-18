// "Menus": today's food at each café. Pick a café, then a meal.

import { useState } from 'react';
import { campusNow, formatClockTime } from '../time.js';
import './Menus.css';

const DIET_LABELS = {
  vegan: 'Vegan',
  vegetarian: 'Vegetarian',
  'gluten-free': 'Gluten free',
  halal: 'Halal',
};

// A station shows this many dishes until you click "more".
const SHORT_LIST = 8;

// "Vegan, Gluten free". Vegan already means vegetarian, so that's left out.
function dietText(tags) {
  return tags
    .filter((tag) => !(tag === 'vegetarian' && tags.includes('vegan')))
    .map((tag) => DIET_LABELS[tag])
    .join(', ');
}

// The meal being served now; if none, the next one today; if none, the last.
function currentMeal(meals) {
  const now = campusNow().toFormat('HH:mm'); // "13:05", compares like a time
  return (
    meals.find((meal) => meal.start <= now && now < meal.end) ||
    meals.find((meal) => meal.start > now) ||
    meals[meals.length - 1]
  );
}

// One station: its name and dishes, with long lists shortened.
function Station({ station }) {
  const [showAll, setShowAll] = useState(false);
  const dishes = showAll ? station.items : station.items.slice(0, SHORT_LIST);
  const hiddenCount = station.items.length - SHORT_LIST;

  return (
    <div className="station">
      <h4>{station.name}</h4>
      <ul className="dishes">
        {dishes.map((dish, index) => (
          <li key={index}>
            {dish.name}
            {dish.tags.length > 0 && <span className="diet">{dietText(dish.tags)}</span>}
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <button className="link-button" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show less' : `${hiddenCount} more`}
        </button>
      )}
    </div>
  );
}

export default function Menus({ data, error }) {
  const [chosenCafe, setChosenCafe] = useState(null);
  const [chosenMeal, setChosenMeal] = useState(null);

  let content;
  if (error) {
    content = <p className="muted">Could not load menus. Try refreshing.</p>;
  } else if (!data) {
    content = <p className="muted">Loading menus…</p>;
  } else if (data.menus.length === 0) {
    content = <p className="muted">No menus posted for today.</p>;
  } else {
    // The cafés with a menu today, the one serving the most meals first (so
    // the main dining hall comes first).
    const mealCount = (name) => data.menus.filter((menu) => menu.cafe === name).length;
    const cafes = [...new Set(data.menus.map((menu) => menu.cafe))].sort(
      (a, b) => mealCount(b) - mealCount(a)
    );
    const cafe = cafes.includes(chosenCafe) ? chosenCafe : cafes[0];

    // That café's meals, in the order they're served.
    const meals = data.menus.filter((menu) => menu.cafe === cafe);
    const meal = meals.find((menu) => menu.meal === chosenMeal) || currentMeal(meals);

    content = (
      <>
        <div className="picker">
          {cafes.map((name) => (
            <button
              key={name}
              className={name === cafe ? 'selected' : ''}
              onClick={() => {
                setChosenCafe(name);
                setChosenMeal(null); // a new café starts on its current meal
              }}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="picker meal-picker">
          {meals.map((menu) => (
            <button
              key={menu.meal}
              className={menu.meal === meal.meal ? 'selected' : ''}
              onClick={() => setChosenMeal(menu.meal)}
            >
              {menu.meal}
            </button>
          ))}
        </div>

        <p className="meal-time">
          {meal.meal}, {formatClockTime(meal.start)} – {formatClockTime(meal.end)}
        </p>

        <div className="stations">
          {meal.stations.map((station) => (
            // The key includes the meal so each station's "more" resets
            // when you switch meals.
            <Station key={`${cafe} ${meal.meal} ${station.name}`} station={station} />
          ))}
        </div>
      </>
    );
  }

  return (
    <section id="menus">
      <h2>Menus</h2>
      {content}
      <p className="more">
        Menus from{' '}
        <a href="https://union.cafebonappetit.com/" target="_blank" rel="noreferrer">
          Union Dining (Bon Appétit)
        </a>
        .
      </p>
    </section>
  );
}
