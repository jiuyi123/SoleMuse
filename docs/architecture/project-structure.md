# SoleMuse 项目目录规划

## 1. 规划结论

SoleMuse 采用轻量单仓库结构。当前只创建并开发微信小程序工作区，同时固定客户端与 API 的边界；等后端或 Web 正式立项后，再增加相应工作区，避免一期承担无效的工程复杂度。

推荐目录如下。标记为“未来”的目录现在不创建。

```text
SoleMuse/
├─ AGENTS.md                         # 仓库级 AI 开发约束，始终生效
├─ README.md                         # 项目入口与当前范围
├─ .agents/
│  └─ skills/
│     └─ solemuse-miniapp/
│        └─ SKILL.md                 # 小程序开发任务的专项约束
├─ apps/
│  ├─ wechat-miniapp/                # 当前：原生 JavaScript 微信小程序
│  │  ├─ miniprogram/                # 微信开发者工具的 miniprogramRoot
│  │  ├─ mocks/                      # 按接口组织的开发期 mock 与场景数据
│  │  ├─ tests/                      # 前端单元测试、fixtures 与测试辅助代码
│  │  ├─ scripts/                    # 仅存放小程序本地工程脚本
│  │  ├─ project.config.json         # 可共享的开发者工具配置
│  │  ├─ project.private.config.json # 个人配置，不提交
│  │  ├─ package.json                # lint、test 与构建辅助依赖
│  │  └─ README.md
│  └─ web/                           # 未来：Web 客户端
├─ services/
│  └─ api/                           # 未来：Node.js API 服务
├─ packages/
│  └─ api-contracts/                 # 未来：多端共用的接口契约/Schema
├─ docs/
│  ├─ architecture/                  # 架构、目录和关键技术决策
│  ├─ api/                           # 接口草案、错误码与联调说明
│  └─ AI 鞋履创意 Prompt 平台_PRD_V1.0.md
└─ tools/                            # 未来：跨工作区开发工具，不放业务代码
```

`apps/web`、`services/api` 和 `packages/api-contracts` 体现最终方向，但应在对应阶段开始时再创建。现在需要的接口草案可先放入 `docs/api/`，由 mock 和 service 共同遵循。

## 2. 小程序内部结构

`apps/wechat-miniapp` 已按以下结构初始化；未产生实际内容的可选目录会在首次需要时创建：

```text
apps/wechat-miniapp/
├─ miniprogram/
│  ├─ app.js
│  ├─ app.json
│  ├─ app.wxss
│  ├─ sitemap.json
│  ├─ assets/
│  │  ├─ icons/
│  │  └─ images/
│  ├─ config/                        # 环境、功能开关；不保存秘密
│  ├─ constants/                     # 路由名、枚举、缓存键
│  ├─ core/
│  │  ├─ http/                       # wx.request 封装、拦截与错误归一化
│  │  ├─ auth/                       # 会话读取、刷新与登录态守卫
│  │  └─ errors/                     # 统一业务错误模型
│  ├─ services/                      # 按领域暴露 API：artwork、user、message 等
│  ├─ models/                        # DTO 到页面模型的转换与 JSDoc 类型
│  ├─ state/                         # 必要的跨页面状态；避免成为全局杂物箱
│  ├─ components/
│  │  ├─ common/                     # 通用视觉组件
│  │  └─ domain/                     # artwork-card、source-tag 等领域组件
│  ├─ behaviors/                     # 多组件共享的微信 behavior
│  ├─ utils/                         # 无业务语义的纯函数
│  ├─ pages/                         # 主包：五个 tab 页
│  │  ├─ home/
│  │  ├─ ranking/
│  │  ├─ create/
│  │  ├─ messages/
│  │  └─ profile/
│  ├─ subpackages/
│  │  ├─ account/                    # 登录、资料完善
│  │  ├─ artwork/                    # 搜索、详情、筛选
│  │  ├─ creator/                    # 发布、编辑、草稿
│  │  └─ user/                       # 资料编辑、我的各类列表
│  └─ custom-tab-bar/                # 可选：需要突出“创作 +”时再创建
├─ mocks/
│  ├─ handlers/                      # 与 service 一一对应的 mock 响应
│  └─ fixtures/                      # 可复用的用户、作品、评论、消息样本
├─ tests/
│  ├─ unit/
│  └─ fixtures/
└─ scripts/
```

每个页面目录使用微信原生四件套：

```text
page-name/
├─ index.js
├─ index.json
├─ index.wxml
├─ index.wxss
└─ components/                       # 仅该页面使用的组件，按需创建
```

## 3. 页面与分包策略

五个底部导航页必须在主包中：`home`、`ranking`、`create`、`messages`、`profile`。登录、搜索、作品详情、作品编辑和“我的内容”等非 Tab 页面按业务域进入分包。

这样拆分有三个直接收益：主包体积更容易控制；作品领域页面可以集中维护；未来 Web 端出现后，页面结构不会被误当作共享业务层。

如果“创作”入口需要明显高于普通 Tab 的加号样式，使用 `custom-tab-bar/`；若视觉稿只要求标准 Tab，则删除该目录并使用原生 tabBar 配置。

## 4. 依赖方向

```text
页面 / 页面私有组件
        ↓
领域组件 + state
        ↓
领域 services
        ↓
models（字段转换）
        ↓
core/http + API 契约
        ↓
真实 Node.js API 或 mocks
```

依赖只能沿图向下。页面不直接调用 `wx.request`，组件不直接请求接口，`utils` 不承载登录、作品或互动规则。后端接入时，只替换底层地址和 mock 开关，页面使用的 service 方法及页面模型保持稳定。

## 5. 与未来后端、Web 的衔接

- API 使用版本前缀，例如 `/api/v1`；认证、错误结构、分页结构和时间格式应在联调前统一。
- 图片上传通过 service 封装，客户端不感知未来使用阿里云 OSS 直传还是 API 中转。
- 小程序只保存短期会话信息；微信 AppSecret、JWT 签名密钥和 OSS 密钥仅属于服务端。
- 可共享的是接口契约、枚举和校验 Schema，不共享小程序页面、组件或 `wx.*` 适配代码。
- 当 Node.js API 与 Web 端启动后，再引入 npm workspaces。当前单客户端阶段不需要提前配置 monorepo 构建系统。

## 6. 命名约定

- 目录与文件使用 `kebab-case`，构造函数或类使用 `PascalCase`，变量与函数使用 `camelCase`。
- 页面路径按业务语义命名，避免 `page1`、`list2` 等无意义名称。
- service 方法表达业务动作，如 `listArtworks`、`publishArtwork`、`toggleFavorite`。
- 接口 DTO 与页面模型分开命名；页面不得依赖服务端蛇形字段或不稳定字段。

## 7. 当前阶段的落地顺序

1. 初始化原生小程序壳与五个 Tab 页面，确认分包和自定义 Tab 的技术可行性。
2. 定义作品、用户、评论、消息的最小前端模型与 API 草案。
3. 建立 HTTP、认证、service 和 mock 基础层。
4. 按“浏览作品 → 作品详情 → 登录互动 → 发布作品 → 个人管理 → 消息”的闭环逐段实现。
5. Node.js API 开始开发后，以契约替换 mock，并保留可切换的开发环境配置。

## 8. 待确认但不阻塞目录初始化

- 登录采用仅微信授权、手机号验证，还是组合方式。
- 图片数量、大小、分辨率与文件类型限制。
- 热度榜计算规则、消息已读规则和分页协议。
- “创作 +”是否要求自定义 TabBar。
- 前端单元测试工具、代码格式化和 lint 的具体选型。
