const STORAGE_KEYS = require('../../constants/storage-keys');
const { getEnvironment } = require('../../config/environment');

function getSession() {
  return wx.getStorageSync(STORAGE_KEYS.SESSION) || null;
}

function setSession(session) {
  wx.setStorageSync(STORAGE_KEYS.SESSION, session);
  return session;
}

function clearSession() {
  wx.removeStorageSync(STORAGE_KEYS.SESSION);
}

function getAccessToken() {
  const session = getSession();
  return session && session.accessToken ? session.accessToken : '';
}

function isAuthenticated() {
  const currentSession = getSession();
  return Boolean(
    currentSession && (
      currentSession.accessToken
      || (currentSession.mode === 'local' && getEnvironment().enableDemoSession)
    ),
  );
}

module.exports = {
  clearSession,
  getAccessToken,
  getSession,
  isAuthenticated,
  setSession,
};
