const ENVIRONMENTS = Object.freeze({
  develop: Object.freeze({ apiBaseUrl: '', enableDebugLog: true }),
  trial: Object.freeze({ apiBaseUrl: '', enableDebugLog: false }),
  release: Object.freeze({ apiBaseUrl: '', enableDebugLog: false }),
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
