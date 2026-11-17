// Small helpers the importers share for fetching web pages politely.

// Tells the sites who is asking.
const USER_AGENT = 'GarnetBoard/1.0 (Union College student project)';

// Downloads a page and returns its HTML as text.
async function getPage(url) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) {
    throw new Error(`${url} answered ${response.status}`);
  }
  return response.text();
}

// Downloads a JSON feed and returns the parsed data.
async function getJson(url) {
  return JSON.parse(await getPage(url));
}

// Pauses between requests so we never hammer a site.
function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

module.exports = { getPage, getJson, wait };
