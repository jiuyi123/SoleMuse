function previewImages(urls, current) {
  return wx.previewImage({ urls, current: current || urls[0] });
}

function chooseImages(count) {
  return wx.chooseMedia({
    count,
    mediaType: ['image'],
    sourceType: ['album', 'camera'],
    sizeType: ['compressed'],
  });
}

module.exports = {
  chooseImages,
  previewImages,
};
