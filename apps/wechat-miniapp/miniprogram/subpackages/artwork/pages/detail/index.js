Page({
  data: {
    artworkId: '',
    artwork: null,
  },

  onLoad(options) {
    this.setData({ artworkId: options.id || '' });
  },

  showPendingMessage() {
    wx.showToast({ title: '详情接口待接入', icon: 'none' });
  },
});
