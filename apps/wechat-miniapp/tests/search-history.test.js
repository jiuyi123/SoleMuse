const test = require('node:test');
const assert = require('node:assert/strict');

const storage = new Map();

global.wx = {
  getStorageSync(key) {
    return storage.has(key) ? storage.get(key) : '';
  },
  setStorageSync(key, value) {
    storage.set(key, value);
  },
};

const searchHistory = require('../miniprogram/core/storage/search-history');

test.beforeEach(() => storage.clear());

test('uses demo history until the user has stored a history value', () => {
  assert.deepEqual(searchHistory.getSearchHistory(['东方美学', '未来科技']), ['东方美学', '未来科技']);
});

test('adds recent unique keywords and keeps at most eight items', () => {
  const current = ['东方美学', '运动潮流', '国风鞋履', '可持续设计', 'AI 鞋履', '运动鞋', '休闲鞋', '科技风'];
  const result = searchHistory.addSearchHistory('运动潮流', current);
  assert.equal(result.length, 8);
  assert.equal(result[0], '运动潮流');
  assert.equal(result.filter((item) => item === '运动潮流').length, 1);
});

test('keeps history empty after the user clears it', () => {
  searchHistory.clearSearchHistory();
  assert.deepEqual(searchHistory.getSearchHistory(['默认记录']), []);
});
