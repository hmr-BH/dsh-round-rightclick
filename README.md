# dsh-round-rightclick

为 DeepSeek Harness 提供圆盘式右键菜单：在对话的具体轮次上点击右键，即可在光标位置执行常用会话操作。

[English](README.en.md) · [更新记录](CHANGELOG.md)

![版本](https://img.shields.io/github/v/release/hmr-BH/dsh-round-rightclick?display_name=tag&sort=semver)
![npm](https://img.shields.io/npm/v/dsh-round-rightclick)
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

## 截图

![圆盘菜单](assets/screenshots/radial-menu.png)

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

### npm 安装（推荐）

```sh
dsh plugin --profile web add dsh-round-rightclick
```

重启 `dsh web` 并刷新页面。npm 包内已含构建产物，无需安装 pnpm，也无需本地编译；预构建发布也不会触发构建授权。

### Release 包安装

从 [Releases](https://github.com/hmr-BH/dsh-round-rightclick/releases) 下载 `dsh-round-rightclick-0.1.0.tgz`，然后执行：

```sh
dsh plugin --profile web add ./dsh-round-rightclick-0.1.0.tgz
```

重启 `dsh web` 并刷新页面。tarball 内同样已含构建产物。

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
