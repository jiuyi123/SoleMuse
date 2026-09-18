const ROUTES = require('../../../../constants/routes');
const session = require('../../../../core/auth/session');
const imageMedia = require('../../../../core/media/image');
const router = require('../../../../core/navigation/router');
const demoContent = require('../../../../services/demo-content-service');
const getNavigationLayout = require('../../../../utils/navigation-layout');

Page({
  data: {
    artworkId: '', artwork: null, authorInitial: '', authorBadges: [], comments: [], commentSort: 'latest',
    currentImage: 1, currentImageIndex: 0, followed: false, headerSolid: false, headerTop: 20,
    headerNavigationHeight: 44, headerRightInset: 104, liked: false, favorited: false, shareCount: 0,
    commentText: '', submitting: false, toolDisplay: '',
  },

  onLoad(options) {
    const { menuRightInset, navigationHeight, statusBarHeight } = getNavigationLayout();
    this.setData({ artworkId: options.id || '', headerTop: statusBarHeight, headerNavigationHeight: navigationHeight, headerRightInset: menuRightInset + 8 });
    this.syncNavigationBarTone(false);
    this.loadArtwork();
  },

  onPageScroll(event) {
    const headerSolid = event.scrollTop > 72;
    if (headerSolid === this.data.headerSolid) return;
    this.setData({ headerSolid });
    this.syncNavigationBarTone(headerSolid);
  },

  syncNavigationBarTone(solid) {
    wx.setNavigationBarColor({ frontColor: solid ? '#000000' : '#ffffff', backgroundColor: solid ? '#ffffff' : '#315d79', animation: { duration: 180, timingFunc: 'easeOut' } });
  },

  async loadArtwork() {
    try {
      const result = await demoContent.getArtwork(this.data.artworkId);
      const artwork = result.artwork;
      artwork.metrics.favorites = artwork.metrics.favorites || 0;
      this.sourceComments = result.comments.slice();
      const source = artwork.aiSource || {};
      this.setData({
        artwork,
        authorInitial: artwork.author.nickname.charAt(0).toUpperCase(),
        authorBadges: [artwork.author.role].concat(artwork.author.labels || artwork.author.tags || []).filter(Boolean),
        comments: this.sourceComments,
        followed: Boolean(artwork.followed),
        liked: Boolean(artwork.liked),
        favorited: Boolean(artwork.favorited),
        shareCount: Number(artwork.metrics.shares || 0),
        toolDisplay: [source.name, source.version].filter(Boolean).join(' · '),
      });
    } catch (error) {
      wx.showToast({ title: '作品加载失败，请重试', icon: 'none' });
    }
  },

  changeImage(event) {
    const currentImageIndex = event.detail.current;
    this.setData({ currentImage: currentImageIndex + 1, currentImageIndex });
  },

  selectThumbnail(event) {
    const currentImageIndex = Number(event.currentTarget.dataset.index);
    this.setData({ currentImage: currentImageIndex + 1, currentImageIndex });
  },

  previewImage(event) { imageMedia.previewImages(this.data.artwork.images, event.currentTarget.dataset.url); },

  requireLogin() {
    if (session.isAuthenticated()) return true;
    router.navigateTo(ROUTES.LOGIN, { redirect: ROUTES.ARTWORK_DETAIL, redirectId: this.data.artworkId });
    return false;
  },

  goBack() { router.navigateBack(); },

  openAuthorProfile(event) {
    const userId = event.currentTarget.dataset.userId;
    if (userId) router.navigateTo(ROUTES.PUBLIC_PROFILE, { id: userId });
  },

  async toggleFollow() {
    if (!this.requireLogin()) return;
    const followed = !this.data.followed;
    this.setData({ followed });
    try { await demoContent.setPublicProfileFollowing(this.data.artwork.author.id, followed); } catch (error) { this.setData({ followed: !followed }); }
  },

  async toggleLike() {
    if (!this.requireLogin()) return;
    const liked = !this.data.liked;
    this.setData({ liked, 'artwork.metrics.likes': this.data.artwork.metrics.likes + (liked ? 1 : -1) });
    try { await demoContent.toggleArtworkLike(this.data.artworkId, liked); } catch (error) { this.setData({ liked: !liked, 'artwork.metrics.likes': this.data.artwork.metrics.likes + (liked ? -1 : 1) }); }
  },

  async toggleFavorite() {
    if (!this.requireLogin()) return;
    const favorited = !this.data.favorited;
    this.setData({ favorited, 'artwork.metrics.favorites': this.data.artwork.metrics.favorites + (favorited ? 1 : -1) });
    try { await demoContent.toggleArtworkFavorite(this.data.artworkId, favorited); } catch (error) { this.setData({ favorited: !favorited, 'artwork.metrics.favorites': this.data.artwork.metrics.favorites + (favorited ? -1 : 1) }); }
  },

  copyPrompt() { wx.setClipboardData({ data: this.data.artwork.prompt }); },
  updateComment(event) { this.setData({ commentText: event.detail.value }); },

  changeCommentSort(event) {
    const commentSort = event.currentTarget.dataset.sort;
    const comments = this.sourceComments.slice();
    if (commentSort === 'hottest') comments.sort((left, right) => right.likes - left.likes);
    this.setData({ comments, commentSort });
  },

  async publishComment() {
    if (!this.requireLogin() || this.data.submitting) return;
    const content = this.data.commentText.trim();
    if (!content) { wx.showToast({ title: '请输入评论内容', icon: 'none' }); return; }
    this.setData({ submitting: true });
    try {
      const comment = await demoContent.addArtworkComment(this.data.artworkId, content);
      const comments = [comment].concat(this.sourceComments);
      this.sourceComments = comments.slice();
      this.setData({ comments, commentSort: 'latest', commentText: '', submitting: false, 'artwork.metrics.comments': this.data.artwork.metrics.comments + 1 });
    } catch (error) {
      this.setData({ submitting: false });
      wx.showToast({ title: '评论发布失败，请重试', icon: 'none' });
    }
  },

  onShareAppMessage() {
    return { title: this.data.artwork ? this.data.artwork.title : 'SoleMuse 作品', path: `${ROUTES.ARTWORK_DETAIL}?id=${this.data.artworkId}` };
  },
});
