const artworkImages = [1, 2, 3, 4, 5, 6].map(
  (index) => `/assets/images/demo/artworks/artwork-0${index}-${[
    'yixiu-shanhai',
    'yixiu-huayu',
    'yiyun-chaosheng',
    'dongfang-xiujing',
    'liuguang-yixiu',
    'yixiu-future',
  ][index - 1]}.png`,
);

const artworks = [
  ['prototype-artwork-01', '颐绣·山海行', 'Lynn.', 'Midjourney', 328, 56, ['东方美学', 'AI设计']],
  ['prototype-artwork-02', '颐绣花语', 'Sugar', 'DALL·E 3', 512, 72, ['温州颐绣', '国风鞋履']],
  ['prototype-artwork-03', '颐韵·潮生', 'KAI', 'Stable Diffusion', 243, 38, ['科技未来', '鞋履设计']],
  ['prototype-artwork-04', '东方绣境', '绘设计', 'Midjourney', 476, 42, ['东方美学', '自然灵感']],
  ['prototype-artwork-05', '流光颐绣', '小鹿', 'Leonardo', 398, 64, ['春日灵感', 'AI创作']],
  ['prototype-artwork-06', '颐绣 × 未来', 'NeoDesign', '腾讯混元', 291, 31, ['未来科技', '国风新生']],
].map((item, index) => ({
  id: item[0],
  title: item[1],
  coverUrl: artworkImages[index],
  images: [artworkImages[index]],
  author: { id: `prototype-author-${index + 1}`, nickname: item[2], avatarUrl: '' },
  aiSource: { type: 'ai', name: item[3], version: '' },
  status: 'published',
  tags: item[6],
  metrics: { likes: item[4], favorites: Math.round(item[4] * 0.34), comments: item[5], views: 1800 + index * 260 },
  publishedAtDisplay: `2024-0${3 - Math.floor(index / 2)}-${12 - index * 2} 18:${24 - index}`,
}));

const featuredArtwork = {
  id: 'prototype-cloud-walker',
  title: '云境行者',
  tagline: '步履山水，心向远方',
  coverUrl: artworkImages[0],
  images: [artworkImages[0], artworkImages[4], artworkImages[1]],
  author: { id: 'prototype-author-lynn', nickname: 'Lynn.', avatarUrl: '' },
  aiSource: { type: 'ai', name: 'Midjourney', version: 'v6.1' },
  workType: 'AI 生成',
  prompt: '一双融合东方美学与未来科技的运动鞋，灵感来自中国山水画，以温州颐绣的花鸟纹样为设计元素，流动的云雾，水面倒影，柔和的晨光，梦幻唯美，超精细材质，产品摄影，8k，cinematic lighting, water reflection, Chinese aesthetics, --ar 3:2 --v 6.1',
  description: '这双鞋的灵感来源于温州的山水与颐绣文化。将传统的花鸟纹样与现代运动鞋结构相融合，表达“行走在山水之间”的诗意体验。鞋面采用流动的云雾纹理与绣花细节，寓意每一步都是与自然和文化的对话。',
  tags: ['运动鞋', '东方美学', '颐绣元素', '山水意境', '梦幻风格', '产品设计'],
  metrics: { likes: 328, favorites: 118, comments: 243, shares: 622 },
  publishedAtDisplay: '2024年5月20日 14:36',
};

const profile = {
  id: 'prototype-user-lintong',
  nickname: '林桐漫步',
  avatarUrl: '/assets/images/demo/profile/avatar-lintong-manbu.png',
  region: '浙江 · 温州',
  role: '独立鞋履设计师',
  bio: '用 AI 探索鞋履的更多可能',
  specialties: ['运动鞋', '国潮鞋', '可持续设计', 'AI 设计'],
  stats: [
    { label: '作品', value: '28' },
    { label: '收藏', value: '1.2k' },
    { label: '点赞', value: '356' },
    { label: '评论', value: '128' },
  ],
};

const comments = [
  { id: 'comment-1', author: 'Sugar', initial: 'S', time: '5月20日 16:22', content: '太美了！传统文化和现代设计结合得好棒，想收藏一双实体版！', likes: 56 },
  { id: 'comment-2', author: '山与海', initial: '山', time: '5月21日 09:15', content: '光影和配色太有氛围感了，提示词也很详细，学习了！', likes: 28 },
  { id: 'comment-3', author: 'AI喵酱', initial: 'A', time: '5月21日 11:40', content: '这配色像把江南的春天穿在了脚上。', likes: 16 },
];

const messages = [
  { id: 'message-1', type: 'like', icon: '♥', tone: 'rose', title: '有人点赞了你的作品', summary: 'Busy 等 3 人赞了你的作品《云境行者》', time: '3 分钟前', artworkId: 'prototype-cloud-walker', image: artworkImages[0] },
  { id: 'message-2', type: 'favorite', icon: '★', tone: 'cyan', title: '新的收藏', summary: 'KAI 将《流光颐绣》加入了收藏夹', time: '12 分钟前', artworkId: 'prototype-artwork-05', image: artworkImages[4] },
  { id: 'message-3', type: 'comment', icon: '…', tone: 'amber', title: '有人评论了你的作品', summary: 'Lynn.：“这个配色太美了！好有东方的味道。”', time: '28 分钟前', artworkId: 'prototype-artwork-04', image: artworkImages[3] },
  { id: 'message-4', type: 'status', icon: '≡', tone: 'blue', title: '作品状态更新', summary: '你的作品《山海行》已发布成功', time: '1 小时前', artworkId: 'prototype-artwork-01', image: artworkImages[2] },
  { id: 'message-5', type: 'system', icon: '♢', tone: 'blue', title: '系统通知', summary: '平台「春日灵感计划」现已开启，快来参与吧！', time: '5 小时前', image: artworkImages[1] },
];

const ranking = [
  { rank: 1, title: '云境行者', author: 'NeoDesign', avatarUrl: '', heat: '2.8k', subtitle: '步履山水，心向远方', image: artworkImages[0], artworkId: 'prototype-cloud-walker', metrics: { likes: '2.8k', favorites: 936, comments: 428 } },
  { rank: 2, title: '未来之翼', author: 'Lynn.', avatarUrl: '/assets/images/demo/profile/avatar-lintong-manbu.png', heat: '2.4k', subtitle: '科技与东方的相遇', image: artworkImages[2], artworkId: 'prototype-artwork-03', metrics: { likes: '2.4k', favorites: 810, comments: 365 } },
  { rank: 3, title: '流光花穿', author: 'Sin Studio', avatarUrl: '', heat: '1.9k', subtitle: '花鸟入梦，流光成履', image: artworkImages[4], artworkId: 'prototype-artwork-05', metrics: { likes: '1.9k', favorites: 647, comments: 286 } },
  { rank: 4, title: '机械花园', author: 'Wei Design', avatarUrl: '', heat: '1.4k', subtitle: '未来与自然的碰撞', image: artworkImages[2], artworkId: 'prototype-artwork-03', metrics: { likes: '1.4k', favorites: 476, comments: 214 } },
  { rank: 5, title: '颐绣新生', author: '青岚', avatarUrl: '', heat: '1.3k', subtitle: '东方美学 · 数字演绎', image: artworkImages[3], artworkId: 'prototype-artwork-04', metrics: { likes: '1.3k', favorites: 442, comments: 198 } },
  { rank: 6, title: '赛博逐潮', author: 'Luna', avatarUrl: '', heat: '1.1k', subtitle: '潮起东方', image: artworkImages[1], artworkId: 'prototype-artwork-02', metrics: { likes: '1.1k', favorites: 374, comments: 176 } },
  { rank: 7, title: '自然共生', author: '浮生映月', avatarUrl: '', heat: '1.1k', subtitle: '步履山水之间', image: artworkImages[4], artworkId: 'prototype-artwork-05', metrics: { likes: '1.1k', favorites: 360, comments: 149 } },
  { rank: 8, title: '无界 · NEXT', author: 'Cloudy', avatarUrl: '', heat: '0.9k', subtitle: '探索下一种可能', image: artworkImages[5], artworkId: 'prototype-artwork-06', metrics: { likes: 928, favorites: 315, comments: 126 } },
];

const searchDiscovery = {
  defaultHistory: ['未来科技运动鞋', '东方美学', '可持续鞋履'],
  hotKeywords: ['未来科技', '东方美学', '国风鞋履', '运动潮流', '可持续设计', 'AI 鞋履'],
};

module.exports = {
  artworkImages,
  artworks,
  comments,
  featuredArtwork,
  messages,
  profile,
  ranking,
  searchDiscovery,
};
