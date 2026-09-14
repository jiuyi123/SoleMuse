const http = require('../core/http/client');

function listMessages(params = {}) {
  return http.request({ path: '/messages', data: params });
}

module.exports = {
  listMessages,
};
