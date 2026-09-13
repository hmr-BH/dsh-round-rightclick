/** 右键命中的对话位置，只使用界面明确提供的身份。 */
export interface ConversationTarget {
  readonly turn?: number
  readonly nodeKey?: string
}

/** 分叉可用性；未定位或未结束的轮次不允许退回整段会话。 */
export type ForkTarget =
  | { readonly kind: 'ready'; readonly turn: number; readonly atSeq: number }
  | { readonly kind: 'no-turn' | 'unfinished' | 'unavailable'; readonly turn?: number }

/** 会话事件窗口中用于定位轮次的最小字段。 */
export interface HistoryEntry {
  readonly type: string
  readonly event: { readonly type: string; readonly seq: number; readonly data: unknown }
}

/**
 * 根据轮次身份或消息锚点定位已完成轮次的结束事件。
 * @param entries - 当前已加载的事件窗口，按序号升序排列
 * @param turn - 界面声明的轮次身份
 * @param anchorSeq - 节点声明的事件锚点
 * @returns 精确分叉位置或不能分叉的原因
 */
export function resolveTurnFork(
  entries: readonly HistoryEntry[],
  turn?: number,
  anchorSeq?: number,
): ForkTarget {
  if (turn === undefined && anchorSeq === undefined) return { kind: 'no-turn' }
  if (turn !== undefined && (!Number.isSafeInteger(turn) || turn < 0)) return { kind: 'unavailable' }
  if (turn === undefined && (anchorSeq === undefined || !Number.isFinite(anchorSeq) || anchorSeq < 0 || anchorSeq > Number.MAX_SAFE_INTEGER)) {
    return { kind: 'unavailable' }
  }
  for (const { type, event } of entries) {
    if (type !== 'event' || event.type !== 'turn/end') continue
    const data = event.data
    if (typeof data !== 'object' || data === null || !('turn' in data)) continue
    const endedTurn = data.turn
    if (typeof endedTurn !== 'number' || !Number.isSafeInteger(endedTurn) || endedTurn < 0) continue
    if (!Number.isSafeInteger(event.seq) || event.seq < 0) continue
    // 有轮次身份时必须精确匹配，避免历史分页或节点重排导致切到相邻轮次。
    if (turn !== undefined ? endedTurn === turn : event.seq >= (anchorSeq as number)) {
      return { kind: 'ready', turn: endedTurn, atSeq: event.seq }
    }
  }
  return { kind: entries.length === 0 ? 'unavailable' : 'unfinished', turn }
}
