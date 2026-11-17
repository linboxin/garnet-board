// Imports the latest news stories from union.edu.
//
// The page lists each story like this:
//
//   <article class="node--type-news">
//     <time datetime="2026-11-10T12:00:00Z">November 10, 2026</time>
//     <h2 class="teaser__title"><a href="/news/stories/…">Headline</a></h2>
//   </article>

const cheerio = require('cheerio');
const News = require('../models/News');
const { getPage } = require('./fetch');

const SITE = 'https://www.union.edu';

async function importNews() {
  const html = await getPage(`${SITE}/news/stories/all`);
  const $ = cheerio.load(html);

  const stories = [];
  $('article.node--type-news').each((index, article) => {
    const headline = $(article).find('.teaser__title a');
    stories.push({
      title: headline.text().trim(),
      link: SITE + headline.attr('href'),
      publishedAt: new Date($(article).find('time').attr('datetime')),
    });
  });

  // Save each story. "upsert" updates the story if its link is already in
  // the database and adds it if not, so nothing is ever saved twice.
  for (const story of stories) {
    await News.updateOne({ link: story.link }, story, { upsert: true });
  }

  return `${stories.length} stories`;
}

module.exports = importNews;
