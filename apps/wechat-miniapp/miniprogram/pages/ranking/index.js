const ROUTES = require('../../constants/routes');
const router = require('../../core/navigation/router');

Page({
  data: { artworks: [] },

  openArtwork(event) {
    router.navigateTo(ROUTES.ARTWORK_DETAIL, { id: event.detail.artworkId });
  },
});
