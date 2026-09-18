const http = require('../core/http/client');
const { isApiEnabled } = require('./api-mode');

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({ filePath, success: resolve, fail: reject });
  });
}

async function uploadImage(filePath) {
  if (!isApiEnabled() || !filePath || String(filePath).startsWith('/assets/') || String(filePath).startsWith('http')) {
    return { assetId: '', url: filePath };
  }
  const file = await readFile(filePath);
  const filename = String(filePath).split('/').pop() || `image-${Date.now()}.jpg`;
  const mimeType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  const presign = await http.request({ path: '/uploads/presign', method: 'POST', data: { filename, mimeType, size: file.data.byteLength } });
  const completed = await http.request({
    path: presign.uploadUrl.replace(/^.*\/api\/v1/, ''),
    method: 'POST',
    data: file.data,
    header: { 'content-type': 'application/octet-stream' },
  });
  return { assetId: completed.assetId, url: completed.url };
}

async function uploadImages(filePaths) {
  const results = [];
  for (const filePath of filePaths || []) results.push(await uploadImage(filePath));
  return results;
}

module.exports = {
  uploadImage,
  uploadImages,
};
