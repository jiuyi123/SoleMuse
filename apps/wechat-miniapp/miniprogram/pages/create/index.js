const imageMedia = require('../../core/media/image');
const draftStorage = require('../../core/storage/draft-storage');
const mediaService = require('../../services/media-service');
const demoContent = require('../../services/demo-content-service');
const { isApiEnabled } = require('../../services/api-mode');
const router = require('../../core/navigation/router');
const getNavigationLayout = require('../../utils/navigation-layout');
const syncTabBar = require('../../utils/sync-tab-bar');

Page({
  data: {
    images: [],
    categories: ['运动鞋', '休闲鞋', '潮流鞋', '商务鞋', '户外鞋'],
    descriptionExpanded: false,
    entranceReady: true,
    transitionArrival: false,
    headerBarHeight: 60,
    headerRightInset: 104,
    tagOptions: ['未来科技', '国风新中式', '自然灵感', '可持续'].map((label) => ({ label, selected: false })),
    tools: ['Midjourney', 'DALL·E 3', 'Stable Diffusion', 'Leonardo', '腾讯混元', '非 AI 生成', '来源未标注'],
    toolIndex: 0,
    form: { title: '', prompt: '', sourceName: 'Midjourney', category: '', tags: [], description: '' },
    submitting: false,
    statusBarHeight: 20,
  },

  onLoad() {
    const app = getApp();
    const transitionArrival = Boolean(app.globalData.creationTransitionPending);
    app.globalData.creationTransitionPending = false;
    this.initialTransitionArrival = transitionArrival;
    const { menuRightInset, navigationHeight, statusBarHeight } = getNavigationLayout();
    this.setData({
      entranceReady: !transitionArrival,
      headerBarHeight: Math.max(60, navigationHeight),
      headerRightInset: menuRightInset + 8,
      statusBarHeight,
      transitionArrival,
    });
    const draft = draftStorage.getDraft();
    if (draft) {
      const form = draft.form || this.data.form;
      const selectedTags = form.tags || [];
      const categories = this.data.categories.slice();
      if (form.category && categories.indexOf(form.category) < 0) categories.push(form.category);
      const tagOptions = this.data.tagOptions.map((item) => Object.assign({}, item, { selected: selectedTags.indexOf(item.label) >= 0 }));
      selectedTags.forEach((label) => {
        if (!tagOptions.some((item) => item.label === label)) tagOptions.push({ label, selected: true });
      });
      this.setData({
        categories,
        images: draft.images || [],
        form,
        tagOptions,
      });
    }
  },

  onReady() {
    if (!this.initialTransitionArrival) return;
    this.playEntranceTransition();
  },

  playEntranceTransition() {
    clearTimeout(this.entranceTimer);
    clearTimeout(this.entranceCleanupTimer);
    this.entranceTimer = setTimeout(() => {
      this.setData({ entranceReady: true });
    }, 20);
    this.entranceCleanupTimer = setTimeout(() => {
      this.setData({ transitionArrival: false });
    }, 300);
  },

  onShow() {
    syncTabBar(this, 2, { hidden: true });
    const app = getApp();
    if (!app.globalData.creationTransitionPending) return;
    app.globalData.creationTransitionPending = false;
    this.setData({ entranceReady: false, transitionArrival: true }, () => {
      wx.nextTick(() => this.playEntranceTransition());
    });
  },

  onUnload() {
    clearTimeout(this.entranceTimer);
    clearTimeout(this.entranceCleanupTimer);
  },

  goBack() {
    router.navigateBack();
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

  pastePrompt() {
    wx.getClipboardData({
      success: (result) => {
        const clipboardText = String(result.data || '');
        if (!clipboardText.trim()) {
          wx.showToast({ title: '剪贴板中没有文字', icon: 'none' });
          return;
        }
        const prompt = clipboardText.slice(0, 500);
        this.setData({ 'form.prompt': prompt });
        wx.showToast({ title: clipboardText.length > 500 ? '已粘贴前 500 字' : '已粘贴', icon: 'none' });
      },
      fail: () => {
        wx.showToast({ title: '无法读取剪贴板', icon: 'none' });
      },
    });
  },

  chooseTool(event) {
    const toolIndex = Number(event.detail.value);
    this.setData({ toolIndex, 'form.sourceName': this.data.tools[toolIndex] });
  },

  chooseCategory(event) {
    this.setData({ 'form.category': event.currentTarget.dataset.value });
  },

  addCustomCategory() {
    wx.showModal({
      title: '自定义作品分类',
      editable: true,
      placeholderText: '请输入分类名称',
      success: (result) => {
        if (!result.confirm) return;
        const value = (result.content || '').trim();
        if (!value) {
          wx.showToast({ title: '请输入分类名称', icon: 'none' });
          return;
        }
        if (value.length > 12) {
          wx.showToast({ title: '分类名称最多 12 个字', icon: 'none' });
          return;
        }
        const categories = this.data.categories.slice();
        if (categories.indexOf(value) < 0) categories.push(value);
        this.setData({ categories, 'form.category': value });
      },
    });
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

  addCustomTag() {
    wx.showModal({
      title: '自定义风格标签',
      editable: true,
      placeholderText: '请输入标签名称',
      success: (result) => {
        if (!result.confirm) return;
        const value = (result.content || '').trim();
        if (!value) {
          wx.showToast({ title: '请输入标签名称', icon: 'none' });
          return;
        }
        if (value.length > 12) {
          wx.showToast({ title: '标签名称最多 12 个字', icon: 'none' });
          return;
        }
        const tags = this.data.form.tags.slice();
        if (tags.indexOf(value) < 0) tags.push(value);
        const tagOptions = this.data.tagOptions.map((item) => Object.assign({}, item, { selected: tags.indexOf(item.label) >= 0 }));
        if (!tagOptions.some((item) => item.label === value)) tagOptions.push({ label: value, selected: true });
        this.setData({ tagOptions, 'form.tags': tags });
      },
    });
  },

  toggleDescription() {
    this.setData({ descriptionExpanded: !this.data.descriptionExpanded });
  },

  async saveDraft() {
    if (this.data.submitting) return;
    if (isApiEnabled()) {
      this.setData({ submitting: true });
      try {
        const uploaded = await mediaService.uploadImages(this.data.images);
        await demoContent.saveArtwork(this.buildArtworkPayload(uploaded, 'draft'));
        this.setData({ submitting: false });
        wx.showToast({ title: '草稿已保存', icon: 'success' });
      } catch (error) {
        this.setData({ submitting: false });
        wx.showToast({ title: '草稿保存失败，请重试', icon: 'none' });
      }
      return;
    }
    draftStorage.saveDraft({ images: this.data.images, form: this.data.form, savedAt: Date.now() });
    wx.showToast({ title: '草稿已保存', icon: 'success' });
  },

  buildArtworkPayload(uploaded, status) {
    const uploadedResults = Array.isArray(uploaded) ? uploaded : [];
    const assetIds = uploaded.assetIds || uploadedResults.map((item) => item.assetId).filter(Boolean);
    const urls = uploaded.urls || uploadedResults.map((item) => item.url).filter(Boolean);
    return {
      title: this.data.form.title.trim(),
      prompt: this.data.form.prompt.trim(),
      description: this.data.form.description.trim(),
      workType: 'ai_generated',
      categoryId: this.data.form.category,
      tags: this.data.form.tags,
      imageAssetIds: assetIds,
      images: urls,
      aiSource: { type: 'ai', name: this.data.form.sourceName, version: '' },
      status,
    };
  },

  async publishArtwork() {
    if (this.data.submitting) return;
    const form = this.data.form;
    if (!this.data.images.length || !form.title.trim() || !form.prompt.trim() || !form.sourceName || !form.category || !form.tags.length) {
      wx.showToast({ title: '请完成图片和必填信息', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    if (isApiEnabled()) {
      try {
        const uploadedResults = await mediaService.uploadImages(this.data.images);
        await demoContent.saveArtwork(this.buildArtworkPayload({
          assetIds: uploadedResults.map((item) => item.assetId).filter(Boolean),
          urls: uploadedResults.map((item) => item.url).filter(Boolean),
        }, 'published'));
        draftStorage.clearDraft();
        this.setData({ submitting: false });
        wx.showToast({ title: '作品发布成功', icon: 'success' });
      } catch (error) {
        this.setData({ submitting: false });
        wx.showToast({ title: '作品发布失败，请重试', icon: 'none' });
      }
      return;
    }
    setTimeout(() => {
      draftStorage.clearDraft();
      this.setData({ submitting: false });
      wx.showToast({ title: '开发预览：发布成功', icon: 'none' });
    }, 400);
  },
});
