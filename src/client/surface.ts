/**
 * 识别对话区域及右键命中的消息身份，排除消息输入栏和可编辑控件。
 */

const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'

/**
 * 事件目标是否属于当前会话对话表面。
 * @param target - 右键事件的目标元素
 * @returns 允许显示会话菜单时为 true
 */
export function isSessionConversationSurface(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  if (target.closest(EDITABLE) !== null) return false
  if (target.closest('[data-composer-seat]') !== null) return false
  return target.closest('[data-conversation-scroll], [data-phase], [data-chat-flow-key]') !== null
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
