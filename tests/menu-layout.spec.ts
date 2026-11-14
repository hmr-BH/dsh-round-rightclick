import { describe, expect, it } from 'vitest'
import {
  labelPosition,
  labelWidthPercent,
  placeMenu,
  sectorClip,
} from '../src/client/menu-layout.ts'

describe('sectorClip', () => {
  it('keeps the default six-sector geometry when count is omitted', () => {
    expect(sectorClip(0)).toBe(sectorClip(0, 6))
    expect(sectorClip(5)).toBe(sectorClip(5, 6))
  })

  it('splits the ring into the requested number of distinct sectors', () => {
    const seven = new Set(Array.from({ length: 7 }, (_, index) => sectorClip(index, 7)))
    expect(seven.size).toBe(7)
    for (const clip of seven) {
      expect(clip.startsWith('polygon(')).toBe(true)
      expect(clip.endsWith(')')).toBe(true)
    }
  })

  it('rejects empty layouts instead of dividing by zero', () => {
    expect(() => sectorClip(0, 0)).toThrow('count')
  })
})

describe('labelPosition', () => {
  it('centers the first label at the top of the wheel for any count', () => {
    for (const count of [6, 7]) {
      expect(labelPosition(0, count)).toEqual({ left: '50%', top: '17%' })
    }
  })

  it('rejects empty layouts instead of dividing by zero', () => {
    expect(() => labelPosition(0, 0)).toThrow('count')
  })
})

describe('labelWidthPercent', () => {
  it('keeps the previous 30% width for six sectors and narrows as sectors grow', () => {
    expect(labelWidthPercent(6)).toBe(29.7)
    expect(labelWidthPercent(7)).toBe(25.8)
    expect(labelWidthPercent(8)).toBeLessThan(labelWidthPercent(7))
  })

  it('rejects empty layouts instead of dividing by zero', () => {
    expect(() => labelWidthPercent(0)).toThrow('count')
  })
})

describe('placeMenu', () => {
  it('keeps the wheel and its label inside the viewport and shrinks in small windows', () => {
    expect(placeMenu(100, 100, 1200, 900)).toEqual({ x: 112, y: 112, size: 200 })
    expect(placeMenu(1190, 890, 1200, 900)).toEqual({ x: 1088, y: 736, size: 200 })
    expect(placeMenu(50, 50, 120, 120)).toEqual({ x: 50, y: 34, size: 44 })
  })
})
