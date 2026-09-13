import { describe, expect, it } from 'vitest'
import {
  DEFAULT_START_ANGLE, hitTestPie, sliceCssMidDegrees, sliceCssSpanDegrees, sliceMidAngle,
} from '../src/client/pie.ts'

const center = { x: 100, y: 100 }
const inner = 20
const count = 6

/** 从正上顺时针 `deg` 度、距离 `r` 的点（屏幕坐标 y 向下）。 */
function at(deg: number, r: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180
  // 正上是 -90° in atan2 screen space when y grows down... 我们的 startAngle 是 -π/2，
  // 顺时针 deg 对应：x = sin(deg), y = -cos(deg)（相对圆心）。
  return {
    x: center.x + r * Math.sin(rad),
    y: center.y - r * Math.cos(rad),
  }
}

describe('hitTestPie', () => {
  it('selects the slice in that direction, not by distance', () => {
    // 第一项覆盖 0°–60° 顺时针；30° 是中线。近处与远处同一项。
    expect(hitTestPie({ center, pointer: at(30, 40), innerRadius: inner, count }).kind).toBe('slice')
    expect(hitTestPie({ center, pointer: at(30, 40), innerRadius: inner, count })).toEqual({ kind: 'slice', index: 0 })
    expect(hitTestPie({ center, pointer: at(30, 400), innerRadius: inner, count })).toEqual({ kind: 'slice', index: 0 })
    expect(hitTestPie({ center, pointer: at(90, 80), innerRadius: inner, count })).toEqual({ kind: 'slice', index: 1 })
    expect(hitTestPie({ center, pointer: at(150, 80), innerRadius: inner, count })).toEqual({ kind: 'slice', index: 2 })
    expect(hitTestPie({ center, pointer: at(210, 80), innerRadius: inner, count })).toEqual({ kind: 'slice', index: 3 })
    expect(hitTestPie({ center, pointer: at(270, 80), innerRadius: inner, count })).toEqual({ kind: 'slice', index: 4 })
    expect(hitTestPie({ center, pointer: at(330, 80), innerRadius: inner, count })).toEqual({ kind: 'slice', index: 5 })
  })

  it('cancels inside the center hole', () => {
    expect(hitTestPie({ center, pointer: center, innerRadius: inner, count })).toEqual({ kind: 'cancel' })
    expect(hitTestPie({ center, pointer: { x: 100 + 5, y: 100 }, innerRadius: inner, count })).toEqual({ kind: 'cancel' })
    expect(hitTestPie({
      center,
      pointer: { x: 100 + inner - 0.5, y: 100 },
      innerRadius: inner,
      count,
    }).kind).toBe('cancel')
  })

  it('wraps across 0° (positive x, 90° clockwise from top) and across the start edge', () => {
    // 359° 仍是最后一项；1° 是第一项。
    expect(hitTestPie({ center, pointer: at(359, 50), innerRadius: inner, count })).toEqual({ kind: 'slice', index: 5 })
    expect(hitTestPie({ center, pointer: at(1, 50), innerRadius: inner, count })).toEqual({ kind: 'slice', index: 0 })
    // 屏幕 +x 是 90° 顺时针，落在第 1 项中段。
    expect(hitTestPie({ center, pointer: { x: 180, y: 100 }, innerRadius: inner, count })).toEqual({ kind: 'slice', index: 1 })
  })

  it('spaces N items around the ring', () => {
    const n = 8
    for (let i = 0; i < n; i += 1) {
      const deg = (360 / n) * (i + 0.5)
      expect(hitTestPie({ center, pointer: at(deg, 60), innerRadius: inner, count: n })).toEqual({
        kind: 'slice',
        index: i,
      })
    }
  })

  it('treats beyond outerRadius as outside when provided', () => {
    expect(hitTestPie({
      center,
      pointer: at(30, 200),
      innerRadius: inner,
      count,
      outerRadius: 100,
    })).toEqual({ kind: 'outside' })
  })

  it('returns outside for empty layouts', () => {
    expect(hitTestPie({ center, pointer: at(0, 50), innerRadius: inner, count: 0 })).toEqual({ kind: 'outside' })
  })
})

describe('sliceMidAngle', () => {
  it('places the first mid-angle half a slice clockwise from start', () => {
    const mid = sliceMidAngle(6, 0, DEFAULT_START_ANGLE)
    expect(mid).toBeCloseTo(DEFAULT_START_ANGLE + Math.PI / 6, 10)
  })
})

describe('sliceCssMidDegrees', () => {
  it('uses 0deg as 12 o\'clock clockwise, so a 6-item first slice sits at 30deg', () => {
    expect(sliceCssMidDegrees(6, 0)).toBe(30)
    expect(sliceCssMidDegrees(6, 1)).toBe(90)
    expect(sliceCssMidDegrees(6, 5)).toBe(330)
  })
})

describe('sliceCssSpanDegrees', () => {
  it('spans the first 6-item slice from 0 to 60 (from 0deg = 12 o\'clock)', () => {
    expect(sliceCssSpanDegrees(6, 0)).toEqual({ start: 0, end: 60 })
    expect(sliceCssSpanDegrees(6, 1)).toEqual({ start: 60, end: 120 })
  })
})
