# dsh-round-rightclick

在 DeepSeek Harness（DSH）Web 的对话上点右键，弹出一个圆盘菜单，把常用的会话操作直接放到鼠标底下。

[English](README.en.md) · [更新记录](CHANGELOG.md)

![版本](https://img.shields.io/github/v/release/hmr-BH/dsh-round-rightclick?display_name=tag&sort=semver)
![许可证](https://img.shields.io/github/license/hmr-BH/dsh-round-rightclick)

## 为什么做这个

DSH 的会话操作挺散的。工作目录要翻侧栏，打断要抢时机，而「从中间某一轮重新开一个分支」这件事原本压根没有——只能手动把前面的对话复制到新会话里，粘完还得检查有没有漏。

圆盘把这些动作收到了一起。右键点在某条具体的提问或回复上，六个动作围成一圈，鼠标和键盘都能选。

用得最多的是**从此轮分叉**。假设一个会话聊了三轮：

```text
第 1 轮：确定需求
第 2 轮：比较方案
第 3 轮：完善文案
```

在第 1 轮上分叉，新会话只带第 1 轮；在第 2 轮上分叉，新会话带第 1、2 轮。源会话原样不动，两边可以对着看。方向跑偏了就从跑偏的那一轮之前重来，不用重开一个空白会话把上下文重新喂一遍。

分叉点取的是那一轮 `turn/end` 事件的序号，不是鼠标坐标，也不是会话里最后一条消息。所以点在哪一轮就是点到哪一轮。轮次还在生成、或者结束事件还没加载出来时，这一项会置灰并写明原因，不会闷头退化成「复制整个会话」——那种分叉结果是错的还不吭声，比没有这个功能更坑。

## 界面

![圆盘菜单](assets/screenshots/radial-menu.png)

默认直径 240 CSS 像素。窗口小的时候圆盘会自动缩小并往里挪，不会被裁掉。中间那颗按钮显示当前锁定的是第几轮，点它可以关掉菜单。操作结果在页面顶部弹提示：绿色对勾是成功，红色感叹号是失败，提示文字会告诉你下一步该干什么。

## 六个动作

| 动作 | 干什么 | 什么时候能用 |
| --- | --- | --- |
| 打开目录 | 在系统文件管理器里打开这个会话的工作目录 | 会话设了目录，且 DSH 跑在本机 |
| 复制路径 | 把工作目录的完整路径写进剪贴板 | 浏览器允许剪贴板写入 |
| 复制会话 ID | 复制当前会话的 ID | 有打开的会话 |
| 打断 | 停掉正在跑的生成或工具执行，已有对话保留 | 会话在运行中 |
| 从此轮分叉 | 带着截至该轮的对话开一个新的分支会话 | 该轮已完成且已加载 |
| 导出日志 | 下载当前会话及其子会话的日志 ZIP | 宿主提供导出服务 |

## 安装

### 装 Release 包（推荐）

从 [Releases](https://github.com/hmr-BH/dsh-round-rightclick/releases) 下载 `dsh-round-rightclick-0.1.0.tgz`，然后：

```sh
dsh plugin --profile web add ./dsh-round-rightclick-0.1.0.tgz
```

重启 `dsh web`，刷新页面。包里已经带了构建产物，不用装 pnpm 也不用自己编译。

### 从源码装

```sh
git clone https://github.com/hmr-BH/dsh-round-rightclick.git
cd dsh-round-rightclick
pnpm install --frozen-lockfile
pnpm run build
dsh plugin --profile web add .
```

装完同样要重启 `dsh web`。卸载：

```sh
dsh plugin --profile web remove dsh-round-rightclick
```

## 怎么用

- 在已经完成的提问或回复上按右键，圆盘出现。
- 鼠标移到扇区上点左键执行，或者用方向键选、Enter 执行。
- 松开右键不会触发动作，所以按住右键划到某一项再松手是安全的。
- Esc、Tab、滚动页面、窗口失焦、缩放窗口、点圆盘外面，都会关掉菜单。
- 一个动作执行期间菜单会锁住，重复点没用，避免连发两次请求。
- 输入框、`contenteditable` 这类可编辑区域保留浏览器原生右键菜单，插件不抢。

## 环境要求和已知限制

- DSH Web。分叉这块开发时对着本机装的 `@deepseek-ai/dsh-api-session-controller` `0.1.2-rc.1` 跑过契约检查（`scripts/verify-installed-dsh.mjs`），换了宿主版本建议自己再跑一遍。
- Node.js `^22.19.0` 或 `>=24.0.0`。只有从源码装才需要，构建用 pnpm。
- 浏览器要支持 SVG、CSS `clip-path` 和 Clipboard API。
- Windows 是我日常在用的环境；macOS 和 Linux 的文件管理器命令有测试覆盖，但没做实机验收，遇到「打开目录」不出来的话欢迎提 issue。
- 只注入 Web 页面，TUI 里没有这个菜单。

## 隐私

没有遥测，没有广告，不连任何远程服务，也不需要额外的 API Key。所有动作都是你点了才执行：读一次当前会话快照，然后请宿主去开目录、打断、分叉或导出，或者往浏览器剪贴板写一段文本。仅此而已。

导出的日志里有完整对话和工具输出，发给别人之前先翻一遍。

## 常见问题

**右键没反应。** 确认插件装在 `web` profile 下，重启 `dsh web` 再刷新页面。另外得在对话内容上点——在输入框里点是不会有圆盘的。

**「从此轮分叉」是灰的。** 检查两件事：右键点的是不是具体某一轮的提问或回复，以及那一轮跑完了没有。正在生成的话先「打断」，等结束事件加载出来再开一次菜单。

**复制失败。** 两种常见原因：浏览器不给这个页面剪贴板权限，或者页面不是 localhost / HTTPS。这两种情况下剪贴板 API 就是写不进去。

**远程 SSH 会话打不开目录。** 这是故意的。文件管理器只能开在 DSH 所在的那台机器上，硬映射的话只会在服务器上弹一个谁也看不见的窗口，所以直接拒绝并提示原因。

## 开发

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
node scripts/package-release.mjs
```

47 个测试，覆盖菜单动作、轮次解析、宿主路由、剪贴板反馈和组件交互。本机装了 DSH 的话，可以拿真实宿主跑一遍分叉契约检查：

```sh
node scripts/verify-installed-dsh.mjs "path/to/installed/@deepseek-ai/dsh"
```

代码大致这么分：

```text
src/client/RadialMenu.tsx  渲染、键盘导航、操作反馈
src/client/menu-layout.ts  圆盘几何、扇区命中区域、视口避让
src/client/fork-target.ts  分叉轮次解析
src/client/index.ts        和宿主会话服务的接线
src/client/styles.ts       圆盘、图标、顶部提示的样式
src/opener.ts              目录校验和文件管理器调用
tests/                     单元测试和组件测试
```

## 许可

[MIT](LICENSE)。个人维护的社区插件，和 DeepSeek 官方没有隶属关系。
