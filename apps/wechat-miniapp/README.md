# SoleMuse 微信小程序

此目录是 SoleMuse 一期唯一的客户端实现位置，技术栈为微信小程序原生 JavaScript。目前已完成按设计原型重写的前端演示版，可直接导入微信开发者工具预览。

内部结构、页面分包和依赖边界见 [项目目录规划](../../docs/architecture/project-structure.md)。微信开发者工具的 `miniprogramRoot` 已指向本目录下的 `miniprogram/`。

原型对应的页面功能、交互和范围决策见 [页面级功能界面设计](../../docs/miniappDesign/page-level-functional-design.md)；已提取的开发素材见 [原型素材提取说明](../../docs/miniappDesign/extracted-materials.md)。

本阶段不要在这里实现服务端逻辑，也不要保存微信 AppSecret 或阿里云访问凭证。

## 本地使用

1. 使用微信开发者工具导入当前目录 `apps/wechat-miniapp`。
2. 确认 `project.config.json` 中的 `appid` 属于当前小程序。AppID 可以提交，但 AppSecret 绝不能进入前端仓库。
3. 执行 `npm run check` 检查目录、JSON 配置和请求边界。
4. 执行 `npm test` 运行不依赖微信运行时的单元测试。

当前 `config/environment.js` 未配置 API 域名，页面不会主动请求占位域名。开发版会启用本地演示会话和原型数据，以便完整查看消息、个人中心、发布与编辑流程；体验版和正式版不会启用该会话。后端接口确定后再填写各环境地址。
