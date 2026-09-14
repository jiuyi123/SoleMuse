function buildUrl(path, query = {}) {
  const queryString = Object.keys(query)
    .filter((key) => query[key] !== undefined && query[key] !== null && query[key] !== '')
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
    .join('&');
  return queryString ? `${path}?${queryString}` : path;
}

function navigateTo(path, query) {
  return wx.navigateTo({ url: buildUrl(path, query) });
}

function redirectTo(path, query) {
  return wx.redirectTo({ url: buildUrl(path, query) });
}

module.exports = {
  buildUrl,
  navigateTo,
  redirectTo,
};
