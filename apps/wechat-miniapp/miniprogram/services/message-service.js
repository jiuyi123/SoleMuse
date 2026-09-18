const http = require('../core/http/client');

function listMessages(params = {}) {
  return http.request({ path: '/messages', data: params });
}

function listNotificationChannels() {
  return http.request({ path: '/notifications/channels' });
}

function listNotifications(params = {}) {
  return http.request({ path: '/notifications', data: params });
}

function markNotificationsRead(payload) {
  return http.request({ path: '/notifications/read', method: 'POST', data: payload });
}

function listConversations(params = {}) {
  return http.request({ path: '/conversations', data: params });
}

function getConversationMessages(conversationId, params = {}) {
  return http.request({ path: `/conversations/${conversationId}/messages`, data: params });
}

function createDirectConversation(participantId) {
  return http.request({ path: '/conversations/direct', method: 'POST', data: { participantId } });
}

function sendConversationMessage(conversationId, content, clientMessageId = '') {
  return http.request({
    path: `/conversations/${conversationId}/messages`,
    method: 'POST',
    data: { clientMessageId: clientMessageId || `miniapp-${Date.now()}`, type: 'text', content },
  });
}

function markConversationRead(conversationId, lastReadMessageId) {
  return http.request({ path: `/conversations/${conversationId}/read`, method: 'POST', data: { lastReadMessageId } });
}

module.exports = {
  createDirectConversation,
  getConversationMessages,
  listConversations,
  listMessages,
  listNotificationChannels,
  listNotifications,
  markConversationRead,
  markNotificationsRead,
  sendConversationMessage,
};
