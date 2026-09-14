const { AI_SOURCE_TYPE, ARTWORK_STATUS } = require('../constants/enums');

function mapArtwork(dto = {}) {
  const images = Array.isArray(dto.images) ? dto.images.slice() : [];
  const coverUrl = dto.coverUrl || images[0] || '';

  return {
    id: String(dto.id || ''),
    title: dto.title || '未命名作品',
    description: dto.description || '',
    prompt: dto.prompt || '',
    coverUrl,
    images,
    author: {
      id: String((dto.author && dto.author.id) || ''),
      nickname: (dto.author && dto.author.nickname) || '匿名设计师',
      avatarUrl: (dto.author && dto.author.avatarUrl) || '',
    },
    aiSource: {
      type: (dto.aiSource && dto.aiSource.type) || AI_SOURCE_TYPE.UNDISCLOSED,
      name: (dto.aiSource && dto.aiSource.name) || '来源未标注',
      version: (dto.aiSource && dto.aiSource.version) || '',
    },
    status: dto.status || ARTWORK_STATUS.DRAFT,
    tags: Array.isArray(dto.tags) ? dto.tags.slice() : [],
    metrics: {
      likes: Number((dto.metrics && dto.metrics.likes) || 0),
      favorites: Number((dto.metrics && dto.metrics.favorites) || 0),
      comments: Number((dto.metrics && dto.metrics.comments) || 0),
      shares: Number((dto.metrics && dto.metrics.shares) || 0),
    },
    publishedAt: dto.publishedAt || '',
  };
}

module.exports = {
  mapArtwork,
};
