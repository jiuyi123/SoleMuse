const http = require('../core/http/client');

function getMyProfile() {
  return http.request({ path: '/users/me' });
}

function updateMyProfile(payload) {
  return http.request({ path: '/users/me', method: 'PATCH', data: payload });
}

function getAccountInfo() {
  return http.request({ path: '/users/me/account' });
}

function getPublicProfile(userId) {
  return http.request({ path: `/users/${userId}/public-profile` });
}

function toggleFollow(userId, following) {
  return http.request({ path: `/users/${userId}/follow`, method: following ? 'PUT' : 'DELETE' });
}

function listMyArtworks(params = {}) {
  return http.request({ path: '/users/me/artworks', data: params });
}

function listMyFavorites(params = {}) {
  return http.request({ path: '/users/me/favorites', data: params });
}

function listMyLikes(params = {}) {
  return http.request({ path: '/users/me/likes', data: params });
}

function listMyComments(params = {}) {
  return http.request({ path: '/users/me/comments', data: params });
}

function getNotificationPreferences() {
  return http.request({ path: '/users/me/notification-preferences' });
}

function updateNotificationPreferences(payload) {
  return http.request({ path: '/users/me/notification-preferences', method: 'PATCH', data: payload });
}

function getPrivacySettings() {
  return http.request({ path: '/users/me/privacy-settings' });
}

function updatePrivacySettings(payload) {
  return http.request({ path: '/users/me/privacy-settings', method: 'PATCH', data: payload });
}

module.exports = {
  getMyProfile,
  getAccountInfo,
  getPrivacySettings,
  getPublicProfile,
  listMyArtworks,
  listMyComments,
  listMyFavorites,
  listMyLikes,
  toggleFollow,
  updateMyProfile,
  updateNotificationPreferences,
  updatePrivacySettings,
  getNotificationPreferences,
};
