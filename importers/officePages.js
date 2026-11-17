// The union.edu pages the hours importer reads, and which group each place
// belongs to on the dashboard. Each page has an "Office Hours" box.
//
// To add a place: find its page on union.edu and add a line here. Give it a
// `name` only if the page's own heading isn't a good one.

const OFFICE_PAGES = [
  // Libraries & study
  { path: '/special-collections', category: 'study' },
  { path: '/adirondack-research-library', category: 'study' },
  { path: '/language-center', category: 'study' },

  // Health & wellness
  { path: '/counseling-center', category: 'health' },
  { path: '/health-services', category: 'health' },
  { path: '/student-accessibility-services', category: 'health' },

  // Services
  { path: '/campus-safety', category: 'services' },
  { path: '/central-mail-service', category: 'services' },
  { path: '/central-scheduling', category: 'services' },
  { path: '/copy-center', category: 'services' },
  { path: '/facilities-services', category: 'services' },
  { path: '/information-technology-services', category: 'services' },

  // Offices
  { path: '/becker-career-center', category: 'offices' },
  { path: '/bursar', category: 'offices' },
  { path: '/college-relations', category: 'offices' },
  { path: '/community-standards', category: 'offices' },
  { path: '/dean-students', category: 'offices' },
  { path: '/digital-scholarship', category: 'offices' },
  { path: '/finance', category: 'offices' },
  { path: '/financial-aid-family-financing', category: 'offices' },
  { path: '/fraternity-and-sorority-life', category: 'offices' },
  { path: '/health-professions', category: 'offices' },
  { path: '/human-resources', category: 'offices' },
  { path: '/institutional-research', category: 'offices' },
  { path: '/international-advising', category: 'offices' },
  { path: '/lddi', category: 'offices' },
  { path: '/presidents-office', category: 'offices', name: "President's Office" },
  { path: '/registrar', category: 'offices' },
  { path: '/residential-life', category: 'offices' },
  { path: '/scholars-program', category: 'offices' },
  { path: '/special-events-conferences', category: 'offices' },
  { path: '/student-activities', category: 'offices' },
  { path: '/student-success', category: 'offices' },
  { path: '/ucall', category: 'offices' },
];

// Two places describe their hours in a paragraph instead of an Office Hours
// box, so their term-time hours are typed in here by hand from the page.
const TYPED_IN = [
  {
    name: 'Schaffer Library',
    category: 'study',
    path: '/schaffer-library/library-hours',
    hours: [
      ['Mon-Thu', '8:00 am - 2:00 am'],
      ['Fri', '8:00 am - 12:00 am'],
      ['Sat', '10:00 am - 12:00 am'],
      ['Sun', '10:00 am - 2:00 am'],
    ],
  },
  {
    name: 'Writing Center',
    category: 'study',
    path: '/writing-programs/writing-center/hours-location',
    hours: [['Sun-Thu', '3:00 pm - 11:00 pm']],
  },
];

module.exports = { OFFICE_PAGES, TYPED_IN };
