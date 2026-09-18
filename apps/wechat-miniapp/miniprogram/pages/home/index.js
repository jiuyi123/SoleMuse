const ROUTES = require('../../constants/routes');
const router = require('../../core/navigation/router');
const demoContent = require('../../services/demo-content-service');
const syncTabBar = require('../../utils/sync-tab-bar');
const getNavigationLayout = require('../../utils/navigation-layout');

Page({
  data: {
    allArtworks: [],
    artworks: [],
    hotTags: [],
    activeFeed: 'discover',
    topbarHeight: 92,
    fixedHeaderHeight: 132,
    loading: true,
  },

  onLoad() {
    const { menuBottom } = getNavigationLayout();
    const topbarHeight = menuBottom + 12;
    this.setData({ topbarHeight, fixedHeaderHeight: topbarHeight + 40 });
    this.loadContent();
  },

  onShow() {
    syncTabBar(this, 0);
  },

  async loadContent() {
    this.setData({ loading: true });
    const content = await demoContent.getHomeContent();
    this.setData({
      allArtworks: content.artworks,
      artworks: content.artworks,
      hotTags: content.tags,
      loading: false,
    });
  },

  openSearch() {
    router.navigateTo(ROUTES.ARTWORK_SEARCH);
  },

  searchByTag(event) {
    router.navigateTo(ROUTES.ARTWORK_SEARCH, { tag: event.currentTarget.dataset.tag });
  },

  openArtwork(event) {
    router.navigateTo(ROUTES.ARTWORK_DETAIL, { id: event.detail.artworkId });
  },

  async changeFeed(event) {
    const activeFeed = event.currentTarget.dataset.feed;
    if (activeFeed && activeFeed !== 'discover') {
      try {
        const content = await demoContent.getHomeContent(activeFeed);
        this.setData({ activeFeed, artworks: content.artworks });
        return;
      } catch (error) {
        wx.showToast({ title: '内容加载失败，请重试', icon: 'none' });
      }
    }
    let artworks = this.data.allArtworks.slice();
    if (activeFeed === 'following') artworks = artworks.slice(0, 4);
    if (activeFeed === 'latest') artworks.reverse();
    this.setData({ activeFeed, artworks });
  },
});
