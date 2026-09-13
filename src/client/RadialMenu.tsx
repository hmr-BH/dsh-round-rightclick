/**
 * 会话表面右键弹出的圆形菜单。
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  isActionEnabled,
  PIE_ACTION_IDS,
  runAction,
  type ActionDeps,
  type ActionState,
  type PieActionId,
} from './actions.ts'
import { actionDescription, actionError, dictionaryForDocument, withTurn } from './locales.ts'
import { ensureRadialStyles } from './styles.ts'
import { conversationTarget, isSessionConversationSurface } from './surface.ts'
import { MenuIcon } from './Icons.tsx'
import { INNER_RATIO, labelPosition, placeMenu, sectorClip, type MenuPlacement } from './menu-layout.ts'

/** 菜单从会话列表读取的数据：当前会话 ID、工作目录和运行状态。 */
export interface SessionListLike {
  readonly current: string | undefined
  readonly byId: Readonly<Record<string, { readonly cwd?: string; readonly running?: boolean } | undefined>>
}

/** 菜单组件需要的会话订阅函数和操作函数。 */
export interface RadialMenuProps {
  readonly useSessions: <T>(select: (state: SessionListLike) => T, isEqual?: (a: T, b: T) => boolean) => T
  readonly deps: ActionDeps
}

const SECTORS = PIE_ACTION_IDS.map((id, index) => ({ id, clip: sectorClip(index), position: labelPosition(index) }))

function readState(list: SessionListLike): ActionState {
  const sessionId = list.current
  const row = sessionId === undefined ? undefined : list.byId[sessionId]
  return {
    sessionId,
    cwd: row?.cwd ?? '',
    running: row?.running ?? false,
  }
}

function equalState(a: ActionState, b: ActionState): boolean {
  return a.sessionId === b.sessionId && a.cwd === b.cwd && a.running === b.running
}

interface OpenMenu extends MenuPlacement {
  readonly snapshot: ActionState
}

interface Feedback { readonly kind: 'pending' | 'success' | 'error'; readonly text: string }

/**
 * 渲染带键盘导航、轮次锁定和异步反馈的会话圆盘。
 * @param props - 用于订阅会话状态和执行菜单操作的函数
 * @returns 固定在页面上的菜单与状态提示
 */
export function RadialMenu(props: RadialMenuProps): React.JSX.Element {
  const state = props.useSessions(readState, equalState)
  const [open, setOpen] = useState<OpenMenu | null>(null)
  const [hover, setHover] = useState<number | 'cancel' | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const busyRef = useRef(false)
  const aliveRef = useRef(true)
  const focusBeforeOpen = useRef<HTMLElement | null>(null)
  const menuElement = useRef<HTMLDivElement>(null)
  const centerElement = useRef<HTMLButtonElement>(null)
  const detailId = useId()
  const openRef = useRef(open)
  const stateRef = useRef(state)
  const depsRef = useRef(props.deps)
  openRef.current = open
  stateRef.current = state
  depsRef.current = props.deps

  useEffect(() => {
    if (feedback === null || feedback.kind === 'pending') return
    const timer = window.setTimeout(() => setFeedback(null), feedback.kind === 'error' ? 8000 : 4500)
    return () => window.clearTimeout(timer)
  }, [feedback])

  const close = useCallback((): void => {
    if (openRef.current === null) return
    openRef.current = null
    setOpen(null)
    setHover(null)
    if (focusBeforeOpen.current?.isConnected) focusBeforeOpen.current.focus({ preventScroll: true })
  }, [])

  const onPieClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    const menu = openRef.current
    if (menu === null) return
    event.preventDefault()
    event.stopPropagation()
    if (event.target !== event.currentTarget) return
    close()
  }

  useEffect(() => {
    if (open !== null) centerElement.current?.focus({ preventScroll: true })
  }, [open])

  useEffect(() => {
    if (openRef.current !== null && openRef.current.snapshot.sessionId !== state.sessionId) close()
  }, [state.sessionId, close])

  useEffect(() => {
    ensureRadialStyles()
    aliveRef.current = true
    const onContextMenu = (event: MouseEvent): void => {
      const pie = (event.target instanceof Element)
        ? event.target.closest('[data-dsh-rr-layer]')
        : null
      if (pie !== null) {
        event.preventDefault()
        return
      }
      if (!isSessionConversationSurface(event.target)) return
      const current = stateRef.current
      if (current.sessionId === undefined || current.sessionId === '') return
      event.preventDefault()
      event.stopPropagation()
      if (busyRef.current) return
      const placed = placeMenu(event.clientX, event.clientY, window.innerWidth, window.innerHeight)
      const target = conversationTarget(event.target)
      let forkTarget: ActionState['forkTarget'] = { kind: 'no-turn' }
      if (target.turn !== undefined || target.nodeKey !== undefined) {
        try {
          forkTarget = depsRef.current.resolveForkTarget?.(current.sessionId, target) ?? { kind: 'unavailable' }
        } catch {
          forkTarget = { kind: 'unavailable' }
        }
      }
      focusBeforeOpen.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      const next = { ...placed, snapshot: { ...current, forkTarget } }
      openRef.current = next
      setOpen(next)
      setHover(null)
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (openRef.current === null) return
      if (event.key === 'Escape' || event.key === 'Tab') {
        if (event.key === 'Escape') event.preventDefault()
        event.stopPropagation()
        close()
        return
      }
      if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
        event.preventDefault()
        event.stopPropagation()
        const items = Array.from(menuElement.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])
        if (items.length === 0) return
        const index = items.indexOf(document.activeElement as HTMLButtonElement)
        const direction = event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 1
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
          : index < 0 ? (direction === 1 ? 0 : items.length - 1) : (index + direction + items.length) % items.length
        items[next]?.focus({ preventScroll: true })
      }
    }
    document.addEventListener('contextmenu', onContextMenu, true)
    document.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('resize', close)
    window.addEventListener('blur', close)
    document.addEventListener('scroll', close, true)
    return () => {
      aliveRef.current = false
      document.removeEventListener('contextmenu', onContextMenu, true)
      document.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('blur', close)
      document.removeEventListener('scroll', close, true)
    }
  }, [close])

  const onCatcherDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    event.preventDefault()
    close()
  }

  const execute = async (id: PieActionId): Promise<void> => {
    const menu = openRef.current
    if (menu === null || busyRef.current) return
    if (menu.snapshot.sessionId !== stateRef.current.sessionId) {
      close()
      return
    }
    const snapshot = { ...menu.snapshot, running: stateRef.current.running }
    if (!isActionEnabled(id, snapshot)) {
      setHover(PIE_ACTION_IDS.indexOf(id))
      return
    }
    // 在首次 await 之前锁住动作，防止快速连击创建多份分支或重复下载。
    busyRef.current = true
    const copy = dictionaryForDocument()
    setFeedback({ kind: 'pending', text: withTurn(copy[`${id}.pending`], snapshot) })
    close()
    try {
      await runAction(id, snapshot, depsRef.current)
      if (aliveRef.current) setFeedback({ kind: 'success', text: withTurn(copy[`${id}.success`], snapshot) })
    } catch (error) {
      if (aliveRef.current) setFeedback({ kind: 'error', text: actionError(error, id, copy) })
    } finally {
      busyRef.current = false
    }
  }

  const copy = dictionaryForDocument()
  const menuState: ActionState = { ...(open?.snapshot ?? state), running: state.running }
  const description = hover === null ? copy.keys : hover === 'cancel' ? copy.cancel : actionDescription(PIE_ACTION_IDS[hover]!, menuState, copy)

  return (
    <div data-dsh-rr-layer="">
      {open !== null && (
        <>
          <div data-dsh-rr-catcher="" onPointerDown={onCatcherDown} />
          <div
            ref={menuElement}
            data-dsh-rr-pie=""
            role="menu"
            aria-label={copy.menu}
            style={{
              left: open.x,
              top: open.y,
              ['--dsh-rr-size' as string]: `${String(open.size)}px`,
              ['--dsh-rr-hole' as string]: `${String(open.size * INNER_RATIO)}px`,
            }}
            onClick={onPieClick}
            onPointerDown={(event) => { event.stopPropagation() }}
          >
            <button ref={centerElement} data-dsh-rr-hole="" onClick={close} type="button" aria-label={copy.cancel}
              onPointerEnter={() => setHover('cancel')} onFocus={() => setHover('cancel')}>
              <MenuIcon name={typeof hover === 'number' ? PIE_ACTION_IDS[hover]! : 'close'} size={20} />
              <strong>{menuState.forkTarget?.turn === undefined ? copy.choose : withTurn(copy.turn, menuState)}</strong>
              <span>Esc</span>
            </button>
            <div data-dsh-rr-detail="" id={detailId} data-visible={typeof hover === 'number' ? '' : undefined}>
              <span>{description}</span>
            </div>
            {SECTORS.map(({ id, clip, position }, index) => {
              const enabled = isActionEnabled(id, menuState)
              return (
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  key={id}
                  data-dsh-rr-action=""
                  data-action={id}
                  data-active={hover === index ? '' : undefined}
                  data-disabled={enabled ? undefined : ''}
                  aria-disabled={enabled ? undefined : true}
                  title={copy[id]}
                  aria-label={copy[id]}
                  aria-describedby={detailId}
                  style={{ clipPath: clip }}
                  onPointerEnter={() => setHover(index)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(index)}
                  onClick={(event) => { event.stopPropagation(); void execute(id) }}
                >
                  <span data-dsh-rr-label="" style={position}>
                    <MenuIcon name={id} size={22} />
                    <span data-dsh-rr-text="">{copy[id]}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
      <div role="status" aria-live="polite" aria-atomic="true">
        {feedback !== null && <div data-dsh-rr-toast="" data-kind={feedback.kind}>
          <MenuIcon name={feedback.kind === 'success' ? 'check-circle' : feedback.kind === 'error' ? 'error-circle' : 'loading'} size={20} />
          <span data-dsh-rr-toast-text="">{feedback.text}</span>
          {feedback.kind !== 'pending' && <button type="button" data-dsh-rr-toast-dismiss="" aria-label={copy.dismiss}
            onClick={() => setFeedback(null)}><MenuIcon name="close" size={16} /></button>}
        </div>}
      </div>
    </div>
  )
}
