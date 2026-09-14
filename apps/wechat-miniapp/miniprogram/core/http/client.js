const { getEnvironment } = require('../../config/environment');
const session = require('../auth/session');
const AppError = require('../errors/app-error');

const DEFAULT_TIMEOUT = 15000;

function request(options) {
  const environment = getEnvironment();
  const apiBaseUrl = environment.apiBaseUrl;

  if (!apiBaseUrl) {
    return Promise.reject(
      new AppError('API_BASE_URL_NOT_CONFIGURED', '接口服务尚未配置', { retryable: false }),
    );
  }

  const accessToken = session.getAccessToken();
  const header = Object.assign(
    { 'content-type': 'application/json' },
    accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    options.header || {},
  );

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${apiBaseUrl}${options.path}`,
      method: options.method || 'GET',
      data: options.data,
      header,
      timeout: options.timeout || DEFAULT_TIMEOUT,
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          const payload = response.data || {};
          resolve(Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload);
          return;
        }

        if (response.statusCode === 401) {
          session.clearSession();
        }
        reject(AppError.fromResponse(response.statusCode, response.data));
      },
      fail(error) {
        reject(
          new AppError('NETWORK_ERROR', '网络连接失败，请检查网络后重试', {
            details: error,
            retryable: true,
          }),
        );
      },
    });
  });
}

module.exports = {
  request,
};
