const ROUTES = require('../../constants/routes');
const session = require('../../core/auth/session');
const router = require('../../core/navigation/router');
const demoContentService = require('../../services/demo-content-service');
const getNavigationLayout = require('../../utils/navigation-layout');
const syncTabBar = require('../../utils/sync-tab-bar');

function selectMessages(messages, filter) {
  if (filter === 'reaction') return messages.filter((item) => item.type === 'like' || item.type === 'favorite');
  if (filter === 'follow') return messages.filter((item) => item.type === 'follow');
  if (filter === 'comment') return messages.filter((item) => item.type === 'comment');
  return messages.filter((item) => item.type === 'direct' || item.type === 'system' || item.type === 'status');
}

Page({
  data: {
    isAuthenticated: false,
    channels: [],
    activeFilter: 'inbox',
    messages: [],
    visibleMessages: [],
    statusBarHeight: 20,
    navigationHeight: 44,
    loading: true,
    loadFailed: false,
  },
  onLoad() {
    const { statusBarHeight, navigationHeight } = getNavigationLayout();
    this.setData({ statusBarHeight, navigationHeight });
  },
  async onShow() {
    syncTabBar(this, 3);
    const isAuthenticated = session.isAuthenticated();
    this.setData({ isAuthenticated });
    if (isAuthenticated && !this.data.messages.length) this.loadMessages();
  },
  async loadMessages() {
    this.setData({ loading: true, loadFailed: false });
    try {
      const [channels, messages] = await Promise.all([
        demoContentService.getMessageChannels(),
        demoContentService.getMessages(),
      ]);
      this.setData({ channels, messages, visibleMessages: selectMessages(messages, 'inbox'), loading: false });
    } catch (error) {
      this.setData({ loading: false, loadFailed: true });
    }
  },
  openLogin() { router.navigateTo(ROUTES.LOGIN, { redirect: ROUTES.MESSAGES }); },
  openChannel(event) {
    const { filter, title } = event.currentTarget.dataset;
    router.navigateTo(ROUTES.MESSAGE_CATEGORY, { filter, title });
  },
  openMessage(event) {
    const item = this.data.messages.find((message) => message.id === event.currentTarget.dataset.id);
    if (!item) return;
    if (item.type === 'direct' || item.type === 'system' || item.type === 'status') {
      router.navigateTo(ROUTES.CHAT, { id: item.id });
      return;
    }
    if (item.artworkId) router.navigateTo(ROUTES.ARTWORK_DETAIL, { id: item.artworkId });
    else router.navigateTo(ROUTES.NOTICE_DETAIL, { id: item.id });
  },
});
