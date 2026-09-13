/**
 * @vitest-environment jsdom
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const PLUGIN_ID = 'dsh-round-rightclick'

interface Handoff {
  id: string
  factory: (require: (spec: string) => unknown) => Record<string, unknown>
}

type Win = { __ModuleLoader__?: { load(h: Handoff): void } }

afterEach(() => {
  delete (window as Win).__ModuleLoader__
})

describe('client bundle', () => {
  it('executes in a window without Node module/require and installs apply', async () => {
    const code = readFileSync(resolve('lib/client.js'), 'utf8')
    expect(code.includes('module.exports') || code.includes('exports.')).toBe(true)

    let handoff: Handoff | undefined
    ;(window as Win).__ModuleLoader__ = { load: (h) => { handoff = h } }

    const fn = new Function(code) as () => void
    fn()

    expect(handoff).toBeDefined()
    expect(handoff!.id).toBe(PLUGIN_ID)

    const react = await import('react')
    const jsx = await import('react/jsx-runtime')
    const exports = handoff!.factory((spec) => {
      if (spec === 'react') return react
      if (spec === 'react/jsx-runtime') return jsx
      throw new Error(`unexpected require: ${spec}`)
    })
    expect(exports.apply).toBeTypeOf('function')
    expect(exports.inject).toEqual(['slots', 'sessions', 'locale'])
  })
})
