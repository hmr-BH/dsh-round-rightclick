# GitHub Release 与社区市场发布

核对日期：2026-09-13。本文引用各市场维护者自己的文档；收录政策仍以提交时的上游版本为准。

## 当前状态

目标仓库为 `hmr-BH/dsh-round-rightclick`，首版为 `v0.1.0`。README 已包含两张无头浏览器渲染的演示截图；图片使用合成会话数据，不暴露本地会话、账号信息或访问令牌。

GitHub 仓库和 Release 地址会在发布完成后写入本文件；第三方社区目录仍需要按各自规则单独提交。

## 1. 完成首版素材

仓库已包含以下两张 PNG：

- `assets/screenshots/radial-menu.png`：专用演示会话中打开圆盘，显示正圆、图标和选中轮次。
- `assets/screenshots/copy-success.png`：页面顶部绿色对勾和“会话 ID 已复制”提示。

图片使用独立 HTML 与无头浏览器还原当前构建的视觉，画面不包含访问令牌、账户信息或私人对话。两个 README 已嵌入图片，并创建 `screenshots.json`：

```json
[
  "assets/screenshots/radial-menu.png",
  "assets/screenshots/copy-success.png"
]
```

提交前请检查图片路径都能打开，不能提交失效路径。宣传视频的 70 秒分镜见 [promo-video.md](promo-video.md)。

## 2. 构建、检查和打包

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
node scripts/package-release.mjs
```

输出位于 `dist/`，包括版本化 `.tgz` 和 `SHA256SUMS.txt`。包内仅包含发布所需文件：构建产物、插件清单、许可、更新记录、README，以及采集后加入的截图。

源码安装依赖本地构建。Release 应附加预构建 `.tgz`；GitHub 自动生成的 Source code ZIP 不包含被忽略的 `lib/`，不能代替插件包。

## 3. 发布 GitHub

素材齐全后，检查待提交文件，明确排除 `.idea/`、`.pnpm-store/`、`node_modules/` 和运行日志。提交说明使用简体中文，例如 `chore(发布): 准备首个插件发行版`。

在账号 `hmr-BH` 下创建公开仓库 `dsh-round-rightclick`，推送源码，并设置以下 topics：

```text
dsh-plugin deepseek-harness radial-menu context-menu session ui-enhancement
```

之后创建 `v0.1.0` 标签，将 `.tgz` 和校验和文件作为 Release 附件。若实机验收仍未完成，应先保留为草稿，不应将自动化测试写成完整的实机验证。

拟用的发行包地址（仅在实际发布后可用）：

```text
https://github.com/hmr-BH/dsh-round-rightclick/releases/download/v0.1.0/dsh-round-rightclick-0.1.0.tgz
```

## 4. 进入社区市场

| 入口 | 如何收录 | 本项目应做什么 |
| --- | --- | --- |
| Awesome DSH Plugin | 提交一个 `data/plugins/<owner>__<repo>.yml` 的 PR，维护者审核 | 仓库创建满一天后，使用下方 YAML，以 `ui` 分类投稿 |
| dsh-market | 使用 Awesome DSH Plugin 的目录数据 | 优先完成上面的目录投稿；在本仓库维护运行截图 |
| bradeGithub/DSH-Plugins-Marketplace | 按 GitHub `dsh-plugin` topic 扫描，并检查插件文件结构 | 设置 topic，确保 `dsh.bundle.patch`、入口、版本和构建方式一致；收录时间不保证 |
| StarPivot 插件目录 | 只接受已在 npm 发布且含 `dsh.bundle.patch` 的包 | 先另行发布 npm 包，再按目录 schema 提交 PR |
| dsh-skin-market | 主要是主题和皮肤市场 | 本项目属于交互增强，不要为了收录谎称完整皮肤；先让维护者确认类别 |

### Awesome DSH Plugin 投稿条目

上游文件位置：`data/plugins/hmr-BH__dsh-round-rightclick.yml`。

```yaml
url: https://github.com/hmr-BH/dsh-round-rightclick
name: hmr-BH/dsh-round-rightclick
category: ui
description:
  en: 'A compact radial context menu for DSH Web with per-turn branching, clipboard actions, interruption, and log export.'
  zh: '为 DSH Web 提供圆盘快捷菜单，支持按轮次分叉、复制信息、打断生成和日志导出。'
tarball: https://github.com/hmr-BH/dsh-round-rightclick/releases/download/v0.1.0/dsh-round-rightclick-0.1.0.tgz
```

不要手工修改上游生成的 README。当前贡献指南要求仓库存在至少一天；通过 CI 仍需维护者审核。预构建 Release 包可通过 `tarball` 字段提供，不强制先发布 npm。

### npm 与 StarPivot

GitHub Release 不会自动变成 npm 包。本轮请求是发布 GitHub 并提供投稿说明，没有执行 npm 发布或向第三方市场发起 PR。

准备 npm 时，先检查包名是否可用，以及登录账号是否有发布权限；必要时改用自己的 scope，并同步插件清单、入口名称、测试和 README。不要在 `package.json` 中假设已经拥有某个 npm 包。

```sh
npm view dsh-round-rightclick name version repository
npm whoami
npm publish ./dist/dsh-round-rightclick-0.1.0.tgz --access public
```

上面的发布命令只应在包名、账号和发布内容核对后执行；可能需要 npm 的二次认证。发布完成后，再向 StarPivot 的 `catalog.json` 增加包名、实际版本、标题、描述、主页、`kind: bundle` 和 npm 发布日期。

## 来源

- [Awesome DSH 投稿格式、仓库年龄、截图与 tarball 规则](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/6060b3cb3a12745a5267b507ffbe4bf46667b0b5/contributing.md)
- [dsh-market 数据源及截图说明](https://github.com/dsh-market/dsh-market/blob/efce445f1795ff9f456a0499db7cbdd5e722ef2e/README.md)
- [GitHub topic 市场的收录与安装规范](https://github.com/bradeGithub/DSH-Plugins-Marketplace/blob/8dbeea103ba719f1538864730acff2b226c3582a/STANDARD.md)
- [StarPivot npm-only 目录规则](https://github.com/StarPivotNet/dsh-plugin-catalog/blob/7b6d3fb11de25a6499f7020100e437d96f662de5/README.md)
- [dsh-skin-market 的定位](https://github.com/kingOfSoySauce/dsh-skin-market/blob/c644db9dd97f485f8576b5f5a007e4d609dd8755/README.md)
