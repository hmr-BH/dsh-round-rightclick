/**
 * 圆形区域的角度计算工具。
 * 角度命中和 CSS 扇区计算可独立使用；菜单按钮本身使用 menu-layout.ts 生成点击区域。
 */

/** 平面点。 */
export interface Point {
  readonly x: number
  readonly y: number
}

/** 命中结果。 */
export type PieHit =
  | { readonly kind: 'slice'; readonly index: number }
  | { readonly kind: 'cancel' }
  | { readonly kind: 'outside' }

/** 命中参数。 */
export interface PieHitInput {
  readonly center: Point
  readonly pointer: Point
  readonly innerRadius: number
  readonly count: number
  /** 第一项的起始边角度；默认 -π/2，表示屏幕正上方。 */
  readonly startAngle?: number
  /** 可选外半径；设置后圆盘外的点不命中操作，省略时只判断方向。 */
  readonly outerRadius?: number
}

const TWO_PI = Math.PI * 2

/** 默认将第一项的起始边放在正上方，角度顺时针增加。 */
export const DEFAULT_START_ANGLE = -Math.PI / 2

/**
 * 把任意角规范到 [0, 2π)。
 * @param angle - 弧度
 * @returns 大于等于 0 且小于 2π 的等价角度
 */
export function normalizeAngle(angle: number): number {
  return ((angle % TWO_PI) + TWO_PI) % TWO_PI
}

/**
 * 计算等分扇区的中线角度，使用屏幕向右为零点的弧度坐标。
 * CSS 旋转的零点和单位不同，对应计算见 sliceCssMidDegrees。
 * @param count - 切片数
 * @param index - 0..count-1
 * @param startAngle - 第一项起始边
 * @returns 指定扇区中线的弧度值
 */
export function sliceMidAngle(
  count: number,
  index: number,
  startAngle: number = DEFAULT_START_ANGLE,
): number {
  if (count <= 0) throw new Error('sliceMidAngle: count must be positive')
  const width = TWO_PI / count
  return startAngle + (index + 0.5) * width
}

/**
 * 计算 CSS 扇区中线角度，以正上方为零点，顺时针增加。
 * @param count - 切片数
 * @param index - 0..count-1
 * @returns 适用于 CSS 旋转或锥形渐变的角度值
 */
export function sliceCssMidDegrees(count: number, index: number): number {
  if (count <= 0) throw new Error('sliceCssMidDegrees: count must be positive')
  return ((index + 0.5) * 360) / count
}

/**
 * 计算 CSS 锥形渐变中指定扇区的起止角度。
 * @param count - 切片数
 * @param index - 0..count-1
 * @returns 从正上方顺时针计算的起始角度和结束角度
 */
export function sliceCssSpanDegrees(
  count: number,
  index: number,
): { readonly start: number; readonly end: number } {
  if (count <= 0) throw new Error('sliceCssSpanDegrees: count must be positive')
  const width = 360 / count
  return { start: index * width, end: (index + 1) * width }
}

/**
 * 判断一个点位于中心取消区、某项操作区域还是圆盘之外。
 * @param input - 圆心、指针、内径、切片数
 * @returns 命中区域；操作区域同时携带从零开始的序号
 */
export function hitTestPie(input: PieHitInput): PieHit {
  const { center, pointer, innerRadius, count } = input
  const startAngle = input.startAngle ?? DEFAULT_START_ANGLE
  if (count <= 0) return { kind: 'outside' }
  const dx = pointer.x - center.x
  const dy = pointer.y - center.y
  const dist = Math.hypot(dx, dy)
  if (dist < innerRadius) return { kind: 'cancel' }
  if (input.outerRadius !== undefined && dist > input.outerRadius) return { kind: 'outside' }
  const rel = normalizeAngle(Math.atan2(dy, dx) - startAngle)
  const width = TWO_PI / count
  const index = Math.min(count - 1, Math.floor(rel / width))
  return { kind: 'slice', index }
}
