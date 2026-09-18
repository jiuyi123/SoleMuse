const ROUTES = require('../../../../constants/routes');
const router = require('../../../../core/navigation/router');
const searchHistoryStorage = require('../../../../core/storage/search-history');
const demoContent = require('../../../../services/demo-content-service');

Page({
  data: {
    artworks: [],
    filters: ['分类', '风格标签', 'AI生成源', '发布时间'],
    hasSearched: false,
    hotKeywords: [],
    keyword: '',
    loading: false,
    searchHistory: [],
    sort: 'latest',
  },

  async onLoad(options) {
    const discovery = await demoContent.getSearchDiscovery();
    const keyword = (options.tag || '').trim();

    this.setData({
      hotKeywords: discovery.hotKeywords,
      keyword,
      searchHistory: searchHistoryStorage.getSearchHistory(discovery.defaultHistory),
    });

    if (keyword) this.runSearch(false);
  },

  handleInput(event) {
    const keyword = event.detail.value;
    this.setData({ keyword });

    if (!keyword.trim() && this.data.hasSearched) {
      this.setData({ artworks: [], hasSearched: false, loading: false });
    }
  },

  submitSearch() {
    this.runSearch(true);
  },

  selectKeyword(event) {
    const keyword = event.currentTarget.dataset.keyword;
    this.setData({ keyword }, () => this.runSearch(true));
  },

  clearKeyword() {
    this.setData({ artworks: [], hasSearched: false, keyword: '', loading: false });
  },

  clearHistory() {
    searchHistoryStorage.clearSearchHistory();
    this.setData({ searchHistory: [] });
  },

  async runSearch(recordHistory) {
    const keyword = this.data.keyword.trim();
    if (!keyword) {
      wx.showToast({ title: '请输入搜索内容', icon: 'none' });
      return;
    }

    if (recordHistory) {
      this.setData({
        searchHistory: searchHistoryStorage.addSearchHistory(keyword, this.data.searchHistory),
      });
    }

    this.setData({ artworks: [], hasSearched: true, loading: true, sort: 'latest' });

    try {
      const artworks = await demoContent.searchArtworks({ keyword, sort: 'latest' });
      const matches = artworks
        .filter((artwork) => !artwork.id || `${artwork.title}${artwork.author.nickname}${artwork.tags.join('')}`.includes(keyword))
        .sort((left, right) => right.publishedAtDisplay.localeCompare(left.publishedAtDisplay));
      this.setData({ artworks: matches, loading: false });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({ title: '搜索失败，请稍后重试', icon: 'none' });
    }
  },

  openArtwork(event) {
    router.navigateTo(ROUTES.ARTWORK_DETAIL, { id: event.detail.artworkId });
  },

  changeSort(event) {
    const sort = event.currentTarget.dataset.sort;
    const artworks = this.data.artworks.slice();

    if (sort === 'hottest') {
      artworks.sort((left, right) => right.metrics.likes - left.metrics.likes);
    } else {
      artworks.sort((left, right) => right.publishedAtDisplay.localeCompare(left.publishedAtDisplay));
    }

    this.setData({ artworks, sort });
  },

  showFilter(event) {
    wx.showToast({ title: `${event.currentTarget.dataset.filter}筛选待接入`, icon: 'none' });
  },
});
