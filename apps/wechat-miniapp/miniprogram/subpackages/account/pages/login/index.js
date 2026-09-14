const ROUTES = require('../../../../constants/routes');
const router = require('../../../../core/navigation/router');
const sessionStore = require('../../../../state/session-store');

Page({
  data: {
    redirect: '',
    redirectType: '',
    submitting: false,
  },

  onLoad(options) {
    this.setData({
      redirect: options.redirect || '',
      redirectType: options.redirectType || '',
    });
  },

  async handleLogin() {
    if (this.data.submitting) return;
    this.setData({ submitting: true });

    // 骨架阶段使用本地演示会话；接入后端时改为微信 code 换取服务端会话。
    sessionStore.setSnapshot({ mode: 'local', userId: 'local-user' });
    wx.showToast({ title: '已进入本地演示状态', icon: 'none' });

    const redirect = this.data.redirect;
    if (redirect && Object.values(ROUTES).indexOf(redirect) >= 0) {
      const tabRoutes = [ROUTES.HOME, ROUTES.RANKING, ROUTES.CREATE, ROUTES.MESSAGES, ROUTES.PROFILE];
      if (tabRoutes.indexOf(redirect) >= 0) {
        wx.switchTab({ url: redirect });
      } else {
        router.redirectTo(redirect, { type: this.data.redirectType });
      }
      return;
    }
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: ROUTES.HOME });
    }
  },
});
