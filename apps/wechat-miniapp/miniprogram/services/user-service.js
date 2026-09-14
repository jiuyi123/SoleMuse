const http = require('../core/http/client');

function getMyProfile() {
  return http.request({ path: '/users/me' });
}

function updateMyProfile(payload) {
  return http.request({ path: '/users/me', method: 'PATCH', data: payload });
}

module.exports = {
  getMyProfile,
  updateMyProfile,
};
