const ROUTES = require('../../constants/routes');
const session = require('../../core/auth/session');
const router = require('../../core/navigation/router');
const demoContentService = require('../../services/demo-content-service');
const getNavigationLayout = require('../../utils/navigation-layout');
const syncTabBar = require('../../utils/sync-tab-bar');

const CONTENT_TABS = [
  { key: 'artworks', label: '作品' },
  { key: 'comments', label: '评论' },
  { key: 'likes', label: '点赞' },
  { key: 'favorites', label: '收藏' },
  { key: 'footprints', label: '印迹' },
];

function selectContent(items, type) {
  if (type === 'likes') return items.slice().reverse();
  if (type === 'favorites') return items.slice(1, 6);
  if (type === 'footprints') return items.slice(0, 5).reverse();
  return items.filter((item) => item.status === 'published');
}

Page({
  data: {
    isAuthenticated: false,
    isOwnProfile: false,
    profile: null,
    contentTabs: CONTENT_TABS,
    activeContent: 'artworks',
    activeStatus: 'published',
    allItems: [],
    visibleItems: [],
    myComments: [],
    visibleComments: [],
    commentFilter: 'all',
    publicCommentCount: 0,
    statusBarHeight: 20,
    navigationHeight: 44,
    headerRightInset: 104,
    loading: true,
    loadFailed: false,
  },
  onLoad() {
    const { statusBarHeight, navigationHeight, menuRightInset } = getNavigationLayout();
    this.setData({ statusBarHeight, navigationHeight, headerRightInset: menuRightInset + 8 });
  },
  async onShow() {
    syncTabBar(this, 4);
    const isAuthenticated = session.isAuthenticated();
    this.setData({ isAuthenticated });
    if (isAuthenticated && !this.data.profile) this.loadProfile();
  },
  async loadProfile() {
    this.setData({ loading: true, loadFailed: false });
    try {
      const [profile, allItems, myComments] = await Promise.all([
        demoContentService.getProfile(),
        demoContentService.getMyContent(),
        demoContentService.getMyComments(),
      ]);
      this.setData({
        profile,
        isOwnProfile: true,
        allItems,
        myComments,
        visibleComments: myComments,
        publicCommentCount: myComments.filter((item) => item.visibility === 'public').length,
        visibleItems: this.data.activeContent === 'comments' ? [] : selectContent(allItems, this.data.activeContent),
        loading: false,
      });
    } catch (error) {
      this.setData({ loading: false, loadFailed: true });
    }
  },
  openLogin() { router.navigateTo(ROUTES.LOGIN, { redirect: ROUTES.PROFILE }); },
  editProfile() { router.navigateTo(ROUTES.PROFILE_EDIT); },
  openSettings() { router.navigateTo(ROUTES.SETTINGS); },
  changeContent(event) {
    const activeContent = event.currentTarget.dataset.type;
    this.setData({
      activeContent,
      activeStatus: 'published',
      commentFilter: 'all',
      visibleComments: this.data.myComments,
      visibleItems: activeContent === 'comments' ? [] : selectContent(this.data.allItems, activeContent),
    });
  },
  changeStatus(event) {
    const activeStatus = event.currentTarget.dataset.status;
    const visibleItems = activeStatus === 'draft'
      ? this.data.allItems.filter((item) => item.status === 'draft')
      : selectContent(this.data.allItems, 'artworks');
    this.setData({ activeStatus, visibleItems });
  },
  changeCommentFilter(event) {
    const commentFilter = event.currentTarget.dataset.filter;
    const visibleComments = commentFilter === 'public'
      ? this.data.myComments.filter((item) => item.visibility === 'public')
      : this.data.myComments;
    this.setData({ commentFilter, visibleComments });
  },
  openArtwork(event) { router.navigateTo(ROUTES.ARTWORK_DETAIL, { id: event.detail.artworkId }); },
  openCommentSource(event) { router.navigateTo(ROUTES.ARTWORK_DETAIL, { id: event.currentTarget.dataset.artworkId }); },
});
