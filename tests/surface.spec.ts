/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { isSessionConversationSurface, selectedConversationText } from '../src/client/surface.ts'

beforeEach(() => {
  document.getSelection()?.removeAllRanges()
  document.body.innerHTML = ''
})

function textOf(element: Element): Text {
  return element.firstChild as Text
}

function selectBetween(
  start: Node,
  startOffset: number,
  end: Node = start,
  endOffset: number = startOffset,
): Selection {
  const range = document.createRange()
  range.setStart(start, startOffset)
  range.setEnd(end, endOffset)
  const selection = document.getSelection() as Selection
  selection.removeAllRanges()
  selection.addRange(range)
  return selection
}

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

describe('selectedConversationText', () => {
  function build(): void {
    document.body.innerHTML = `
      <div data-phase="active">
        <div data-conversation-scroll>
          <article id="msg">hello world</article>
          <div data-composer-seat>
            <div id="ed" contenteditable="true">note text</div>
          </div>
        </div>
      </div>
      <nav id="side">sidebar text</nav>
    `
  }

  it('returns text selected inside the conversation', () => {
    build()
    const message = document.getElementById('msg') as HTMLElement
    expect(selectedConversationText(selectBetween(textOf(message), 0, textOf(message), 5))).toBe('hello')
    // 跨段落选中同一消息内的词也允许。
    expect(selectedConversationText(selectBetween(textOf(message), 6, textOf(message), 11))).toBe('world')
  })

  it('ignores selections outside the conversation', () => {
    build()
    const side = document.getElementById('side') as HTMLElement
    expect(selectedConversationText(selectBetween(textOf(side), 0, textOf(side), 7))).toBe('')
  })

  it('ignores selections in the composer and editable regions', () => {
    build()
    const editable = document.getElementById('ed') as HTMLElement
    expect(selectedConversationText(selectBetween(textOf(editable), 0, textOf(editable), 4))).toBe('')
  })

  it('ignores a selection that crosses the conversation and the composer', () => {
    build()
    const message = document.getElementById('msg') as HTMLElement
    const editable = document.getElementById('ed') as HTMLElement
    expect(selectedConversationText(selectBetween(textOf(message), 0, textOf(editable), 4))).toBe('')
  })

  it('ignores collapsed and whitespace-only selections', () => {
    build()
    const message = document.getElementById('msg') as HTMLElement
    expect(selectedConversationText(selectBetween(textOf(message), 2))).toBe('')
    expect(selectedConversationText(selectBetween(textOf(message), 5, textOf(message), 6))).toBe('')
    expect(selectedConversationText(null)).toBe('')
  })
})
