const ROUTES = require('../constants/routes');
const router = require('../core/navigation/router');
const calculateCircularReveal = require('../utils/circular-reveal');

const CREATION_TAB_INDEX = 2;
const REVEAL_DIAMETER = 64;
const REVEAL_DURATION = 560;

Component({
  data: {
    hidden: false,
    transitionVisible: false,
    transitionExpanded: false,
    transitionX: 0,
    transitionY: 0,
    transitionScale: 0.02,
    transitioning: false,
    ready: false,
    selected: -1,
    unread: 2,
    items: [
      { text: '首页', icon: '/assets/icons/tab-home.svg', activeIcon: '/assets/icons/tab-home-active.svg', path: ROUTES.HOME },
      { text: '榜单', icon: '/assets/icons/tab-ranking.svg', activeIcon: '/assets/icons/tab-ranking-active.svg', path: ROUTES.RANKING },
      { text: '创作', icon: '/assets/icons/tab-create.svg', activeIcon: '/assets/icons/tab-create.svg', path: ROUTES.CREATE, raised: true },
      { text: '消息', icon: '/assets/icons/tab-messages.svg', activeIcon: '/assets/icons/tab-messages-active.svg', path: ROUTES.MESSAGES },
      { text: '我的', icon: '/assets/icons/tab-profile.svg', activeIcon: '/assets/icons/tab-profile-active.svg', path: ROUTES.PROFILE },
    ],
  },

  lifetimes: {
    detached() {
      this.clearTransitionTimers();
    },
  },

  methods: {
    switchTab(event) {
      if (this.data.transitioning) return;
      const index = Number(event.currentTarget.dataset.index);
      const item = this.data.items[index];
      if (!item || index === this.data.selected) return;
      if (index === CREATION_TAB_INDEX) {
        this.startCreationTransition(item.path);
        return;
      }
      router.switchTab(item.path);
    },

    startCreationTransition(path) {
      this.setData({ transitioning: true });
      const viewport = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      this.createSelectorQuery()
        .select('.tab-item--raised .tab-icon-wrap')
        .boundingClientRect((rect) => {
          const reveal = calculateCircularReveal(rect, viewport, REVEAL_DIAMETER);
          this.setData({
            transitionExpanded: false,
            transitionScale: 0.02,
            transitionVisible: true,
            transitionX: reveal.centerX,
            transitionY: reveal.centerY,
          });

          wx.nextTick(() => {
            this.expansionTimer = setTimeout(() => {
              this.setData({
                transitionExpanded: true,
                transitionScale: reveal.scale,
              }, () => {
                this.navigationTimer = setTimeout(() => {
                  getApp().globalData.creationTransitionPending = true;
                  const navigation = router.switchTab(path);
                  if (navigation && typeof navigation.catch === 'function') {
                    navigation.catch(() => this.resetCreationTransition());
                  }
                }, REVEAL_DURATION + 20);

                this.fallbackTimer = setTimeout(() => this.resetCreationTransition(), REVEAL_DURATION + 1200);
              });
            }, 16);
          });
        })
        .exec();
    },

    blockTransitionInteraction() {},

    resetCreationTransition() {
      this.clearTransitionTimers();
      const app = getApp();
      if (app && app.globalData) app.globalData.creationTransitionPending = false;
      this.setData({
        transitionExpanded: false,
        transitionScale: 0.02,
        transitionVisible: false,
        transitioning: false,
      });
    },

    clearTransitionTimers() {
      clearTimeout(this.expansionTimer);
      clearTimeout(this.navigationTimer);
      clearTimeout(this.fallbackTimer);
      this.expansionTimer = null;
      this.navigationTimer = null;
      this.fallbackTimer = null;
    },
  },
});
