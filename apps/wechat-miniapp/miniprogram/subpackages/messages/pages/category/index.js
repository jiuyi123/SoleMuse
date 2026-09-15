const ROUTES = require('../../../../constants/routes');
const router = require('../../../../core/navigation/router');
const demoContentService = require('../../../../services/demo-content-service');

const CATEGORY_TITLES = Object.freeze({
  reaction: '收到的赞和收藏',
  follow: '新增关注',
  comment: '评论和@',
});

Page({
  data: {
    filter: '',
    title: '互动消息',
    messages: [],
    loading: true,
    loadFailed: false,
  },

  onLoad(options) {
    const filter = CATEGORY_TITLES[options.filter] ? options.filter : 'reaction';
    this.setData({ filter, title: CATEGORY_TITLES[filter] });
    this.loadMessages();
  },

  async loadMessages() {
    this.setData({ loading: true, loadFailed: false });
    try {
      const messages = await demoContentService.getMessagesByCategory(this.data.filter);
      this.setData({ messages, loading: false });
    } catch (error) {
      this.setData({ loading: false, loadFailed: true });
    }
  },

  openNotification(event) {
    const item = this.data.messages.find((message) => message.id === event.currentTarget.dataset.id);
    if (!item) return;
    if (item.type === 'follow') {
      wx.showToast({ title: '用户主页建设中', icon: 'none' });
      return;
    }
    if (item.artworkId) router.navigateTo(ROUTES.ARTWORK_DETAIL, { id: item.artworkId });
  },
});
