const ROUTES = require('../constants/routes');
const router = require('../core/navigation/router');

Component({
  data: {
    selected: 0,
    unread: 2,
    items: [
      { text: '首页', icon: '⌂', path: ROUTES.HOME },
      { text: '榜单', icon: '♕', path: ROUTES.RANKING },
      { text: '创作', icon: '+', path: ROUTES.CREATE, raised: true },
      { text: '消息', icon: '◌', path: ROUTES.MESSAGES },
      { text: '我的', icon: '♙', path: ROUTES.PROFILE },
    ],
  },

  methods: {
    switchTab(event) {
      const index = Number(event.currentTarget.dataset.index);
      const item = this.data.items[index];
      if (!item || index === this.data.selected) return;
      router.switchTab(item.path);
    },
  },
});
