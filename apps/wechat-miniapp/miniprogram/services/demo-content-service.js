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

function resolvePublicProfile(userId) {
  const explicitProfile = content.publicProfiles.find((item) => item.id === userId);
  if (explicitProfile) return clone(explicitProfile);

  const allArtworks = [content.featuredArtwork].concat(content.artworks);
  const authoredArtworks = allArtworks.filter((item) => item.author && item.author.id === userId);
  const directMessage = content.messages.find((item) => item.userId === userId);
  const authoredComment = content.comments.find((item) => item.authorId === userId);
  const sourceArtwork = authoredArtworks[0];
  if (!sourceArtwork && !directMessage && !authoredComment) return null;

  return {
    id: userId,
    nickname: sourceArtwork ? sourceArtwork.author.nickname : (directMessage ? directMessage.title : authoredComment.author),
    avatarUrl: (sourceArtwork && (sourceArtwork.author.avatarUrl || sourceArtwork.coverUrl)) || (directMessage && directMessage.avatarUrl) || '',
    region: '浙江 · 温州',
    role: '鞋履创意设计师',
    bio: '持续记录鞋履结构、材料与审美之间的灵感连接。',
    specialties: ['鞋履设计', 'AI 创意', '灵感实验'],
    stats: [
      { label: '关注', value: '86' },
      { label: '粉丝', value: '1.6k' },
      { label: '获赞与收藏', value: '5.2k' },
    ],
    isFollowing: false,
    conversationId: directMessage ? directMessage.id : `public-chat-${userId}`,
    artworkIds: authoredArtworks.length ? authoredArtworks.map((item) => item.id) : (directMessage && directMessage.artworkIds) || [],
  };
}

function getConversation(id) {
  const conversation = content.conversations.find((item) => item.id === id);
  if (!conversation && id.startsWith('public-chat-')) {
    const userId = id.slice('public-chat-'.length);
    const profile = resolvePublicProfile(userId);
    if (!profile) return Promise.resolve(null);
    return Promise.resolve({
      id,
      participant: { userId, name: profile.nickname, status: '在线', avatarUrl: profile.avatarUrl },
      currentUser: { avatarUrl: content.profile.avatarUrl },
      messages: [],
    });
  }
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

function getPublicProfile(userId) {
  const profile = resolvePublicProfile(userId);
  if (!profile) return Promise.resolve(null);
  const allArtworks = [content.featuredArtwork].concat(content.artworks);
  const artworkIds = new Set(profile.artworkIds);
  const artworks = allArtworks
    .filter((item) => artworkIds.has(item.id))
    .map((item) => ({
      ...item,
      author: { id: profile.id, nickname: profile.nickname, avatarUrl: profile.avatarUrl },
    }));
  return Promise.resolve({ profile: clone(profile), artworks: clone(artworks) });
}

function setPublicProfileFollowing(userId, following) {
  return Promise.resolve({ userId, following: Boolean(following) });
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
  getPublicProfile,
  getRanking,
  getSearchDiscovery,
  searchArtworks,
  sendConversationMessage,
  setPublicProfileFollowing,
};
