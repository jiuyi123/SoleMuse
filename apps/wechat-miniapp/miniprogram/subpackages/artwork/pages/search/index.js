const ROUTES = require('../../../../constants/routes');
const router = require('../../../../core/navigation/router');

Page({
  data: {
    keyword: '',
    selectedTag: '',
    artworks: [],
  },

  onLoad(options) {
    this.setData({ selectedTag: options.tag || '' });
  },

  handleKeywordInput(event) {
    this.setData({ keyword: event.detail.value });
  },

  submitSearch() {
    wx.showToast({ title: '搜索接口待接入', icon: 'none' });
  },

  clearSearch() {
    this.setData({ keyword: '', selectedTag: '', artworks: [] });
  },

  openArtwork(event) {
    router.navigateTo(ROUTES.ARTWORK_DETAIL, { id: event.detail.artworkId });
  },
});
