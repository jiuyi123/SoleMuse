const ROUTES = require('../../../../constants/routes');
const router = require('../../../../core/navigation/router');
const authService = require('../../../../services/auth-service');

Page({
  data: {
    redirect: '',
    redirectType: '',
    redirectId: '',
    submitting: false,
    loginError: '',
  },

  onLoad(options) {
    this.setData({
      redirect: options.redirect || '',
      redirectType: options.redirectType || '',
      redirectId: options.redirectId || '',
    });
  },

  async handleWechatLogin() {
    if (this.data.submitting) return;
    this.setData({ submitting: true, loginError: '' });

    try {
      await authService.loginWithWechat();
      this.finishLogin('微信登录成功');
    } catch (error) {
      this.setData({ submitting: false, loginError: error.message || '登录失败，请重试' });
    }
  },

  async handlePhoneLogin(event) {
    if (this.data.submitting) return;
    this.setData({ submitting: true, loginError: '' });

    try {
      await authService.loginWithPhone(event.detail || {});
      this.finishLogin('手机号登录成功');
    } catch (error) {
      this.setData({ submitting: false, loginError: error.message || '手机号登录失败，请重试' });
    }
  },

  finishLogin(message) {
    wx.showToast({ title: message, icon: 'none' });

    const redirect = this.data.redirect;
    if (redirect && Object.values(ROUTES).indexOf(redirect) >= 0) {
      const tabRoutes = [ROUTES.HOME, ROUTES.RANKING, ROUTES.CREATE, ROUTES.MESSAGES, ROUTES.PROFILE];
      if (tabRoutes.indexOf(redirect) >= 0) {
        router.switchTab(redirect);
      } else {
        router.redirectTo(redirect, { type: this.data.redirectType, id: this.data.redirectId });
      }
      return;
    }
    if (getCurrentPages().length > 1) {
      router.navigateBack();
    } else {
      router.switchTab(ROUTES.HOME);
    }
  },
});
