const ENVIRONMENTS = Object.freeze({
  // 微信开发者工具可直接访问本机；真机联调时替换为电脑局域网 IP。
  develop: Object.freeze({ apiBaseUrl: 'http://127.0.0.1:3000/api/v1', enableDebugLog: true, enableDemoSession: false, useDemoData: false }),
  trial: Object.freeze({ apiBaseUrl: '', enableDebugLog: false, enableDemoSession: true, useDemoData: true }),
  release: Object.freeze({ apiBaseUrl: '', enableDebugLog: false, enableDemoSession: false, useDemoData: false }),
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
