import { describe, it, expect } from 'vitest'
import {
  mountBenGua, zhiGuaValues, huGuaLines, computePalace, splitTrigrams, yaoToLine
} from '../src/core/liuyao-mount'
import { getHexagram } from '../src/data/hexagrams'

// 经典卦例（《增删卜易》/《火珠林》纳甲装卦对照）

describe('六爻装卦 · 京房纳甲', () => {
  it('乾为天（六阳）纳甲完全正确', () => {
    const rows = mountBenGua([7, 7, 7, 7, 7, 7], '甲')
    const ganzhis = rows.map((r) => r.ganzhi)
    // 乾宫本卦纳甲：初甲子 · 二甲寅 · 三甲辰 · 四壬午 · 五壬申 · 上壬戌
    expect(ganzhis).toEqual(['甲子', '甲寅', '甲辰', '壬午', '壬申', '壬戌'])
    const liuqins = rows.map((r) => r.liuqin)
// 宫五行金：子水=子孙 · 寅木=妻财 · 辰土=父母 · 午火=官鬼 · 申金=兄弟 · 戌土=父母
    expect(liuqins).toEqual(['子孙', '妻财', '父母', '官鬼', '兄弟', '父母'])
    // 本宫卦世六应三
    expect(rows.map((r) => r.shiying)).toEqual(['', '', '应', '', '', '世'])
    // 甲乙起青龙
    expect(rows.map((r) => r.liushen)).toEqual(['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'])
  })

  it('水火既济（六爻：阴阳阴阳阴阳）纳甲正确', () => {
    // 既济 = 下离上坎：离内己卯己丑己亥 · 坎外戊申戊戌戊子
    const rows = mountBenGua([7, 8, 7, 8, 7, 8], '庚')
    expect(rows.map((r) => r.ganzhi)).toEqual(['己卯', '己丑', '己亥', '戊申', '戊戌', '戊子'])
    // 庚辛日白虎起
    expect(rows[0].liushen).toBe('白虎')
  })

  it('八卦宫次：天山遁一世，火地晋游魂，火天大有归魂', () => {
    // 遁 = 下艮上乾
    const dun = computePalace(yaoToLine(7) === 1 ? [0, 0, 1, 1, 1, 1] : [0, 0, 1, 1, 1, 1])
    expect(dun.palace).toBe('乾')
    expect(dun.level).toBe('二世')
    expect(dun.shi).toBe(2)
    // 晋 = 下坤上离（游魂）
    const jin = computePalace([0, 0, 0, 1, 0, 1])
    expect(jin.palace).toBe('乾')
    expect(jin.level).toBe('游魂')
    expect(jin.shi).toBe(4)
    // 大有 = 下乾上离（归魂）
    const dayou = computePalace([1, 1, 1, 1, 0, 1])
    expect(dayou.palace).toBe('乾')
    expect(dayou.level).toBe('归魂')
    expect(dayou.shi).toBe(3)
  })

  it('三爻卦名识别', () => {
    expect(splitTrigrams([0, 0, 1, 1, 1, 1]).lower).toBe('艮')
    expect(splitTrigrams([0, 0, 1, 1, 1, 1]).upper).toBe('乾')
  })

  it('变卦：动爻阴阳互换', () => {
    expect(zhiGuaValues([6, 7, 8, 9, 7, 8])).toEqual([8, 7, 8, 7, 7, 8])
  })

  it('互卦取互体法', () => {
    // 泰 = 下乾上坤 => 二三四爻=乾坤... 取本卦2,3,4爻 与 3,4,5爻
    const hu = huGuaLines([1, 1, 1, 0, 0, 0])
    expect(hu).toEqual([1, 1, 0, 1, 0, 0])
  })

  it('六十四卦齐全且可查卦辞', () => {
    const ben = getHexagram('乾', '乾')
    expect(ben).toBeDefined()
    expect(ben.name).toBe('乾')
    expect(ben.guaci).toContain('元')
    expect(ben.yaoci.length).toBe(6)
  })
})