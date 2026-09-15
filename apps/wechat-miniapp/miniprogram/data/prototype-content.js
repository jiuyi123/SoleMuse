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
  bio: '让每一步，都走向更美的世界。',
  specialties: ['运动鞋', '国潮鞋', '可持续设计', 'AI 设计'],
  stats: [
    { label: '关注', value: '356' },
    { label: '粉丝', value: '128' },
    { label: '获赞与收藏', value: '1.2k' },
  ],
};

const comments = [
  { id: 'comment-1', author: 'Sugar', initial: 'S', time: '5月20日 16:22', content: '太美了！传统文化和现代设计结合得好棒，想收藏一双实体版！', likes: 56 },
  { id: 'comment-2', author: '山与海', initial: '山', time: '5月21日 09:15', content: '光影和配色太有氛围感了，提示词也很详细，学习了！', likes: 28 },
  { id: 'comment-3', author: 'AI喵酱', initial: 'A', time: '5月21日 11:40', content: '这配色像把江南的春天穿在了脚上。', likes: 16 },
];

const myComments = [
  {
    id: 'my-comment-1',
    artworkId: 'prototype-artwork-01',
    content: '山水层次和鞋面的结构融合得很自然，尤其喜欢云雾纹理的处理。',
    sourceTitle: '颐绣·山海行',
    sourceMeta: '东方美学 · 运动鞋',
    publishedAtDisplay: '今天 10:24',
    visibility: 'public',
  },
  {
    id: 'my-comment-2',
    artworkId: 'prototype-artwork-05',
    content: '花鸟纹样的尺度控制得刚刚好，保留了传统气质，也很适合日常穿搭。',
    sourceTitle: '流光颐绣',
    sourceMeta: '春日灵感 · AI 创作',
    publishedAtDisplay: '昨天 18:06',
    visibility: 'public',
  },
  {
    id: 'my-comment-3',
    artworkId: 'prototype-artwork-03',
    content: '未来感不只来自材质，鞋底轮廓的节奏也很有力量。',
    sourceTitle: '颐韵·潮生',
    sourceMeta: '科技未来 · 鞋履设计',
    publishedAtDisplay: '09-12 14:31',
    visibility: 'public',
  },
  {
    id: 'my-comment-4',
    artworkId: 'prototype-artwork-04',
    content: '配色像雨后的江南，安静但很有记忆点。',
    sourceTitle: '东方绣境',
    sourceMeta: '东方美学 · 自然灵感',
    publishedAtDisplay: '09-08 21:17',
    visibility: 'public',
  },
  {
    id: 'my-comment-5',
    artworkId: 'prototype-artwork-06',
    content: '很喜欢这次传统纹样和未来结构之间的平衡。',
    sourceTitle: '颐绣 × 未来',
    sourceMeta: '未来科技 · 国风新生',
    publishedAtDisplay: '09-02 09:42',
    visibility: 'public',
  },
];

const messages = [
  { id: 'message-direct-1', type: 'direct', icon: '杉', tone: 'blue', title: '杉和设计', summary: '这个系列的材质方案可以再聊聊吗？', time: '18:22', avatarUrl: artworkImages[0], unread: true },
  { id: 'message-direct-2', type: 'direct', icon: '点', tone: 'mint', title: '点点', summary: '想交流一下可持续鞋底的设计思路', time: '昨天', unread: true },
  { id: 'message-direct-3', type: 'direct', icon: 'N', tone: 'cyan', title: 'NeoDesign', summary: '新的鞋面结构草图已经整理好了', time: '09-14', avatarUrl: artworkImages[5] },
  { id: 'message-1', type: 'like', icon: '♥', tone: 'rose', title: '有人点赞了你的作品', summary: 'Busy 等 3 人赞了你的作品《云境行者》', time: '3 分钟前', artworkId: 'prototype-cloud-walker', image: artworkImages[0], unread: true },
  { id: 'message-2', type: 'favorite', icon: '★', tone: 'rose', title: '新的收藏', summary: 'KAI 将《流光颐绣》加入了收藏夹', time: '12 分钟前', artworkId: 'prototype-artwork-05', image: artworkImages[4], unread: true },
  { id: 'message-3', type: 'comment', icon: '…', tone: 'mint', title: '有人评论了你的作品', summary: 'Lynn.：“这个配色太美了！好有东方的味道。”', time: '28 分钟前', artworkId: 'prototype-artwork-04', image: artworkImages[3], unread: true },
  { id: 'message-6', type: 'follow', icon: '山', tone: 'blue', title: '山与海', summary: '开始关注你，期待看到你的新作品', time: '今天', avatarUrl: artworkImages[1], unread: true, userId: 'prototype-user-shanhai' },
  { id: 'message-4', type: 'status', icon: '≡', tone: 'blue', title: '作品状态更新', summary: '你的作品《山海行》已发布成功', time: '1 小时前', artworkId: 'prototype-artwork-01', image: artworkImages[2] },
  { id: 'message-5', type: 'system', icon: '♢', tone: 'cyan', title: '系统通知', summary: '平台「春日灵感计划」现已开启，快来参与吧！', time: '5 小时前', image: artworkImages[1] },
];

const messageChannels = [
  { key: 'reaction', filter: 'reaction', title: '赞和收藏', iconAsset: '/assets/icons/message-reaction.svg', tone: 'rose', unread: 2 },
  { key: 'follow', filter: 'follow', title: '新增关注', iconAsset: '/assets/icons/message-follow.svg', tone: 'blue', unread: 1 },
  { key: 'comment', filter: 'comment', title: '评论和@', iconAsset: '/assets/icons/message-comment.svg', tone: 'mint', unread: 1 },
];

const conversations = [
  {
    id: 'message-direct-1',
    participant: { name: '杉和设计', status: '刚刚在线', avatarUrl: artworkImages[0] },
    messages: [
      { id: 'chat-1', sender: 'other', type: 'text', content: '你好，很喜欢你最近的山海系列。', time: '今天 17:48' },
      { id: 'chat-2', sender: 'self', type: 'text', content: '谢谢你！这组主要在尝试东方纹样和运动结构的结合。' },
      { id: 'chat-3', sender: 'other', type: 'text', content: '这个系列的材质方案可以再聊聊吗？', time: '18:22' },
    ],
  },
  {
    id: 'message-direct-2',
    participant: { name: '点点', status: '在线', avatarUrl: '' },
    messages: [
      { id: 'chat-4', sender: 'other', type: 'text', content: '看到你分享的环保材料实验了，很有启发。', time: '昨天 21:10' },
      { id: 'chat-5', sender: 'other', type: 'text', content: '想交流一下可持续鞋底的设计思路。' },
    ],
  },
  {
    id: 'message-direct-3',
    participant: { name: 'NeoDesign', status: '1小时前在线', avatarUrl: artworkImages[5] },
    messages: [
      { id: 'chat-6', sender: 'self', type: 'text', content: '上次讨论的结构方案有新进展吗？', time: '09-14 10:06' },
      { id: 'chat-7', sender: 'other', type: 'text', content: '新的鞋面结构草图已经整理好了。' },
    ],
  },
  {
    id: 'message-4',
    participant: { name: '作品助手', status: '平台服务', avatarUrl: '' },
    messages: [
      { id: 'chat-status-1', sender: 'other', type: 'text', content: '你的作品《山海行》已发布成功，现在可以在作品广场中查看。', time: '今天 17:30' },
    ],
  },
  {
    id: 'message-5',
    participant: { name: 'SoleMuse 助手', status: '系统消息', avatarUrl: '' },
    messages: [
      { id: 'chat-system-1', sender: 'other', type: 'text', content: '平台「春日灵感计划」现已开启，快来分享你的鞋履创意吧！', time: '今天 13:20' },
    ],
  },
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
  conversations,
  featuredArtwork,
  messages,
  messageChannels,
  myComments,
  profile,
  ranking,
  searchDiscovery,
};
