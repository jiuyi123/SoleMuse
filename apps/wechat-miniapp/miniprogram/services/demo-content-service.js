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

function getProfile() {
  return Promise.resolve(clone(content.profile));
}

function getMyContent() {
  return Promise.resolve(clone(content.artworks));
}

module.exports = {
  getArtwork,
  getHomeContent,
  getMessages,
  getMyContent,
  getProfile,
  getRanking,
  searchArtworks,
};
