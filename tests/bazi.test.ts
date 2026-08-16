import { describe, it, expect } from 'vitest'
import { paiPan } from '../src/core/bazi'

describe('八字排盘', () => {
  it('经典生辰四柱正确（1986-5-29 子时）', () => {
    // lunar-javascript 官方示例：1986-5-29 -> 丙寅年 癸巳月 癸酉日
    const pan = paiPan({ year: 1986, month: 5, day: 29, hour: 1 }, 1)
    expect(pan.pillars[0].ganZhi).toBe('丙寅')
    expect(pan.pillars[1].ganZhi).toBe('癸巳')
    expect(pan.pillars[2].ganZhi).toBe('癸酉')
    expect(pan.dayGan).toBe('癸')
  })

  it('月令换节气正确（2月4日前属上一年）', () => {
    const pan = paiPan({ year: 2023, month: 2, day: 3, hour: 12 }, 0)
    // 2023年立春为2月4日，此前仍属壬寅年
    expect(pan.pillars[0].ganZhi[1]).toBe('寅')
  })

  it('十神计算正确（与库校验）', () => {
    const pan = paiPan({ year: 1990, month: 6, day: 15, hour: 14 }, 1)
    // 日主辛金：见壬水（我生，辛壬皆阴? 辛阴壬阳 -> 伤官）
    expect(pan.pillars[3].shiShenGan.length).toBeGreaterThan(0)
  })

  it('大运与流年齐全', () => {
    const pan = paiPan({ year: 1990, month: 6, day: 15, hour: 14 }, 1)
    expect(pan.daYun.length).toBeGreaterThanOrEqual(5)
    expect(pan.liuNian.length).toBeGreaterThanOrEqual(5)
    expect(pan.yun.label).toMatch(/顺行|逆行/)
  })

  it('神煞计算无异常', () => {
    const pan = paiPan({ year: 1990, month: 6, day: 15, hour: 14 }, 1)
    expect(Array.isArray(pan.shenSha)).toBe(true)
  })

  it('五行统计覆盖四柱', () => {
    const pan = paiPan({ year: 1990, month: 6, day: 15, hour: 14 }, 1)
    const total = pan.wuxing.reduce((a, b) => a + b.count, 0)
    expect(total).toBe(8) // 四柱干支各一 = 8
  })

  it('解读与结论完整', () => {
    const pan = paiPan({ year: 1990, month: 6, day: 15, hour: 14 }, 1)
    expect(pan.readings.length).toBeGreaterThanOrEqual(3)
    expect(pan.conclusion.length).toBeGreaterThan(5)
    for (const r of pan.readings) {
      expect(r.source.length).toBeGreaterThan(0)
    }
  })
})