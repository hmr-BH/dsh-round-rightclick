/** 圆盘默认直径，单位为 CSS 像素。 */
export const MENU_SIZE = 240
/** 中心取消按钮的半径与圆盘直径之比。 */
export const INNER_RATIO = 0.18
/** 操作区域的外半径与圆盘直径之比，外侧预留装饰环。 */
export const OUTER_RATIO = 0.47
/** 图标和文字的中心到圆心的距离与圆盘直径之比。 */
export const LABEL_RATIO = 0.33
/** 圆盘上的操作数量。 */
export const MENU_COUNT = 6

/** 圆盘中心位置及实际直径。 */
export interface MenuPlacement { readonly x: number; readonly y: number; readonly size: number }

/**
 * 将圆盘和下方说明限制在视口内，小窗口同步缩小圆盘。
 * @param x - 右键横坐标
 * @param y - 右键纵坐标
 * @param width - 视口宽度
 * @param height - 视口高度
 * @returns 可见的中心位置和直径
 */
export function placeMenu(x: number, y: number, width: number, height: number): MenuPlacement {
  const margin = 12
  const detailClearance = 52
  const size = Math.max(0, Math.min(MENU_SIZE, width - margin * 2, height - margin * 2 - detailClearance))
  const radius = size / 2
  return {
    size,
    x: Math.max(radius + margin, Math.min(x, width - radius - margin)),
    y: Math.max(radius + margin, Math.min(y, height - radius - margin - detailClearance)),
  }
}

function point(deg: number, radius: number): [number, number] {
  const angle = deg * Math.PI / 180
  return [50 + Math.sin(angle) * radius, 50 - Math.cos(angle) * radius]
}

/**
 * 生成环形扇区的 CSS 命中多边形，第一项居正上方。
 * @param index - 从零开始的动作位置
 * @returns 用百分比表示的 clip-path 值
 */
export function sectorClip(index: number): string {
  const start = index * 360 / MENU_COUNT - 180 / MENU_COUNT
  const points: string[] = []
  // 沿外弧正向、内弧反向连接，得到不覆盖中心按钮的封闭环形扇区。
  for (const [radius, direction] of [[OUTER_RATIO * 100, 1], [INNER_RATIO * 100, -1]]) {
    for (let step = 0; step <= 20; step++) {
      const progress = direction === 1 ? step / 20 : 1 - step / 20
      const [x, y] = point(start + progress * 360 / MENU_COUNT, radius)
      points.push(`${x.toFixed(3)}% ${y.toFixed(3)}%`)
    }
  }
  return `polygon(${points.join(',')})`
}

/**
 * 获取动作标签在圆盘中的百分比位置。
 * @param index - 动作位置
 * @returns CSS left、top 的百分比值
 */
export function labelPosition(index: number): { left: string; top: string } {
  const [x, y] = point(index * 360 / MENU_COUNT, LABEL_RATIO * 100)
  return { left: `${x}%`, top: `${y}%` }
}
