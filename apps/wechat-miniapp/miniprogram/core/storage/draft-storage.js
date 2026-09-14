const DRAFT_KEY = 'solemuse.artwork-draft';

function saveDraft(draft) {
  wx.setStorageSync(DRAFT_KEY, draft);
}

function getDraft() {
  return wx.getStorageSync(DRAFT_KEY) || null;
}

function clearDraft() {
  wx.removeStorageSync(DRAFT_KEY);
}

module.exports = {
  clearDraft,
  getDraft,
  saveDraft,
};
