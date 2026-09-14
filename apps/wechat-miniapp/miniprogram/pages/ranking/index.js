const ROUTES = require('../../constants/routes');
const router = require('../../core/navigation/router');
const demoContent = require('../../services/demo-content-service');
const syncTabBar = require('../../utils/sync-tab-bar');

Page({
  data: {
    period: 'day',
    periods: [
      { value: 'day', label: '24小时热榜' },
      { value: 'week', label: '周榜' },
      { value: 'month', label: '月榜' },
    ],
    podiums: [],
    ranking: [],
    showRules: false,
  },

  onLoad() {
    this.loadRanking();
  },

  onShow() {
    syncTabBar(this, 1);
  },

  async loadRanking() {
    const source = await demoContent.getRanking();
    const ranking = source.map((item) => Object.assign({}, item, {
      authorInitial: String(item.author || '?').charAt(0).toUpperCase(),
      metrics: Object.assign({ likes: item.heat || 0, favorites: 0, comments: 0 }, item.metrics),
    }));
    this.setData({ podiums: [ranking[1], ranking[0], ranking[2]], ranking: ranking.slice(3) });
  },

  openArtwork(event) {
    const artworkId = event.currentTarget.dataset.id || event.detail.artworkId;
    router.navigateTo(ROUTES.ARTWORK_DETAIL, { id: artworkId });
  },

  changePeriod(event) {
    this.setData({ period: event.currentTarget.dataset.period });
  },

  toggleRules() {
    this.setData({ showRules: !this.data.showRules });
  },

  noop() {},
});
