const SEARCH_HISTORY_KEY = 'solemuse.search-history';
const MAX_HISTORY_ITEMS = 8;

function normalizeHistory(items) {
  if (!Array.isArray(items)) return [];
  return [...new Set(items.map((item) => `${item}`.trim()).filter(Boolean))].slice(0, MAX_HISTORY_ITEMS);
}

function getSearchHistory(fallback = []) {
  const stored = wx.getStorageSync(SEARCH_HISTORY_KEY);
  return Array.isArray(stored) ? normalizeHistory(stored) : normalizeHistory(fallback);
}

function addSearchHistory(keyword, currentHistory = []) {
  const history = normalizeHistory([keyword, ...currentHistory]);
  wx.setStorageSync(SEARCH_HISTORY_KEY, history);
  return history;
}

function clearSearchHistory() {
  wx.setStorageSync(SEARCH_HISTORY_KEY, []);
}

module.exports = {
  addSearchHistory,
  clearSearchHistory,
  getSearchHistory,
};
