function syncTabBar(page, selected, options = {}) {
  if (page && typeof page.getTabBar === 'function') {
    const tabBar = page.getTabBar();
    if (tabBar) tabBar.setData({ hidden: Boolean(options.hidden), selected });
  }
}

module.exports = syncTabBar;
