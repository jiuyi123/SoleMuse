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

async function saveArtwork(payload) {
  return http.request({ path: '/artworks', method: 'POST', data: payload });
}

async function updateArtwork(artworkId, payload) {
  return http.request({ path: `/artworks/${artworkId}`, method: 'PATCH', data: payload });
}

module.exports = {
  getArtwork,
  listArtworks,
  saveArtwork,
  updateArtwork,
};
