# SoleMuse 本地 API

这是按照 `services/api/tmp/backend-api-contracts.md` 实现的无第三方依赖本地 API，用于前后端联调。默认使用 Node 原生 `node:sqlite`，数据持久化在 `services/api/data/local-db.sqlite`；集合名称与 `Design/database-design.md` 的表职责对应。Node 不支持 `node:sqlite` 时才回退到 JSON store。

## 启动

```powershell
cd services/api
npm run dev
```

默认监听 `0.0.0.0:3000`，接口前缀为 `http://127.0.0.1:3000/api/v1`。首次启动会从小程序现有原型数据生成本地种子数据和 SQLite 表。

环境变量：`PORT=3000`、`HOST=0.0.0.0`。

## 联调说明

- 本地开发登录接口接受非空的开发 `code`，不会调用微信 AppSecret；真实微信换取 session 的逻辑应在生产配置中替换。
- 真机访问时，把小程序 develop 环境的 API 地址改为电脑局域网 IP，并在微信开发者工具中配置合法域名/关闭校验；正式环境必须使用 HTTPS 域名。
- 本地数据文件和上传文件均已加入 gitignore，不会提交用户数据或运行时内容。
