import { describe, expect, it } from 'vitest'
import { resolveTurnFork } from '../src/client/fork-target.ts'

const entries = [
  { type: 'event', event: { type: 'turn/end', seq: 10, data: { turn: 0 } } },
  { type: 'event', event: { type: 'turn/end', seq: 22, data: { turn: 1 } } },
] as const

describe('resolveTurnFork', () => {
  it('returns the exact turn end sequence', () => {
    expect(resolveTurnFork(entries, 0)).toEqual({ kind: 'ready', turn: 0, atSeq: 10 })
    expect(resolveTurnFork(entries, 1)).toEqual({ kind: 'ready', turn: 1, atSeq: 22 })
  })

  it('uses the first completed boundary after a message, including fractional display anchors', () => {
    expect(resolveTurnFork(entries, undefined, 5.25)).toEqual({ kind: 'ready', turn: 0, atSeq: 10 })
    expect(resolveTurnFork(entries, undefined, 11)).toEqual({ kind: 'ready', turn: 1, atSeq: 22 })
    expect(resolveTurnFork(entries, undefined, 23).kind).toBe('unfinished')
  })

  it('rejects corrupt identities instead of interpreting them as the first turn', () => {
    for (const anchor of [-1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(resolveTurnFork(entries, undefined, anchor).kind).toBe('unavailable')
    }
    expect(resolveTurnFork(entries, NaN).kind).toBe('unavailable')
  })

  it('rejects an unloaded or unfinished target instead of forking the whole session', () => {
    expect(resolveTurnFork(entries, 3)).toEqual({ kind: 'unfinished', turn: 3 })
    expect(resolveTurnFork([], 1)).toEqual({ kind: 'unavailable', turn: 1 })
    expect(resolveTurnFork(entries)).toEqual({ kind: 'no-turn' })
  })
})
