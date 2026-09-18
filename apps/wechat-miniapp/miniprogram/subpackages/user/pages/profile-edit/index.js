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

  async saveProfile() {
    if (this.data.submitting) return;
    this.setData({ submitting: true });
    try {
      await demoContentService.updateProfile({
        nickname: this.data.profile.nickname.trim(),
        region: this.data.profile.region.trim(),
        role: this.data.profile.role.trim(),
        bio: this.data.profile.bio || '',
        specialties: this.data.profile.specialties.split('、').map((item) => item.trim()).filter(Boolean),
      });
      wx.showToast({ title: '资料已保存', icon: 'success' });
    } catch (error) {
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
    this.setData({ submitting: false });
  },
});
