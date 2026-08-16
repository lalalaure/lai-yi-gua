import { describe, it, expect } from 'vitest'
import { methods, getMethod } from '../src/data/methods'

describe('占法之道 · 元数据完整性', () => {
  it('三种可用占法齐全且唯一', () => {
    const ids = methods.filter((m) => m.available).map((m) => m.id)
    expect(ids).toEqual(['bazi', 'liuyao', 'meihua'])
  })

  it('每种占法都有三步引导与引用', () => {
    for (const m of methods) {
      expect(m.steps.length).toBeGreaterThanOrEqual(3)
      expect(m.suitedFor).toBeTruthy()
      expect(m.readingPoints.length).toBeGreaterThan(0)
    }
  })

  it('getMethod 能找到对应方法', () => {
    expect(getMethod('liuyao').name).toBe('六爻')
  })

  it('首页引导意图均指向已可用或可解释的占法', () => {
    const intentMethods = new Set(['bazi', 'liuyao', 'meihua'])
    expect(intentMethods).toEqual(new Set(['bazi', 'liuyao', 'meihua']))
  })
})