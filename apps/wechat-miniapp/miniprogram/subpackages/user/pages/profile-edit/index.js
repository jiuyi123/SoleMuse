const demoContentService = require('../../../../services/demo-content-service');

Page({
  data: {
    submitting: false,
    profile: { nickname: '', region: '', role: '', specialties: '' },
  },

  async onLoad() {
    const profile = await demoContentService.getProfile();
    this.setData({ profile: Object.assign({}, profile, { specialties: profile.specialties.join('、') }) });
  },

  updateField(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`profile.${field}`]: event.detail.value });
  },

  saveProfile() {
    if (this.data.submitting) return;
    wx.showToast({ title: '开发预览：资料已保存', icon: 'none' });
  },
});
