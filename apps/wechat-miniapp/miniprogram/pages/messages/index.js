const ROUTES = require('../../constants/routes');
const session = require('../../core/auth/session');
const router = require('../../core/navigation/router');
const demoContentService = require('../../services/demo-content-service');
const syncTabBar = require('../../utils/sync-tab-bar');

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'reaction', label: '互动' },
  { key: 'comment', label: '评论' },
  { key: 'system', label: '系统' },
];

Page({
  data: { isAuthenticated: false, filters: FILTERS, activeFilter: 'all', messages: [], visibleMessages: [] },
  async onShow() {
    syncTabBar(this, 3);
    const isAuthenticated = session.isAuthenticated();
    this.setData({ isAuthenticated });
    if (isAuthenticated && !this.data.messages.length) {
      const messages = await demoContentService.getMessages();
      this.setData({ messages, visibleMessages: messages });
    }
  },
  openLogin() { router.navigateTo(ROUTES.LOGIN, { redirect: ROUTES.MESSAGES }); },
  changeFilter(event) {
    const activeFilter = event.currentTarget.dataset.key;
    const visibleMessages = this.data.messages.filter((item) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'reaction') return item.type === 'like' || item.type === 'favorite';
      if (activeFilter === 'comment') return item.type === 'comment';
      return item.type === 'system' || item.type === 'status';
    });
    this.setData({ activeFilter, visibleMessages });
  },
  openMessage(event) {
    const item = this.data.messages.find((message) => message.id === event.currentTarget.dataset.id);
    if (!item) return;
    if (item.artworkId) router.navigateTo(ROUTES.ARTWORK_DETAIL, { id: item.artworkId });
    else router.navigateTo(ROUTES.NOTICE_DETAIL, { id: item.id });
  },
});
