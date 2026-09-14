const imageMedia = require('../../core/media/image');
const draftStorage = require('../../core/storage/draft-storage');
const syncTabBar = require('../../utils/sync-tab-bar');

Page({
  data: {
    images: [],
    categories: ['运动鞋', '休闲鞋', '潮流鞋', '商务鞋', '户外鞋'],
    tagOptions: ['未来科技', '国风新中式', '自然灵感', '可持续'].map((label) => ({ label, selected: false })),
    tools: ['Midjourney', 'DALL·E 3', 'Stable Diffusion', 'Leonardo', '腾讯混元', '非 AI 生成', '来源未标注'],
    toolIndex: 0,
    form: { title: '', prompt: '', sourceName: 'Midjourney', category: '', tags: [], description: '' },
    submitting: false,
  },

  onLoad() {
    const draft = draftStorage.getDraft();
    if (draft) {
      const form = draft.form || this.data.form;
      const selectedTags = form.tags || [];
      this.setData({
        images: draft.images || [],
        form,
        tagOptions: this.data.tagOptions.map((item) => Object.assign({}, item, { selected: selectedTags.indexOf(item.label) >= 0 })),
      });
    }
  },

  onShow() {
    syncTabBar(this, 2);
  },

  async chooseImages() {
    const remaining = 9 - this.data.images.length;
    if (remaining <= 0) {
      wx.showToast({ title: '最多上传 9 张图片', icon: 'none' });
      return;
    }
    try {
      const result = await imageMedia.chooseImages(remaining);
      const images = this.data.images.concat(result.tempFiles.map((item) => item.tempFilePath));
      this.setData({ images });
    } catch (error) {
      if (!error.errMsg || !error.errMsg.includes('cancel')) wx.showToast({ title: '选择图片失败', icon: 'none' });
    }
  },

  previewImage(event) {
    imageMedia.previewImages(this.data.images, event.currentTarget.dataset.url);
  },

  updateField(event) {
    this.setData({ [`form.${event.currentTarget.dataset.field}`]: event.detail.value });
  },

  chooseTool(event) {
    const toolIndex = Number(event.detail.value);
    this.setData({ toolIndex, 'form.sourceName': this.data.tools[toolIndex] });
  },

  chooseCategory(event) {
    this.setData({ 'form.category': event.currentTarget.dataset.value });
  },

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

  saveDraft() {
    if (this.data.submitting) return;
    draftStorage.saveDraft({ images: this.data.images, form: this.data.form, savedAt: Date.now() });
    wx.showToast({ title: '草稿已保存', icon: 'success' });
  },

  publishArtwork() {
    if (this.data.submitting) return;
    const form = this.data.form;
    if (!this.data.images.length || !form.title.trim() || !form.prompt.trim() || !form.sourceName || !form.category) {
      wx.showToast({ title: '请完成图片和必填信息', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    setTimeout(() => {
      draftStorage.clearDraft();
      this.setData({ submitting: false });
      wx.showToast({ title: '开发预览：发布成功', icon: 'none' });
    }, 400);
  },
});
