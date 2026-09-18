const content = require('../data/prototype-content');
const { isApiEnabled } = require('./api-mode');
const artworkService = require('./artwork-service');
const messageService = require('./message-service');
const userService = require('./user-service');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function displayTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function mapComment(item) {
  const author = item.author || {};
  return {
    id: item.id,
    artworkId: item.artworkId,
    authorId: author.id || item.authorId || '',
    author: author.nickname || item.author || '匿名用户',
    initial: (author.nickname || item.author || '匿').slice(0, 1),
    time: item.time || displayTime(item.createdAt),
    content: item.content || '',
    likes: Number(item.likeCount || item.likes || 0),
  };
}

function mapProfile(profile) {
  if (!profile) return null;
  const stats = Array.isArray(profile.stats)
    ? profile.stats
    : [
      { label: '作品', value: profile.stats?.works || 0 },
      { label: '获赞', value: profile.stats?.likes || 0 },
      { label: '粉丝', value: profile.stats?.followers || 0 },
    ];
  return Object.assign({}, profile, { stats });
}

function mapArtwork(dto) {
  const artwork = dto && dto.id ? require('../models/artwork').mapArtwork(dto) : dto;
  if (!artwork) return artwork;
  return Object.assign({}, artwork, {
    publishedAtDisplay: artwork.publishedAtDisplay || displayTime(artwork.publishedAt),
    workType: artwork.workType || (artwork.aiSource?.type === 'non_ai' ? '非 AI 生成' : 'AI 生成'),
  });
}

async function getHomeContent(feed = 'discover') {
  if (isApiEnabled()) {
    const result = await require('../core/http/client').request({ path: '/feeds/home', data: { feed } });
    return { tags: (result.hotTags || []).map((item) => item.name || item), artworks: (result.items || []).map(mapArtwork) };
  }
  return { tags: ['未来科技', '东方灵感', '运动潮流', '可持续', 'AI设计'], artworks: clone(content.artworks) };
}

async function searchArtworks(params = {}) {
  if (isApiEnabled()) return (await artworkService.listArtworks(params)).items.map(mapArtwork);
  return clone(content.artworks);
}

async function getSearchDiscovery() {
  if (isApiEnabled()) return require('../core/http/client').request({ path: '/search/discovery' });
  return clone(content.searchDiscovery);
}

async function getArtwork(artworkId = 'prototype-cloud-walker') {
  if (isApiEnabled()) {
    const [artwork, comments] = await Promise.all([
      artworkService.getArtwork(artworkId),
      artworkService.listComments(artworkId),
    ]);
    return { artwork: mapArtwork(artwork), comments: (comments.items || []).map(mapComment) };
  }
  return { artwork: clone(content.featuredArtwork), comments: clone(content.comments) };
}

async function getRanking(params = {}) {
  if (isApiEnabled()) {
    const result = await require('../core/http/client').request({ path: '/rankings', data: params });
    return (result.items || []).map((item) => Object.assign({}, item, { author: item.author?.nickname || item.author || '' }));
  }
  return clone(content.ranking);
}

async function getMessages() {
  if (isApiEnabled()) {
    const [notifications, conversations] = await Promise.all([
      messageService.listNotifications(),
      messageService.listConversations(),
    ]);
    const directMessages = (conversations.items || []).map((conversation) => ({
      id: conversation.id,
      type: 'direct',
      userId: conversation.participant?.userId,
      title: conversation.participant?.nickname || '新会话',
      summary: conversation.lastMessage?.content || '',
      time: displayTime(conversation.updatedAt),
      avatarUrl: conversation.participant?.avatarUrl || '',
      unread: Boolean(conversation.unread),
    }));
    return directMessages.concat((notifications.items || []).map((item) => Object.assign({}, item, { time: displayTime(item.createdAt) })));
  }
  return clone(content.messages);
}

async function getMessageChannels() {
  if (isApiEnabled()) {
    const result = await messageService.listNotificationChannels();
    return (result.items || []).map((item) => ({
      key: item.id,
      filter: item.type || item.id,
      title: item.id === 'reaction' ? '赞和收藏' : item.id === 'follow' ? '新增关注' : '评论和回复',
      iconAsset: `/assets/icons/message-${item.id}.svg`,
      tone: item.id === 'reaction' ? 'rose' : item.id === 'follow' ? 'blue' : 'mint',
      unread: item.unread || 0,
    }));
  }
  return clone(content.messageChannels);
}

async function getMessagesByCategory(filter) {
  if (isApiEnabled()) {
    const result = await messageService.listNotifications({ category: filter });
    return (result.items || []).map((item) => Object.assign({}, item, { time: displayTime(item.createdAt) }));
  }
  return clone(content.messages.filter((item) => {
    if (filter === 'reaction') return item.type === 'like' || item.type === 'favorite';
    if (filter === 'follow') return item.type === 'follow';
    if (filter === 'comment') return item.type === 'comment';
    return false;
  }));
}

async function getConversation(conversationId) {
  if (isApiEnabled()) {
    const result = await messageService.getConversationMessages(conversationId);
    if (!result || !result.participant) return null;
    return {
      id: conversationId,
      participant: { userId: result.participant.userId, name: result.participant.nickname, status: result.participant.status, avatarUrl: result.participant.avatarUrl },
      currentUser: { avatarUrl: result.currentUser?.avatarUrl || '' },
      messages: (result.messages || []).map((item) => ({ ...item, time: displayTime(item.createdAt) })),
    };
  }
  const conversation = content.conversations.find((item) => item.id === conversationId);
  if (!conversation) return null;
  return { ...clone(conversation), currentUser: { avatarUrl: content.profile.avatarUrl } };
}

async function sendConversationMessage(conversationId, messageContent) {
  if (isApiEnabled()) {
    const result = await messageService.sendConversationMessage(conversationId, messageContent);
    return Object.assign({}, result, { time: displayTime(result.createdAt) });
  }
  return { id: `chat-local-${Date.now()}`, conversationId, sender: 'self', type: 'text', content: messageContent, time: '刚刚' };
}

async function startConversation(userId) {
  if (isApiEnabled()) return messageService.createDirectConversation(userId);
  return { id: `public-chat-${userId}` };
}

async function getProfile() {
  if (isApiEnabled()) return mapProfile(await userService.getMyProfile());
  return clone(content.profile);
}

async function updateProfile(profile) {
  if (isApiEnabled()) return mapProfile(await userService.updateMyProfile(profile));
  return clone(profile);
}

function resolvePublicProfile(userId) {
  const explicitProfile = content.publicProfiles.find((item) => item.id === userId);
  if (explicitProfile) return clone(explicitProfile);
  const allArtworks = [content.featuredArtwork].concat(content.artworks);
  const authoredArtworks = allArtworks.filter((item) => item.author && item.author.id === userId);
  if (!authoredArtworks.length) return null;
  return {
    id: userId,
    nickname: authoredArtworks[0].author.nickname,
    avatarUrl: authoredArtworks[0].author.avatarUrl || authoredArtworks[0].coverUrl,
    region: '',
    role: '鞋履创意设计师',
    bio: '',
    specialties: [],
    stats: [],
    isFollowing: false,
    conversationId: `public-chat-${userId}`,
    artworkIds: authoredArtworks.map((item) => item.id),
  };
}

async function getPublicProfile(userId) {
  if (isApiEnabled()) {
    const result = await userService.getPublicProfile(userId);
    return result && { profile: mapProfile(result.profile), artworks: (result.artworks || []).map(mapArtwork) };
  }
  const profile = resolvePublicProfile(userId);
  if (!profile) return null;
  const artworkIds = new Set(profile.artworkIds);
  const allArtworks = [content.featuredArtwork].concat(content.artworks);
  return { profile: clone(profile), artworks: clone(allArtworks.filter((item) => artworkIds.has(item.id))) };
}

async function setPublicProfileFollowing(userId, following) {
  if (isApiEnabled()) return Object.assign({ userId }, await userService.toggleFollow(userId, following));
  return { userId, following: Boolean(following) };
}

async function toggleArtworkLike(artworkId, liked) {
  if (isApiEnabled()) return artworkService.toggleArtworkLike(artworkId, liked);
  return { liked: Boolean(liked) };
}

async function toggleArtworkFavorite(artworkId, favorited) {
  if (isApiEnabled()) return artworkService.toggleArtworkFavorite(artworkId, favorited);
  return { favorited: Boolean(favorited) };
}

async function addArtworkComment(artworkId, commentText) {
  if (isApiEnabled()) return mapComment(await artworkService.addComment(artworkId, commentText));
  return { id: `local-${Date.now()}`, artworkId, author: '林桐漫步', authorId: 'prototype-user-lintong', initial: '林', time: '刚刚', content: commentText, likes: 0 };
}

async function updateArtwork(artworkId, payload) {
  if (isApiEnabled()) return mapArtwork(await artworkService.updateArtwork(artworkId, payload));
  return { ...payload, id: artworkId };
}

async function publishArtwork(artworkId, payload) {
  if (isApiEnabled()) return mapArtwork(await artworkService.publishArtwork(artworkId, payload));
  return { ...payload, id: artworkId, status: 'published' };
}

async function offShelfArtwork(artworkId, reason) {
  if (isApiEnabled()) return mapArtwork(await artworkService.offShelfArtwork(artworkId, reason));
  return { id: artworkId, status: 'off_shelf' };
}

async function saveArtwork(payload) {
  if (isApiEnabled()) return mapArtwork(await artworkService.saveArtwork(payload));
  return { ...payload, id: `local-${Date.now()}`, status: payload.status || 'draft' };
}

async function getMyContent(type) {
  if (isApiEnabled()) {
    if (type === 'comments') {
      const result = await userService.listMyComments();
      return (result.items || []).map((item) => mapArtwork(item.artwork)).filter(Boolean);
    }
    const method = type === 'favorites' ? userService.listMyFavorites : type === 'likes' ? userService.listMyLikes : userService.listMyArtworks;
    const result = await method({});
    return (result.items || []).map(mapArtwork);
  }
  return clone(content.artworks);
}

async function getMyComments() {
  if (isApiEnabled()) {
    const result = await userService.listMyComments();
    return (result.items || []).map((item) => ({
      ...mapComment(item),
      sourceTitle: item.artwork?.title || '',
      sourceMeta: item.artwork?.tags?.map((tag) => tag.name || tag).join(' · ') || '',
      publishedAtDisplay: displayTime(item.createdAt),
      visibility: 'public',
    }));
  }
  return clone(content.myComments);
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
  addArtworkComment,
  offShelfArtwork,
  publishArtwork,
  saveArtwork,
  searchArtworks,
  sendConversationMessage,
  startConversation,
  setPublicProfileFollowing,
  toggleArtworkFavorite,
  toggleArtworkLike,
  updateArtwork,
  updateProfile,
};
