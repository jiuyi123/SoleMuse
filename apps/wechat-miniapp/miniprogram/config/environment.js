const ENVIRONMENTS = Object.freeze({
  develop: Object.freeze({ apiBaseUrl: '', enableDebugLog: true, enableDemoSession: true }),
  trial: Object.freeze({ apiBaseUrl: '', enableDebugLog: false, enableDemoSession: false }),
  release: Object.freeze({ apiBaseUrl: '', enableDebugLog: false, enableDemoSession: false }),
});

function getEnvironmentVersion() {
  if (typeof wx === 'undefined' || typeof wx.getAccountInfoSync !== 'function') {
    return 'develop';
  }

  const accountInfo = wx.getAccountInfoSync();
  return accountInfo.miniProgram.envVersion || 'develop';
}

function getEnvironment() {
  return ENVIRONMENTS[getEnvironmentVersion()] || ENVIRONMENTS.develop;
}

module.exports = {
  getEnvironment,
};
