Page({
  data: { noticeId: '' },

  onLoad(options) {
    this.setData({ noticeId: options.id || '' });
  },
});
