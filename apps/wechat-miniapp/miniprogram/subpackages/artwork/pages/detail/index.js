const ROUTES = require('../../../../constants/routes');
const session = require('../../../../core/auth/session');
const imageMedia = require('../../../../core/media/image');
const router = require('../../../../core/navigation/router');
const demoContent = require('../../../../services/demo-content-service');

Page({
  data: {
    artworkId: '',
    artwork: null,
    comments: [],
    currentImage: 1,
    liked: false,
    favorited: false,
    commentText: '',
    submitting: false,
  },

  onLoad(options) {
    this.setData({ artworkId: options.id || '' });
    this.loadArtwork();
  },

  async loadArtwork() {
    const content = await demoContent.getArtwork();
    this.setData({ artwork: content.artwork, comments: content.comments });
  },

  changeImage(event) {
    this.setData({ currentImage: event.detail.current + 1 });
  },

  previewImage(event) {
    imageMedia.previewImages(this.data.artwork.images, event.currentTarget.dataset.url);
  },

  requireLogin() {
    if (session.isAuthenticated()) return true;
    router.navigateTo(ROUTES.LOGIN, { redirect: ROUTES.ARTWORK_DETAIL, redirectId: this.data.artworkId });
    return false;
  },

  toggleLike() {
    if (!this.requireLogin()) return;
    const liked = !this.data.liked;
    this.setData({ liked, 'artwork.metrics.likes': this.data.artwork.metrics.likes + (liked ? 1 : -1) });
  },

  toggleFavorite() {
    if (!this.requireLogin()) return;
    const favorited = !this.data.favorited;
    this.setData({ favorited, 'artwork.metrics.favorites': this.data.artwork.metrics.favorites + (favorited ? 1 : -1) });
  },

  copyPrompt() {
    wx.setClipboardData({ data: this.data.artwork.prompt });
  },

  updateComment(event) {
    this.setData({ commentText: event.detail.value });
  },

  publishComment() {
    if (!this.requireLogin() || this.data.submitting) return;
    const content = this.data.commentText.trim();
    if (!content) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }
    const comments = [{ id: `local-${Date.now()}`, author: '林桐漫步', initial: '林', time: '刚刚', content, likes: 0 }].concat(this.data.comments);
    this.setData({ comments, commentText: '', 'artwork.metrics.comments': this.data.artwork.metrics.comments + 1 });
  },
});
