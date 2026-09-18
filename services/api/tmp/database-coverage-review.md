# SoleMuse 数据库设计覆盖审查

本文档检查现有 [database-design.md](../Design/database-design.md) 是否能支撑前端需求和后端接口。结论是：核心业务表基本完整，但要真正接入当前前端，还需要补充媒体资源、隐私设置、作品事件/分享统计，并统一若干枚举和接口语义。

## 1. 表覆盖总表

| 表 | 主要职责 | 对应接口/前端模块 | 结论 |
| --- | --- | --- | --- |
| `users` | 用户主身份、账号 ID、状态 | 认证、我的、公开主页 | 已覆盖 |
| `user_profiles` | 昵称、头像、地区、角色、简介、擅长领域 | 我的、资料编辑、公开主页 | 已覆盖 |
| `auth_identities` | 微信 openid/unionid 等登录身份 | 微信一键登录、账号绑定 | 已覆盖 |
| `phone_bindings` | 手机号 hash、密文、脱敏值、验证时间 | 手机号登录、设置账号信息 | 已覆盖 |
| `auth_sessions` | access/refresh 会话生命周期 | 登录、刷新、注销 | 已覆盖，但需配套前端 refresh |
| `user_privacy_settings` | 资料、作品、互动公开范围 | 设置页隐私设置 | 缺失，建议新增 |
| `notification_preferences` | 点赞、评论、关注、系统通知开关 | 设置页消息通知 | 已覆盖 |
| `media_assets` | 上传资源归属、对象存储 key、状态 | 图片上传、作品图片 | 缺失，建议新增 |
| `artworks` | 作品主信息、状态、作者、发布时间 | 首页、搜索、榜单、详情、创作 | 已覆盖 |
| `artwork_images` | 图片顺序、封面、尺寸 | 创建、编辑、详情 | 已覆盖 |
| `artwork_ai_sources` | AI 类型、工具、版本、工作流、二次编辑 | 创建、编辑、详情、搜索筛选 | 已覆盖 |
| `artwork_revisions` | Prompt/来源/作品修改快照 | 编辑、追溯 | 已覆盖 |
| `artwork_categories` | 分类选项 | 搜索、创建、编辑 | 已覆盖 |
| `tags` | 风格标签选项 | 搜索、创建、编辑 | 已覆盖 |
| `artwork_tags` | 作品与标签多对多关系 | 作品列表、搜索筛选 | 已覆盖 |
| `artwork_metrics` | 作品 views/likes/favorites/comments/shares 冗余计数 | 卡片、详情、榜单 | 已覆盖，建议补 views 来源 |
| `artwork_events` | 浏览、分享等计数事件 | 详情分享、热度统计 | 缺失，建议新增或明确埋点方案 |
| `artwork_likes` | 用户点赞关系 | 详情、我的点赞 | 已覆盖 |
| `artwork_favorites` | 用户收藏关系 | 详情、我的收藏 | 已覆盖 |
| `comments` | 评论、一级回复、状态 | 作品详情、我的评论 | 已覆盖 |
| `comment_likes` | 评论点赞关系 | 评论列表 | 已覆盖 |
| `user_follows` | 用户关注关系 | 公开主页、首页关注流、通知 | 已覆盖 |
| `conversations` | 私信会话 | 私信列表、公开主页发私信 | 已覆盖 |
| `conversation_members` | 会话成员、已读游标 | 私信列表、聊天 | 已覆盖 |
| `chat_messages` | 文本消息、幂等键、发送者 | 聊天页 | 已覆盖 |
| `notifications` | 点赞、收藏、评论、关注、状态、系统通知 | 消息中心、分类、通知详情 | 已覆盖 |
| `user_search_histories` | 跨设备搜索历史 | 搜索页 | 可选；当前本地 storage 已足够一期 |
| `ranking_snapshots` | 固定时间榜单快照 | 榜单周期 | 可选；一期可实时/定时计算 |

## 2. 需要新增或修正的表

### 2.1 `media_assets`（必须新增）

当前创建页只产生微信临时文件路径，正式后端需要资源上传生命周期。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | uuid | 资源 ID |
| `owner_id` | uuid | 上传用户 |
| `storage_key` | text | 对象存储 key |
| `mime_type` | varchar(64) | 图片类型 |
| `byte_size` | bigint | 文件大小 |
| `width` / `height` | integer | 图片尺寸 |
| `status` | varchar(16) | `pending`、`uploaded`、`attached`、`expired`、`deleted` |
| `expires_at` | timestamptz nullable | 未完成上传的清理时间 |
| `created_at` / `updated_at` | timestamptz | 生命周期时间 |

`artwork_images` 应通过 `asset_id` 关联该表，而不是只接收客户端传来的 URL。

### 2.2 `user_privacy_settings`（如果设置入口保留则必须新增）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `user_id` | uuid | PK/FK → `users.id` |
| `profile_visibility` | varchar(16) | `public`、`private` |
| `artwork_visibility` | varchar(16) | `public`、`private` |
| `interaction_visibility` | varchar(16) | 互动记录公开范围 |
| `updated_at` | timestamptz | 更新时间 |

当前设置页只是展示行，若一期不实现隐私控制，可以暂时不建此表并隐藏入口。

### 2.3 `artwork_events`（建议新增）

`artwork_metrics` 可以保存当前计数，但无法解释 views/shares 如何产生，也无法做时间窗口热度。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | uuid | PK |
| `artwork_id` | uuid | FK → `artworks.id` |
| `actor_id` | uuid nullable | 登录用户；游客可为空 |
| `event_type` | varchar(16) | `view`、`share` |
| `request_id` | varchar(80) nullable | 防重复埋点 |
| `created_at` | timestamptz | 事件时间 |

如果一期不需要真实浏览统计，可以只保留 `share_count`，并在接口文档中明确计数来源，避免前端显示一个无法维护的 `views`。

## 3. 与现有表设计的错误或不一致

### 3.1 枚举名称不统一

当前 mock 和页面出现：`direct`、`like`、`favorite`、`follow`、`comment`、`status`、`system`；`constants/enums.js` 只覆盖部分值，并使用 `artwork_status` 语义。

建议服务端统一：

- 作品状态：`draft`、`published`、`off_shelf`、`deleted`
- AI 来源：`ai`、`non_ai`、`undisclosed`
- 通知类型：`like`、`favorite`、`comment`、`follow`、`artwork_status`、`system`
- 聊天类型：`text`
- 榜单周期：`day`、`week`、`month`
- 排序：`latest`、`hottest`

### 3.2 作品详情和评论接口未对齐

mock 的 `getArtwork()` 一次返回 `{ artwork, comments }`，独立 `artwork-service.getArtwork()` 只返回作品。建议后端拆为：

- `GET /artworks/:id`
- `GET /artworks/:id/comments?sort&cursor&limit`

前端可以并行请求，评论独立分页，避免作品详情被评论数量限制。

### 3.3 `conversationId` 不应存入用户资料

当前公开主页 mock 为 profile 拼接 `conversationId`。正式模型中用户关系和会话关系是动态的，应使用 `POST /conversations/direct` 幂等获取会话，而不是把会话 ID 写入 `user_profiles`。

### 3.4 聚合字段不能作为主数据

- `metrics` 是缓存/冗余统计，点赞、收藏、评论关系表才是事实来源。
- `profile.stats` 应由关注关系、作品互动聚合或缓存生成，不能由用户自行修改。
- `time`、`publishedAtDisplay`、`sender=self/other` 都是接口层或前端 view model 派生字段。
- `coverUrl` 是封面便捷字段，图片真实顺序由 `artwork_images.sort_order` 决定。

### 3.5 认证表需要和前端 session 机制补齐

数据库设计包含 refresh session，但当前小程序只读取 `accessToken`，尚未实现 refresh 和 logout service。后端可以先提供接口，但前端接入时必须补齐：401 → refresh → 重放请求；refresh 失败 → 清除本地 session → 引导登录。

### 3.6 关注关系的历史语义需要明确

若 `user_follows` 使用 `(follower_id, following_id)` 主键并将取消关注改为 `removed`，重新关注可复用同一行；如果未来需要完整关注历史，再单独增加 `user_follow_events`，不要依赖 `removed` 行统计粉丝数。

## 4. 数据库到接口的覆盖矩阵

| 业务能力 | 必需表 | 后端接口 | 是否可满足 |
| --- | --- | --- | --- |
| 微信/手机号登录 | `users`、`auth_identities`、`phone_bindings`、`auth_sessions` | BE-AUTH-01~04 | 是，需服务端微信配置 |
| 账号信息展示 | `users`、`user_profiles`、身份/手机号表 | BE-USER-01~03 | 是 |
| 公开用户主页 | `user_profiles`、`artworks`、`artwork_metrics`、`user_follows` | BE-USER-04、BE-INT-03 | 是 |
| 首页发现/关注/最新 | `artworks`、`artwork_metrics`、`user_follows` | BE-DISC-01 | 是，需真实查询替换本地截取 |
| 搜索筛选 | `artworks`、`user_profiles`、`tags`、分类、AI 来源 | BE-DISC-02~03 | 是，需统一参数 |
| 榜单 | `artwork_metrics`，可选快照表 | BE-DISC-04~05 | 是，需固定热度规则 |
| 图片上传 | `media_assets`、`artwork_images` | BE-ART-03 | 现有设计不足，新增后满足 |
| 草稿/发布/编辑/下架 | `artworks`、图片、来源、标签、revision | BE-ART-04~09 | 是 |
| 点赞/收藏 | 互动关系表、metrics | BE-INT-01~02、07~08 | 是 |
| 关注 | `user_follows`、notifications | BE-INT-03 | 是 |
| 评论/回复 | `comments`、`comment_likes`、notifications | BE-ART-02、BE-INT-04~06、09 | 是 |
| 消息通知 | `notifications`、偏好表 | BE-MSG-02~04 | 是 |
| 私信 | `conversations`、members、chat_messages | BE-MSG-01、05~08 | 是 |
| 搜索历史 | `user_search_histories` 或本地 storage | BE-DISC-06 | 可选 |
| 隐私设置 | `user_privacy_settings` | BE-SET-03 | 新增表后满足 |

## 5. 建议最小落地顺序

第一批数据库迁移：

`users`、`user_profiles`、`auth_identities`、`phone_bindings`、`auth_sessions`、`artworks`、`artwork_images`、`artwork_ai_sources`、`artwork_categories`、`tags`、`artwork_tags`。

第二批迁移：

`media_assets`、`artwork_metrics`、`artwork_likes`、`artwork_favorites`、`comments`、`comment_likes`、`user_follows`、`artwork_revisions`。

第三批迁移：

`notifications`、`notification_preferences`、`conversations`、`conversation_members`、`chat_messages`。

第四批可选迁移：

`user_privacy_settings`、`user_search_histories`、`artwork_events`、`ranking_snapshots`。

## 6. 最终判定

现有数据库设计覆盖了核心领域，但不能原样支撑完整前端。完成以下三项后可以作为一期后端建表基线：

1. 新增 `media_assets`，打通图片上传与作品图片归属。
2. 新增 `user_privacy_settings`，或明确一期隐藏隐私设置入口。
3. 统一枚举、分页、详情/评论拆分、会话创建和 token refresh 语义。

在此基础上，前端 mock 可以按照 `backend-api-contracts.md` 逐个替换为 HTTP service，而不需要修改页面层的业务字段。
