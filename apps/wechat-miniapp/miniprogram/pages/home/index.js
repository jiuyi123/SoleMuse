const ROUTES = require('../../constants/routes');
const router = require('../../core/navigation/router');

Page({
  data: {
    artworks: [],
    hotTags: ['运动鞋', '未来感', '可持续', '复古'],
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
});
