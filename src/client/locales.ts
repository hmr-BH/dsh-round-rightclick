import type { ActionState, PieActionId } from './actions.ts'

/** 插件翻译命名空间。 */
export const NS = 'dsh-round-rightclick'
/** 动作名称、说明和三种执行状态的文案键。 */
export type CopyKey = PieActionId | `${PieActionId}.${'description' | 'success' | 'pending'}`
  | 'menu' | 'choose' | 'cancel' | 'keys' | 'turn' | 'no-turn' | 'unfinished' | 'unavailable'
  | 'no-directory' | 'idle' | 'busy' | 'failed' | 'clipboard-denied' | 'network-error' | 'dismiss'
/** 菜单字典。 */
export type MenuCopy = Record<CopyKey, string>

/** 简体中文操作文案。 */
export const zh: MenuCopy = {
  'open-dir': '打开目录', 'copy-cwd': '复制路径', 'copy-session-id': '复制会话 ID',
  stop: '打断', fork: '从此轮分叉', export: '导出日志',
  'open-dir.description': '在系统文件管理器中打开此会话的工作目录',
  'copy-cwd.description': '复制此会话工作目录的完整路径',
  'copy-session-id.description': '复制此会话的唯一 ID',
  'stop.description': '打断当前生成或工具执行，保留已有对话',
  'fork.description': '保留截至第 {turn} 轮的完整对话，并打开新的分支会话',
  'export.description': '下载此会话及子会话的日志 ZIP 文件',
  'open-dir.success': '已请求打开工作目录', 'copy-cwd.success': '工作目录路径已复制',
  'copy-session-id.success': '会话 ID 已复制', 'stop.success': '已发送打断请求',
  'fork.success': '已从第 {turn} 轮创建并打开分支会话', 'export.success': '已开始下载会话日志',
  'open-dir.pending': '正在打开工作目录…', 'copy-cwd.pending': '正在复制路径…',
  'copy-session-id.pending': '正在复制会话 ID…', 'stop.pending': '正在请求打断…',
  'fork.pending': '正在从第 {turn} 轮创建分支…', 'export.pending': '正在准备会话日志…',
  menu: '会话快捷菜单', choose: '选择操作', cancel: '关闭菜单', keys: '方向键选择 · Enter 执行 · Esc 关闭',
  turn: '第 {turn} 轮', 'no-turn': '请在要分叉的提问或回复上右键',
  unfinished: '此轮尚未结束，结束或打断后可分叉', unavailable: '此轮记录尚未就绪，请等待加载后重新打开菜单',
  'no-directory': '此会话未设置工作目录', idle: '当前没有正在进行的生成或工具执行',
  busy: '正在处理上一项操作，请稍候', failed: '操作未完成，请重试',
  'clipboard-denied': '无法写入剪贴板，请允许浏览器访问剪贴板后重试',
  'network-error': '无法连接本地服务，请检查连接后重试', dismiss: '关闭提示',
}

/** 英文操作文案。 */
export const en: MenuCopy = {
  'open-dir': 'Open folder', 'copy-cwd': 'Copy path', 'copy-session-id': 'Copy session ID',
  stop: 'Interrupt', fork: 'Fork this turn', export: 'Export log',
  'open-dir.description': 'Open this session’s workspace in your file manager',
  'copy-cwd.description': 'Copy the full workspace directory path',
  'copy-session-id.description': 'Copy this session’s unique ID',
  'stop.description': 'Interrupt generation or tool execution and keep the conversation',
  'fork.description': 'Keep the conversation through turn {turn} and open a new branch',
  'export.description': 'Download this session and its children as a log ZIP',
  'open-dir.success': 'Requested to open the workspace', 'copy-cwd.success': 'Workspace path copied',
  'copy-session-id.success': 'Session ID copied', 'stop.success': 'Interrupt requested',
  'fork.success': 'Created and opened a branch from turn {turn}', 'export.success': 'Session log download started',
  'open-dir.pending': 'Opening workspace…', 'copy-cwd.pending': 'Copying path…',
  'copy-session-id.pending': 'Copying session ID…', 'stop.pending': 'Requesting interruption…',
  'fork.pending': 'Creating a branch from turn {turn}…', 'export.pending': 'Preparing session log…',
  menu: 'Session shortcuts', choose: 'Choose action', cancel: 'Close menu', keys: 'Arrows to select · Enter to run · Esc to close',
  turn: 'Turn {turn}', 'no-turn': 'Right-click the question or answer you want to branch from',
  unfinished: 'This turn is still running; finish or interrupt it before branching', unavailable: 'This turn is not loaded yet; reopen the menu after loading',
  'no-directory': 'This session has no workspace directory', idle: 'No generation or tool execution is running',
  busy: 'An action is already in progress', failed: 'Action failed. Please retry',
  'clipboard-denied': 'Clipboard access failed. Allow clipboard access and retry',
  'network-error': 'Cannot reach the local service. Check the connection and retry', dismiss: 'Dismiss notification',
}

/**
 * 按文档语言选择字典，未声明时使用简体中文。
 * @returns 当前菜单字典
 */
export function dictionaryForDocument(): MenuCopy {
  const lang = typeof document === 'undefined' ? '' : document.documentElement.lang
  return lang === '' || lang.toLowerCase().startsWith('zh') ? zh : en
}

/**
 * 展示包含轮次占位符的操作文案。
 * @param text - 字典文本
 * @param state - 打开菜单时锁定的会话和轮次
 * @returns 填入轮次的文本
 */
export function withTurn(text: string, state: ActionState): string {
  return text.replace('{turn}', String(state.forkTarget?.turn ?? ''))
}

/**
 * 获取动作的说明或不可用原因。
 * @param id - 动作身份
 * @param state - 会话快照
 * @param copy - 当前字典
 * @returns 可供悬停和读屏显示的说明
 */
export function actionDescription(id: PieActionId, state: ActionState, copy: MenuCopy): string {
  if ((id === 'open-dir' || id === 'copy-cwd') && state.cwd === '') return copy['no-directory']
  if (id === 'stop' && !state.running) return copy.idle
  if (id === 'fork' && state.forkTarget?.kind !== 'ready') return copy[state.forkTarget?.kind ?? 'no-turn']
  return withTurn(copy[`${id}.description`], state)
}

/**
 * 将异常转换为可操作的提示，不将服务堆栈或会话内容显示给用户。
 * @param error - 执行异常
 * @param id - 失败动作
 * @param copy - 当前字典
 * @returns 简明错误提示
 */
export function actionError(error: unknown, id: PieActionId, copy: MenuCopy): string {
  if (id === 'copy-cwd' || id === 'copy-session-id') return copy['clipboard-denied']
  if (error instanceof TypeError) return copy['network-error']
  return `${copy[id]}：${copy.failed}`
}
