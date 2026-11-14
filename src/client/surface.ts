/**
 * 识别对话区域及右键命中的消息身份，排除消息输入栏和可编辑控件。
 */

const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
const COMPOSER_SEAT = '[data-composer-seat]'
const CONVERSATION_SURFACE = '[data-conversation-scroll], [data-phase], [data-chat-flow-key]'

function elementOf(node: Node | null): Element | null {
  if (node === null) return null
  return node instanceof Element ? node : node.parentElement
}

/**
 * 事件目标是否属于当前会话对话表面。
 * @param target - 右键事件的目标元素
 * @returns 允许显示会话菜单时为 true
 */
export function isSessionConversationSurface(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  if (target.closest(EDITABLE) !== null) return false
  if (target.closest(COMPOSER_SEAT) !== null) return false
  return target.closest(CONVERSATION_SURFACE) !== null
}

/**
 * 读取当前选区中属于对话内容的文本。
 * 选区两端都必须落在对话表面内，输入框、输入栏等可编辑区域以及侧栏等页面其他部分一律排除。
 * @param selection - 文档当前选区
 * @returns 可复制的选中文本；没有选区或选区不属于对话内容时返回空字符串
 */
export function selectedConversationText(selection: Selection | null | undefined): string {
  if (selection === null || selection === undefined || selection.isCollapsed) return ''
  const text = selection.toString()
  if (text.trim() === '') return ''
  // 选区跨越对话内容与输入栏时不应复制，因此两端都检查。
  for (const node of [selection.anchorNode, selection.focusNode]) {
    const element = elementOf(node)
    if (element === null) return ''
    if (element.closest(EDITABLE) !== null) return ''
    if (element.closest(COMPOSER_SEAT) !== null) return ''
    if (element.closest(CONVERSATION_SURFACE) === null) return ''
  }
  return text
}

/**
 * 读取右键命中节点的身份，不用页面位置猜测对话轮次。
 * @param target - 右键事件目标
 * @returns 明确的轮次和节点键，空白处返回空对象
 */
export function conversationTarget(target: EventTarget | null): import('./fork-target.ts').ConversationTarget {
  if (!(target instanceof Element)) return {}
  const row = target.closest<HTMLElement>('[data-chat-flow-key], [data-chat-turn]')
  if (row === null) return {}
  const raw = row.getAttribute('data-chat-turn')
  const turn = raw !== null && /^\d+$/.test(raw) ? Number(raw) : undefined
  return {
    turn: turn !== undefined && Number.isSafeInteger(turn) ? turn : undefined,
    nodeKey: row.dataset.chatFlowKey,
  }
}
