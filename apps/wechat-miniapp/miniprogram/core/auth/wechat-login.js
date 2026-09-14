function getWechatLoginCode() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(result) {
        if (result.code) {
          resolve(result.code);
          return;
        }
        reject(new Error('微信登录未返回有效 code'));
      },
      fail: reject,
    });
  });
}

module.exports = {
  getWechatLoginCode,
};
