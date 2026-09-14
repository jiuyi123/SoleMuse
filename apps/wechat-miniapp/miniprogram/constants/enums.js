const ARTWORK_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  OFF_SHELF: 'off_shelf',
});

const AI_SOURCE_TYPE = Object.freeze({
  AI: 'ai',
  NON_AI: 'non_ai',
  UNDISCLOSED: 'undisclosed',
});

const MESSAGE_TYPE = Object.freeze({
  LIKE: 'like',
  COMMENT: 'comment',
  ARTWORK_STATUS: 'artwork_status',
  SYSTEM: 'system',
});

const SORT_MODE = Object.freeze({
  LATEST: 'latest',
  HOTTEST: 'hottest',
});

module.exports = {
  AI_SOURCE_TYPE,
  ARTWORK_STATUS,
  MESSAGE_TYPE,
  SORT_MODE,
};
