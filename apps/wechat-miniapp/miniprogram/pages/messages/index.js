const ROUTES = require('../../constants/routes');
const session = require('../../core/auth/session');
const router = require('../../core/navigation/router');

Page({
  data: { isAuthenticated: false, messages: [] },

  onShow() {
    this.setData({ isAuthenticated: session.isAuthenticated() });
  },

  openLogin() {
    router.navigateTo(ROUTES.LOGIN, { redirect: ROUTES.MESSAGES });
  },

  openNotice(event) {
    router.navigateTo(ROUTES.NOTICE_DETAIL, { id: event.currentTarget.dataset.id });
  },
});
