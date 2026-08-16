import { describe, it, expect } from 'vitest'
import { paiPan } from '../src/core/bazi'
import { gejuOf, determineGeju, type GejuPillar } from '../src/core/geju'

/** 构造四柱的便捷函数 */
function mkPillars(
  year: [string, string, string[]],
  month: [string, string, string[]],
  day: [string, string, string[]],
  hour: [string, string, string[]]
): GejuPillar[] {
  const mk = (name: string, [gan, zhi, hidden]: [string, string, string[]]): GejuPillar => ({
    name,
    gan,
    zhi,
    hiddenGans: hidden,
    shiShenGan: '',
    shiShenZhi: []
  })
  return [mk('年柱', year), mk('月柱', month), mk('日柱', day), mk('时柱', hour)]
}

describe('格局引擎 · 定格局', () => {
  it('月令本气透干 → 正官格', () => {
    // 甲日主，酉月（辛=正官），时干透辛
    const pillars = mkPillars(
      ['庚', '午', ['丁', '己']],
      ['癸', '酉', ['辛']],
      ['甲', '子', ['癸']],
      ['辛', '未', ['己', '丁', '乙']]
    )
    const r = determineGeju(pillars, '甲', '酉')
    expect(r.name).toBe('正官格')
    expect(r.cheng).toBe(true)
    expect(r.basis).toContain('透干')
  })

  it('月令本气不透 → 取余气透干定格', () => {
    // 甲日主，辰月（戊=偏财本气，不透），余气癸=正印，时干透癸
    const pillars = mkPillars(
      ['庚', '午', ['丁', '己']],
      ['丙', '辰', ['戊', '乙', '癸']],
      ['甲', '子', ['癸']],
      ['癸', '酉', ['辛']]
    )
    const r = determineGeju(pillars, '甲', '辰')
    expect(r.name).toBe('正印格')
    expect(r.cheng).toBe(true)
  })

  it('建禄格：月支为日主之禄', () => {
    // 甲日主，寅月
    const pillars = mkPillars(
      ['庚', '午', ['丁', '己']],
      ['丙', '寅', ['甲', '丙', '戊']],
      ['甲', '子', ['癸']],
      ['辛', '未', ['己', '丁', '乙']]
    )
    const r = determineGeju(pillars, '甲', '寅')
    expect(r.name).toBe('建禄格')
    expect(r.cheng).toBe(true)
  })

  it('羊刃格：月支为日主之刃', () => {
    // 甲日主，卯月
    const pillars = mkPillars(
      ['庚', '午', ['丁', '己']],
      ['丁', '卯', ['乙']],
      ['甲', '子', ['癸']],
      ['辛', '未', ['己', '丁', '乙']]
    )
    const r = determineGeju(pillars, '甲', '卯')
    expect(r.name).toBe('羊刃格')
    expect(r.cheng).toBe(true)
  })

  it('从财格：日主极弱无根，满盘财星', () => {
    // 庚日主，地支无根，满盘财（木），无印比帮扶
    const pillars = mkPillars(
      ['甲', '寅', ['甲', '丙', '戊']],
      ['丙', '寅', ['甲', '丙', '戊']],
      ['庚', '辰', ['戊', '乙', '癸']],
      ['乙', '卯', ['乙']]
    )
    const r = determineGeju(pillars, '庚', '寅')
    expect(r.name).toBe('从财格')
    expect(r.cheng).toBe(true)
  })

  it('无格：月令本气不透且无有力可取', () => {
    // 甲日主，酉月（辛=正官），天干无辛；月干为比肩跳过
    const pillars = mkPillars(
      ['戊', '午', ['丁', '己']],
      ['甲', '酉', ['辛']],
      ['甲', '子', ['癸']],
      ['己', '未', ['己', '丁', '乙']]
    )
    const r = determineGeju(pillars, '甲', '酉')
    expect(r.name).toBe('无格')
    expect(r.cheng).toBe(false)
  })
})

describe('格局引擎 · 破格检查', () => {
  it('正官格遇伤官透干 → 破格', () => {
    // 甲日主，酉月正官格（年干透辛），时干透丁=伤官
    const pillars = mkPillars(
      ['辛', '午', ['丁', '己']],
      ['癸', '酉', ['辛']],
      ['甲', '子', ['癸']],
      ['丁', '未', ['己', '丁', '乙']]
    )
    const r = gejuOf(pillars, '甲', '酉')
    expect(r.name).toBe('正官格')
    expect(r.cheng).toBe(false)
    expect(r.poReason).toContain('伤官')
  })

  it('七杀格无制化 → 破格', () => {
    // 甲日主，申月（庚=七杀，年干透庚），无食伤印透干
    const pillars = mkPillars(
      ['庚', '午', ['丁', '己']],
      ['戊', '申', ['庚', '壬', '戊']],
      ['甲', '子', ['癸']],
      ['己', '未', ['己', '丁', '乙']]
    )
    const r = gejuOf(pillars, '甲', '申')
    expect(r.name).toBe('七杀格')
    expect(r.cheng).toBe(false)
    expect(r.poReason).toContain('无制化')
  })

  it('七杀格有食神制 → 成格', () => {
    // 甲日主，申月七杀格，时干透丙=食神制杀
    const pillars = mkPillars(
      ['庚', '午', ['丁', '己']],
      ['壬', '申', ['庚', '壬', '戊']],
      ['甲', '子', ['癸']],
      ['丙', '寅', ['甲', '丙', '戊']]
    )
    const r = gejuOf(pillars, '甲', '申')
    expect(r.name).toBe('七杀格')
    expect(r.cheng).toBe(true)
    expect(r.poReason).toBe('')
  })
})

describe('格局引擎 · 与排盘集成', () => {
  it('paiPan 返回 geju 字段且读势含格局卡片', () => {
    const pan = paiPan({ year: 1986, month: 5, day: 29, hour: 1 }, 1)
    expect(pan.geju).toBeDefined()
    expect(pan.geju.name.length).toBeGreaterThan(0)
    expect(typeof pan.geju.cheng).toBe('boolean')
    const gejuRead = pan.readings.find((r) => r.title === '格局成否')
    expect(gejuRead).toBeDefined()
    expect(gejuRead!.text).toContain(pan.geju.name)
  })
})