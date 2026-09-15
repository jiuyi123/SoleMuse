const content = require('../data/prototype-content');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getHomeContent() {
  return Promise.resolve({
    tags: ['未来科技', '颐绣灵感', '运动潮流', '可持续', 'AI设计'],
    artworks: clone(content.artworks),
  });
}

function searchArtworks() {
  return Promise.resolve(clone(content.artworks));
}

function getSearchDiscovery() {
  return Promise.resolve(clone(content.searchDiscovery));
}

function getArtwork() {
  return Promise.resolve({
    artwork: clone(content.featuredArtwork),
    comments: clone(content.comments),
  });
}

function getRanking() {
  return Promise.resolve(clone(content.ranking));
}

function getMessages() {
  return Promise.resolve(clone(content.messages));
}

function getMessageChannels() {
  return Promise.resolve(clone(content.messageChannels));
}

function getMessagesByCategory(filter) {
  const messages = content.messages.filter((item) => {
    if (filter === 'reaction') return item.type === 'like' || item.type === 'favorite';
    if (filter === 'follow') return item.type === 'follow';
    if (filter === 'comment') return item.type === 'comment';
    return false;
  });
  return Promise.resolve(clone(messages));
}

function getConversation(id) {
  const conversation = content.conversations.find((item) => item.id === id);
  if (!conversation) return Promise.resolve(null);
  return Promise.resolve({
    ...clone(conversation),
    currentUser: { avatarUrl: content.profile.avatarUrl },
  });
}

function sendConversationMessage(conversationId, messageContent) {
  return Promise.resolve({
    id: `chat-local-${Date.now()}`,
    conversationId,
    sender: 'self',
    type: 'text',
    content: messageContent,
    time: '刚刚',
  });
}

function getProfile() {
  return Promise.resolve(clone(content.profile));
}

function getMyContent() {
  return Promise.resolve(clone(content.artworks));
}

function getMyComments() {
  return Promise.resolve(clone(content.myComments));
}

module.exports = {
  getArtwork,
  getConversation,
  getHomeContent,
  getMessages,
  getMessagesByCategory,
  getMessageChannels,
  getMyComments,
  getMyContent,
  getProfile,
  getRanking,
  getSearchDiscovery,
  searchArtworks,
  sendConversationMessage,
};
