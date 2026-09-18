const ROUTES = require('../../../../constants/routes');
const authService = require('../../../../services/auth-service');
const router = require('../../../../core/navigation/router');

Page({
  data: {
    account: null,
    accountInitial: 'S',
  },

  async onShow() {
    const account = await authService.loadAccountInfo() || authService.getAccountInfo();
    this.setData({
      account,
      accountInitial: account ? account.nickname.slice(0, 1) : 'S',
    });
  },

  openLogin() {
    router.navigateTo(ROUTES.LOGIN, { redirect: ROUTES.SETTINGS });
  },
});
