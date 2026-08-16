import { describe, it, expect } from 'vitest'
import { nowGanzhi, zhiSeq, meihuaNowNums } from '../src/core/clock'
import { meihuaByTime } from '../src/core/meihua'

describe('当下四柱与时占', () => {
  it('当下四柱为四组干支', () => {
    const p = nowGanzhi()
    for (const g of [p.pillars.year, p.pillars.month, p.pillars.day, p.pillars.hour]) {
      expect(g.length).toBe(2)
      expect(/^[甲乙丙丁戊己庚辛壬癸]/.test(g[0])).toBe(true)
      expect(/^[子丑寅卯辰巳午未申酉戌亥]/.test(g[1])).toBe(true)
    }
  })

  it('地支序数 子=1 … 亥=12', () => {
    expect(zhiSeq('子')).toBe(1)
    expect(zhiSeq('申')).toBe(9)
    expect(zhiSeq('亥')).toBe(12)
  })

  it('梅花以当下时刻起卦不抛错', () => {
    const nums = meihuaNowNums()
    expect(nums.length).toBe(4)
    const pan = meihuaByTime('此刻', nums)
    expect(pan.benData.guaci.length).toBeGreaterThan(0)
  })
})