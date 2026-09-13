/**
 * @vitest-environment jsdom
 */
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})
import { RadialMenu, type SessionListLike } from '../src/client/RadialMenu.tsx'
import type { ActionDeps } from '../src/client/actions.ts'
let root: Root | undefined
let host: HTMLDivElement | undefined

afterEach(() => {
  act(() => { root?.unmount() })
  root = undefined
  host?.remove()
  host = undefined
  document.body.innerHTML = ''
  vi.useRealTimers()
})

function renderMenu(list: SessionListLike, deps: ActionDeps): HTMLDivElement {
  host = document.createElement('div')
  document.body.appendChild(host)
  const surface = document.createElement('div')
  surface.setAttribute('data-phase', 'active')
  surface.innerHTML = '<div data-conversation-scroll><p id="transcript">hi</p></div>'
  document.body.appendChild(surface)
  root = createRoot(host)
  act(() => {
    root!.render(
      <RadialMenu
        useSessions={(select) => select(list)}
        deps={deps}
      />,
    )
  })
  return surface
}

function fakeDeps() {
  return {
    openDirectory: vi.fn(async () => {}),
    clipboardWrite: vi.fn(async () => {}),
    cancel: vi.fn(async () => {}),
    fork: vi.fn(async () => {}),
    exportLog: vi.fn(async () => {}),
  }
}

const list: SessionListLike = {
  current: 's1',
  byId: { s1: { cwd: '/work/app', running: false } },
}

describe('RadialMenu', () => {
  it('ignores right-button release and retains focus for keyboard navigation', async () => {
    const deps = fakeDeps()
    const before = document.createElement('button')
    document.body.appendChild(before)
    before.focus()
    const surface = renderMenu(list, deps)
    openAt(surface.querySelector('#transcript')!)
    const pie = document.querySelector('[data-dsh-rr-pie]')!
    act(() => { pie.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, button: 2, clientX: 220, clientY: 130 })) })
    expect(deps.openDirectory).not.toHaveBeenCalled()
    act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })) })
    expect(document.activeElement?.getAttribute('data-action')).toBe('open-dir')
    act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })) })
    expect(document.activeElement).toBe(before)
  })

  it('shows pending and success feedback and ignores duplicate clicks until completion', async () => {
    vi.useFakeTimers()
    const deps = fakeDeps()
    let finish!: () => void
    deps.clipboardWrite.mockImplementation(() => new Promise<void>(resolve => { finish = resolve }))
    const surface = renderMenu(list, deps)
    const transcript = surface.querySelector('#transcript')!
    openAt(transcript)
    const copy = document.querySelector<HTMLButtonElement>('[data-action="copy-session-id"]')!
    act(() => { copy.click(); copy.click() })
    expect(deps.clipboardWrite).toHaveBeenCalledExactlyOnceWith('s1')
    expect(document.querySelector('[data-dsh-rr-toast]')?.getAttribute('data-kind')).toBe('pending')
    openAt(transcript)
    expect(document.querySelector('[data-dsh-rr-pie]')).toBeNull()
    await act(async () => finish())
    const successToast = document.querySelector<HTMLElement>('[data-dsh-rr-toast]')!
    expect(successToast.textContent).toBe('会话 ID 已复制')
    expect(getComputedStyle(successToast).position).toBe('fixed')
    expect(getComputedStyle(successToast).top).toBe('16px')
    const successIcon = successToast.querySelector('[data-dsh-rr-icon="check-circle"]')!
    expect(successIcon.querySelector('circle')).not.toBeNull()
    expect(getComputedStyle(successIcon).color).toBe('rgb(66, 189, 123)')
    act(() => vi.advanceTimersByTime(4500))
    expect(document.querySelector('[data-dsh-rr-toast]')).toBeNull()
  })

  it('shows clipboard failure without reporting success', async () => {
    const deps = fakeDeps()
    deps.clipboardWrite.mockRejectedValue(new Error('permission denied'))
    const surface = renderMenu(list, deps)
    openAt(surface.querySelector('#transcript')!)
    await act(async () => document.querySelector<HTMLButtonElement>('[data-action="copy-session-id"]')!.click())
    expect(document.querySelector('[data-dsh-rr-toast]')?.getAttribute('data-kind')).toBe('error')
    expect(document.querySelector('[data-dsh-rr-toast]')?.textContent).toContain('剪贴板')
    const errorToast = document.querySelector<HTMLElement>('[data-dsh-rr-toast]')!
    expect(getComputedStyle(errorToast).top).toBe('16px')
    const errorIcon = errorToast.querySelector('[data-dsh-rr-icon="error-circle"]')!
    expect(errorIcon.querySelector('circle')).not.toBeNull()
    expect(getComputedStyle(errorIcon).color).toBe('rgb(241, 107, 115)')
    act(() => errorToast.querySelector<HTMLButtonElement>('[aria-label="关闭提示"]')!.click())
    expect(document.querySelector('[data-dsh-rr-toast]')).toBeNull()
  })

  it('locks the clicked turn boundary and sends it to fork once', async () => {
    const deps = fakeDeps()
    const resolveForkTarget = vi.fn(() => ({ kind: 'ready' as const, turn: 1, atSeq: 10 }))
    const surface = renderMenu(list, { ...deps, resolveForkTarget })
    surface.querySelector('#transcript')!.setAttribute('data-chat-turn', '1')
    openAt(surface.querySelector('#transcript')!)
    resolveForkTarget.mockReturnValue({ kind: 'ready', turn: 2, atSeq: 22 })
    await act(async () => document.querySelector<HTMLButtonElement>('[data-action="fork"]')!.click())
    expect(deps.fork).toHaveBeenCalledExactlyOnceWith('s1', 10)
    expect(document.querySelector('[data-dsh-rr-toast]')?.textContent).toContain('第 1 轮')
  })

  it('keeps unfinished or unidentified turns disabled with an explanation', async () => {
    const deps = fakeDeps()
    const surface = renderMenu(list, { ...deps, resolveForkTarget: () => ({ kind: 'unfinished', turn: 3 }) })
    const transcript = surface.querySelector('#transcript')!
    transcript.setAttribute('data-chat-turn', '3')
    openAt(transcript)
    const fork = document.querySelector<HTMLButtonElement>('[data-action="fork"]')!
    expect(fork.getAttribute('aria-disabled')).toBe('true')
    await act(async () => fork.click())
    expect(deps.fork).not.toHaveBeenCalled()
    expect(document.querySelector('[data-dsh-rr-detail]')?.textContent).toContain('此轮尚未结束')
    expect(document.querySelector('[data-dsh-rr-toast]')).toBeNull()
    act(() => document.querySelector<HTMLButtonElement>('[data-dsh-rr-hole]')!.click())
    transcript.removeAttribute('data-chat-turn')
    openAt(transcript)
    await act(async () => document.querySelector<HTMLButtonElement>('[data-action="fork"]')!.click())
    expect(deps.fork).not.toHaveBeenCalled()
    expect(document.querySelector('[data-dsh-rr-detail]')?.textContent).toContain('请在要分叉')
  })

  it('opens six actions and executes the clicked item with feedback', async () => {
    const deps = fakeDeps()
    const surface = renderMenu(list, deps)
    const transcript = surface.querySelector('#transcript') as HTMLElement
    const cx = 200
    const cy = 200

    act(() => {
      transcript.dispatchEvent(new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: cx,
        clientY: cy,
      }))
    })
    const pie = document.querySelector('[data-dsh-rr-pie]') as HTMLElement | null
    expect(pie).not.toBeNull()
    expect(document.querySelectorAll('[data-dsh-rr-label]')).toHaveLength(6)

    const openDir = document.querySelector('[data-action="open-dir"]') as HTMLElement
    expect(document.querySelectorAll('[role="menuitem"]')).toHaveLength(6)
    expect(openDir.querySelector('svg')).not.toBeNull()
    act(() => { openDir.focus() })
    expect(openDir.hasAttribute('data-active')).toBe(true)
    expect(document.querySelector('[data-dsh-rr-detail]')?.hasAttribute('data-visible')).toBe(true)

    await act(async () => { openDir.click() })
    expect(deps.openDirectory).toHaveBeenCalledWith('/work/app')
    expect(deps.exportLog).not.toHaveBeenCalled()
    expect(document.querySelector('[data-dsh-rr-pie]')).toBeNull()
    expect(document.querySelector('[data-dsh-rr-toast]')?.getAttribute('data-kind')).toBe('success')
  })

  it('dismisses on Escape and does not fire', () => {
    const deps = fakeDeps()
    const surface = renderMenu(list, deps)
    act(() => {
      surface.querySelector('#transcript')!.dispatchEvent(new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 40,
        clientY: 40,
      }))
    })
    expect(document.querySelector('[data-dsh-rr-pie]')).not.toBeNull()
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    })
    expect(document.querySelector('[data-dsh-rr-pie]')).toBeNull()
    expect(deps.openDirectory).not.toHaveBeenCalled()
  })

  it('removes document listeners on unmount', () => {
    const deps = fakeDeps()
    const surface = renderMenu(list, deps)
    act(() => { root?.unmount() })
    root = undefined
    act(() => {
      surface.querySelector('#transcript')!.dispatchEvent(new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 10,
        clientY: 10,
      }))
    })
    expect(document.querySelector('[data-dsh-rr-pie]')).toBeNull()
  })
})

/** 在模拟对话节点上触发用户右键。 */
function openAt(target: Element): void {
  act(() => target.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true, cancelable: true, clientX: 220, clientY: 220,
  })))
}
