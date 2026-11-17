// Front end for Garnet Board, shared by the dashboard (index.html) and the
// event form (post.html). Everything shown comes from the /api endpoints;
// nothing here decides whether a place is open.

const timeZone = 'America/New_York'; // Union's time zone

// ---------- small helpers ----------

// el('p', { class: 'muted' }, 'text', childNode) -> <p class="muted">…</p>
// Text always goes in as text nodes, so posted content can't inject HTML.
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== null && value !== false) node.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child === undefined || child === null || child === false) continue;
    node.append(child);
  }
  return node;
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

const fmt = (options) => new Intl.DateTimeFormat('en-US', { timeZone, ...options });
const formatTime = (date) => fmt({ hour: 'numeric', minute: '2-digit' }).format(date);
const formatDay = (date) => fmt({ weekday: 'long', month: 'long', day: 'numeric' }).format(date);
const formatShortDate = (date) => fmt({ month: 'short', day: 'numeric', year: 'numeric' }).format(date);
// "2026-11-12" for the campus day a date falls on.
const dayKey = (date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
// "07:30" -> "7:30 AM"
function formatClock(hhmm) {
  const [hour, minute] = hhmm.split(':').map(Number);
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

// ---------- sidebar ----------

function renderClock() {
  const now = new Date();
  document.getElementById('today').textContent = `${formatDay(now)}, ${formatTime(now)}`;
}

// Mark the sidebar link for the section currently being read.
function watchSections() {
  const links = new Map(
    [...document.querySelectorAll('nav a[href^="#"]')].map((link) => [
      link.getAttribute('href').slice(1),
      link,
    ])
  );
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const [id, link] of links) link.classList.toggle('is-current', id === entry.target.id);
      }
    },
    { rootMargin: '-15% 0px -70% 0px' }
  );
  for (const id of links.keys()) observer.observe(document.getElementById(id));
}

// ---------- hours ----------

// Locations are grouped under their type, in this order.
const GROUPS = [
  ['dining', 'Dining'],
  ['study', 'Libraries & study'],
  ['fitness', 'Fitness'],
  ['health', 'Health & wellness'],
  ['services', 'Services'],
  ['offices', 'Offices'],
];

let locations = [];
const openPlaces = new Set(); // ids of the rows the reader has expanded

// The hours the server sent for this place: the week for most places, today
// and tomorrow for dining cafés.
function scheduleList(location) {
  if (!location.schedule.length) return el('p', {}, 'No hours listed.');
  const cells = [];
  for (const { label, text, isToday } of location.schedule) {
    const cls = isToday ? 'is-today' : undefined;
    cells.push(el('dt', { class: cls }, label), el('dd', { class: cls }, text));
  }
  return el('dl', { class: 'week' }, cells);
}

// One building: a row with its status that opens to show the week's hours.
function placeRow(location) {
  const { status } = location;
  let state = 'closed';
  if (status.isOpen) state = status.closingSoon ? 'soon' : 'open';

  const where = [location.building !== location.name && location.building, location.note]
    .filter(Boolean)
    .join(' · ');
  const source =
    location.pageUrl &&
    el('a', { class: 'source-link', href: location.pageUrl, target: '_blank', rel: 'noopener' }, 'Source page');

  const details = el(
    'details',
    { class: 'place', open: openPlaces.has(location.id) ? '' : undefined },
    el(
      'summary',
      {},
      el('span', { class: 'name' }, location.name),
      el('span', { class: `status ${state}` }, status.detail)
    ),
    el('div', { class: 'place-body' }, where && el('p', {}, where), scheduleList(location), source)
  );

  details.addEventListener('toggle', () => {
    if (details.open) openPlaces.add(location.id);
    else openPlaces.delete(location.id);
  });
  return details;
}

// Splits blocks into two independent columns, so a short block sits right
// under the one above it instead of waiting for a long block in the other
// column to end. Big blocks are placed first, each into whichever column is
// shorter (measured by `sizeOf`, in rows), which keeps the columns even; each
// column then lists its blocks in their original order, with the first block
// on the left.
function twoColumns(blocks, sizeOf = () => 1) {
  const columns = [
    { blocks: [], size: 0 },
    { blocks: [], size: 0 },
  ];
  const bySize = blocks
    .map((block, index) => ({ block, index, size: sizeOf(block) + 1 }))
    .sort((a, b) => b.size - a.size);
  for (const item of bySize) {
    const target = columns[0].size <= columns[1].size ? columns[0] : columns[1];
    target.blocks.push(item);
    target.size += item.size;
  }
  for (const column of columns) column.blocks.sort((a, b) => a.index - b.index);
  columns.sort((a, b) => (a.blocks[0]?.index ?? Infinity) - (b.blocks[0]?.index ?? Infinity));
  return columns.map((column) =>
    el('div', { class: 'column' }, column.blocks.map((item) => item.block))
  );
}

function renderLocations() {
  const blocks = [];
  for (const [category, label] of GROUPS) {
    const group = locations
      .filter((location) => location.category === category)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (!group.length) continue;
    blocks.push(
      el('div', { class: 'group' }, el('h3', {}, label), group.map(placeRow))
    );
  }
  const container = document.getElementById('locations');
  if (!blocks.length) {
    container.replaceChildren(el('p', { class: 'muted' }, 'No locations yet.'));
    return;
  }
  container.replaceChildren(...twoColumns(blocks, (block) => block.querySelectorAll('.place').length));
}

// ---------- menus ----------

const DIET_LABELS = {
  vegan: 'Vegan',
  vegetarian: 'Vegetarian',
  'gluten-free': 'Gluten free',
  halal: 'Halal',
};
const SHORT_LIST = 8; // longer stations start collapsed

let menus = []; // today's meals, every café
let selectedCafe = null;
let selectedMeal = null;
const expandedStations = new Set();

// "11:00" -> minutes since midnight
const minutesOf = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

function nowMinutes() {
  const [h, m] = fmt({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date()).split(':');
  return Number(h) * 60 + Number(m);
}

// The meal being served now, else the next one today, else the last one.
function currentMeal(meals) {
  const now = nowMinutes();
  const serving = meals.find((m) => minutesOf(m.start) <= now && now < minutesOf(m.end));
  if (serving) return serving.meal;
  const next = meals.find((m) => minutesOf(m.start) > now);
  return (next || meals[meals.length - 1]).meal;
}

function pickerButtons(container, options, selected, onPick) {
  container.replaceChildren(
    ...options.map(([value, label]) => {
      const button = el(
        'button',
        {
          type: 'button',
          class: value === selected ? 'is-current' : undefined,
          'aria-pressed': String(value === selected),
        },
        label
      );
      button.addEventListener('click', () => onPick(value));
      return button;
    })
  );
}

function dietText(tags) {
  return tags
    .filter((tag) => !(tag === 'vegetarian' && tags.includes('vegan'))) // vegan implies it
    .map((tag) => DIET_LABELS[tag] || tag)
    .join(', ');
}

function stationBlock(station, key) {
  const expanded = expandedStations.has(key);
  const shown = expanded ? station.items : station.items.slice(0, SHORT_LIST);
  const hidden = station.items.length - shown.length;

  const block = el(
    'div',
    { class: 'station' },
    el('h4', {}, station.name),
    el(
      'ul',
      { class: 'dishes' },
      shown.map((item) =>
        el(
          'li',
          { title: item.description || undefined },
          item.name,
          item.tags.length > 0 && el('span', { class: 'diet' }, dietText(item.tags))
        )
      )
    )
  );

  if (hidden > 0 || expanded) {
    const toggle = el(
      'button',
      { type: 'button', class: 'link-button' },
      expanded ? 'Show less' : `${hidden} more`
    );
    toggle.addEventListener('click', () => {
      if (expanded) expandedStations.delete(key);
      else expandedStations.add(key);
      renderMenus();
    });
    block.append(toggle);
  }
  return block;
}

function renderMenus() {
  const container = document.getElementById('menus-list');
  const cafePicker = document.getElementById('cafe-picker');
  const mealPicker = document.getElementById('meal-picker');

  if (!menus.length) {
    cafePicker.replaceChildren();
    mealPicker.replaceChildren();
    container.replaceChildren(el('p', { class: 'muted' }, 'No menus posted for today.'));
    return;
  }

  // Cafés with the most meals (the dining halls) first.
  const cafes = [...new Set(menus.map((m) => m.cafe))].sort(
    (a, b) =>
      menus.filter((m) => m.cafe === b).length - menus.filter((m) => m.cafe === a).length ||
      a.localeCompare(b)
  );
  if (!cafes.includes(selectedCafe)) {
    selectedCafe = cafes[0];
    selectedMeal = null;
  }

  const meals = menus
    .filter((m) => m.cafe === selectedCafe)
    .sort((a, b) => a.start.localeCompare(b.start));
  if (!meals.some((m) => m.meal === selectedMeal)) selectedMeal = currentMeal(meals);
  const menu = meals.find((m) => m.meal === selectedMeal);

  pickerButtons(cafePicker, cafes.map((c) => [c, c]), selectedCafe, (cafe) => {
    selectedCafe = cafe;
    selectedMeal = null;
    renderMenus();
  });
  pickerButtons(mealPicker, meals.map((m) => [m.meal, m.meal]), selectedMeal, (meal) => {
    selectedMeal = meal;
    renderMenus();
  });

  container.replaceChildren(
    el(
      'p',
      { class: 'meal-time' },
      `${menu.meal}, ${formatClock(menu.start)} – ${formatClock(menu.end)}`
    ),
    el(
      'div',
      { class: 'stations' },
      menu.stations.map((station) =>
        stationBlock(station, `${menu.cafe}|${menu.meal}|${station.name}`)
      )
    )
  );
}

async function loadMenus() {
  try {
    const data = await getJson('/api/menus');
    menus = data.menus;
    renderMenus();
  } catch (err) {
    console.error(err);
    document
      .getElementById('menus-list')
      .replaceChildren(el('p', { class: 'muted' }, 'Could not load menus. Try refreshing.'));
  }
}

async function loadLocations() {
  try {
    const data = await getJson('/api/locations');
    locations = data.locations;
    renderLocations();
  } catch (err) {
    console.error(err);
    if (!locations.length) {
      document
        .getElementById('locations')
        .replaceChildren(el('p', { class: 'muted' }, 'Could not load hours. Try refreshing.'));
    }
  }
}

// ---------- events ----------

// Same sections as the Union Daily Digest.
const EVENT_GROUPS = [
  ['signup', 'Sign ups'],
  ['event', 'Events'],
  ['meeting', 'Meetings & practices'],
];

const formatDate = (date) => fmt({ weekday: 'short', month: 'short', day: 'numeric' }).format(date);

function eventRow(event) {
  const start = new Date(event.start);
  const end = event.end ? new Date(event.end) : null;
  const startedEarlier = dayKey(start) < dayKey(new Date());
  let time;
  if (end && (startedEarlier || end - start > 24 * 60 * 60 * 1000)) {
    // Runs over several days, like an application window.
    time = `Until ${formatDate(end)}`;
  } else if (end) {
    time = `${formatTime(start)} – ${formatTime(end)}`;
  } else {
    time = formatTime(start);
  }

  const title = event.link
    ? el('a', { class: 'name', href: event.link, target: '_blank', rel: 'noopener' }, event.title)
    : el('span', { class: 'name' }, event.title);

  return el(
    'li',
    { class: 'event-row' },
    el('div', { class: 'time' }, time),
    el(
      'div',
      {},
      title,
      el('span', { class: 'sub' }, `${event.location} · ${event.organizer}`),
      event.description && el('span', { class: 'sub' }, event.description)
    )
  );
}

// One day: a heading, then each Digest section that has something in it.
function dayBlock(heading, events) {
  const block = el('div', { class: 'day' }, el('h4', { class: 'day-title' }, heading));
  if (!events.length) {
    block.append(el('p', { class: 'muted' }, 'Nothing on the calendar.'));
    return block;
  }
  for (const [category, label] of EVENT_GROUPS) {
    const group = events.filter((event) => event.category === category);
    if (!group.length) continue;
    block.append(el('h5', {}, label), el('ul', { class: 'rows' }, group.map(eventRow)));
  }
  return block;
}

function renderEvents(events) {
  const todayKey = dayKey(new Date());
  const byDay = new Map([[todayKey, []]]);
  for (const event of events) {
    // Events that started before today and are still running go under today.
    const startKey = dayKey(new Date(event.start));
    const key = startKey < todayKey ? todayKey : startKey;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(event);
  }

  const blocks = [];
  for (const [key, dayEvents] of byDay) {
    const heading =
      key === todayKey
        ? `Today, ${formatDay(new Date())}`
        : formatDay(new Date(dayEvents[0].start));
    blocks.push(dayBlock(heading, dayEvents));
  }
  document.getElementById('events-list').replaceChildren(...blocks);
}

async function loadEvents() {
  try {
    const data = await getJson('/api/events');
    renderEvents(data.events);
  } catch (err) {
    console.error(err);
    document
      .getElementById('events-list')
      .replaceChildren(el('p', { class: 'muted' }, 'Could not load events. Try refreshing.'));
  }
}

// ---------- news ----------

async function loadNews() {
  const list = document.getElementById('news-list');
  try {
    const { news } = await getJson('/api/news');
    if (!news.length) {
      list.replaceChildren(el('li', { class: 'muted' }, 'No headlines yet.'));
      return;
    }
    list.replaceChildren(
      ...news.map((item) =>
        el(
          'li',
          { class: 'event-row' },
          el('div', { class: 'time' }, formatShortDate(new Date(item.publishedAt))),
          el(
            'div',
            {},
            el('a', { class: 'name', href: item.link, target: '_blank', rel: 'noopener' }, item.title)
          )
        )
      )
    );
  } catch (err) {
    console.error(err);
    list.replaceChildren(el('li', { class: 'muted' }, 'Could not load news. Try refreshing.'));
  }
}

// ---------- post an event (post.html) ----------

function setUpForm(form) {
  const message = document.getElementById('form-message');
  // Which input to highlight for each field the server can reject.
  const fieldInputs = { start: 'date', end: 'endTime' };

  form.elements.date.value = dayKey(new Date());

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    for (const span of form.querySelectorAll('.field-error')) span.textContent = '';
    for (const input of form.querySelectorAll('.is-invalid')) input.classList.remove('is-invalid');
    message.replaceChildren();
    message.className = 'form-message';

    const values = Object.fromEntries(new FormData(form));
    const button = form.querySelector('.submit');
    button.disabled = true;

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        for (const [field, text] of Object.entries(data.fields || {})) {
          const span = form.querySelector(`[data-error-for="${field}"]`);
          if (span) span.textContent = text;
          const input = form.elements[fieldInputs[field] || field];
          if (input) input.classList.add('is-invalid');
        }
        message.textContent = data.error || 'Could not save the event.';
        message.classList.add('bad');
        return;
      }

      form.reset();
      form.elements.date.value = values.date;
      message.append(
        `Saved "${data.event.title}". `,
        el('a', { href: 'index.html#events' }, 'See it on the dashboard')
      );
      message.classList.add('ok');
    } catch (err) {
      console.error(err);
      message.textContent = 'Could not reach the server. Try again.';
      message.classList.add('bad');
    } finally {
      button.disabled = false;
    }
  });
}

// ---------- start ----------

async function start() {
  renderClock();
  setInterval(renderClock, 15 * 1000);

  const form = document.getElementById('event-form');
  if (form) setUpForm(form);

  // The dashboard page.
  if (document.getElementById('locations')) {
    watchSections();
    loadNews();
    loadMenus();
    loadLocations();
    loadEvents();
    // Keep the open/closed status current without a refresh.
    setInterval(loadLocations, 60 * 1000);
    setInterval(loadMenus, 15 * 60 * 1000);
    setInterval(loadEvents, 5 * 60 * 1000);
  }
}

start();
