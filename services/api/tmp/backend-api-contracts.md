# SoleMuse 后端接口清单与前端需求对应表

本文档将 [前端需求接口清单](./frontend-api-requirements.md) 逐项转换为后端需要提供的接口。接口以 `/api/v1` 为统一前缀；同一行的 `FE ID` 和 `BE ID` 表示一一对应关系。

## 1. 通用协议

### 1.1 请求与响应

```http
Authorization: Bearer <access-token>
Content-Type: application/json
```

成功响应：

```json
{ "data": {} }
```

分页响应：

```json
{
  "data": {
    "items": [],
    "nextCursor": ""
  }
}
```

错误响应：

```json
{
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "请先登录",
    "details": null
  }
}
```

建议错误码：`AUTH_REQUIRED`、`SESSION_EXPIRED`、`VALIDATION_ERROR`、`FORBIDDEN`、`NOT_FOUND`、`CONFLICT`、`RATE_LIMITED`、`UPLOAD_NOT_ALLOWED`、`INTERNAL_ERROR`。

### 1.2 统一字段原则

- ID 使用 UUID 字符串。
- 原始时间使用 ISO 8601 UTC；不要返回仅用于展示的 `time` 或 `publishedAtDisplay` 作为唯一时间字段。
- 计数使用整数；前端再格式化为 `1.2k`。
- 作者统一返回 `{ id, nickname, avatarUrl }`。
- 列表为空返回 `items: []`，游标结束返回空字符串。
- 所有 mutation 接受 `Idempotency-Key` 或业务幂等键，避免重复点赞、收藏、关注和消息。

## 2. 认证与账号接口

| FE ID | BE ID | 方法与路径 | 请求 | 成功响应 | 权限 |
| --- | --- | --- | --- | --- | --- |
| FE-AUTH-01 | BE-AUTH-01 | `POST /auth/wechat/login` | `{ code }` | `session` | Guest |
| FE-AUTH-02 | BE-AUTH-02 | `POST /auth/phone/login` | `{ code }` | `session` | Guest |
| FE-AUTH-03 | BE-AUTH-03 | `POST /auth/refresh` | `{ refreshToken }` | 新 `session` | Guest |
| FE-AUTH-04 | BE-AUTH-04 | `POST /auth/logout` | 无 | `{ success: true }` | Auth |
| FE-AUTH-05 | BE-USER-01 | `GET /users/me` | 无 | `profile + stats` | Auth |
| FE-AUTH-06 | BE-USER-02 | `PATCH /users/me` | 允许修改的资料字段 | 更新后的 `profile` | Auth |
| FE-AUTH-07 | BE-USER-03 | `GET /users/me/account` | 无 | `accountInfo` | Auth |

`session` 建议结构：

```json
{
  "accessToken": "server-issued-token",
  "refreshToken": "server-issued-refresh-token",
  "expiresIn": 7200,
  "user": {
    "id": "uuid",
    "accountId": "SM-000001",
    "nickname": "林桐漫步",
    "avatarUrl": "...",
    "loginMethod": "wechat",
    "phoneDisplay": "138****8821",
    "wechatBound": true
  }
}
```

实现要求：

- 微信登录由服务端使用小程序 AppID/AppSecret 向微信换取身份；AppSecret 只存在服务端环境变量。
- 手机号登录只接收微信 `getPhoneNumber` 返回的临时 code；服务端换取手机号后保存加密原文、hash 和脱敏值。
- 如果手机号已存在，应绑定到已有用户；登录身份不能因不同登录方式重复创建用户。
- `refreshToken` 只在服务端保存 hash；退出登录需要撤销当前 session。

## 3. 发现、搜索和榜单接口

| FE ID | BE ID | 方法与路径 | 关键查询参数 | 成功响应 | 权限 |
| --- | --- | --- | --- | --- | --- |
| FE-DISC-01 | BE-DISC-01 | `GET /feeds/home` | `feed=discover&cursor&limit` | 作品列表、热门标签 | Guest |
| FE-DISC-02 | BE-DISC-01 | `GET /feeds/home` | `feed=following&cursor&limit` | 关注作品列表 | Auth |
| FE-DISC-03 | BE-DISC-01 | `GET /feeds/home` | `feed=latest&cursor&limit` | 最新作品列表 | Guest |
| FE-DISC-04 | BE-DISC-02 | `GET /search/discovery` | 无 | 热搜和默认历史建议 | Guest/Auth |
| FE-DISC-05 | BE-DISC-03 | `GET /artworks` | `keyword&cursor&limit` | 作品分页 | Guest |
| FE-DISC-06 | BE-DISC-03 | `GET /artworks` | `categoryId&tagId&sourceType&publishedFrom&publishedTo` | 过滤后的作品分页 | Guest |
| FE-DISC-07 | BE-DISC-03 | `GET /artworks` | `sort=latest\|hottest&cursor&limit` | 排序后的作品分页 | Guest |
| FE-DISC-08 | BE-DISC-04 | `GET /rankings` | `period=day\|week\|month&cursor&limit` | 排名项和更新时间 | Guest |
| FE-DISC-09 | BE-DISC-05 | `GET /rankings/rules` | 无 | 规则文本、周期说明 | Guest |
| FE-DISC-10 | BE-DISC-06 | `GET /users/me/search-history`、`PUT/DELETE /users/me/search-history` | keyword 或清理操作 | 历史关键词 | Auth |

`BE-DISC-03` 的默认排序为 `latest`，只查询 `status = published`。热度排序和榜单必须使用公开热度规则，不能依赖个人画像。

作品列表最小响应：

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "云境行者",
      "coverUrl": "...",
      "author": { "id": "uuid", "nickname": "Lynn.", "avatarUrl": "" },
      "aiSource": { "type": "ai", "name": "Midjourney", "version": "v6.1" },
      "status": "published",
      "tags": [{ "id": "uuid", "name": "东方美学" }],
      "metrics": { "views": 1200, "likes": 328, "favorites": 118, "comments": 243, "shares": 622 },
      "publishedAt": "2026-09-18T10:00:00Z"
    }
  ],
  "nextCursor": ""
}
```

## 4. 作品、图片和创作接口

| FE ID | BE ID | 方法与路径 | 请求 | 成功响应 | 权限 |
| --- | --- | --- | --- | --- | --- |
| FE-ART-01 | BE-ART-01 | `GET /artworks/:artworkId` | 无 | 作品详情 | Guest |
| FE-ART-02 | BE-ART-02 | `GET /artworks/:artworkId/comments` | `sort&cursor&limit` | 评论分页 | Guest |
| FE-ART-03 | BE-ART-03 | `POST /uploads/presign` | `filename&mimeType&size` | asset、上传 URL、过期时间 | Auth |
| FE-ART-04 | BE-ART-04 | `POST /artworks` | 作品草稿字段，`status=draft` | 草稿作品 | Auth |
| FE-ART-05 | BE-ART-05 | `POST /artworks/:artworkId/publish` | 可选发布校验字段 | 已发布作品 | Auth |
| FE-ART-06 | BE-ART-06 | `PATCH /artworks/:artworkId` | 变更字段 | 更新后的作品 | Auth |
| FE-ART-07 | BE-ART-07 | `POST /artworks/:artworkId/off-shelf` | 可选原因 | 下架作品 | Auth |
| FE-ART-08 | BE-ART-08 | `GET /artwork-options` | 无 | 分类、标签、AI 工具 | Guest |
| FE-ART-09 | BE-ART-09 | `GET /users/me/artworks` | `status&cursor&limit` | 我的作品分页 | Auth |

`BE-ART-03` 的流程是：后端签发上传凭证 → 小程序上传对象存储 → 将返回的 `assetId` 放入作品 payload。后端必须校验 asset 所属用户，不能允许客户端直接挂载他人资源。

草稿/发布请求示例：

```json
{
  "title": "云境行者",
  "description": "创作说明",
  "prompt": "完整 Prompt",
  "workType": "ai_generated",
  "categoryId": "uuid",
  "tagIds": ["uuid"],
  "imageAssetIds": ["uuid", "uuid"],
  "coverAssetId": "uuid",
  "aiSource": {
    "type": "ai",
    "name": "Midjourney",
    "version": "v6.1",
    "workflow": "",
    "editDescription": ""
  }
}
```

发布校验至少包括：已登录且为作者、至少一张图片、封面存在、标题/Prompt/分类/标签满足前端必填约束、图片类型和大小合法、所有资源属于当前用户。

## 5. 作品互动和评论接口

| FE ID | BE ID | 方法与路径 | 请求/语义 | 成功响应 | 权限 |
| --- | --- | --- | --- | --- | --- |
| FE-INT-01 | BE-INT-01 | `PUT/DELETE /artworks/:artworkId/like` | PUT 为点赞，DELETE 为取消 | `liked`、`likeCount` | Auth |
| FE-INT-02 | BE-INT-02 | `PUT/DELETE /artworks/:artworkId/favorite` | PUT 为收藏，DELETE 为取消 | `favorited`、`favoriteCount` | Auth |
| FE-INT-03 | BE-INT-03 | `PUT/DELETE /users/:userId/follow` | PUT 为关注，DELETE 为取消 | `following`、统计摘要 | Auth |
| FE-INT-04 | BE-INT-04 | `POST /artworks/:artworkId/comments` | `{ content, parentId? }` | 新评论 | Auth |
| FE-INT-05 | BE-INT-05 | `DELETE /comments/:commentId` | 无 | `{ deleted: true }` | Auth |
| FE-INT-06 | BE-INT-06 | `PUT/DELETE /comments/:commentId/like` | 点赞/取消 | `liked`、`likeCount` | Auth |
| FE-INT-07 | BE-INT-07 | `GET /users/me/favorites` | `cursor&limit` | 作品分页 | Auth |
| FE-INT-08 | BE-INT-08 | `GET /users/me/likes` | `cursor&limit` | 作品分页 | Auth |
| FE-INT-09 | BE-INT-09 | `GET /users/me/comments` | `cursor&limit` | 评论及来源作品 | Auth |

点赞、收藏、关注使用关系表唯一约束实现幂等；计数更新和关系写入必须同事务，或通过可靠事件最终修正。评论 `parentId` 只能指向同一作品的顶级评论，禁止超过一级回复。

## 6. 公开主页与消息接口

| FE ID | BE ID | 方法与路径 | 请求 | 成功响应 | 权限 |
| --- | --- | --- | --- | --- | --- |
| FE-USER-01 | BE-USER-04 | `GET /users/:userId/public-profile` | 无 | 公开资料、统计、公开作品、following | Guest/Auth |
| FE-USER-02 | BE-MSG-01 | `POST /conversations/direct` | `{ participantId }` | 已存在或新建的会话摘要 | Auth |
| FE-MSG-01 | BE-MSG-02 | `GET /notifications/channels` | 无 | 三类频道和 unread 数 | Auth |
| FE-MSG-02 | BE-MSG-03 | `GET /notifications` | `category&cursor&limit` | 通知分页 | Auth |
| FE-MSG-03 | BE-MSG-04 | `POST /notifications/read` | `{ notificationIds }` 或 `{ all: true }` | 已读结果 | Auth |
| FE-MSG-04 | BE-MSG-05 | `GET /conversations` | `cursor&limit` | 会话摘要分页 | Auth |
| FE-MSG-05 | BE-MSG-06 | `GET /conversations/:conversationId/messages` | `cursor&limit` | participant、消息分页、已读游标 | Auth |
| FE-MSG-06 | BE-MSG-07 | `POST /conversations/:conversationId/messages` | `{ clientMessageId, type, content }` | 新消息 | Auth |
| FE-MSG-07 | BE-MSG-08 | `POST /conversations/:conversationId/read` | `{ lastReadMessageId }` | 已读游标 | Auth |

公开主页不应把 `conversationId` 固化在用户资料表中；应由 `BE-MSG-01` 幂等创建/获取当前用户与目标用户的 direct conversation。

通知类型统一为：`like`、`favorite`、`comment`、`follow`、`artwork_status`、`system`。私信消息类型一期只支持 `text`。前端的 `sender=self/other` 由当前用户 ID 计算。

## 7. 设置与偏好接口

| FE ID | BE ID | 方法与路径 | 请求 | 成功响应 | 权限 |
| --- | --- | --- | --- | --- | --- |
| FE-SET-01 | BE-SET-01 | `GET /users/me/notification-preferences` | 无 | 偏好对象 | Auth |
| FE-SET-02 | BE-SET-02 | `PATCH /users/me/notification-preferences` | 开关字段 | 更新后的偏好 | Auth |
| FE-SET-03 | BE-SET-03 | `GET/PATCH /users/me/privacy-settings` | 公开范围字段 | 隐私设置 | Auth |

当前设置页的隐私和通知行仍是占位交互。如果一期不实现，应暂时不展示可点击状态；如果保留入口，则至少提供上述接口并让页面覆盖加载、保存、失败和重试状态。

## 8. 现有前端 service 与正式接口的替换关系

| 当前前端调用 | 正式替换 |
| --- | --- |
| `demoContentService.getHomeContent()` | `GET /feeds/home` |
| `demoContentService.searchArtworks()` | `GET /artworks` |
| `demoContentService.getSearchDiscovery()` | `GET /search/discovery` |
| `demoContentService.getArtwork()` | `GET /artworks/:id` + `GET /artworks/:id/comments` |
| `demoContentService.getRanking()` | `GET /rankings?period=...` |
| `demoContentService.getMessages()` / `getMessageChannels()` | `GET /notifications/channels` + `GET /notifications` + `GET /conversations` |
| `demoContentService.getMessagesByCategory()` | `GET /notifications?category=...` |
| `demoContentService.getConversation()` | `GET /conversations/:id/messages` |
| `demoContentService.sendConversationMessage()` | `POST /conversations/:id/messages` |
| `demoContentService.getProfile()` | `GET /users/me` |
| `demoContentService.getPublicProfile()` | `GET /users/:id/public-profile` |
| `demoContentService.setPublicProfileFollowing()` | `PUT/DELETE /users/:id/follow` |
| `demoContentService.getMyContent()` | `GET /users/me/artworks/favorites/likes`，或统一内容查询 |
| `demoContentService.getMyComments()` | `GET /users/me/comments` |
| 当前详情页本地点赞/收藏/评论 | `BE-INT-01` 至 `BE-INT-06` |
| 当前创建/编辑页本地 Toast | `BE-ART-03` 至 `BE-ART-09` |

## 9. 建议接口实现顺序

1. 认证、`GET /users/me`、公开作品列表和作品详情。
2. 图片上传、草稿、发布、编辑、下架。
3. 点赞、收藏、关注、评论。
4. 公开主页、通知列表和已读。
5. 私信会话、消息发送和会话已读。
6. 搜索筛选、榜单周期、我的内容和设置偏好。

