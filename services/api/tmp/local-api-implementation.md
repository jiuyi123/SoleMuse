# 本地 API 实现说明

本地服务按照 `backend-api-contracts.md` 实现了认证、用户、作品、图片、互动、搜索、榜单、消息会话、通知和设置接口。

## 图片上传

`POST /uploads/presign` 返回的 `uploadUrl` 在本地实现为 `POST /uploads/:assetId/complete`。小程序通过 `media-service` 将临时图片二进制提交到该地址，服务端写入 `services/api/uploads/` 并返回可访问的本地资源 URL。生产环境替换为对象存储直传地址，不改变作品接口中的 `imageAssetIds` 字段。

## 数据持久化

当前默认使用 Node 原生 SQLite，数据库文件为 `services/api/data/local-db.sqlite`，表名与数据库设计中的逻辑表一致，运行时文件不会提交。若运行环境没有 `node:sqlite`，才会回退到 JSON store；后续接入 PostgreSQL 时替换 store/repository 层即可，前后端接口保持不变。

## 启动

```powershell
cd services/api
npm run dev
```
