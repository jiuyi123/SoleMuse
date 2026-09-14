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

function navigateBack(delta = 1) {
  if (getCurrentPages().length > 1) {
    return wx.navigateBack({ delta });
  }
  return wx.switchTab({ url: '/pages/home/index' });
}

function switchTab(path) {
  return wx.switchTab({ url: path });
}

module.exports = {
  buildUrl,
  navigateBack,
  navigateTo,
  redirectTo,
  switchTab,
};
