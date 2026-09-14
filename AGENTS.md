# SoleMuse repository instructions

这些约束适用于整个仓库。

## 开始工作前

- 阅读 `docs/AI 鞋履创意 Prompt 平台_PRD_V1.0.md`，不要自行扩大一期范围。
- 阅读 `docs/architecture/project-structure.md`，新增文件应进入对应职责目录。
- 修改微信小程序时，使用 `.agents/skills/solemuse-miniapp/SKILL.md` 中的开发约束。

## 当前开发边界

- 当前只实现 `apps/wechat-miniapp` 下的原生 JavaScript 微信小程序。
- 未经用户明确要求，不创建 Node.js 后端、Web 端、管理后台或在线 AI 生成功能。
- 后端尚未可用时，通过 mock 与明确的数据契约开发，不要把 mock 数据直接写进页面。

## 仓库级规则

- 页面不得直接调用 `wx.request`；网络访问统一经过 API client 和领域 service。
- 页面负责展示与交互编排，跨页面业务状态和领域规则不得散落在页面文件中。
- 密钥、AppSecret、生产 Token、私有域名配置不得提交到仓库或打包进小程序。
- 新增接口或改变字段语义时，同步更新接口契约或对应文档。
- 保留用户已有改动；只修改完成当前任务所需的文件。
- 完成改动后运行与改动范围相称的 lint、单元测试或微信开发者工具检查，并说明未能执行的检查。

