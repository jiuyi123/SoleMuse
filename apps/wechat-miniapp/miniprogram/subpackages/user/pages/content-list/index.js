const TITLES = Object.freeze({
  artworks: '我的作品',
  favorites: '我的收藏',
  likes: '我的点赞',
  comments: '我的评论',
});

Page({
  data: { type: 'artworks', title: '我的作品', items: [] },

  onLoad(options) {
    const type = TITLES[options.type] ? options.type : 'artworks';
    this.setData({ type, title: TITLES[type] });
    wx.setNavigationBarTitle({ title: TITLES[type] });
  },
});
