const { getEnvironment } = require('../config/environment');
const session = require('../core/auth/session');
const { getWechatLoginCode } = require('../core/auth/wechat-login');
const http = require('../core/http/client');
const sessionStore = require('../state/session-store');
const { isApiEnabled } = require('./api-mode');
const userService = require('./user-service');

const DEMO_ACCOUNT = Object.freeze({
  id: 'prototype-user-lintong',
  accountId: 'SM-000001',
  nickname: '林桐漫步',
  avatarUrl: '/assets/images/demo/profile/avatar-lintong-manbu.png',
});

function createDemoSession(loginMethod, phoneNumber = '') {
  return {
    mode: 'local',
    userId: DEMO_ACCOUNT.id,
    accountId: DEMO_ACCOUNT.accountId,
    nickname: DEMO_ACCOUNT.nickname,
    avatarUrl: DEMO_ACCOUNT.avatarUrl,
    loginMethod,
    phoneNumber,
    wechatBound: true,
  };
}

function saveApiSession(payload, loginMethod) {
  const apiSession = payload.session || payload;
  const user = apiSession.user || {};
  sessionStore.setSnapshot({
    mode: 'api',
    accessToken: apiSession.accessToken,
    refreshToken: apiSession.refreshToken,
    expiresIn: apiSession.expiresIn,
    userId: user.id,
    accountId: user.accountId,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    loginMethod: user.loginMethod || loginMethod,
    phoneNumber: user.phoneDisplay || '',
    wechatBound: user.wechatBound !== false,
  });
  return getAccountInfo();
}

function ensureDemoSession() {
  if (getEnvironment().enableDemoSession) return;
  throw new Error('登录服务暂未配置，请稍后重试');
}

function getAccountInfo() {
  const currentSession = session.getSession();
  if (!currentSession) return null;
  const loginMethod = currentSession.loginMethod === 'phone' ? 'phone' : 'wechat';
  return {
    id: currentSession.userId || DEMO_ACCOUNT.id,
    accountId: currentSession.accountId || DEMO_ACCOUNT.accountId,
    nickname: currentSession.nickname || DEMO_ACCOUNT.nickname,
    avatarUrl: currentSession.avatarUrl || DEMO_ACCOUNT.avatarUrl,
    loginMethod,
    loginMethodLabel: loginMethod === 'phone' ? '手机号登录' : '微信一键登录',
    phoneDisplay: currentSession.phoneNumber || '未绑定手机号',
    wechatDisplay: currentSession.wechatBound === false ? '未绑定微信' : '已绑定',
    isDemo: currentSession.mode === 'local',
  };
}

async function loadAccountInfo() {
  if (!isApiEnabled()) return getAccountInfo();
  const account = await userService.getAccountInfo();
  return {
    ...account,
    loginMethod: session.getSession()?.loginMethod || 'wechat',
    loginMethodLabel: session.getSession()?.loginMethod === 'phone' ? '手机号登录' : '微信一键登录',
    phoneDisplay: account.phoneDisplay || '未绑定手机号',
    wechatDisplay: account.wechatBound === false ? '未绑定微信' : '已绑定',
    isDemo: false,
  };
}

async function loginWithWechat() {
  let code;
  try {
    code = await getWechatLoginCode();
  } catch (error) {
    throw new Error('微信登录失败，请重试');
  }
  if (isApiEnabled()) return saveApiSession(await http.request({ path: '/auth/wechat/login', method: 'POST', data: { code } }), 'wechat');
  ensureDemoSession();
  sessionStore.setSnapshot(createDemoSession('wechat'));
  return getAccountInfo();
}

async function loginWithPhone(detail = {}) {
  if (detail.errMsg && detail.errMsg.indexOf('deny') >= 0) throw new Error('你已取消手机号授权');
  if (!detail.code) throw new Error('暂未获取到手机号，请重试');
  if (isApiEnabled()) return saveApiSession(await http.request({ path: '/auth/phone/login', method: 'POST', data: { code: detail.code } }), 'phone');
  ensureDemoSession();
  sessionStore.setSnapshot(createDemoSession('phone', '138****8821'));
  return getAccountInfo();
}

async function logout() {
  if (isApiEnabled() && session.isAuthenticated()) {
    try { await http.request({ path: '/auth/logout', method: 'POST' }); } catch (error) { /* 本地清理优先 */ }
  }
  sessionStore.setSnapshot(null);
}

async function refreshSession() {
  const currentSession = session.getSession();
  if (!isApiEnabled() || !currentSession?.refreshToken) return getAccountInfo();
  return saveApiSession(await http.request({ path: '/auth/refresh', method: 'POST', data: { refreshToken: currentSession.refreshToken } }), currentSession.loginMethod || 'wechat');
}

module.exports = {
  getAccountInfo,
  loadAccountInfo,
  loginWithPhone,
  loginWithWechat,
  logout,
  refreshSession,
};
