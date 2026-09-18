# SoleMuse 前端需求接口清单

## 1. 依据与前端现状

本清单来自以下前端模块：

- 首页：`pages/home`
- 榜单：`pages/ranking`
- 创作：`pages/create`、`subpackages/creator/pages/editor`
- 搜索与作品：`subpackages/artwork/pages/search`、`detail`
- 用户：`pages/profile`、`subpackages/user/pages/profile-edit`、`content-list`、`public-profile`、`settings`
- 消息：`pages/messages`、`subpackages/messages/pages/category`、`chat`、`notice-detail`
- 认证：`subpackages/account/pages/login`

当前 demo service 对外暴露的方法为：

`getHomeContent`、`searchArtworks`、`getSearchDiscovery`、`getArtwork`、`getRanking`、`getMessages`、`getMessageChannels`、`getMessagesByCategory`、`getConversation`、`sendConversationMessage`、`getProfile`、`getPublicProfile`、`setPublicProfileFollowing`、`getMyContent`、`getMyComments`。

这些方法代表前端所需的领域能力，但不是最终 HTTP 路径。正式接口必须保留页面需要的稳定字段，并补齐所有写操作和分页参数。

## 2. 前端需求接口总表

### 2.1 认证与当前账号

| ID | 前端需求 | 当前触发位置 | 输入 | 输出 | 权限 |
| --- | --- | --- | --- | --- | --- |
| FE-AUTH-01 | 微信一键登录并创建会话 | 登录页 `handleWechatLogin` | 微信临时 `code` | access token、refresh token、账号摘要 | Guest |
| FE-AUTH-02 | 手机号直接获取并创建/绑定会话 | 登录页 `handlePhoneLogin` | `getPhoneNumber` 返回的临时 `code` | access token、refresh token、脱敏手机号、账号摘要 | Guest |
| FE-AUTH-03 | 刷新会话 | HTTP client/auth guard | refresh token | 新 token 和过期时间 | Guest |
| FE-AUTH-04 | 注销当前会话 | 设置/账号安全预留入口 | 当前会话 | 成功状态 | Auth |
| FE-AUTH-05 | 获取当前用户资料 | 我的页面、设置、资料编辑 | 无 | `id`、昵称、头像、地区、角色、简介、擅长领域、统计摘要 | Auth |
| FE-AUTH-06 | 修改当前用户资料 | 资料编辑页 | 昵称、头像资源、地区、角色、简介、擅长领域 | 更新后的资料 | Auth |
| FE-AUTH-07 | 查看账号信息 | 设置页账号卡片 | 无 | accountId、登录方式、微信绑定状态、脱敏手机号 | Auth |

约束：手机号和微信身份信息由服务端处理；客户端只提交临时 code，不提交或保存 AppSecret、session_key、手机号明文。

### 2.2 首页、搜索和榜单

| ID | 前端需求 | 当前触发位置 | 输入 | 输出 | 权限 |
| --- | --- | --- | --- | --- | --- |
| FE-DISC-01 | 获取首页发现作品 | `home.loadContent` | feed、cursor、limit | 作品卡片列表、热门标签、分页游标 | Guest |
| FE-DISC-02 | 获取首页关注作品 | 首页“关注”Tab | 当前用户、cursor、limit | 关注用户的公开作品 | Auth |
| FE-DISC-03 | 获取首页最新作品 | 首页“最新”Tab | cursor、limit | 按发布时间倒序的作品 | Guest |
| FE-DISC-04 | 获取搜索发现数据 | 搜索页 `onLoad` | 无 | 默认历史建议、热搜关键词 | Guest/Auth |
| FE-DISC-05 | 搜索作品 | 搜索页 `runSearch` | keyword、cursor、limit | 作品列表、命中数、分页游标 | Guest |
| FE-DISC-06 | 按条件筛选作品 | 搜索页筛选按钮 | category、tag、sourceType、publishedFrom、publishedTo | 过滤后的作品列表 | Guest |
| FE-DISC-07 | 切换排序 | 搜索页最新/热度 | sort、cursor、limit | 最新或热度排序作品 | Guest |
| FE-DISC-08 | 获取榜单 | 榜单页 `loadRanking` | period、cursor、limit | rank、score、作品、作者、metrics、更新时间 | Guest |
| FE-DISC-09 | 获取榜单规则 | 榜单“排行规则”弹窗 | 无 | 规则说明和统计周期 | Guest |
| FE-DISC-10 | 同步搜索历史（可选） | 当前前端使用本地 storage | keyword、操作类型 | 历史关键词列表 | Auth |

当前错误/遗漏：搜索页虽然显示分类、风格标签、AI 生成源、发布时间四个筛选项，但 `showFilter` 只弹 Toast；榜单切换 `period` 没有请求参数；首页“关注”只是前端截取数组，不能代表真实关注流。

### 2.3 作品浏览与创作

| ID | 前端需求 | 当前触发位置 | 输入 | 输出 | 权限 |
| --- | --- | --- | --- | --- | --- |
| FE-ART-01 | 获取作品详情 | 作品卡片、榜单、消息跳转 | artworkId | 作品完整资料、作者、图片、AI 来源、metrics | Guest |
| FE-ART-02 | 获取作品评论 | 作品详情页 | artworkId、sort、cursor、limit | 评论、作者摘要、评论点赞数、分页游标 | Guest |
| FE-ART-03 | 上传作品图片 | 创建页/编辑页选择图片后 | 文件元数据或上传凭证 | assetId、storageKey、url、尺寸、状态 | Auth |
| FE-ART-04 | 保存作品草稿 | 创建页“存草稿”、编辑页保存 | 标题、Prompt、说明、来源、分类、标签、图片资源、状态 | 草稿作品 | Auth |
| FE-ART-05 | 发布作品 | 创建页/编辑页“发布” | 完整作品字段 | 已发布作品详情 | Auth |
| FE-ART-06 | 编辑本人作品 | 编辑页 | artworkId + 变更字段 | 更新后的作品 | Auth |
| FE-ART-07 | 下架本人作品 | 编辑页“下架” | artworkId | `off_shelf` 状态 | Auth |
| FE-ART-08 | 获取分类和 AI 工具选项 | 创建/编辑页 | 无 | 分类、标签、工具/来源选项 | Guest |
| FE-ART-09 | 获取我的作品 | 我的内容/内容列表 | status、cursor、limit | 我的作品列表 | Auth |

作品字段要求：

```json
{
  "id": "uuid",
  "title": "云境行者",
  "description": "创作说明",
  "prompt": "完整 Prompt",
  "workType": "ai_generated",
  "status": "draft",
  "category": { "id": "uuid", "name": "运动鞋" },
  "tags": [{ "id": "uuid", "name": "东方美学" }],
  "images": [{ "id": "uuid", "url": "...", "sortOrder": 0, "isCover": true }],
  "aiSource": { "type": "ai", "name": "Midjourney", "version": "v6.1", "workflow": "", "editDescription": "" },
  "author": { "id": "uuid", "nickname": "Lynn.", "avatarUrl": "" },
  "metrics": { "views": 0, "likes": 328, "favorites": 118, "comments": 243, "shares": 622 },
  "publishedAt": "2026-09-18T10:00:00Z"
}
```

当前错误/遗漏：`artwork-service` 已有 `saveArtwork/updateArtwork`，但创建页和编辑页没有调用；图片只有微信临时路径，没有上传接口；`getArtwork` 的独立 service 只返回作品，而详情页 mock 还需要评论，二者必须通过聚合接口或单独评论接口对齐。

### 2.4 作品互动与评论

| ID | 前端需求 | 当前触发位置 | 输入 | 输出 | 权限 |
| --- | --- | --- | --- | --- | --- |
| FE-INT-01 | 点赞/取消点赞作品 | 详情底部互动栏 | artworkId、desiredState | liked、最新 likeCount | Auth |
| FE-INT-02 | 收藏/取消收藏作品 | 详情底部互动栏 | artworkId、desiredState | favorited、最新 favoriteCount | Auth |
| FE-INT-03 | 关注/取消关注作者 | 作品详情、公开主页 | targetUserId、desiredState | following、最新关注状态 | Auth |
| FE-INT-04 | 发布评论 | 作品详情评论输入 | artworkId、content、parentId 可选 | 评论对象 | Auth |
| FE-INT-05 | 删除本人评论 | 评论管理/未来入口 | commentId | 删除状态 | Auth |
| FE-INT-06 | 点赞/取消评论 | 评论列表/未来入口 | commentId、desiredState | liked、最新 likeCount | Auth |
| FE-INT-07 | 获取我的收藏 | 我的内容 | cursor、limit | 作品列表 | Auth |
| FE-INT-08 | 获取我的点赞 | 我的内容 | cursor、limit | 作品列表 | Auth |
| FE-INT-09 | 获取我的评论 | 我的内容 | cursor、limit | 评论及来源作品 | Auth |

所有关系操作需要幂等。前端的 `liked`、`favorited`、`followed` 是当前用户视角的状态，不应由作品公共 metrics 反推。

### 2.5 用户主页、消息和私信

| ID | 前端需求 | 当前触发位置 | 输入 | 输出 | 权限 |
| --- | --- | --- | --- | --- | --- |
| FE-USER-01 | 获取公开用户主页 | 作品作者、评论作者、消息头像、私信头像 | userId | 用户资料、统计、公开作品、当前用户 following | Guest/Auth |
| FE-USER-02 | 从公开主页发起私信 | 公开主页“私信” | participantId | 已存在或新建的 conversationId | Auth |
| FE-MSG-01 | 获取消息频道和未读数 | 消息首页 | 无 | 赞收藏、关注、评论频道及 unread | Auth |
| FE-MSG-02 | 获取通知列表 | 消息分类页 | category、cursor、limit | 通知列表、关联作品/用户/评论 | Auth |
| FE-MSG-03 | 标记通知已读 | 通知详情/进入分类 | notificationId 或批量 ID | 已读状态 | Auth |
| FE-MSG-04 | 获取私信会话列表 | 消息首页私信列表 | cursor、limit | 会话摘要、参与者、最后消息、未读数 | Auth |
| FE-MSG-05 | 获取会话详情和消息 | 聊天页 | conversationId、cursor、limit | 参与者、消息列表、已读游标 | Auth |
| FE-MSG-06 | 发送文本消息 | 聊天页 | conversationId、clientMessageId、content | 消息对象和服务端时间 | Auth |
| FE-MSG-07 | 标记会话已读 | 聊天页打开/滚动 | conversationId、lastReadMessageId | 已读游标 | Auth |

当前错误/遗漏：消息 mock 同时包含 `direct`、`like`、`favorite`、`follow`、`status`、`system`；但 `constants/enums.js` 没有完整覆盖这些值，且现有 `message-service` 没有分类、私信和已读方法。通知和聊天消息应在数据库中分开，再在消息首页聚合。

### 2.6 设置与偏好

| ID | 前端需求 | 当前触发位置 | 输入 | 输出 | 权限 |
| --- | --- | --- | --- | --- | --- |
| FE-SET-01 | 获取通知偏好 | 设置页“消息通知” | 无 | 点赞、评论、关注、系统通知开关 | Auth |
| FE-SET-02 | 修改通知偏好 | 设置页 | 偏好字段 | 更新后的偏好 | Auth |
| FE-SET-03 | 获取/修改隐私设置 | 设置页“隐私设置”预留 | 公开范围字段 | 更新后的隐私设置 | Auth |

当前设置页的隐私设置和消息通知只是展示行，没有交互逻辑；如果一期要开放入口，必须同步增加接口和页面，否则应在接口范围中标记为后续功能。

## 3. 前端统一 DTO 规则

1. 接口返回原始 ISO 时间和数字计数，前端负责格式化 `publishedAtDisplay`、`time` 和 `1.2k`。
2. 作者统一使用 `{ id, nickname, avatarUrl }`，不能一部分使用 `authorId`，另一部分只返回 `author` 字符串。
3. AI 来源统一使用 `sourceType: ai | non_ai | undisclosed`；工具名、模型版本、工作流、二次编辑说明分开字段。
4. 图片统一返回 `images` 的稳定排序，明确 `isCover`；`coverUrl` 是便捷冗余字段，不作为图片顺序的唯一来源。
5. 所有列表必须返回 `nextCursor`；空列表返回 `items: []` 而不是 `null`。
6. 需要登录的失败统一返回 `AUTH_REQUIRED` 或 `SESSION_EXPIRED`，页面据此保留原操作上下文并跳转登录。
