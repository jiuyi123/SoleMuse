# SoleMuse 前端接口契约草案

此文档用于小程序骨架与 mock 对齐，不代表后端最终协议。Node.js API 开发前需由前后端共同确认。

## 通用约定

- API 前缀：`/api/v1`，当前客户端环境配置中的 `apiBaseUrl` 应包含该前缀。
- 成功响应：`{ "data": ... }`。
- 错误响应：`{ "error": { "code": "ERROR_CODE", "message": "用户可理解的消息", "details": null } }`。
- 时间：ISO 8601 UTC 字符串。
- 列表分页：请求传 `cursor`、`limit`；响应返回 `items`、`nextCursor`。
- 身份认证：`Authorization: Bearer <access-token>`；正式 Token 只能由服务端签发。

## 已建立的前端 service 边界

| 方法 | HTTP | 路径 | 用途 |
| --- | --- | --- | --- |
| `listArtworks` | GET | `/artworks` | 首页、搜索和榜单作品列表 |
| `getArtwork` | GET | `/artworks/:id` | 作品详情 |
| `saveArtwork` | POST | `/artworks` | 创建草稿或发布作品 |
| `updateArtwork` | PATCH | `/artworks/:id` | 编辑、发布或下架本人作品 |
| `getMyProfile` | GET | `/users/me` | 当前用户资料 |
| `updateMyProfile` | PATCH | `/users/me` | 修改当前用户资料 |
| `listMessages` | GET | `/messages` | 当前用户消息列表 |

## 作品最小字段

作品包含 `id`、`title`、`description`、`prompt`、`coverUrl`、有序 `images`、`author`、`aiSource`、`status`、`tags`、`metrics` 与 `publishedAt`。枚举值以客户端 `constants/enums.js` 为当前草案基线。

待确认：上传协议、登录换取会话协议、互动接口、评论结构、热度榜规则、消息已读协议及分页上限。

