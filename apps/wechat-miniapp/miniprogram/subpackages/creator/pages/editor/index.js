Page({
  data: {
    artworkId: '',
    mode: 'create',
    submitting: false,
    form: {
      title: '',
      prompt: '',
      sourceName: '',
      category: '',
    },
  },

  onLoad(options) {
    const artworkId = options.id || '';
    this.setData({ artworkId, mode: artworkId ? 'edit' : 'create' });
  },

  updateField(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: event.detail.value });
  },

  saveDraft() {
    if (this.data.submitting) return;
    wx.showToast({ title: '草稿接口待接入', icon: 'none' });
  },

  publishArtwork() {
    if (this.data.submitting) return;
    wx.showToast({ title: '发布接口待接入', icon: 'none' });
  },
});
