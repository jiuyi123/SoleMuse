const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createStore } = require('./store');
const { PRIMARY_USER_ID, createSeed } = require('./seed');

const API_PREFIX = '/api/v1';
const ACCESS_TOKEN_TTL = 7200;
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60;
const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

class HttpError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function now() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toInt(value, fallback, max = 50) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), max) : fallback;
}

function paginate(items, cursor, limit) {
  const offset = Math.max(Number.parseInt(cursor || '0', 10) || 0, 0);
  const page = items.slice(offset, offset + limit);
  return { items: page, nextCursor: offset + limit < items.length ? String(offset + limit) : '' };
}

function response(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ data }));
}

function errorResponse(res, error) {
  const status = error instanceof HttpError ? error.status : 500;
  const code = error instanceof HttpError ? error.code : 'INTERNAL_ERROR';
  const message = error instanceof HttpError ? error.message : '服务暂时不可用';
  const details = error instanceof HttpError ? error.details : null;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error: { code, message, details } }));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      if (!buffer.length) return resolve({});
      const type = String(req.headers['content-type'] || '');
      if (type.includes('application/json')) {
        try {
          return resolve(JSON.parse(buffer.toString('utf8')));
        } catch (error) {
          return reject(new HttpError(400, 'VALIDATION_ERROR', '请求体不是有效 JSON'));
        }
      }
      resolve({ raw: buffer, contentType: type });
    });
    req.on('error', reject);
  });
}

function getUser(state, userId) {
  return state.users.find((item) => item.id === userId) || null;
}

function getProfile(state, userId) {
  return state.user_profiles.find((item) => item.user_id === userId) || {
    user_id: userId,
    region: '',
    role: '设计师',
    bio: '',
    specialties: [],
  };
}

function publicUser(state, userId) {
  const user = getUser(state, userId) || { id: userId, nickname: '匿名设计师', avatar_url: '' };
  return { id: user.id, nickname: user.nickname, avatarUrl: user.avatar_url || '' };
}

function profileDto(state, userId) {
  const user = getUser(state, userId);
  if (!user) throw new HttpError(404, 'NOT_FOUND', '用户不存在');
  const profile = getProfile(state, userId);
  const artworkCount = state.artworks.filter((item) => item.creator_id === userId && item.status !== 'deleted').length;
  const likes = state.artwork_likes.filter((item) => {
    const artwork = state.artworks.find((candidate) => candidate.id === item.artwork_id);
    return artwork && artwork.creator_id === userId;
  }).length;
  const followers = state.user_follows.filter((item) => item.followee_id === userId).length;
  return {
    id: user.id,
    accountId: user.account_id,
    nickname: user.nickname,
    avatarUrl: user.avatar_url || '',
    region: profile.region || '',
    role: profile.role || '设计师',
    bio: profile.bio || '',
    specialties: asArray(profile.specialties),
    stats: { works: artworkCount, likes, followers },
  };
}

function sourceDto(state, artworkId) {
  const source = state.artwork_ai_sources.find((item) => item.artwork_id === artworkId) || {};
  return {
    type: source.source_type || 'undisclosed',
    name: source.tool_name || '来源未标注',
    version: source.model_version || '',
    workflow: source.workflow || '',
    editDescription: source.edit_description || '',
  };
}

function tagsDto(state, artworkId) {
  const tagIds = state.artwork_tags.filter((item) => item.artwork_id === artworkId).map((item) => item.tag_id);
  return state.tags.filter((tag) => tagIds.includes(tag.id)).map((tag) => ({ id: tag.id, name: tag.name }));
}

function artworkDto(state, artwork, viewerId = null) {
  if (!artwork) throw new HttpError(404, 'NOT_FOUND', '作品不存在');
  const metrics = state.artwork_metrics.find((item) => item.artwork_id === artwork.id) || {};
  const images = state.artwork_images
    .filter((item) => item.artwork_id === artwork.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => item.url)
    .filter(Boolean);
  const liked = Boolean(viewerId && state.artwork_likes.some((item) => item.artwork_id === artwork.id && item.user_id === viewerId));
  const favorited = Boolean(viewerId && state.artwork_favorites.some((item) => item.artwork_id === artwork.id && item.user_id === viewerId));
  return {
    id: artwork.id,
    title: artwork.title,
    description: artwork.description || '',
    prompt: artwork.prompt || '',
    coverUrl: images[0] || '',
    images,
    author: publicUser(state, artwork.creator_id),
    aiSource: sourceDto(state, artwork.id),
    workType: artwork.work_type,
    categoryId: artwork.category_id,
    status: artwork.status,
    tags: tagsDto(state, artwork.id),
    metrics: {
      views: Number(metrics.views || 0),
      likes: Number(metrics.likes || 0),
      favorites: Number(metrics.favorites || 0),
      comments: Number(metrics.comments || 0),
      shares: Number(metrics.shares || 0),
    },
    liked,
    favorited,
    followed: Boolean(viewerId && state.user_follows.some((item) => item.follower_id === viewerId && item.followee_id === artwork.creator_id)),
    publishedAt: artwork.published_at,
    createdAt: artwork.created_at,
    updatedAt: artwork.updated_at,
  };
}

function commentDto(state, comment, viewerId = null) {
  return {
    id: comment.id,
    artworkId: comment.artwork_id,
    author: publicUser(state, comment.user_id),
    content: comment.content,
    parentId: comment.parent_id,
    liked: Boolean(viewerId && state.comment_likes.some((item) => item.comment_id === comment.id && item.user_id === viewerId)),
    likeCount: state.comment_likes.filter((item) => item.comment_id === comment.id).length,
    createdAt: comment.created_at,
  };
}

function metric(state, artworkId) {
  let item = state.artwork_metrics.find((candidate) => candidate.artwork_id === artworkId);
  if (!item) {
    item = { artwork_id: artworkId, views: 0, likes: 0, favorites: 0, comments: 0, shares: 0, updated_at: now() };
    state.artwork_metrics.push(item);
  }
  return item;
}

function ensureOwner(state, artworkId, userId) {
  const artwork = state.artworks.find((item) => item.id === artworkId);
  if (!artwork) throw new HttpError(404, 'NOT_FOUND', '作品不存在');
  if (artwork.creator_id !== userId) throw new HttpError(403, 'FORBIDDEN', '无权操作该作品');
  return artwork;
}

function ensurePublished(state, artworkId) {
  const artwork = state.artworks.find((item) => item.id === artworkId);
  if (!artwork) throw new HttpError(404, 'NOT_FOUND', '作品不存在');
  if (artwork.status !== 'published') throw new HttpError(409, 'CONFLICT', '该作品暂不可互动');
  return artwork;
}

function optionalUser(state, req) {
  const header = String(req.headers.authorization || '');
  if (!header.startsWith('Bearer ')) return null;
  const tokenHash = hash(header.slice(7));
  const session = state.auth_sessions.find((item) => item.access_token_hash === tokenHash && !item.revoked_at && new Date(item.access_expires_at) > new Date());
  return session ? getUser(state, session.user_id) : null;
}

function requireUser(state, req) {
  const user = optionalUser(state, req);
  if (!user) throw new HttpError(401, 'AUTH_REQUIRED', '请先登录');
  return user;
}

function issueSession(state, userId, loginMethod) {
  const accessToken = `sm_access_${crypto.randomBytes(24).toString('hex')}`;
  const refreshToken = `sm_refresh_${crypto.randomBytes(32).toString('hex')}`;
  const createdAt = Date.now();
  state.auth_sessions.push({
    id: id(),
    user_id: userId,
    access_token_hash: hash(accessToken),
    refresh_token_hash: hash(refreshToken),
    login_method: loginMethod,
    access_expires_at: new Date(createdAt + ACCESS_TOKEN_TTL * 1000).toISOString(),
    refresh_expires_at: new Date(createdAt + REFRESH_TOKEN_TTL * 1000).toISOString(),
    revoked_at: null,
    created_at: new Date(createdAt).toISOString(),
  });
  const user = getUser(state, userId);
  const phone = state.phone_bindings.find((item) => item.user_id === userId);
  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL,
    user: {
      id: user.id,
      accountId: user.account_id,
      nickname: user.nickname,
      avatarUrl: user.avatar_url || '',
      loginMethod,
      phoneDisplay: phone?.phone_display || '',
      wechatBound: Boolean(state.auth_identities.some((item) => item.user_id === userId && item.provider === 'wechat')),
    },
  };
}

function findOrCreateIdentity(state, provider, code) {
  const subject = hash(`${provider}:${code}`);
  const identity = state.auth_identities.find((item) => item.provider === provider && item.provider_subject_hash === subject);
  if (identity) return getUser(state, identity.user_id);
  const user = getUser(state, PRIMARY_USER_ID) || state.users[0];
  state.auth_identities.push({ id: id(), user_id: user.id, provider, provider_subject_hash: subject, created_at: now() });
  return user;
}

function ensurePreferences(state, userId) {
  let item = state.notification_preferences.find((candidate) => candidate.user_id === userId);
  if (!item) {
    item = { user_id: userId, like_enabled: true, comment_enabled: true, follow_enabled: true, system_enabled: true };
    state.notification_preferences.push(item);
  }
  return item;
}

function ensurePrivacy(state, userId) {
  let item = state.user_privacy_settings.find((candidate) => candidate.user_id === userId);
  if (!item) {
    item = { user_id: userId, profile_visibility: 'public', allow_direct_message: true };
    state.user_privacy_settings.push(item);
  }
  return item;
}

function saveArtworkRelations(state, artwork, payload) {
  const imageAssetIds = asArray(payload.imageAssetIds);
  if (imageAssetIds.length) {
    state.artwork_images = state.artwork_images.filter((item) => item.artwork_id !== artwork.id);
    imageAssetIds.forEach((assetId, index) => {
      const asset = state.media_assets.find((item) => item.id === assetId);
      if (!asset || asset.owner_id !== artwork.creator_id) throw new HttpError(403, 'FORBIDDEN', '图片资源不属于当前用户');
      if (asset.status !== 'uploaded') throw new HttpError(409, 'CONFLICT', '图片尚未上传完成');
      state.artwork_images.push({ id: id(), artwork_id: artwork.id, asset_id: asset.id, url: asset.url, sort_order: index, is_cover: index === 0 });
    });
  } else if (asArray(payload.images).length) {
    state.artwork_images = state.artwork_images.filter((item) => item.artwork_id !== artwork.id);
    asArray(payload.images).filter(Boolean).forEach((url, index) => state.artwork_images.push({
      id: id(), artwork_id: artwork.id, asset_id: null, url: String(url), sort_order: index, is_cover: index === 0,
    }));
  }

  const source = state.artwork_ai_sources.find((item) => item.artwork_id === artwork.id) || { artwork_id: artwork.id };
  Object.assign(source, {
    source_type: payload.aiSource?.type || payload.sourceType || source.source_type || 'undisclosed',
    tool_name: payload.aiSource?.name || source.tool_name || '',
    model_version: payload.aiSource?.version || source.model_version || '',
    workflow: payload.aiSource?.workflow || source.workflow || '',
    edit_description: payload.aiSource?.editDescription || source.edit_description || '',
  });
  if (!state.artwork_ai_sources.some((item) => item.artwork_id === artwork.id)) state.artwork_ai_sources.push(source);

  const names = asArray(payload.tags).map((tag) => typeof tag === 'string' ? tag : tag.name).filter(Boolean);
  const tagIds = asArray(payload.tagIds).concat(names.map((name) => {
    let tag = state.tags.find((candidate) => candidate.name === name);
    if (!tag) {
      tag = { id: id(), name, enabled: true };
      state.tags.push(tag);
    }
    return tag.id;
  }));
  state.artwork_tags = state.artwork_tags.filter((item) => item.artwork_id !== artwork.id);
  uniqueIds(tagIds).forEach((tagId) => state.artwork_tags.push({ artwork_id: artwork.id, tag_id: tagId }));
}

function uniqueIds(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function resolveCategoryId(state, value) {
  if (!value) return null;
  const category = state.categories.find((item) => item.id === value || item.name === value);
  return category ? category.id : value;
}

function validateArtworkPayload(state, payload, forPublish) {
  const errors = {};
  if (forPublish) {
    if (!String(payload.title || '').trim()) errors.title = '请输入作品标题';
  }
  if (forPublish) {
    if (!String(payload.prompt || '').trim()) errors.prompt = '请输入 Prompt';
  }
  if (forPublish) {
    if (!payload.categoryId) errors.categoryId = '请选择作品分类';
  }
  const imageCount = asArray(payload.imageAssetIds).length || asArray(payload.images).length;
  if (forPublish && imageCount < 1) errors.images = '至少上传一张作品图片';
  if (Object.keys(errors).length) throw new HttpError(422, 'VALIDATION_ERROR', '作品信息不完整', errors);
}

function sortArtworks(items, sort) {
  return items.sort((a, b) => {
    if (sort === 'hottest') {
      const am = a.metrics || {}; const bm = b.metrics || {};
      return (bm.likes + bm.favorites * 2 + bm.comments * 3 + bm.views * 0.1) - (am.likes + am.favorites * 2 + am.comments * 3 + am.views * 0.1);
    }
    return String(b.publishedAt || b.createdAt).localeCompare(String(a.publishedAt || a.createdAt));
  });
}

function messageDto(state, message, currentUserId) {
  return {
    id: message.id,
    sender: message.sender_id === currentUserId ? 'self' : 'other',
    senderId: message.sender_id,
    type: message.type,
    content: message.content,
    createdAt: message.created_at,
  };
}

function conversationDto(state, conversation, currentUserId) {
  const member = state.conversation_members.find((item) => item.conversation_id === conversation.id && item.user_id !== currentUserId);
  const messages = state.chat_messages.filter((item) => item.conversation_id === conversation.id).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const last = messages[0];
  return {
    id: conversation.id,
    participant: member ? { userId: member.user_id, ...publicUser(state, member.user_id), status: 'online' } : null,
    lastMessage: last ? messageDto(state, last, currentUserId) : null,
    unread: 0,
    updatedAt: conversation.updated_at,
  };
}

function notificationDto(state, item) {
  return {
    id: item.id,
    type: item.type,
    userId: item.actor_id,
    avatarUrl: item.actor_id ? publicUser(state, item.actor_id).avatarUrl : '',
    title: item.title,
    summary: item.summary,
    image: item.image_url,
    artworkId: item.artwork_id,
    commentId: item.comment_id,
    unread: item.unread,
    createdAt: item.created_at,
  };
}

function categoryForNotification(type) {
  if (type === 'like' || type === 'favorite') return 'reaction';
  if (type === 'follow') return 'follow';
  if (type === 'comment') return 'comment';
  return 'system';
}

function createApiServer(options = {}) {
  const store = createStore({
    filePath: options.filePath || path.join(__dirname, '..', 'data', 'local-db.json'),
    seed: options.seed || createSeed(),
  });
  const state = store.state;
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

  async function handle(req, res) {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
      return res.end();
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
    try {
      const requestUrl = new URL(req.url, 'http://localhost');
      let pathname = requestUrl.pathname;
      if (pathname.startsWith(API_PREFIX)) pathname = pathname.slice(API_PREFIX.length) || '/';
      const query = Object.fromEntries(requestUrl.searchParams.entries());
      const parts = pathname.split('/').filter(Boolean);
      const body = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) ? await readBody(req) : {};
      const currentUser = optionalUser(state, req);
      const auth = () => currentUser || requireUser(state, req);

      if (req.method === 'GET' && pathname === '/health') return response(res, 200, { status: 'ok', timestamp: now() });
      if (req.method === 'GET' && parts[0] === 'local-assets' && parts[1]) {
        const asset = state.media_assets.find((item) => item.id === parts[1] && item.status === 'uploaded');
        if (!asset) throw new HttpError(404, 'NOT_FOUND', '图片资源不存在');
        const filePath = path.join(UPLOAD_ROOT, `${asset.id}.bin`);
        if (!fs.existsSync(filePath)) throw new HttpError(404, 'NOT_FOUND', '图片文件不存在');
        res.statusCode = 200;
        res.setHeader('Content-Type', asset.mime_type || 'application/octet-stream');
        return res.end(fs.readFileSync(filePath));
      }

      if (req.method === 'POST' && pathname === '/auth/wechat/login') {
        if (!body.code) throw new HttpError(422, 'VALIDATION_ERROR', '缺少微信登录 code');
        const user = findOrCreateIdentity(state, 'wechat', body.code);
        const session = issueSession(state, user.id, 'wechat');
        store.save();
        return response(res, 200, { session });
      }
      if (req.method === 'POST' && pathname === '/auth/phone/login') {
        if (!body.code) throw new HttpError(422, 'VALIDATION_ERROR', '缺少手机号登录 code');
        const user = findOrCreateIdentity(state, 'phone', body.code);
        if (!state.phone_bindings.some((item) => item.user_id === user.id)) {
          state.phone_bindings.push({ user_id: user.id, phone_hash: hash(`dev:${body.code}`), phone_display: '138****8821', verified_at: now() });
        }
        const session = issueSession(state, user.id, 'phone');
        store.save();
        return response(res, 200, { session });
      }
      if (req.method === 'POST' && pathname === '/auth/refresh') {
        const refreshHash = body.refreshToken && hash(body.refreshToken);
        const oldSession = state.auth_sessions.find((item) => item.refresh_token_hash === refreshHash && !item.revoked_at && new Date(item.refresh_expires_at) > new Date());
        if (!oldSession) throw new HttpError(401, 'SESSION_EXPIRED', '登录状态已过期，请重新登录');
        oldSession.revoked_at = now();
        const session = issueSession(state, oldSession.user_id, oldSession.login_method);
        store.save();
        return response(res, 200, { session });
      }
      if (req.method === 'POST' && pathname === '/auth/logout') {
        const user = auth();
        const header = String(req.headers.authorization || '');
        const active = state.auth_sessions.find((item) => item.access_token_hash === hash(header.slice(7)) && item.user_id === user.id);
        if (active) active.revoked_at = now();
        store.save();
        return response(res, 200, { success: true });
      }

      if (req.method === 'GET' && pathname === '/feeds/home') {
        const feed = query.feed || 'discover';
        let records = state.artworks.filter((item) => item.status === 'published');
        if (feed === 'following') {
          const user = auth();
          const followed = state.user_follows.filter((item) => item.follower_id === user.id).map((item) => item.followee_id);
          records = records.filter((item) => followed.includes(item.creator_id));
        }
        const items = sortArtworks(records.map((item) => artworkDto(state, item, currentUser?.id)), feed === 'latest' ? 'latest' : 'hottest');
        const page = paginate(items, query.cursor, toInt(query.limit, 20));
        page.hotTags = state.tags.slice(0, 8).map((tag) => ({ id: tag.id, name: tag.name }));
        return response(res, 200, page);
      }
      if (req.method === 'GET' && pathname === '/search/discovery') {
        const user = currentUser;
        const history = user ? state.user_search_histories.filter((item) => item.user_id === user.id).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((item) => item.keyword) : [];
        return response(res, 200, { defaultHistory: history, hotKeywords: state.tags.slice(0, 8).map((tag) => tag.name) });
      }
      if (req.method === 'GET' && pathname === '/artworks') {
        let records = state.artworks.filter((item) => item.status === 'published');
        const keyword = String(query.keyword || '').trim().toLowerCase();
        if (keyword) {
          records = records.filter((item) => {
            const author = getUser(state, item.creator_id);
            const tags = tagsDto(state, item.id).map((tag) => tag.name).join(' ');
            return [item.title, item.description, item.prompt, author?.nickname, tags].join(' ').toLowerCase().includes(keyword);
          });
        }
        if (query.categoryId) records = records.filter((item) => item.category_id === query.categoryId);
        if (query.tagId) records = records.filter((item) => state.artwork_tags.some((relation) => relation.artwork_id === item.id && relation.tag_id === query.tagId));
        if (query.sourceType) records = records.filter((item) => sourceDto(state, item.id).type === query.sourceType);
        if (query.publishedFrom) records = records.filter((item) => item.published_at >= query.publishedFrom);
        if (query.publishedTo) records = records.filter((item) => item.published_at <= query.publishedTo);
        const items = sortArtworks(records.map((item) => artworkDto(state, item, currentUser?.id)), query.sort || 'latest');
        if (currentUser && keyword) {
          const existing = state.user_search_histories.find((item) => item.user_id === currentUser.id && item.keyword === keyword);
          if (existing) existing.created_at = now();
          else state.user_search_histories.unshift({ id: id(), user_id: currentUser.id, keyword, created_at: now() });
          state.user_search_histories = state.user_search_histories.slice(0, 20);
          store.save();
        }
        return response(res, 200, paginate(items, query.cursor, toInt(query.limit, 20)));
      }
      if (req.method === 'GET' && pathname === '/rankings') {
        const records = sortArtworks(state.artworks.filter((item) => item.status === 'published').map((item) => artworkDto(state, item)), 'hottest');
        const items = paginate(records, query.cursor, toInt(query.limit, 20)).items.map((item, index) => ({
          rank: index + 1,
          artworkId: item.id,
          title: item.title,
          image: item.coverUrl,
          author: item.author,
          heat: item.metrics.likes + item.metrics.favorites * 2 + item.metrics.comments * 3,
          subtitle: item.aiSource.name,
          metrics: item.metrics,
        }));
        return response(res, 200, { items, nextCursor: '', period: query.period || 'week', updatedAt: now() });
      }
      if (req.method === 'GET' && pathname === '/rankings/rules') return response(res, 200, { title: '热度榜规则', description: '按公开作品的点赞、收藏、评论与浏览热度综合计算。', periods: ['day', 'week', 'month'] });
      if (req.method === 'GET' && pathname === '/artwork-options') {
        return response(res, 200, {
          categories: state.categories.filter((item) => item.enabled).map((item) => ({ id: item.id, name: item.name })),
          tags: state.tags.filter((item) => item.enabled).map((item) => ({ id: item.id, name: item.name })),
          aiSources: [
            { type: 'ai', name: 'Midjourney', version: 'v6.1' },
            { type: 'ai', name: 'Stable Diffusion', version: 'XL' },
            { type: 'non_ai', name: '非 AI 生成', version: '' },
            { type: 'undisclosed', name: '来源未标注', version: '' },
          ],
        });
      }

      if (parts[0] === 'users' && parts[1] === 'me') {
        const user = auth();
        if (req.method === 'GET' && parts.length === 2) return response(res, 200, profileDto(state, user.id));
        if (req.method === 'PATCH' && parts.length === 2) {
          const allowed = ['nickname', 'avatarUrl', 'region', 'role', 'bio', 'specialties'];
          const account = getUser(state, user.id); const profile = getProfile(state, user.id);
          if (body.nickname !== undefined) account.nickname = String(body.nickname).trim();
          if (body.avatarUrl !== undefined) account.avatar_url = String(body.avatarUrl);
          allowed.filter((key) => !['nickname', 'avatarUrl'].includes(key)).forEach((key) => { if (body[key] !== undefined) profile[key === 'specialties' ? 'specialties' : key] = body[key]; });
          account.updated_at = now(); profile.updated_at = now(); store.save();
          return response(res, 200, profileDto(state, user.id));
        }
        if (req.method === 'GET' && parts[2] === 'account') {
          return response(res, 200, {
            id: user.id,
            accountId: user.account_id,
            nickname: user.nickname,
            avatarUrl: user.avatar_url || '',
            phoneDisplay: state.phone_bindings.find((item) => item.user_id === user.id)?.phone_display || '',
            wechatBound: state.auth_identities.some((item) => item.user_id === user.id && item.provider === 'wechat'),
          });
        }
        if (req.method === 'GET' && parts[2] === 'artworks') {
          const records = state.artworks.filter((item) => item.creator_id === user.id && (!query.status || item.status === query.status));
          return response(res, 200, paginate(sortArtworks(records.map((item) => artworkDto(state, item, user.id)), 'latest'), query.cursor, toInt(query.limit, 20)));
        }
        if (req.method === 'GET' && ['favorites', 'likes'].includes(parts[2])) {
          const relationKey = parts[2] === 'favorites' ? 'artwork_favorites' : 'artwork_likes';
          const relation = state[relationKey].filter((item) => item.user_id === user.id);
          const records = relation.map((item) => state.artworks.find((artwork) => artwork.id === item.artwork_id)).filter(Boolean).filter((item) => item.status === 'published');
          return response(res, 200, paginate(sortArtworks(records.map((item) => artworkDto(state, item, user.id)), 'latest'), query.cursor, toInt(query.limit, 20)));
        }
        if (req.method === 'GET' && parts[2] === 'comments') {
          const records = state.comments.filter((item) => item.user_id === user.id && item.status === 'published').map((item) => ({ ...commentDto(state, item, user.id), artwork: artworkDto(state, state.artworks.find((artwork) => artwork.id === item.artwork_id), user.id) }));
          return response(res, 200, paginate(records, query.cursor, toInt(query.limit, 20)));
        }
        if (parts[2] === 'search-history') {
          if (req.method === 'GET') return response(res, 200, { items: state.user_search_histories.filter((item) => item.user_id === user.id).map((item) => ({ id: item.id, keyword: item.keyword, createdAt: item.created_at })) });
          if (req.method === 'PUT') {
            const keyword = String(body.keyword || query.keyword || '').trim();
            if (!keyword) throw new HttpError(422, 'VALIDATION_ERROR', 'keyword 不能为空');
            state.user_search_histories = state.user_search_histories.filter((item) => !(item.user_id === user.id && item.keyword === keyword));
            state.user_search_histories.unshift({ id: id(), user_id: user.id, keyword, created_at: now() }); store.save();
            return response(res, 200, { keyword });
          }
          if (req.method === 'DELETE') { state.user_search_histories = state.user_search_histories.filter((item) => item.user_id !== user.id || (body.keyword && item.keyword !== body.keyword)); store.save(); return response(res, 200, { success: true }); }
        }
        if (parts[2] === 'notification-preferences') {
          const preference = ensurePreferences(state, user.id);
          if (req.method === 'PATCH') { const mapping = { likes: 'like_enabled', comments: 'comment_enabled', follows: 'follow_enabled', system: 'system_enabled' }; Object.keys(mapping).forEach((key) => { if (body[key] !== undefined) preference[mapping[key]] = Boolean(body[key]); }); store.save(); }
          return response(res, 200, { likes: preference.like_enabled, comments: preference.comment_enabled, follows: preference.follow_enabled, system: preference.system_enabled });
        }
        if (parts[2] === 'privacy-settings') {
          const privacy = ensurePrivacy(state, user.id);
          if (req.method === 'PATCH') { if (body.profileVisibility) privacy.profile_visibility = body.profileVisibility; if (body.allowDirectMessage !== undefined) privacy.allow_direct_message = Boolean(body.allowDirectMessage); store.save(); }
          return response(res, 200, { profileVisibility: privacy.profile_visibility, allowDirectMessage: privacy.allow_direct_message });
        }
      }

      if (parts[0] === 'users' && parts[2] === 'public-profile' && req.method === 'GET') {
        const userId = parts[1]; const profile = profileDto(state, userId); const user = currentUser;
        const isFollowing = Boolean(user && state.user_follows.some((item) => item.follower_id === user.id && item.followee_id === userId));
        const artworks = state.artworks.filter((item) => item.creator_id === userId && item.status === 'published').map((item) => artworkDto(state, item, user?.id));
        return response(res, 200, { profile: { ...profile, isFollowing }, artworks });
      }

      if (parts[0] === 'users' && parts[2] === 'follow' && ['PUT', 'DELETE'].includes(req.method)) {
        const user = auth(); const targetId = parts[1];
        if (targetId === user.id) throw new HttpError(409, 'CONFLICT', '不能关注自己');
        if (!getUser(state, targetId)) throw new HttpError(404, 'NOT_FOUND', '用户不存在');
        const index = state.user_follows.findIndex((item) => item.follower_id === user.id && item.followee_id === targetId);
        if (req.method === 'PUT' && index < 0) { state.user_follows.push({ id: id(), follower_id: user.id, followee_id: targetId, created_at: now() }); state.notifications.unshift({ id: id(), recipient_id: targetId, actor_id: user.id, type: 'follow', title: `${user.nickname} 关注了你`, summary: '你们可以开始交流了', image_url: '', unread: true, created_at: now() }); }
        if (req.method === 'DELETE' && index >= 0) state.user_follows.splice(index, 1);
        store.save(); return response(res, 200, { following: req.method === 'PUT', followerCount: state.user_follows.filter((item) => item.followee_id === targetId).length });
      }

      if (parts[0] === 'artworks' && parts[1] && parts[2] === 'comments' && req.method === 'GET') {
        const artwork = ensurePublished(state, parts[1]); const user = currentUser;
        const comments = state.comments.filter((item) => item.artwork_id === artwork.id && item.status === 'published').sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))).map((item) => commentDto(state, item, user?.id));
        return response(res, 200, paginate(comments, query.cursor, toInt(query.limit, 20)));
      }
      if (parts[0] === 'artworks' && parts[1] && parts[2] === 'like' && ['PUT', 'DELETE'].includes(req.method)) {
        const user = auth(); const artwork = ensurePublished(state, parts[1]); const index = state.artwork_likes.findIndex((item) => item.artwork_id === artwork.id && item.user_id === user.id);
        if (req.method === 'PUT' && index < 0) { state.artwork_likes.push({ id: id(), artwork_id: artwork.id, user_id: user.id, created_at: now() }); if (artwork.creator_id !== user.id) state.notifications.unshift({ id: id(), recipient_id: artwork.creator_id, actor_id: user.id, type: 'like', artwork_id: artwork.id, title: `${user.nickname} 赞了你的作品`, summary: artwork.title, image_url: artworkDto(state, artwork).coverUrl, unread: true, created_at: now() }); }
        if (req.method === 'DELETE' && index >= 0) state.artwork_likes.splice(index, 1); const m = metric(state, artwork.id); m.likes = state.artwork_likes.filter((item) => item.artwork_id === artwork.id).length; store.save(); return response(res, 200, { liked: req.method === 'PUT', likeCount: m.likes });
      }
      if (parts[0] === 'artworks' && parts[1] && parts[2] === 'favorite' && ['PUT', 'DELETE'].includes(req.method)) {
        const user = auth(); const artwork = ensurePublished(state, parts[1]); const index = state.artwork_favorites.findIndex((item) => item.artwork_id === artwork.id && item.user_id === user.id);
        if (req.method === 'PUT' && index < 0) { state.artwork_favorites.push({ id: id(), artwork_id: artwork.id, user_id: user.id, created_at: now() }); if (artwork.creator_id !== user.id) state.notifications.unshift({ id: id(), recipient_id: artwork.creator_id, actor_id: user.id, type: 'favorite', artwork_id: artwork.id, title: `${user.nickname} 收藏了你的作品`, summary: artwork.title, image_url: artworkDto(state, artwork).coverUrl, unread: true, created_at: now() }); }
        if (req.method === 'DELETE' && index >= 0) state.artwork_favorites.splice(index, 1); const m = metric(state, artwork.id); m.favorites = state.artwork_favorites.filter((item) => item.artwork_id === artwork.id).length; store.save(); return response(res, 200, { favorited: req.method === 'PUT', favoriteCount: m.favorites });
      }
      if (parts[0] === 'artworks' && parts[1] && parts[2] === 'comments' && req.method === 'POST') {
        const user = auth(); const artwork = ensurePublished(state, parts[1]); const content = String(body.content || '').trim();
        if (!content) throw new HttpError(422, 'VALIDATION_ERROR', '评论内容不能为空');
        if (body.parentId) { const parent = state.comments.find((item) => item.id === body.parentId); if (!parent || parent.artwork_id !== artwork.id || parent.parent_id) throw new HttpError(422, 'VALIDATION_ERROR', '只支持回复顶级评论'); }
        const comment = { id: id(), artwork_id: artwork.id, user_id: user.id, parent_id: body.parentId || null, content, status: 'published', created_at: now(), updated_at: now() };
        state.comments.push(comment); metric(state, artwork.id).comments = state.comments.filter((item) => item.artwork_id === artwork.id && item.status === 'published').length;
        if (artwork.creator_id !== user.id) state.notifications.unshift({ id: id(), recipient_id: artwork.creator_id, actor_id: user.id, type: 'comment', artwork_id: artwork.id, comment_id: comment.id, title: `${user.nickname} 评论了你的作品`, summary: content, image_url: artworkDto(state, artwork).coverUrl, unread: true, created_at: now() });
        store.save(); return response(res, 201, commentDto(state, comment, user.id));
      }
      if (parts[0] === 'artworks' && parts[1] && parts.length === 2 && req.method === 'GET') {
        const artwork = state.artworks.find((item) => item.id === parts[1]); if (!artwork || (artwork.status !== 'published' && artwork.creator_id !== currentUser?.id)) throw new HttpError(404, 'NOT_FOUND', '作品不存在');
        metric(state, artwork.id).views += 1; store.save(); return response(res, 200, artworkDto(state, artwork, currentUser?.id));
      }
      if (parts[0] === 'artworks' && parts[1] && parts[2] === 'publish' && req.method === 'POST') { const user = auth(); const artwork = ensureOwner(state, parts[1], user.id); validateArtworkPayload(state, { ...artwork, ...body, categoryId: body.categoryId || artwork.category_id, imageAssetIds: body.imageAssetIds || state.artwork_images.filter((item) => item.artwork_id === artwork.id).map((item) => item.asset_id).filter(Boolean), images: body.images || state.artwork_images.filter((item) => item.artwork_id === artwork.id).map((item) => item.url).filter(Boolean) }, true); artwork.status = 'published'; artwork.published_at = now(); artwork.updated_at = now(); if (body && Object.keys(body).length) saveArtworkRelations(state, artwork, body); store.save(); return response(res, 200, artworkDto(state, artwork, user.id)); }
      if (parts[0] === 'artworks' && parts[1] && parts[2] === 'off-shelf' && req.method === 'POST') { const user = auth(); const artwork = ensureOwner(state, parts[1], user.id); artwork.status = 'off_shelf'; artwork.updated_at = now(); state.notifications.unshift({ id: id(), recipient_id: user.id, actor_id: null, type: 'artwork_status', artwork_id: artwork.id, title: '作品已下架', summary: body.reason || '', image_url: artworkDto(state, artwork, user.id).coverUrl, unread: true, created_at: now() }); store.save(); return response(res, 200, artworkDto(state, artwork, user.id)); }
      if (parts[0] === 'artworks' && parts[1] && parts.length === 2 && req.method === 'PATCH') { const user = auth(); const artwork = ensureOwner(state, parts[1], user.id); if (body.title !== undefined) artwork.title = String(body.title); if (body.description !== undefined) artwork.description = String(body.description); if (body.prompt !== undefined) artwork.prompt = String(body.prompt); if (body.workType !== undefined) artwork.work_type = body.workType; if (body.categoryId !== undefined) artwork.category_id = resolveCategoryId(state, body.categoryId); if (body.status !== undefined) artwork.status = body.status; artwork.updated_at = now(); saveArtworkRelations(state, artwork, body); store.save(); return response(res, 200, artworkDto(state, artwork, user.id)); }
      if (req.method === 'POST' && pathname === '/artworks') { const user = auth(); validateArtworkPayload(state, body, false); const artwork = { id: id(), creator_id: user.id, title: String(body.title || ''), description: String(body.description || ''), prompt: String(body.prompt || ''), work_type: body.workType || 'ai_generated', category_id: resolveCategoryId(state, body.categoryId), status: body.status || 'draft', published_at: null, created_at: now(), updated_at: now() }; state.artworks.push(artwork); metric(state, artwork.id); saveArtworkRelations(state, artwork, body); if (artwork.status === 'published') { validateArtworkPayload(state, { ...body, imageAssetIds: body.imageAssetIds || body.images }, true); artwork.published_at = now(); } store.save(); return response(res, 201, artworkDto(state, artwork, user.id)); }
      if (req.method === 'POST' && pathname === '/uploads/presign') { const user = auth(); const filename = String(body.filename || 'upload'); const asset = { id: id(), owner_id: user.id, storage_key: `${user.id}/${id()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`, filename, mime_type: body.mimeType || 'image/jpeg', size: Number(body.size || 0), url: '', status: 'pending', created_at: now() }; state.media_assets.push(asset); store.save(); return response(res, 200, { assetId: asset.id, storageKey: asset.storage_key, uploadUrl: `/api/v1/uploads/${asset.id}/complete`, expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() }); }
      if (parts[0] === 'uploads' && parts[1] && parts[2] === 'complete' && req.method === 'POST') { const user = auth(); const asset = state.media_assets.find((item) => item.id === parts[1] && item.owner_id === user.id); if (!asset) throw new HttpError(404, 'NOT_FOUND', '上传资源不存在'); if (body.raw) fs.writeFileSync(path.join(UPLOAD_ROOT, `${asset.id}.bin`), body.raw); asset.status = 'uploaded'; asset.url = `http://${req.headers.host || '127.0.0.1:3000'}${API_PREFIX}/local-assets/${asset.id}`; asset.updated_at = now(); store.save(); return response(res, 200, { assetId: asset.id, url: asset.url, status: asset.status }); }

      if (parts[0] === 'comments' && parts[1] && parts[2] === 'like' && ['PUT', 'DELETE'].includes(req.method)) { const user = auth(); const comment = state.comments.find((item) => item.id === parts[1] && item.status === 'published'); if (!comment) throw new HttpError(404, 'NOT_FOUND', '评论不存在'); const index = state.comment_likes.findIndex((item) => item.comment_id === comment.id && item.user_id === user.id); if (req.method === 'PUT' && index < 0) state.comment_likes.push({ id: id(), comment_id: comment.id, user_id: user.id, created_at: now() }); if (req.method === 'DELETE' && index >= 0) state.comment_likes.splice(index, 1); store.save(); return response(res, 200, { liked: req.method === 'PUT', likeCount: state.comment_likes.filter((item) => item.comment_id === comment.id).length }); }
      if (req.method === 'DELETE' && parts[0] === 'comments' && parts[1]) { const user = auth(); const comment = state.comments.find((item) => item.id === parts[1]); if (!comment) throw new HttpError(404, 'NOT_FOUND', '评论不存在'); if (comment.user_id !== user.id) throw new HttpError(403, 'FORBIDDEN', '无权删除该评论'); comment.status = 'deleted'; metric(state, comment.artwork_id).comments = state.comments.filter((item) => item.artwork_id === comment.artwork_id && item.status === 'published').length; store.save(); return response(res, 200, { deleted: true }); }

      if (req.method === 'GET' && pathname === '/notifications/channels') { const user = auth(); const mine = state.notifications.filter((item) => item.recipient_id === user.id); const count = (type) => mine.filter((item) => item.unread && categoryForNotification(item.type) === type).length; return response(res, 200, { items: [{ id: 'reaction', type: 'reaction', unread: count('reaction') }, { id: 'follow', type: 'follow', unread: count('follow') }, { id: 'comment', type: 'comment', unread: count('comment') }] }); }
      if (req.method === 'GET' && pathname === '/notifications') { const user = auth(); let items = state.notifications.filter((item) => item.recipient_id === user.id); if (query.category) items = items.filter((item) => categoryForNotification(item.type) === query.category || item.type === query.category); return response(res, 200, paginate(items.map((item) => notificationDto(state, item)), query.cursor, toInt(query.limit, 20))); }
      if (req.method === 'POST' && pathname === '/notifications/read') { const user = auth(); const ids = asArray(body.notificationIds); state.notifications.filter((item) => item.recipient_id === user.id && (body.all || ids.includes(item.id))).forEach((item) => { item.unread = false; }); store.save(); return response(res, 200, { success: true }); }

      if (req.method === 'POST' && pathname === '/conversations/direct') { const user = auth(); const participantId = String(body.participantId || ''); if (!participantId || !getUser(state, participantId)) throw new HttpError(404, 'NOT_FOUND', '聊天对象不存在'); let conversation = state.conversations.find((candidate) => { const members = state.conversation_members.filter((member) => member.conversation_id === candidate.id).map((member) => member.user_id); return members.includes(user.id) && members.includes(participantId) && members.length === 2; }); if (!conversation) { conversation = { id: id(), type: 'direct', last_message_at: now(), created_at: now(), updated_at: now() }; state.conversations.push(conversation); state.conversation_members.push({ conversation_id: conversation.id, user_id: user.id, last_read_message_id: null }, { conversation_id: conversation.id, user_id: participantId, last_read_message_id: null }); store.save(); } return response(res, 200, conversationDto(state, conversation, user.id)); }
      if (req.method === 'GET' && pathname === '/conversations') { const user = auth(); const ids = state.conversation_members.filter((item) => item.user_id === user.id).map((item) => item.conversation_id); const items = state.conversations.filter((item) => ids.includes(item.id)).sort((a, b) => b.updated_at.localeCompare(a.updated_at)).map((item) => conversationDto(state, item, user.id)); return response(res, 200, paginate(items, query.cursor, toInt(query.limit, 20))); }
      if (parts[0] === 'conversations' && parts[1] && parts[2] === 'messages' && req.method === 'GET') { const user = auth(); const conversation = state.conversations.find((item) => item.id === parts[1]); if (!conversation || !state.conversation_members.some((item) => item.conversation_id === conversation.id && item.user_id === user.id)) throw new HttpError(404, 'NOT_FOUND', '会话不存在'); const participantMember = state.conversation_members.find((item) => item.conversation_id === conversation.id && item.user_id !== user.id); const messages = state.chat_messages.filter((item) => item.conversation_id === conversation.id).sort((a, b) => a.created_at.localeCompare(b.created_at)).map((item) => messageDto(state, item, user.id)); return response(res, 200, { participant: participantMember ? { userId: participantMember.user_id, ...publicUser(state, participantMember.user_id), status: 'online' } : null, currentUser: publicUser(state, user.id), messages, nextCursor: '' }); }
      if (parts[0] === 'conversations' && parts[1] && parts[2] === 'messages' && req.method === 'POST') { const user = auth(); const conversation = state.conversations.find((item) => item.id === parts[1]); if (!conversation || !state.conversation_members.some((item) => item.conversation_id === conversation.id && item.user_id === user.id)) throw new HttpError(404, 'NOT_FOUND', '会话不存在'); const content = String(body.content || '').trim(); if (!content) throw new HttpError(422, 'VALIDATION_ERROR', '消息不能为空'); const clientMessageId = String(body.clientMessageId || id()); const existing = state.chat_messages.find((item) => item.conversation_id === conversation.id && item.sender_id === user.id && item.client_message_id === clientMessageId); if (existing) return response(res, 200, messageDto(state, existing, user.id)); const message = { id: id(), conversation_id: conversation.id, sender_id: user.id, client_message_id: clientMessageId, type: body.type || 'text', content, created_at: now() }; state.chat_messages.push(message); conversation.last_message_at = message.created_at; conversation.updated_at = message.created_at; const participant = state.conversation_members.find((item) => item.conversation_id === conversation.id && item.user_id !== user.id); if (participant) state.notifications.unshift({ id: id(), recipient_id: participant.user_id, actor_id: user.id, type: 'system', title: user.nickname, summary: content, image_url: '', unread: true, created_at: now() }); store.save(); return response(res, 201, messageDto(state, message, user.id)); }
      if (parts[0] === 'conversations' && parts[1] && parts[2] === 'read' && req.method === 'POST') { const user = auth(); const member = state.conversation_members.find((item) => item.conversation_id === parts[1] && item.user_id === user.id); if (!member) throw new HttpError(404, 'NOT_FOUND', '会话不存在'); member.last_read_message_id = body.lastReadMessageId || null; store.save(); return response(res, 200, { success: true, lastReadMessageId: member.last_read_message_id }); }

      if (req.method === 'GET' && pathname === '/messages') { const user = auth(); const items = state.notifications.filter((item) => item.recipient_id === user.id).map((item) => notificationDto(state, item)); return response(res, 200, { items, nextCursor: '' }); }

      throw new HttpError(404, 'NOT_FOUND', '接口不存在');
    } catch (error) {
      errorResponse(res, error);
    }
  }

  return http.createServer(handle);
}

module.exports = { createApiServer, HttpError };
