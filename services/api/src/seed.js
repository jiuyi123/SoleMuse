const prototypeContent = require('../../../apps/wechat-miniapp/miniprogram/data/prototype-content');

const PRIMARY_USER_ID = 'prototype-user-lintong';
const CATEGORY_NAMES = ['运动鞋', '休闲鞋', '潮流鞋', '商务鞋', '户外鞋'];

function isoDate(daysAgo) {
  return new Date(Date.now() - daysAgo * 86400000).toISOString();
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function createSeed() {
  const content = prototypeContent;
  const users = [];
  const profiles = [];
  const userIds = new Set();

  function ensureUser(user = {}) {
    const id = String(user.id || 'prototype-user-anonymous');
    if (!userIds.has(id)) {
      userIds.add(id);
      users.push({
        id,
        account_id: id === PRIMARY_USER_ID ? 'SM-000001' : `SM-${String(users.length + 2).padStart(6, '0')}`,
        nickname: user.nickname || '匿名设计师',
        avatar_url: user.avatarUrl || '',
        status: 'active',
        created_at: isoDate(120),
        updated_at: isoDate(1),
      });
    }
    return id;
  }

  function ensureProfile(user, extra = {}) {
    const id = ensureUser(user);
    if (!profiles.some((item) => item.user_id === id)) {
      profiles.push({
        user_id: id,
        region: extra.region || '',
        role: extra.role || '设计师',
        bio: extra.bio || '',
        specialties: Array.isArray(extra.specialties) ? extra.specialties : [],
        updated_at: isoDate(1),
      });
    }
    return id;
  }

  const primaryProfile = content.profile || {};
  ensureProfile(primaryProfile, primaryProfile);
  (content.publicProfiles || []).forEach((profile) => ensureProfile(profile, profile));

  const sourceArtworks = [content.featuredArtwork, ...(content.artworks || [])].filter(Boolean);
  sourceArtworks.forEach((artwork) => ensureProfile(artwork.author));
  (content.comments || []).forEach((comment) => ensureProfile({ id: comment.authorId, nickname: comment.author }));
  (content.myComments || []).forEach((comment) => ensureUser({ id: PRIMARY_USER_ID, nickname: '林桐漫步' }));
  (content.messages || []).forEach((message) => {
    if (message.userId) ensureUser({ id: message.userId, nickname: message.title || 'SoleMuse 用户', avatarUrl: message.avatarUrl });
  });
  (content.conversations || []).forEach((conversation) => {
    if (conversation.participant) ensureUser({
      id: conversation.participant.userId,
      nickname: conversation.participant.name,
      avatarUrl: conversation.participant.avatarUrl,
    });
  });

  const categoryByName = new Map();
  const categories = CATEGORY_NAMES.map((name, index) => {
    const category = { id: `category-${index + 1}`, name, sort_order: index + 1, enabled: true };
    categoryByName.set(name, category.id);
    return category;
  });

  const allTags = unique(sourceArtworks.flatMap((artwork) => artwork.tags || []).concat(content.searchDiscovery?.hotKeywords || []));
  const tags = allTags.map((name, index) => ({ id: `tag-${index + 1}`, name, enabled: true }));
  const tagByName = new Map(tags.map((tag) => [tag.name, tag.id]));

  const artworks = sourceArtworks.map((artwork, index) => {
    const status = artwork.status || 'published';
    return {
      id: String(artwork.id),
      creator_id: ensureUser(artwork.author),
      title: artwork.title || '',
      description: artwork.description || '',
      prompt: artwork.prompt || '',
      work_type: artwork.workType === '非 AI' ? 'non_ai' : 'ai_generated',
      category_id: categoryByName.get((artwork.tags || [])[0]) || categories[index % categories.length].id,
      status,
      published_at: status === 'published' ? isoDate(index + 1) : null,
      created_at: isoDate(index + 4),
      updated_at: isoDate(1),
    };
  });

  const artworkImages = [];
  const artworkSources = [];
  const artworkTags = [];
  const artworkMetrics = [];
  artworks.forEach((artwork, index) => {
    const source = sourceArtworks[index];
    (source.images || [source.coverUrl]).filter(Boolean).forEach((url, imageIndex) => {
      artworkImages.push({
        id: `${artwork.id}-image-${imageIndex + 1}`,
        artwork_id: artwork.id,
        asset_id: null,
        url,
        sort_order: imageIndex,
        is_cover: imageIndex === 0,
      });
    });
    const aiSource = source.aiSource || {};
    artworkSources.push({
      artwork_id: artwork.id,
      source_type: aiSource.type || 'undisclosed',
      tool_name: aiSource.name || '',
      model_version: aiSource.version || '',
      workflow: '',
      edit_description: '',
    });
    (source.tags || []).forEach((name) => {
      const tagId = tagByName.get(name);
      if (tagId) artworkTags.push({ artwork_id: artwork.id, tag_id: tagId });
    });
    artworkMetrics.push({
      artwork_id: artwork.id,
      views: Number(source.metrics?.views || 0),
      likes: Number(source.metrics?.likes || 0),
      favorites: Number(source.metrics?.favorites || 0),
      comments: Number(source.metrics?.comments || 0),
      shares: Number(source.metrics?.shares || 0),
      updated_at: isoDate(0),
    });
  });

  const comments = (content.comments || []).map((comment, index) => ({
    id: String(comment.id),
    artwork_id: content.featuredArtwork?.id || artworks[0]?.id,
    user_id: ensureUser({ id: comment.authorId, nickname: comment.author }),
    parent_id: null,
    content: comment.content || '',
    status: 'published',
    created_at: isoDate(index + 2),
    updated_at: isoDate(index + 2),
  }));

  const notifications = (content.messages || [])
    .filter((message) => message.type !== 'direct')
    .map((message, index) => ({
      id: String(message.id),
      recipient_id: PRIMARY_USER_ID,
      actor_id: message.userId ? ensureUser({ id: message.userId, nickname: message.title, avatarUrl: message.avatarUrl }) : null,
      type: message.type === 'status' ? 'artwork_status' : (message.type || 'system'),
      artwork_id: message.artworkId || null,
      comment_id: null,
      title: message.title || '系统通知',
      summary: message.summary || '',
      image_url: message.image || '',
      unread: Boolean(message.unread),
      created_at: isoDate(index + 1),
    }));

  const conversations = (content.conversations || []).map((conversation, index) => ({
    id: String(conversation.id),
    type: 'direct',
    last_message_at: isoDate(index),
    created_at: isoDate(index + 5),
    updated_at: isoDate(index),
  }));
  const conversationMembers = [];
  const chatMessages = [];
  conversations.forEach((conversation, index) => {
    const source = (content.conversations || [])[index];
    const participantId = ensureUser({
      id: source.participant.userId,
      nickname: source.participant.name,
      avatarUrl: source.participant.avatarUrl,
    });
    conversationMembers.push(
      { conversation_id: conversation.id, user_id: PRIMARY_USER_ID, last_read_message_id: null },
      { conversation_id: conversation.id, user_id: participantId, last_read_message_id: null },
    );
    (source.messages || []).forEach((message, messageIndex) => {
      chatMessages.push({
        id: String(message.id),
        conversation_id: conversation.id,
        sender_id: message.sender === 'self' ? PRIMARY_USER_ID : participantId,
        client_message_id: null,
        type: message.type || 'text',
        content: message.content || '',
        created_at: isoDate(messageIndex),
      });
    });
  });

  return {
    users,
    user_profiles: profiles,
    auth_identities: [],
    phone_bindings: [],
    auth_sessions: [],
    media_assets: [],
    artworks,
    artwork_images: artworkImages,
    artwork_ai_sources: artworkSources,
    artwork_revisions: [],
    categories,
    tags,
    artwork_categories: [],
    artwork_tags: artworkTags,
    artwork_metrics: artworkMetrics,
    artwork_likes: [],
    artwork_favorites: [],
    comments,
    comment_likes: [],
    user_follows: [],
    conversations,
    conversation_members: conversationMembers,
    chat_messages: chatMessages,
    notifications,
    notification_preferences: [{ user_id: PRIMARY_USER_ID, like_enabled: true, comment_enabled: true, follow_enabled: true, system_enabled: true }],
    user_privacy_settings: [{ user_id: PRIMARY_USER_ID, profile_visibility: 'public', allow_direct_message: true }],
    user_search_histories: [],
    artwork_events: [],
  };
}

module.exports = { PRIMARY_USER_ID, createSeed };
