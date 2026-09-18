# SoleMuse 前后端接口与数据库审查包

本目录是基于当前 `apps/wechat-miniapp` 页面、WXML 交互、service、mock 数据和 PRD 的一期后端设计审查结果。

## 文件索引

1. [frontend-api-requirements.md](./frontend-api-requirements.md)：从前端页面实际需求出发，逐项定义客户端需要的能力和字段。
2. [backend-api-contracts.md](./backend-api-contracts.md)：与前端需求逐项对应的后端接口、请求参数、响应模型和权限要求。
3. [database-coverage-review.md](./database-coverage-review.md)：数据库表设计、字段覆盖关系、索引建议和遗漏/错误检查。

## 审查结论

当前前端可以支撑视觉原型和本地 mock，但不能直接切换到真实 API。主要缺口如下：

| 优先级 | 缺口 | 当前表现 | 需要补齐 |
| --- | --- | --- | --- |
| P0 | 登录换会话 | `auth-service` 只创建本地演示会话 | 微信 code、手机号 code、刷新和注销接口 |
| P0 | 作品写入链路 | 创建页、编辑页使用本地草稿和 Toast | 图片上传、草稿、编辑、发布、下架接口 |
| P0 | 互动写入 | 详情页点赞、收藏、关注、评论只改本地 state | 幂等关系接口、评论接口、统计计数 |
| P0 | 私信 | `demo-content-service` 返回静态会话 | 会话、消息发送、已读接口 |
| P1 | 公开主页 | mock 已支持，正式 service 尚未提供 | 公开用户资料、公开作品、关注状态接口 |
| P1 | 消息通知 | 页面区分通知和私信，但现有契约只有 `listMessages` | 通知分类、未读数、已读和跳转关联接口 |
| P1 | 搜索和榜单 | 关键词、排序和周期由前端本地处理 | 查询参数、过滤项、周期和分页接口 |
| P1 | 我的内容 | 通过数组切片伪造收藏/点赞/评论 | 按内容类型查询当前用户资源 |
| P2 | 设置项 | 隐私设置、消息通知入口暂无交互 | 偏好设置接口；隐私策略细节后续确认 |

## 当前不应误判为后端已完成的部分

- `services/artwork-service.js`、`user-service.js`、`message-service.js` 已建立 HTTP service 边界，但当前页面大多仍调用 `demo-content-service.js`。
- `search/index.js` 的筛选按钮会显示“筛选待接入”，不是后端已支持的筛选接口。
- 榜单切换周期只改变页面 state，没有重新请求后端。
- 创建页和编辑页的保存、发布、下架目前没有真正的 service 调用。
- `auth-service.js` 的微信/手机号流程在开发环境只写入本地演示 session，不会向后端换取正式 token。

## 统一约定

- API 前缀：`/api/v1`。
- 成功响应：`{ "data": ... }`。
- 错误响应：`{ "error": { "code": "ERROR_CODE", "message": "用户可理解的消息", "details": null } }`。
- 列表响应：`{ "items": [], "nextCursor": "" }`。
- 时间字段使用 ISO 8601 UTC；`time`、`publishedAtDisplay` 等展示字符串由前端格式化。
- 服务端根据 token 确定当前用户，不信任客户端传入的 `creatorId`、`authorId`、`senderId`。
- 所有需要登录的接口在表格中标记为 `Auth`；公开浏览接口标记为 `Guest`。
