const sessionStore = require('./state/session-store');

App({
  globalData: {
    session: null,
  },

  onLaunch() {
    this.globalData.session = sessionStore.hydrate();
  },
});
