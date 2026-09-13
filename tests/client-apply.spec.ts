import { describe, expect, it, vi } from 'vitest'
import { apply, createActionDeps, inject, OVERLAY_ID, type ClientContext } from '../src/client/index.ts'
import { RadialMenu } from '../src/client/RadialMenu.tsx'

interface SlotEntry {
  options: { name: string; id: string }
  component: unknown
}

function boot(): {
  entries: SlotEntry[]
  dispose: () => void
  ctx: ClientContext
} {
  const entries: SlotEntry[] = []
  const disposers: Array<() => void> = []
  const ctx: ClientContext = {
    effect(fn) {
      const d = fn()
      if (typeof d === 'function') disposers.push(d)
    },
    get() { return undefined },
    slots: {
      inject(_key, factory) {
        return factory()
      },
      register(options, component) {
        const entry = { options, component }
        entries.push(entry)
        return () => {
          const i = entries.indexOf(entry)
          if (i >= 0) entries.splice(i, 1)
        }
      },
    },
    sessions: {
      fork: vi.fn(async ({ sessionId }) => `${sessionId}-fork`),
      scope: vi.fn((id: string) => ({ id })),
      sessionOf: vi.fn((scoped: unknown) => ({
        cancel: vi.fn(async () => ({ ok: true, scoped })),
      })),
    },
    locale: {
      register() { return () => {} },
    },
  }
  apply(ctx)
  return {
    entries,
    dispose: () => { for (const d of disposers) d() },
    ctx,
  }
}

describe('client apply', () => {
  it('declares the services it binds', () => {
    expect(inject).toEqual(['slots', 'sessions', 'locale'])
  })

  it('registers the overlay on shell.overlay and dispose removes it', () => {
    const { entries, dispose } = boot()
    expect(entries).toHaveLength(1)
    expect(entries[0]?.options).toMatchObject({ name: 'shell.overlay', id: OVERLAY_ID })
    expect(entries[0]?.component).toBe(RadialMenu)
    dispose()
    expect(entries.map((e) => e.options.id)).not.toContain(OVERLAY_ID)
    expect(entries).toHaveLength(0)
  })
})

describe('createActionDeps', () => {
  it('rejects invalid boundaries and unavailable navigation before creating any child', async () => {
    const { ctx, dispose } = boot()
    ctx.sessions.open = vi.fn()
    const deps = createActionDeps(ctx)
    for (const seq of [-1, NaN, 1.5, Infinity]) await expect(deps.fork('s1', seq)).rejects.toThrow()
    delete ctx.sessions.open
    await expect(deps.fork('s1', 42)).rejects.toThrow('navigation')
    expect(ctx.sessions.fork).not.toHaveBeenCalled()
    dispose()
  })

  it('uses binding.eventSource and never substitutes a later completed turn', () => {
    const { ctx, dispose } = boot()
    ctx.sessions.binding = () => ({ eventSource: { getSnapshot: () => ({ entries: [
      { type: 'event', event: { type: 'turn/end', seq: 10, data: { turn: 1 } } },
      { type: 'event', event: { type: 'turn/end', seq: 22, data: { turn: 2 } } },
      { type: 'event', event: { type: 'turn/start', seq: 23, data: { turn: 3 } } },
    ] }) } })
    const deps = createActionDeps(ctx)
    expect(deps.resolveForkTarget?.('s1', { turn: 1 })).toEqual({ kind: 'ready', turn: 1, atSeq: 10 })
    expect(deps.resolveForkTarget?.('s1', { turn: 3 })).toEqual({ kind: 'unfinished', turn: 3 })
    expect(deps.resolveForkTarget?.('s1', {})).toEqual({ kind: 'no-turn' })
    dispose()
  })

  it('uses the conversation node to resolve questions without a DOM turn attribute', () => {
    const { ctx, dispose } = boot()
    ctx.get = key => key === 'uiConversation' ? {
      binding: () => ({ target: () => ({ getSnapshot: () => ({ nodes: {
        get: (nodeKey: string) => nodeKey === 'question-1' ? { anchorSeq: 2, location: { kind: 'session' } } : undefined,
      } }) }) }),
    } : undefined
    ctx.sessions.binding = () => ({ eventSource: { getSnapshot: () => ({ entries: [
      { type: 'event', event: { type: 'turn/end', seq: 10, data: { turn: 1 } } },
      { type: 'event', event: { type: 'turn/end', seq: 22, data: { turn: 2 } } },
    ] }) } })
    const deps = createActionDeps(ctx)
    expect(deps.resolveForkTarget?.('s1', { nodeKey: 'question-1' })).toEqual({ kind: 'ready', turn: 1, atSeq: 10 })
    expect(deps.resolveForkTarget?.('s1', { nodeKey: 'missing' })).toEqual({ kind: 'unavailable' })
    dispose()
  })

  it('does not report a rejected interrupt as success', async () => {
    const { ctx, dispose } = boot()
    ctx.sessions.sessionOf = () => ({ cancel: async () => ({ ok: false, error: { code: 'session/not-found' } }) })
    await expect(createActionDeps(ctx).cancel('s1')).rejects.toThrow('rejected')
    dispose()
  })

  it('passes the exact boundary to sessions.fork and opens the child, even with uiWorkspace present', async () => {
    const sessionsFork = vi.fn(async () => 'child')
    const open = vi.fn()
    const workspaceFork = vi.fn(async () => {})
    const withWs: ClientContext = {
      effect() {},
      get(key) {
        if (key === 'uiWorkspace') return { forkSession: workspaceFork }
        return undefined
      },
      slots: { inject() {}, register() { return () => {} } },
      sessions: {
        fork: sessionsFork,
        open,
        scope() { return undefined },
        sessionOf() { return undefined },
      },
      locale: { register() { return () => {} } },
    }
    await createActionDeps(withWs).fork('s1', 42)
    expect(workspaceFork).not.toHaveBeenCalled()
    expect(sessionsFork).toHaveBeenCalledWith({ sessionId: 's1', atSeq: 42, increaseTitle: true })
    expect(open).toHaveBeenCalledWith('child')

    const withoutWs: ClientContext = { ...withWs, get() { return undefined } }
    await createActionDeps(withoutWs).fork('s1', 42)
    expect(sessionsFork).toHaveBeenCalledWith({ sessionId: 's1', atSeq: 42, increaseTitle: true })
  })

  it('cancel uses sessions.scope then sessionOf().cancel', async () => {
    const cancel = vi.fn(async () => {})
    const ctx: ClientContext = {
      effect() {},
      get() { return undefined },
      slots: { inject() {}, register() { return () => {} } },
      sessions: {
        fork: async () => 'x',
        scope: (id) => ({ id }),
        sessionOf: () => ({ cancel }),
      },
      locale: { register() { return () => {} } },
    }
    await createActionDeps(ctx).cancel('s1')
    expect(cancel).toHaveBeenCalledOnce()
  })
})
