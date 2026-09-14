const ROUTES = require('../../../../constants/routes');
const router = require('../../../../core/navigation/router');
const demoContent = require('../../../../services/demo-content-service');

Page({
  data: {
    keyword: '',
    selectedTag: '',
    artworks: [],
    sort: 'latest',
    loading: true,
    filters: ['分类', '风格标签', 'AI生成源', '发布时间'],
  },

  onLoad(options) {
    this.setData({ selectedTag: options.tag || '' });
    this.runSearch();
  },

  handleKeywordInput(event) {
    this.setData({ keyword: event.detail.value });
  },

  async runSearch() {
    this.setData({ loading: true });
    const artworks = await demoContent.searchArtworks();
    const keyword = this.data.keyword.trim();
    const selectedTag = this.data.selectedTag;
    const filtered = artworks.filter((artwork) => {
      const keywordMatch = !keyword || `${artwork.title}${artwork.author.nickname}${artwork.tags.join('')}`.includes(keyword);
      const tagMatch = !selectedTag || artwork.tags.join('').includes(selectedTag) || artwork.title.includes(selectedTag.replace('颐绣灵感', '颐绣'));
      return keywordMatch && tagMatch;
    });
    this.setData({ artworks: filtered, loading: false });
  },

  submitSearch() {
    this.runSearch();
  },

  clearSearch() {
    this.setData({ keyword: '', selectedTag: '' }, () => this.runSearch());
  },

  openArtwork(event) {
    router.navigateTo(ROUTES.ARTWORK_DETAIL, { id: event.detail.artworkId });
  },

  changeSort(event) {
    const sort = event.currentTarget.dataset.sort;
    const artworks = this.data.artworks.slice();
    if (sort === 'hottest') artworks.sort((a, b) => b.metrics.likes - a.metrics.likes);
    this.setData({ sort, artworks });
  },

  showFilter(event) {
    wx.showToast({ title: `${event.currentTarget.dataset.filter}筛选待接口字典接入`, icon: 'none' });
  },
});
