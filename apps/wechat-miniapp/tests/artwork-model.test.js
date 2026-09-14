const test = require('node:test');
const assert = require('node:assert/strict');
const { mapArtwork } = require('../miniprogram/models/artwork');

test('mapArtwork preserves image order and uses the first image as fallback cover', () => {
  const artwork = mapArtwork({
    id: 42,
    images: ['first.jpg', 'second.jpg'],
    author: { id: 7, nickname: 'Muse' },
  });

  assert.equal(artwork.id, '42');
  assert.equal(artwork.coverUrl, 'first.jpg');
  assert.deepEqual(artwork.images, ['first.jpg', 'second.jpg']);
  assert.equal(artwork.author.id, '7');
});

test('mapArtwork supplies stable defaults for optional transport fields', () => {
  const artwork = mapArtwork({});

  assert.equal(artwork.title, '未命名作品');
  assert.equal(artwork.aiSource.name, '来源未标注');
  assert.deepEqual(artwork.metrics, { likes: 0, favorites: 0, comments: 0, shares: 0 });
});
