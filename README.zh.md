# dsh-round-rightclick

为 DeepSeek Harness（DSH）Web 提供一个轻量、可键盘操作的圆盘右键菜单，把高频会话操作放到当前轮次旁边。

[English](README.md) · [发布指南](docs/publishing.md) · [更新记录](CHANGELOG.md)

![版本](https://img.shields.io/github/v/release/hmr-BH/dsh-round-rightclick?display_name=tag&sort=semver)
![构建](https://img.shields.io/github/actions/workflow/status/hmr-BH/dsh-round-rightclick/ci.yml?label=build)
![许可证](https://img.shields.io/github/license/hmr-BH/dsh-round-rightclick)

## 解决什么问题

DSH 的会话操作通常分散在不同按钮、面板和浏览器菜单里。这个插件把工作目录、剪贴板、生成控制、按轮次分叉和日志导出集中到一个小圆盘中：在对话的具体提问或回复上右键，选择动作即可。

它特别适合需要频繁比较方案的工作流：先在原会话里讨论，再从第 1、2 或 3 轮分别创建分支，保留源会话继续探索。

## 界面预览

![圆盘菜单预览](assets/screenshots/radial-menu.png)

菜单以标准圆形、细线图标、分隔线和蓝色光晕区分动作；中心按钮显示当前锁定的轮次。默认直径为 240 CSS 像素，会在小窗口中自动缩小并避开边缘。

![复制成功提示](assets/screenshots/copy-success.png)

复制、分叉、导出等操作会在页面顶部显示状态提示。成功提示使用绿色圆形对勾，失败提示使用红色圆形感叹号；提示文字会说明下一步应该做什么。

> 图片使用无头浏览器渲染的演示数据生成，不包含真实会话、账号信息或访问令牌。`screenshots.json` 记录了可供社区目录读取的图片路径。

## 功能

| 操作 | 作用 | 可用条件 |
| --- | --- | --- |
| 打开目录 | 在系统文件管理器中打开当前会话工作目录 | 会话设置了目录，且 DSH 在本机运行 |
| 复制路径 | 复制工作目录的完整路径 | 浏览器允许剪贴板写入 |
| 复制会话 ID | 复制当前会话的唯一标识 | 当前会话存在 |
| 打断 | 请求停止正在进行的生成或工具执行 | 会话处于运行状态 |
| 从此轮分叉 | 只保留截至所选轮次的对话，并打开新的分支会话 | 目标轮次已加载且已完成 |
| 导出日志 | 下载当前会话及其子会话的日志 ZIP | 宿主提供导出服务 |

### 按轮次分叉

假设会话包含三轮完整对话：

```text
第 1 轮：确定需求
第 2 轮：比较方案
第 3 轮：完善文案
```

在第 1 轮的提问或回复上右键并选择“从此轮分叉”，新会话只包含第 1 轮；在第 2 轮操作，则保留第 1～2 轮。源会话不会被覆盖。

分叉位置来自该轮结束事件的序号，而不是鼠标点击位置或整段会话的最后一条消息。正在生成、尚未加载结束事件或无法识别轮次时，动作会禁用并给出原因，避免误复制完整会话。

## 安装

### 使用 Release 包（推荐）

从 [Releases](https://github.com/hmr-BH/dsh-round-rightclick/releases) 下载 `dsh-round-rightclick-0.1.0.tgz`，然后执行：

```sh
dsh plugin --profile web add ./dsh-round-rightclick-0.1.0.tgz
```

重启 `dsh web` 并刷新页面。安装包已经包含构建产物，不需要在本机安装 pnpm 或重新编译。

### 从源码安装

```sh
git clone https://github.com/hmr-BH/dsh-round-rightclick.git
cd dsh-round-rightclick
pnpm install --frozen-lockfile
pnpm run build
dsh plugin --profile web add .
```

源码安装后重启 `dsh web`。卸载命令：

```sh
dsh plugin --profile web remove dsh-round-rightclick
```

## 操作方式

- 在已完成的提问或回复上按右键打开菜单。
- 鼠标悬停或方向键选择动作，Enter 执行。
- Esc、Tab、滚动、窗口失焦或点击菜单外关闭菜单。
- 松开右键不会误触发菜单动作。
- 一项操作执行期间会锁定菜单，避免重复点击。
- 输入框、`contenteditable` 区域和其他编辑控件保留浏览器原生右键菜单。

## 环境要求与边界

- DeepSeek Harness Web，推荐使用已验证的 `@deepseek-ai/dsh-api-session-controller` `0.1.2-rc.1` 或兼容版本。
- Node.js `^22.19.0` 或 `>=24.0.0`；源码构建使用 pnpm。
- 支持 SVG、CSS `clip-path` 和 Clipboard API 的现代浏览器。
- Windows 已完成本机验证；macOS 和 Linux 的文件管理器命令有自动化覆盖，但仍需要各自平台的实机验收。
- 插件只注入 Web 页面，不向 DSH TUI 添加菜单。

## 隐私与权限

插件没有遥测、广告、远程服务或额外 API Key。动作只在用户点击后执行：读取当前会话状态，调用宿主打开目录、打断、分叉或导出，或者写入浏览器剪贴板。

导出的日志可能包含完整对话和工具输出。发送给他人前，请先检查并清理敏感内容。

## 常见问题

**右键没有菜单？** 确认插件安装在 `web` profile，重启 `dsh web` 并刷新页面；请在对话内容上测试，不要在输入框中测试。

**“从此轮分叉”不可用？** 将鼠标移到具体提问或回复，等待该轮完成并加载结束事件。正在生成时可先使用“打断”，再重新打开菜单。

**复制失败？** 允许当前页面访问剪贴板，并使用受支持的 localhost 或 HTTPS 页面。

**为什么远程 SSH 会话不能打开目录？** 文件管理器只能运行在 DSH 所在的机器上，插件会拒绝把远程会话映射到本机桌面。

## 开发与验证

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
node scripts/package-release.mjs
```

项目包含 47 个自动化测试，覆盖菜单动作、轮次解析、宿主路由、剪贴板反馈和组件交互。若本机安装了 DSH，还可以运行宿主契约检查：

```sh
node scripts/verify-installed-dsh.mjs "path/to/installed/@deepseek-ai/dsh"
```

代码入口：

```text
src/client/RadialMenu.tsx  菜单渲染、键盘导航和操作反馈
src/client/menu-layout.ts  圆盘尺寸、扇区区域和边缘避让
src/client/fork-target.ts   已完成轮次的分叉位置解析
src/client/index.ts         宿主会话服务与客户端动作绑定
src/client/styles.ts        圆盘、图标和顶部提示样式
src/opener.ts                工作目录校验和系统文件管理器调用
tests/                       单元测试与组件测试
```

发布到 GitHub Release、Awesome DSH Plugin、dsh-market、StarPivot 等目录的步骤见 [docs/publishing.md](docs/publishing.md)。

## 许可

[MIT](LICENSE)。这是独立社区插件，与 DeepSeek 官方没有隶属关系。
