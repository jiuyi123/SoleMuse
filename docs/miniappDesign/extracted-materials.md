# SoleMuse 原型素材提取说明

## 使用范围

本目录中的素材从 941×1672 页面原型截图中按像素裁切，用于小程序前端布局、卡片、列表和状态联调。它们不是独立原始设计稿，分辨率有限，且来源授权信息未随原型提供；正式发布前应确认权属，或替换为获得授权的高清原图。

结构化示例数据位于 `apps/wechat-miniapp/mocks/fixtures/prototype-content.json`，图片清单位于 `apps/wechat-miniapp/miniprogram/assets/images/demo/asset-manifest.json`。

## 已提取图片

| 文件 | 原型内容 | 尺寸 | 建议用途 |
| --- | --- | ---: | --- |
| `artwork-01-yixiu-shanhai.png` | 颐绣·山海行 | 316×216 | 作品卡片、云境行者详情占位 |
| `artwork-02-yixiu-huayu.png` | 颐绣花语 | 316×216 | 作品卡片 |
| `artwork-03-yiyun-chaosheng.png` | 颐韵·潮生 | 316×205 | 作品卡片 |
| `artwork-04-dongfang-xiujing.png` | 东方绣境 | 316×205 | 作品卡片 |
| `artwork-05-liuguang-yixiu.png` | 流光颐绣 | 316×196 | 作品卡片 |
| `artwork-06-yixiu-future.png` | 颐绣 × 未来 | 316×196 | 作品卡片 |
| `avatar-lintong-manbu.png` | 林桐漫步头像 | 170×170 | 个人资料开发占位 |
| `profile-promo-banner.png` | “AI × 鞋履 × 更美的未来”横幅 | 618×143 | 个人页推广横幅 |

图片统一位于 `apps/wechat-miniapp/miniprogram/assets/images/demo/`。可运行 `apps/wechat-miniapp/scripts/extract-prototype-assets.ps1` 从原型重新生成，脚本使用固定像素区域，不做生成式补画或内容修改。

## 原型中可直接复用的信息

搜索结果页明确展示了以下卡片信息：

| 作品 | 作者 | AI 工具/模型 | 点赞 |
| --- | --- | --- | ---: |
| 颐绣·山海行 | Lynn. | Midjourney | 328 |
| 颐绣花语 | Sugar | DALL·E 3 | 512 |
| 颐韵·潮生 | KAI | Stable Diffusion | 243 |
| 东方绣境 | 绘设计 | Midjourney | 476 |
| 流光颐绣 | 小鹿 | Leonardo | 398 |
| 颐绣 × 未来 | NeoDesign | 腾讯混元 | 291 |

作品详情页还提供了“云境行者”的 Prompt、创作说明、标签、作者、发布时间和互动数字，均已原样整理至 fixture 的 `featuredArtwork`。原型不同页面对同一视觉作品使用了不同标题或作者，例如首页/详情/榜单中的“云境行者”与搜索页“颐绣·山海行”，应视为示例数据不一致，不能据此建立正式数据关联。

## 未提取内容

- 原型外层手机框、山水背景、装饰花纹和英文页脚不属于小程序运行界面，不作为前端页面素材。
- 页面图标建议后续由统一 SVG/iconfont 图标系统实现，不从截图裁切，避免模糊和状态不一致。
- 评论头像尺寸过小，且部分为动物或风景示例，不适合作为正式头像资源。
- 详情页大图带有标题、装饰文案和分页控件，无法无损获得纯作品原图，因此未重复裁切。

