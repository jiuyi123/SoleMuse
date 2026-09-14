function getNavigationLayout() {
  const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
  const menu = wx.getMenuButtonBoundingClientRect();
  const statusBarHeight = windowInfo.statusBarHeight || 20;
  const navigationHeight = Math.max(44, (menu.top - statusBarHeight) * 2 + menu.height);
  const menuBottom = menu.bottom || statusBarHeight + navigationHeight;

  return { menuBottom, navigationHeight, statusBarHeight };
}

module.exports = getNavigationLayout;
