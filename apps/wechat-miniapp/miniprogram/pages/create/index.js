const ROUTES = require('../../constants/routes');
const session = require('../../core/auth/session');
const router = require('../../core/navigation/router');

Page({
  startCreating() {
    if (!session.isAuthenticated()) {
      router.navigateTo(ROUTES.LOGIN, { redirect: ROUTES.ARTWORK_EDITOR });
      return;
    }
    router.navigateTo(ROUTES.ARTWORK_EDITOR);
  },
});
