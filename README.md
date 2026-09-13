# dsh-round-rightclick

为 DeepSeek Harness（DSH）Web 提供圆盘式右键菜单：在对话的具体轮次上点击右键，即可在光标位置执行常用会话操作。

[English](README.en.md) · [更新记录](CHANGELOG.md)

![版本](https://img.shields.io/github/v/release/hmr-BH/dsh-round-rightclick?display_name=tag&sort=semver)
![许可证](https://img.shields.io/github/license/hmr-BH/dsh-round-rightclick)

## 为什么需要这个插件

DSH 的会话操作分散在页面各处。工作目录需要在侧栏中查找，打断生成需要判断时机，而「从中间某一轮创建分支」在原生功能中并不存在——只能手动把此前的对话复制到新会话，并自行确认没有遗漏。

圆盘菜单把这些操作集中到一处。右键点击某条具体的提问或回复，六个动作围绕光标排列，鼠标与键盘均可选择。

核心动作是**从此轮分叉**。以一个包含三轮完整对话的会话为例：

```text
第 1 轮：确定需求
第 2 轮：比较方案
第 3 轮：完善文案
```

在第 1 轮上分叉，新会话只包含第 1 轮；在第 2 轮上分叉，新会话包含第 1、2 轮。源会话保持不变，两个会话可以并行对照。对话方向偏离时，从偏离前的那一轮重新开始即可，不必在新会话中重新提供上下文。

分叉边界取自该轮 `turn/end` 事件的序号，而非鼠标坐标或会话中的最后一条消息，因此分叉结果严格等于所点击的那一轮。该轮仍在生成、或结束事件尚未加载时，动作置灰并说明原因，不会退化为「复制整个会话」——后者会得到错误的分叉结果，且不给出任何提示。

## 界面

![圆盘菜单](assets/screenshots/radial-menu.png)

默认直径 240 CSS 像素。视口较小时圆盘自动缩小并向内偏移，不会被裁切。中心按钮显示当前锁定的轮次，点击可关闭菜单。操作结果以页面顶部提示条反馈：绿色对勾表示成功，红色感叹号表示失败，提示文字说明后续动作。

## 六个动作

| 动作 | 作用 | 可用条件 |
| --- | --- | --- |
| 打开目录 | 在系统文件管理器中打开该会话的工作目录 | 会话已设置目录，且 DSH 运行在本机 |
| 复制路径 | 将工作目录的完整路径写入剪贴板 | 浏览器允许剪贴板写入 |
| 复制会话 ID | 复制当前会话的 ID | 存在已打开的会话 |
| 打断 | 停止正在执行的生成或工具调用，保留已有对话 | 会话处于运行状态 |
| 从此轮分叉 | 携带截至该轮的对话创建新的分支会话 | 该轮已完成且已加载 |
| 导出日志 | 下载当前会话及其子会话的日志 ZIP | 宿主提供导出服务 |

## 安装

### Release 包安装（推荐）

从 [Releases](https://github.com/hmr-BH/dsh-round-rightclick/releases) 下载 `dsh-round-rightclick-0.1.0.tgz`，然后执行：

```sh
dsh plugin --profile web add ./dsh-round-rightclick-0.1.0.tgz
```

重启 `dsh web` 并刷新页面。安装包内已含构建产物，无需安装 pnpm，也无需本地编译。

### 源码安装

```sh
git clone https://github.com/hmr-BH/dsh-round-rightclick.git
cd dsh-round-rightclick
pnpm install --frozen-lockfile
pnpm run build
dsh plugin --profile web add .
```

安装后同样需要重启 `dsh web`。卸载命令：

```sh
dsh plugin --profile web remove dsh-round-rightclick
```

## 操作方式

- 在已完成的提问或回复上点击右键，圆盘菜单出现。
- 左键点击扇区执行动作，或使用方向键选择后按 Enter。
- 松开右键不会触发动作，因此按住右键在扇区之间移动是安全的。
- Esc、Tab、页面滚动、窗口失焦、窗口缩放、点击圆盘外部，均会关闭菜单。
- 动作执行期间菜单锁定，重复点击不会发出第二次请求。
- 输入框、`contenteditable` 等可编辑区域保留浏览器原生右键菜单，插件不接管这些区域。

## 环境要求与已知限制

- DSH Web。分叉契约在开发时针对本机安装的 `@deepseek-ai/dsh-api-session-controller` `0.1.2-rc.1` 验证（`scripts/verify-installed-dsh.mjs`）；宿主版本不同时应重新执行该脚本。
- Node.js `^22.19.0` 或 `>=24.0.0`，仅源码安装需要；构建使用 pnpm。
- 浏览器需支持 SVG、CSS `clip-path` 与 Clipboard API。
- Windows 已完成本机验证。macOS 与 Linux 的文件管理器命令有测试覆盖，但尚未实机验收，若「打开目录」在这两个平台上异常，可提交 issue。
- 仅注入 Web 页面，不提供 TUI 菜单。

## 隐私

无遥测、无广告、不连接远程服务、不需要额外 API Key。所有动作均在用户点击后执行：读取一次当前会话快照，随后请求宿主打开目录、打断、分叉或导出，或向浏览器剪贴板写入文本。

导出的日志包含完整对话与工具输出，对外发送前应检查内容。

## 常见问题

**右键无响应。** 确认插件安装在 `web` profile 下，重启 `dsh web` 并刷新页面。此外需要点击对话内容，输入框区域被有意排除。

**「从此轮分叉」置灰。** 确认右键点击的是具体轮次的提问或回复，且该轮已经结束。若仍在生成，可先执行「打断」，待结束事件加载后重新打开菜单。

**复制失败。** 常见原因有两类：浏览器未授予该页面剪贴板权限，或页面并非通过 localhost / HTTPS 提供。这两种情况下 Clipboard API 都会拒绝写入。

**远程 SSH 会话无法打开目录。** 这是有意设计。文件管理器只能在运行 DSH 的机器上启动，若强行映射，只会在服务器上打开一个无人可见的窗口，因此插件直接拒绝并说明原因。

## 开发

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
node scripts/package-release.mjs
```

47 项测试覆盖菜单动作、轮次解析、宿主路由、剪贴板反馈与组件交互。本机安装 DSH 后，可针对真实宿主执行分叉契约检查：

```sh
node scripts/verify-installed-dsh.mjs "path/to/installed/@deepseek-ai/dsh"
```

代码结构：

```text
src/client/RadialMenu.tsx  渲染、键盘导航、操作反馈
src/client/menu-layout.ts  圆盘几何、扇区命中区域、视口避让
src/client/fork-target.ts  分叉轮次解析
src/client/index.ts        与宿主会话服务的接线
src/client/styles.ts       圆盘、图标、顶部提示的样式
src/opener.ts              目录校验与文件管理器调用
tests/                     单元测试与组件测试
```

## 许可

[MIT](LICENSE)。个人维护的社区插件，与 DeepSeek 官方无隶属关系。
