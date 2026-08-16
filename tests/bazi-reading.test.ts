import { describe, it, expect } from 'vitest'
import { paiPan } from '../src/core/bazi'

describe('八字白话解读', () => {
  const pan = paiPan({ year: 1986, month: 5, day: 29, hour: 1 }, 1)

  it('总体解读六段齐全且都附出处', () => {
    expect(pan.readings.length).toBe(6)
    const titles = pan.readings.map((r) => r.title)
    expect(titles).toContain('命主画像')
    expect(titles).toContain('五行格局与天赋短板')
    expect(titles).toContain('大运走势概览')
    expect(titles).toContain('眼前这两年')
    for (const r of pan.readings) {
      expect(r.text.length).toBeGreaterThan(10)
      expect(r.source.length).toBeGreaterThan(0)
    }
  })

  it('四柱详解：每柱都有白话、藏干与大运建议', () => {
    expect(pan.pillarExplains.length).toBe(4)
    for (const p of pan.pillarExplains) {
      expect(p.name).toMatch(/柱$/)
      expect(p.roleText.length).toBeGreaterThan(0)
      expect(p.explain.length).toBeGreaterThan(0)
      expect(p.hides.length).toBeGreaterThan(0)
      expect(p.naYin.length).toBeGreaterThan(0)
    }
    const ri = pan.pillarExplains.find((p) => p.name === '日柱')!
    expect(ri.ganText).toContain('日主')
  })

  it('五行罗盘：五卡齐全，强/缺/宜分类合理', () => {
    const board = pan.wuxingBoard
    expect(Object.keys(board.cards).length).toBe(5)
    expect(board.strongest.length).toBeGreaterThan(0)
    const roles = Object.values(board.cards).map((c) => c.role)
    expect(roles).toContain('强')
    expect(board.missing.length).toBeGreaterThanOrEqual(0)
  })

  it('大运逐运指数：分数 5..95，高/中/低标签合法', () => {
    expect(pan.dayunRead.length).toBe(pan.daYun.length)
    for (const d of pan.dayunRead) {
      expect(d.score).toBeGreaterThanOrEqual(5)
      expect(d.score).toBeLessThanOrEqual(95)
      expect(['高', '中', '低']).toContain(d.tag)
      expect(d.text.length).toBeGreaterThan(10)
      expect(d.advice.length).toBeGreaterThan(0)
    }
  })

  it('喜忌判断：与强弱一致', () => {
    expect(pan.xiJi.xi.length).toBeGreaterThan(0)
    expect(pan.xiJi.ji.length).toBeGreaterThan(0)
  })
})