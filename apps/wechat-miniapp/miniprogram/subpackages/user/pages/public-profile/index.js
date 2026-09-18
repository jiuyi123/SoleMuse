const ROUTES = require('../../../../constants/routes');
const router = require('../../../../core/navigation/router');
const demoContentService = require('../../../../services/demo-content-service');
const getNavigationLayout = require('../../../../utils/navigation-layout');

Page({
  data: {
    userId: '',
    profile: null,
    profileInitial: '',
    artworks: [],
    statusBarHeight: 20,
    navigationHeight: 44,
    headerRightInset: 104,
    following: false,
    followPending: false,
    loading: true,
    loadFailed: false,
  },

  onLoad(options) {
    const { statusBarHeight, navigationHeight, menuRightInset } = getNavigationLayout();
    this.setData({
      userId: options.id || '',
      statusBarHeight,
      navigationHeight,
      headerRightInset: menuRightInset + 8,
    });
    this.loadProfile();
  },

  async loadProfile() {
    this.setData({ loading: true, loadFailed: false });
    try {
      const result = await demoContentService.getPublicProfile(this.data.userId);
      if (!result) throw new Error('Public profile not found');
      this.setData({
        profile: result.profile,
        profileInitial: result.profile.nickname.slice(0, 1),
        artworks: result.artworks,
        following: result.profile.isFollowing,
        loading: false,
      });
    } catch (error) {
      this.setData({ loading: false, loadFailed: true });
    }
  },

  goBack() {
    router.navigateBack();
  },

  async toggleFollow() {
    if (this.data.followPending) return;
    const following = !this.data.following;
    this.setData({ following, followPending: true });
    try {
      const result = await demoContentService.setPublicProfileFollowing(this.data.userId, following);
      this.setData({ following: result.following, followPending: false });
    } catch (error) {
      this.setData({ following: !following, followPending: false });
    }
  },

  async openChat() {
    if (!this.data.profile) return;
    try {
      const conversation = await demoContentService.startConversation(this.data.userId);
      if (conversation && conversation.id) router.navigateTo(ROUTES.CHAT, { conversationId: conversation.id, id: conversation.id });
    } catch (error) {
      wx.showToast({ title: '暂时无法发起私信', icon: 'none' });
    }
  },

  openArtwork(event) {
    router.navigateTo(ROUTES.ARTWORK_DETAIL, { id: event.detail.artworkId });
  },
});
