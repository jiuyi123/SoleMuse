const http = require('../core/http/client');
const { mapArtwork } = require('../models/artwork');

async function listArtworks(params = {}) {
  const result = await http.request({ path: '/artworks', data: params });
  return {
    items: (result.items || []).map(mapArtwork),
    nextCursor: result.nextCursor || '',
  };
}

async function getArtwork(artworkId) {
  const result = await http.request({ path: `/artworks/${artworkId}` });
  return mapArtwork(result);
}

async function listComments(artworkId, params = {}) {
  return http.request({ path: `/artworks/${artworkId}/comments`, data: params });
}

async function saveArtwork(payload) {
  return http.request({ path: '/artworks', method: 'POST', data: payload }).then(mapArtwork);
}

async function updateArtwork(artworkId, payload) {
  return http.request({ path: `/artworks/${artworkId}`, method: 'PATCH', data: payload }).then(mapArtwork);
}

function publishArtwork(artworkId, payload = {}) {
  return http.request({ path: `/artworks/${artworkId}/publish`, method: 'POST', data: payload }).then(mapArtwork);
}

function offShelfArtwork(artworkId, reason = '') {
  return http.request({ path: `/artworks/${artworkId}/off-shelf`, method: 'POST', data: { reason } }).then(mapArtwork);
}

function toggleArtworkLike(artworkId, liked) {
  return http.request({ path: `/artworks/${artworkId}/like`, method: liked ? 'PUT' : 'DELETE' });
}

function toggleArtworkFavorite(artworkId, favorited) {
  return http.request({ path: `/artworks/${artworkId}/favorite`, method: favorited ? 'PUT' : 'DELETE' });
}

function addComment(artworkId, content, parentId) {
  return http.request({ path: `/artworks/${artworkId}/comments`, method: 'POST', data: { content, parentId } });
}

function deleteComment(commentId) {
  return http.request({ path: `/comments/${commentId}`, method: 'DELETE' });
}

function toggleCommentLike(commentId, liked) {
  return http.request({ path: `/comments/${commentId}/like`, method: liked ? 'PUT' : 'DELETE' });
}

module.exports = {
  getArtwork,
  listComments,
  listArtworks,
  addComment,
  deleteComment,
  offShelfArtwork,
  publishArtwork,
  saveArtwork,
  toggleArtworkFavorite,
  toggleArtworkLike,
  toggleCommentLike,
  updateArtwork,
};
