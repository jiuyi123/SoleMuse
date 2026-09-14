const ROUTES = require('../../../../constants/routes');
const imageMedia = require('../../../../core/media/image');
const router = require('../../../../core/navigation/router');
const demoContentService = require('../../../../services/demo-content-service');

Page({
  data: {
    artworkId: '',
    mode: 'edit',
    images: [],
    categories: ['运动鞋', '休闲鞋', '潮流鞋', '商务鞋', '户外鞋'],
    tagOptions: ['未来科技', '国风新中式', '自然灵感', '可持续'].map((label) => ({ label, selected: false })),
    tools: ['Midjourney', 'DALL·E 3', 'Stable Diffusion', 'Leonardo', '腾讯混元', '非 AI 生成', '来源未标注'],
    toolIndex: 0,
    form: { title: '', prompt: '', sourceName: '', category: '', tags: [], description: '' },
    submitting: false,
  },

  async onLoad(options) {
    const artworkId = options.id || 'prototype-cloud-walker';
    const { artwork } = await demoContentService.getArtwork(artworkId);
    const sourceName = artwork.aiSource.name;
    const toolIndex = Math.max(0, this.data.tools.indexOf(sourceName));
    const tags = artwork.tags.slice(0, 3);
    this.setData({
      artworkId,
      mode: options.id ? 'edit' : 'create',
      images: artwork.images,
      toolIndex,
      form: {
        title: artwork.title,
        prompt: artwork.prompt,
        sourceName,
        category: '运动鞋',
        tags,
        description: artwork.description,
      },
      tagOptions: this.data.tagOptions.map((item) => Object.assign({}, item, { selected: tags.indexOf(item.label) >= 0 })),
    });
  },

  async chooseImages() {
    const remaining = 9 - this.data.images.length;
    if (remaining <= 0) return wx.showToast({ title: '最多上传 9 张图片', icon: 'none' });
    try {
      const result = await imageMedia.chooseImages(remaining);
      this.setData({ images: this.data.images.concat(result.tempFiles.map((item) => item.tempFilePath)) });
    } catch (error) {
      if (!error.errMsg || !error.errMsg.includes('cancel')) wx.showToast({ title: '选择图片失败', icon: 'none' });
    }
  },

  previewImage(event) { imageMedia.previewImages(this.data.images, event.currentTarget.dataset.url); },
  updateField(event) { this.setData({ [`form.${event.currentTarget.dataset.field}`]: event.detail.value }); },
  chooseTool(event) {
    const toolIndex = Number(event.detail.value);
    this.setData({ toolIndex, 'form.sourceName': this.data.tools[toolIndex] });
  },
  chooseCategory(event) { this.setData({ 'form.category': event.currentTarget.dataset.value }); },
  toggleTag(event) {
    const value = event.currentTarget.dataset.value;
    const tags = this.data.form.tags.slice();
    const index = tags.indexOf(value);
    if (index >= 0) tags.splice(index, 1); else tags.push(value);
    this.setData({
      'form.tags': tags,
      tagOptions: this.data.tagOptions.map((item) => Object.assign({}, item, { selected: tags.indexOf(item.label) >= 0 })),
    });
  },
  viewArtwork() { router.navigateTo(ROUTES.ARTWORK_DETAIL, { id: this.data.artworkId }); },
  takeDown() {
    wx.showModal({
      title: '确认下架作品？',
      content: '下架后作品仅自己可见，之后仍可重新发布。',
      confirmText: '确认下架',
      success: (result) => { if (result.confirm) wx.showToast({ title: '开发预览：已下架', icon: 'none' }); },
    });
  },
  saveChanges() { wx.showToast({ title: '开发预览：修改已保存', icon: 'none' }); },
  publishArtwork() { wx.showToast({ title: '开发预览：发布成功', icon: 'none' }); },
});
