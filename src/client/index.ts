/**
 * 浏览器入口：在页面浮层中注册圆盘菜单，并连接会话、剪贴板和下载服务。
 * 通过宿主上下文获取服务，避免将其他插件的实现重复打包到浏览器文件中。
 */

import { RadialMenu, type RadialMenuProps } from './RadialMenu.tsx'
import {
  downloadSessionExport,
  hostBase,
  type ActionDeps,
} from './actions.ts'
import { en, NS, zh } from './locales.ts'
import { OPEN_DIR_ROUTE, OVERLAY_ID } from '../shared.ts'
import { resolveTurnFork, type HistoryEntry } from './fork-target.ts'

export { RadialMenu } from './RadialMenu.tsx'
export { hitTestPie, sliceCssMidDegrees, sliceCssSpanDegrees, sliceMidAngle } from './pie.ts'
export { isActionEnabled, runAction, PIE_ACTION_IDS, downloadSessionExport } from './actions.ts'
export { isSessionConversationSurface } from './surface.ts'
export { OPEN_DIR_ROUTE, OVERLAY_ID } from '../shared.ts'

export const inject = ['slots', 'sessions', 'locale']

/** 浏览器入口需要的宿主服务和插件生命周期方法。 */
export interface ClientContext {
  effect(fn: () => (() => void) | void, label?: string): unknown
  get?(key: string): unknown
  slots: {
    inject(key: string, factory: () => (() => void) | void): unknown
    register(
      options: { name: string; id: string; order?: number; locale?: string; inject?: () => unknown },
      component: unknown,
    ): () => void
  }
  sessions: SessionsFace
  locale: {
    register(ns: string, packs: { zh: Record<string, string>; en: Record<string, string> }): () => void
  }
}

interface SessionsFace {
  fork(opts: { sessionId: string; atSeq?: number; increaseTitle?: boolean }): Promise<string>
  open?(id: string): void
  scope(id: string): unknown
  sessionOf(scoped: unknown): { cancel(): Promise<unknown> } | undefined
  binding?(id: string): SessionBindingLike | undefined
}

interface SessionEventSourceLike {
  getSnapshot(): { entries: readonly HistoryEntry[] }
}

interface SessionBindingLike { eventSource?: SessionEventSourceLike }

interface ChatNodeLike {
  readonly anchorSeq: number
  readonly location?: {
    readonly kind: string
    readonly turn?: { readonly turn: number; readonly status: string; readonly end?: { readonly seq: number } }
  }
}

interface UiConversationFace {
  binding(sessionId: string): {
    target(target: 'chat'): { getSnapshot(): { nodes: { get(key: string): ChatNodeLike | undefined } } | undefined }
  }
}

interface SessionLogDownloadFace {
  download(sessionId: string): Promise<void>
}

function defaultClipboardWrite(text: string): Promise<void> {
  const clipboard = (globalThis as { navigator?: { clipboard?: { writeText(t: string): Promise<void> } } })
    .navigator?.clipboard
  if (clipboard === undefined) return Promise.reject(new Error('clipboard unavailable'))
  return clipboard.writeText(text)
}

function defaultSave(url: string, filename: string): void {
  const doc = (globalThis as { document?: Document }).document
  if (doc === undefined) return
  const anchor = doc.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
}

async function postOpenDirectory(absDir: string): Promise<void> {
  const response = await fetch(new URL(OPEN_DIR_ROUTE, hostBase()), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path: absDir }),
  })
  if (!response.ok) throw new Error(`open-dir failed: HTTP ${String(response.status)}`)
}

/**
 * 将宿主服务转换为菜单可调用的操作函数。
 * @param ctx - 提供会话管理、可选界面服务和生命周期方法的宿主上下文
 * @returns 使用宿主服务执行操作的依赖对象
 */
export function createActionDeps(ctx: ClientContext): ActionDeps {
  return {
    openDirectory: postOpenDirectory,
    clipboardWrite: defaultClipboardWrite,
    cancel: async (sessionId) => {
      const scoped = ctx.sessions.scope(sessionId)
      const session = scoped === undefined ? undefined : ctx.sessions.sessionOf(scoped)
      if (session === undefined) throw new Error(`session "${sessionId}" is not scoped`)
      const result = await session.cancel()
      if (typeof result === 'object' && result !== null && 'ok' in result && result.ok === false) {
        const error = 'error' in result ? result.error : undefined
        throw Object.assign(new Error('Interrupt request rejected'), { cause: error })
      }
    },
    fork: async (sessionId, atSeq) => {
      if (atSeq === undefined || !Number.isSafeInteger(atSeq) || atSeq < 0) throw new Error('A completed turn is required')
      if (typeof ctx.sessions.open !== 'function') throw new Error('Session navigation is unavailable')
      const childId = await ctx.sessions.fork({ sessionId, atSeq, increaseTitle: true })
      ctx.sessions.open(childId)
    },
    resolveForkTarget: (sessionId, target) => {
      const conversation = ctx.get?.('uiConversation') as UiConversationFace | undefined
      const node = target.nodeKey === undefined ? undefined
        : conversation?.binding(sessionId).target('chat').getSnapshot()?.nodes.get(target.nodeKey)
      const location = node?.location
      const turn = location?.kind === 'turn' || location?.kind === 'step' ? location.turn : undefined
      if (turn?.status === 'closed' && turn.end !== undefined && Number.isSafeInteger(turn.end.seq) && turn.end.seq >= 0) {
        return { kind: 'ready', turn: turn.turn, atSeq: turn.end.seq }
      }
      if (turn?.status === 'open') return { kind: 'unfinished', turn: turn.turn }
      // 用户消息也可能属于会话层；用节点锚点匹配其后的结束事件，覆盖提问区域的右键。
      const entries = ctx.sessions.binding?.(sessionId)?.eventSource?.getSnapshot().entries ?? []
      if (target.nodeKey !== undefined && node === undefined && target.turn === undefined) return { kind: 'unavailable' }
      return resolveTurnFork(entries, turn?.turn ?? target.turn, node?.anchorSeq)
    },
    exportLog: async (sessionId) => {
      const downloader = ctx.get?.('sessionLogDownload') as SessionLogDownloadFace | undefined
      if (downloader !== undefined) {
        await downloader.download(sessionId)
        return
      }
      await downloadSessionExport(sessionId, {
        fetch: (input, init) => fetch(input, init),
        save: defaultSave,
        hostBase,
      })
    },
  }
}

/**
 * 注册菜单和翻译，并在插件卸载时移除注册。
 * @param ctx - 浏览器插件上下文
 * @returns 无返回值；注册由宿主跟随插件生命周期管理
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-round-rightclick: dictionaries')
  const deps = createActionDeps(ctx)
  ctx.effect(() => {
    let disposeSlot: (() => void) | undefined
    ctx.slots.inject('shell.overlay', () => {
      disposeSlot = ctx.slots.register({
        name: 'shell.overlay',
        id: OVERLAY_ID,
        order: 40,
        inject: (): Pick<RadialMenuProps, 'deps'> => ({ deps }),
      }, RadialMenu)
      return disposeSlot
    })
    return () => { disposeSlot?.() }
  }, 'dsh-round-rightclick: overlay')
}
