import { describe, it, expect } from 'vitest'
import { divineLiuyao, ASK_CATEGORIES, getAskCat } from '../src/core/liuyao-verdict'
import { tossSix } from '../src/core/liuyao-cast'
import type { YaoValue } from '../src/core/liuyao-mount'

describe('六爻断语 · 规则引擎', () => {
  it('十二类占问皆可取用神', () => {
    expect(ASK_CATEGORIES.length).toBe(12)
    for (const c of ASK_CATEGORIES) {
      expect(c.yong.length).toBeGreaterThan(0)
      expect(getAskCat(c.id).label).toBe(c.label)
    }
  })

  it('完整起卦——断语链条完整，卦盘齐全', () => {
    const tosses = tossSix()
    const values = tosses.map((t) => t.value)
    const time = { year: '庚午', month: '壬午', day: '辛亥', hour: '乙未' }
    const pan = divineLiuyao('这次面试能成吗', 'guan', values, time)

    expect(pan.benRows).toHaveLength(6)
    expect(pan.values).toHaveLength(6)
    expect(pan.conclusion.length).toBeGreaterThan(5)
    expect(pan.verdicts.length).toBeGreaterThanOrEqual(4)
    expect(pan.steps.length).toBeGreaterThanOrEqual(4)
    expect(pan.benName).toBeTruthy()
    expect(pan.zhiName).toBeTruthy()
    // 步序含出处
    for (const s of pan.steps) {
      expect(s.source.length).toBeGreaterThan(0)
    }
    // 六爻值必须合法
    for (const v of values) {
      expect([6, 7, 8, 9]).toContain(v)
    }
  })

  it('静卦无动爻时结论平稳', () => {
    const values: YaoValue[] = [7, 7, 7, 7, 7, 7] // 乾为天，全静
    const pan = divineLiuyao('问家宅', 'jia', values, { year: '庚午', month: '壬午', day: '辛亥', hour: '乙未' })
    expect(pan.benName).toBe('乾')
    // 六爻皆静结论
    expect(pan.verdicts.some((v) => v.text.includes('六爻皆静'))).toBe(true)
  })

  it('全动卦（六冲）可推变卦', () => {
    const values: YaoValue[] = [6, 6, 6, 6, 6, 6] // 坤为地全老阴
    const pan = divineLiuyao('问健康', 'yun', values, { year: '庚午', month: '壬午', day: '辛亥', hour: '乙未' })
    expect(pan.zhiData).toBeTruthy()
    expect(pan.values.some((v) => v === 6 || v === 9)).toBe(true)
  })
})