const ROUTES = require('../../../../constants/routes');
const router = require('../../../../core/navigation/router');
const demoContentService = require('../../../../services/demo-content-service');

const TABS = [
  { key: 'artworks', label: '作品' },
  { key: 'favorites', label: '收藏' },
  { key: 'likes', label: '点赞' },
  { key: 'comments', label: '评论' },
];

Page({
  data: { activeType: 'artworks', tabs: TABS, items: [], profile: null, loading: true },
  onLoad(options) {
    const activeType = TABS.some((item) => item.key === options.type) ? options.type : 'artworks';
    this.setData({ activeType });
    this.loadContent();
  },
  async loadContent() {
    this.setData({ loading: true });
    const [profile, allItems] = await Promise.all([demoContentService.getProfile(), demoContentService.getMyContent()]);
    this.setData({ profile, items: this.selectItems(allItems, this.data.activeType), loading: false });
  },
  selectItems(items, type) {
    if (type === 'favorites') return items.slice(1, 6);
    if (type === 'likes') return items.slice().reverse();
    if (type === 'comments') return items.slice(0, 3);
    return items;
  },
  async changeTab(event) {
    const activeType = event.currentTarget.dataset.type;
    const allItems = await demoContentService.getMyContent();
    this.setData({ activeType, items: this.selectItems(allItems, activeType) });
  },
  openArtwork(event) { router.navigateTo(ROUTES.ARTWORK_DETAIL, { id: event.detail.artworkId }); },
  openMenu(event) {
    const artworkId = event.detail.artworkId;
    wx.showActionSheet({
      itemList: ['编辑作品', '下架作品'],
      success: (result) => {
        if (result.tapIndex === 0) router.navigateTo(ROUTES.ARTWORK_EDITOR, { id: artworkId });
        if (result.tapIndex === 1) wx.showToast({ title: '开发预览：已下架', icon: 'none' });
      },
    });
  },
});
