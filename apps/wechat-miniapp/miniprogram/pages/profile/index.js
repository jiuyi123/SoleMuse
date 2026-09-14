const ROUTES = require('../../constants/routes');
const session = require('../../core/auth/session');
const router = require('../../core/navigation/router');
const demoContentService = require('../../services/demo-content-service');
const syncTabBar = require('../../utils/sync-tab-bar');

Page({
  data: { isAuthenticated: false, profile: null, contentTypes: ['artworks', 'favorites', 'likes', 'comments'] },
  async onShow() {
    syncTabBar(this, 4);
    const isAuthenticated = session.isAuthenticated();
    this.setData({ isAuthenticated });
    if (isAuthenticated && !this.data.profile) this.setData({ profile: await demoContentService.getProfile() });
  },
  openLogin() { router.navigateTo(ROUTES.LOGIN, { redirect: ROUTES.PROFILE }); },
  editProfile() { router.navigateTo(ROUTES.PROFILE_EDIT); },
  openContent(event) {
    const type = event.currentTarget.dataset.type;
    if (!session.isAuthenticated()) {
      router.navigateTo(ROUTES.LOGIN, { redirect: ROUTES.CONTENT_LIST, redirectType: type });
      return;
    }
    router.navigateTo(ROUTES.CONTENT_LIST, { type });
  },
});
