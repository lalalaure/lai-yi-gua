import { describe, it, expect } from 'vitest'
import { meihuaByNumber, meihuaByTime } from '../src/core/meihua'
import { readMeihua } from '../src/core/meihua-reading'

describe('梅花读象篇', () => {
  it('观梅占读象：六段齐全，体用势正确', () => {
    const pan = meihuaByTime('观梅占复验', [5, 12, 17, 9])
    // 兑/离 初爻动 -> 体用对
    expect(pan.benData.name).toBe('革')
    const rs = readMeihua(pan)
    expect(rs.length).toBeGreaterThanOrEqual(6)
    const titles = rs.map((r) => r.title)
    expect(titles[0]).toBe('场面：这是一出什么戏')
    expect(titles).toContain('你与事情的相对位置')
    expect(titles).toContain('动爻：扭转局面的那一下')
    expect(titles).toContain('变卦：故事往哪儿走')
    expect(titles).toContain('你可以怎么做')
    for (const r of rs) {
      expect(r.text.length).toBeGreaterThan(10)
      expect(r.source.length).toBeGreaterThan(0)
    }
  })

  it('报数起卦读象：动爻在上的口径（外在先动）', () => {
    const pan = meihuaByNumber('某所成否', 9, 12, 4)
    const rs = readMeihua(pan)
    expect(pan.movingLine).toBe(4)
    expect(rs.some((r) => r.text.includes('上卦'))).toBe(true)
  })

  it('读象不会用生克术语吓人：只给倾向与建议', () => {
    const pan = meihuaByTime('试一卦', [1, 1, 1, 1])
    for (const r of readMeihua(pan)) {
      expect(r.text).not.toMatch(/血光|生死|注定|必死|大凶/)
    }
  })
})