/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { isSessionConversationSurface } from '../src/client/surface.ts'

describe('isSessionConversationSurface', () => {
  it('accepts the conversation scrollport and phase root, not the composer or inputs', () => {
    document.body.innerHTML = `
      <div data-phase="active">
        <header id="hdr">title</header>
        <div data-conversation-scroll>
          <article id="msg">hello</article>
          <div data-composer-seat>
            <textarea id="box"></textarea>
          </div>
        </div>
      </div>
      <nav id="side">sidebar</nav>
    `
    expect(isSessionConversationSurface(document.getElementById('msg'))).toBe(true)
    expect(isSessionConversationSurface(document.getElementById('hdr'))).toBe(true)
    expect(isSessionConversationSurface(document.getElementById('box'))).toBe(false)
    expect(isSessionConversationSurface(document.querySelector('[data-composer-seat]'))).toBe(false)
    expect(isSessionConversationSurface(document.getElementById('side'))).toBe(false)
    expect(isSessionConversationSurface(null)).toBe(false)
  })
})
