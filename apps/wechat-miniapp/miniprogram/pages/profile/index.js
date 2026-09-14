const ROUTES = require('../../constants/routes');
const session = require('../../core/auth/session');
const router = require('../../core/navigation/router');

Page({
  data: { isAuthenticated: false },

  onShow() {
    this.setData({ isAuthenticated: session.isAuthenticated() });
  },

  openLogin() {
    router.navigateTo(ROUTES.LOGIN, { redirect: ROUTES.PROFILE });
  },

  editProfile() {
    router.navigateTo(ROUTES.PROFILE_EDIT);
  },

  openContent(event) {
    const type = event.currentTarget.dataset.type;
    if (!session.isAuthenticated()) {
      router.navigateTo(ROUTES.LOGIN, {
        redirect: ROUTES.CONTENT_LIST,
        redirectType: type,
      });
      return;
    }
    router.navigateTo(ROUTES.CONTENT_LIST, { type });
  },
});
