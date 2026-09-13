import { describe, expect, it, vi } from 'vitest'
import {
  downloadSessionExport,
  isActionEnabled,
  PIE_ACTION_IDS,
  runAction,
  sessionLogZipFilename,
  type ActionDeps,
  type ActionState,
} from '../src/client/actions.ts'

function deps(): ActionDeps & {
  readonly openDirectory: ReturnType<typeof vi.fn>
  readonly clipboardWrite: ReturnType<typeof vi.fn>
  readonly cancel: ReturnType<typeof vi.fn>
  readonly fork: ReturnType<typeof vi.fn>
  readonly exportLog: ReturnType<typeof vi.fn>
} {
  return {
    openDirectory: vi.fn(async () => {}),
    clipboardWrite: vi.fn(async () => {}),
    cancel: vi.fn(async () => {}),
    fork: vi.fn(async () => {}),
    exportLog: vi.fn(async () => {}),
  }
}

const ready: ActionState = { sessionId: 'sess-1', cwd: '/work/app', running: true, forkTarget: { kind: 'ready', turn: 0, atSeq: 42 } }
const idle: ActionState = { sessionId: 'sess-1', cwd: '/work/app', running: false }
const noCwd: ActionState = { sessionId: 'sess-1', cwd: '', running: false }
const none: ActionState = { sessionId: undefined, cwd: '', running: false }

describe('isActionEnabled', () => {
  it('gates each of the six slices on session/cwd/running', () => {
    expect(PIE_ACTION_IDS).toEqual([
      'open-dir', 'copy-cwd', 'copy-session-id', 'stop', 'fork', 'export',
    ])
    expect(isActionEnabled('open-dir', ready)).toBe(true)
    expect(isActionEnabled('open-dir', noCwd)).toBe(false)
    expect(isActionEnabled('copy-cwd', ready)).toBe(true)
    expect(isActionEnabled('copy-session-id', ready)).toBe(true)
    expect(isActionEnabled('copy-session-id', none)).toBe(false)
    expect(isActionEnabled('stop', ready)).toBe(true)
    expect(isActionEnabled('stop', idle)).toBe(false)
    expect(isActionEnabled('fork', ready)).toBe(true)
    expect(isActionEnabled('export', ready)).toBe(true)
    expect(isActionEnabled('export', none)).toBe(false)
  })
})

describe('runAction', () => {
  it('dispatches the shipped six actions to the injected deps', async () => {
    const d = deps()
    await runAction('open-dir', ready, d)
    await runAction('copy-cwd', ready, d)
    await runAction('copy-session-id', ready, d)
    await runAction('stop', ready, d)
    await runAction('fork', ready, d)
    await runAction('export', ready, d)
    expect(d.openDirectory).toHaveBeenCalledWith('/work/app')
    expect(d.clipboardWrite.mock.calls).toEqual([['/work/app'], ['sess-1']])
    expect(d.cancel).toHaveBeenCalledWith('sess-1')
    expect(d.fork).toHaveBeenCalledWith('sess-1', 42)
    expect(d.exportLog).toHaveBeenCalledWith('sess-1')
  })

  it('does not invoke deps when the slice is disabled', async () => {
    const d = deps()
    await runAction('open-dir', none, d)
    await runAction('stop', idle, d)
    await runAction('fork', none, d)
    expect(d.openDirectory).not.toHaveBeenCalled()
    expect(d.cancel).not.toHaveBeenCalled()
    expect(d.fork).not.toHaveBeenCalled()
  })
})

describe('downloadSessionExport', () => {
  it('HEADs the public export route then saves the zip name', async () => {
    const fetchFn = vi.fn<(input: string | URL, init?: RequestInit) => Promise<Response>>(async () => new Response(null, { status: 200 }))
    const save = vi.fn()
    await downloadSessionExport('abc/def', {
      fetch: fetchFn,
      save,
      hostBase: () => 'http://dsh.internal',
    })
    const called = fetchFn.mock.calls[0]
    expect(called).toBeDefined()
    const url = String(called?.[0])
    expect(url).toContain('/api/session.export')
    expect(url).toContain('sessionId=abc%2Fdef')
    expect(url).toContain('includeDescendants=true')
    expect(called?.[1]).toMatchObject({ method: 'HEAD' })
    expect(save).toHaveBeenCalledWith(url, sessionLogZipFilename('abc/def'))
    expect(sessionLogZipFilename('abc/def')).toBe('dsh-session-abc_def.zip')
  })

  it('throws when HEAD is not ok, without saving', async () => {
    const save = vi.fn()
    await expect(downloadSessionExport('s', {
      fetch: async () => new Response('nope', { status: 404 }),
      save,
      hostBase: () => 'http://dsh.internal',
    })).rejects.toThrow(/HTTP 404/)
    expect(save).not.toHaveBeenCalled()
  })
})
