const router = require('../../../core/navigation/router');
const getNavigationLayout = require('../../../utils/navigation-layout');

Component({
  properties: {
    title: { type: String, value: '' },
    back: { type: Boolean, value: false },
    transparent: { type: Boolean, value: false },
  },

  data: {
    statusBarHeight: 20,
    navigationHeight: 44,
  },

  lifetimes: {
    attached() {
      const { navigationHeight, statusBarHeight } = getNavigationLayout();
      this.setData({ statusBarHeight, navigationHeight });
    },
  },

  methods: {
    goBack() {
      router.navigateBack();
    },
  },
});
