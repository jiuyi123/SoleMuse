const sessionStore = require('./state/session-store');
const { getEnvironment } = require('./config/environment');

App({
  globalData: {
    session: null,
  },

  onLaunch() {
    this.globalData.session = sessionStore.hydrate();
    if (!this.globalData.session && getEnvironment().enableDemoSession) {
      this.globalData.session = { mode: 'local', userId: 'prototype-user-lintong' };
      sessionStore.setSnapshot(this.globalData.session);
    }
  },
});
