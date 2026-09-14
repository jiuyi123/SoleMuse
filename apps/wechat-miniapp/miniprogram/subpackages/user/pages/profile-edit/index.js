Page({
  data: {
    submitting: false,
    profile: { nickname: '', region: '', role: '', specialties: '' },
  },

  updateField(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`profile.${field}`]: event.detail.value });
  },

  saveProfile() {
    if (this.data.submitting) return;
    wx.showToast({ title: '资料接口待接入', icon: 'none' });
  },
});
