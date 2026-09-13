/**
 * 判断六项菜单操作是否可用，并调用传入的操作函数。
 * 此模块不直接访问浏览器或宿主服务，便于单独验证菜单行为。
 */

import type { ConversationTarget, ForkTarget } from './fork-target.ts'

/** 六项操作的固定标识，从圆盘正上方开始顺时针排列。 */
export const PIE_ACTION_IDS = [
  'open-dir',
  'copy-cwd',
  'copy-session-id',
  'stop',
  'fork',
  'export',
] as const

/** 一项菜单操作的标识。 */
export type PieActionId = (typeof PIE_ACTION_IDS)[number]

/** 判断操作可用性所需的会话状态，以及右键命中的分叉位置。 */
export interface ActionState {
  readonly sessionId: string | undefined
  readonly cwd: string
  readonly running: boolean
  readonly forkTarget?: ForkTarget
}

/** 菜单操作函数，由浏览器入口连接到文件管理器、剪贴板和会话服务。 */
export interface ActionDeps {
  readonly openDirectory: (absDir: string) => Promise<void>
  readonly clipboardWrite: (text: string) => Promise<void>
  readonly cancel: (sessionId: string) => Promise<void>
  readonly fork: (sessionId: string, atSeq: number) => Promise<void>
  readonly resolveForkTarget?: (sessionId: string, target: ConversationTarget) => ForkTarget
  readonly exportLog: (sessionId: string) => Promise<void>
}

/**
 * 判断操作是否可执行；禁用项保留在菜单中以显示原因。
 * @param id - 操作标识
 * @param state - 当前会话和分叉位置
 * @returns 操作满足执行条件时为 true
 */
export function isActionEnabled(id: PieActionId, state: ActionState): boolean {
  switch (id) {
    case 'open-dir':
    case 'copy-cwd':
      return state.cwd !== ''
    case 'copy-session-id':
    case 'export':
      return state.sessionId !== undefined && state.sessionId !== ''
    case 'fork':
      return Boolean(state.sessionId) && state.forkTarget?.kind === 'ready'
    case 'stop':
      return Boolean(state.sessionId) && state.running
  }
}

/**
 * 执行可用的菜单操作；不可用时不调用外部服务。
 * @param id - 操作标识
 * @param state - 当前会话和分叉位置
 * @param deps - 实际执行菜单功能的函数
 * @returns 操作完成后的 Promise；服务失败时继续抛出异常供界面提示
 */
export async function runAction(
  id: PieActionId,
  state: ActionState,
  deps: ActionDeps,
): Promise<void> {
  if (!isActionEnabled(id, state)) return
  switch (id) {
    case 'open-dir':
      await deps.openDirectory(state.cwd)
      return
    case 'copy-cwd':
      await deps.clipboardWrite(state.cwd)
      return
    case 'copy-session-id':
      await deps.clipboardWrite(state.sessionId as string)
      return
    case 'stop':
      await deps.cancel(state.sessionId as string)
      return
    case 'fork':
      if (state.forkTarget?.kind === 'ready') await deps.fork(state.sessionId as string, state.forkTarget.atSeq)
      return
    case 'export':
      await deps.exportLog(state.sessionId as string)
      return
  }
}

/**
 * 会话导出 ZIP 文件名（与官方 session-log-export 同一约定）。
 * @param sessionId - 会话 id
 * @returns 可用作 ZIP 下载文件名的字符串
 */
export function sessionLogZipFilename(sessionId: string): string {
  return `dsh-session-${sessionId.replace(/[^A-Za-z0-9_-]/g, '_')}.zip`
}

/**
 * 通过宿主的导出接口下载日志 ZIP，先确认接口可访问再触发浏览器下载。
 * @param sessionId - 会话 id
 * @param deps - fetch / 保存 / Host 基址
 * @returns 浏览器开始下载后完成；接口不可用时抛出异常
 */
export async function downloadSessionExport(
  sessionId: string,
  deps: {
    readonly fetch: (input: string | URL, init?: RequestInit) => Promise<Response>
    readonly save: (url: string, filename: string) => void
    readonly hostBase: () => string
  },
): Promise<void> {
  const url = new URL('/api/session.export', deps.hostBase())
  url.searchParams.set('sessionId', sessionId)
  url.searchParams.set('includeDescendants', 'true')
  const response = await deps.fetch(url, { method: 'HEAD' })
  if (!response.ok) {
    throw new Error(`Export failed: HTTP ${String(response.status)}`)
  }
  deps.save(url.toString(), sessionLogZipFilename(sessionId))
}

/**
 * 获取当前页面的宿主地址；没有有效 origin 时使用桌面客户端约定的内部地址。
 * @returns 可用于构造宿主 API URL 的基址
 */
export function hostBase(): string {
  const origin = (globalThis as { location?: { origin?: string } }).location?.origin
  return origin !== undefined && origin !== 'null' ? origin : 'http://dsh.internal'
}
