// ============================================================
// 格局 · 引擎
// 子平格局以月令为纲：月支本气透干则成格，不透则取他神
// 成格与否：看透干、看破格（伤官见官/七杀混杂/比劫夺财等）
// 内容出《渊海子平·论格局》《子平真诠》，为确定性规则推算
// ============================================================

import { GAN_WUXING, ZHI_HIDEGAN, SHENG, KE, type Wuxing } from './tables'
import { getGejuGuide } from '@/data/geju-guide'

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const YANG = [true, false, true, false, true, false, true, false, true, false]

/** 柱的轻量描述（与 bazi.ts 解耦） */
export interface GejuPillar {
  name: string
  gan: string
  zhi: string
  hiddenGans: string[]
  shiShenGan: string
  shiShenZhi: string[]
}

export interface GejuResult {
  /** 格局名（如 正官格 / 七杀格 / 无格） */
  name: string
  /** 是否成格 */
  cheng: boolean
  /** 定格的依据（白话） */
  basis: string
  /** 破格原因（若有） */
  poReason: string
  /** 一句话定性 */
  oneLiner: string
  /** 此格局的人大致什么样 */
  trait: string
  /** 发挥建议 */
  advice: string
}

// ---------- 十神 ----------

const SS_TABLE: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      const dw = GAN_WUXING[GAN[i]] as Wuxing
      const tw = GAN_WUXING[GAN[j]] as Wuxing
      const same = YANG[i] === YANG[j]
      let s: string
      if (dw === tw) s = same ? '比肩' : '劫财'
      else if (SHENG[dw] === tw) s = same ? '食神' : '伤官'
      else if (SHENG[tw] === dw) s = same ? '偏印' : '正印'
      else if (KE[dw] === tw) s = same ? '偏财' : '正财'
      else s = same ? '七杀' : '正官'
      map[GAN[i] + GAN[j]] = s
    }
  }
  return map
})()

function shiShenOf(dayGan: string, targetGan: string): string {
  return SS_TABLE[dayGan + targetGan] ?? ''
}

/** 地支本气（藏干第一位） */
function benQi(zhi: string): string {
  return ZHI_HIDEGAN[zhi]?.[0] ?? ''
}

/** 地支本气对应的十神 */
function benQiShiShen(dayGan: string, zhi: string): string {
  const bq = benQi(zhi)
  return bq ? shiShenOf(dayGan, bq) : ''
}

/** 天干中是否出现某十神（透干） */
function touGan(pillars: GejuPillar[], dayGan: string, shiShen: string): boolean {
  return pillars.some((p) => p.name !== '日柱' && shiShenOf(dayGan, p.gan) === shiShen)
}

/** 天干中某十神出现次数 */
function countGan(pillars: GejuPillar[], dayGan: string, shiShen: string): number {
  return pillars.filter((p) => p.name !== '日柱' && shiShenOf(dayGan, p.gan) === shiShen).length
}

/** 地支中某十神出现次数（含藏干） */
function countZhi(pillars: GejuPillar[], dayGan: string, shiShen: string): number {
  let n = 0
  for (const p of pillars) {
    for (const g of p.hiddenGans) {
      if (shiShenOf(dayGan, g) === shiShen) n++
    }
  }
  return n
}

/** 日主是否有根（地支藏干含日主同五行） */
function dayRoot(pillars: GejuPillar[], dayGan: string): boolean {
  const dw = GAN_WUXING[dayGan] as Wuxing
  return pillars.some((p) => p.hiddenGans.some((g) => (GAN_WUXING[g] as Wuxing) === dw))
}

/** 日主是否极弱（无根且帮扶少）——用于从格判断 */
function dayExtremeWeak(pillars: GejuPillar[], dayGan: string): boolean {
  if (dayRoot(pillars, dayGan)) return false
  const dw = GAN_WUXING[dayGan] as Wuxing
  let help = 0
  for (const p of pillars) {
    if (p.name === '日柱') continue
    const gw = GAN_WUXING[p.gan] as Wuxing
    if (gw === dw) help += 1 // 比劫
    else if (SHENG[gw] === dw) help += 1 // 印
    for (const g of p.hiddenGans) {
      const hw = GAN_WUXING[g] as Wuxing
      if (hw === dw) help += 0.5
      else if (SHENG[hw] === dw) help += 0.5
    }
  }
  return help <= 1
}

/** 月支本气十神 */
function monthBenQiShiShen(dayGan: string, monthZhi: string): string {
  return benQiShiShen(dayGan, monthZhi)
}

/**
 * 定格局
 * 规则（出《渊海子平·论格局》《子平真诠》）：
 * 1. 从格优先：日主极弱无根，满盘财/杀/食伤 → 从财/从杀/从儿
 * 2. 建禄/羊刃：月支为日主禄刃
 * 3. 月令本气透干 → 以本气定格
 * 4. 月令本气不透 → 取月令余气或天干有力者，否则无格
 */
export function determineGeju(pillars: GejuPillar[], dayGan: string, monthZhi: string): GejuResult {
  const monthSs = monthBenQiShiShen(dayGan, monthZhi)
  const monthBenQiGan = benQi(monthZhi)

  // 禄刃表
  const LU: Record<string, string> = { 甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' }
  const YANGREN: Record<string, string> = { 甲: '卯', 丙: '午', 戊: '午', 庚: '酉', 壬: '子' }

  // ---- 从格 ----
  if (dayExtremeWeak(pillars, dayGan)) {
    const cai = countGan(pillars, dayGan, '正财') + countGan(pillars, dayGan, '偏财') + countZhi(pillars, dayGan, '正财') + countZhi(pillars, dayGan, '偏财')
    const sha = countGan(pillars, dayGan, '七杀') + countGan(pillars, dayGan, '正官') + countZhi(pillars, dayGan, '七杀') + countZhi(pillars, dayGan, '正官')
    const er = countGan(pillars, dayGan, '食神') + countGan(pillars, dayGan, '伤官') + countZhi(pillars, dayGan, '食神') + countZhi(pillars, dayGan, '伤官')
    const total = cai + sha + er
    if (total >= 6) {
      if (cai >= sha && cai >= er) return mkResult('从财格', true, `日主${dayGan}极弱无根，满盘财星，只能顺势从财。`, '')
      if (sha >= cai && sha >= er) return mkResult('从杀格', true, `日主${dayGan}极弱无根，满盘官杀，只能顺势从杀。`, '')
      return mkResult('从儿格', true, `日主${dayGan}极弱无根，满盘食伤，只能顺势从儿。`, '')
    }
  }

  // ---- 建禄 / 羊刃 ----
  if (LU[dayGan] === monthZhi) {
    return mkResult('建禄格', true, `月支${monthZhi}为日主${dayGan}之禄，日主得令而旺，自立门户。`, '')
  }
  if (YANGREN[dayGan] === monthZhi) {
    return mkResult('羊刃格', true, `月支${monthZhi}为日主${dayGan}之羊刃，日主极旺，刚猛有担当。`, '')
  }

  // ---- 月令本气透干 → 定格 ----
  const monthSsName = monthSs
  if (touGan(pillars, dayGan, monthSsName)) {
    return mkResult(monthSsName + '格', true, `月支${monthZhi}本气为${monthBenQiGan}（${monthSsName}），透干成格。`, '')
  }

  // ---- 月令本气不透 → 取余气或天干有力者 ----
  // 余气（藏干第二、三位）；比劫（禄刃）不成格，跳过
  const hides = ZHI_HIDEGAN[monthZhi] ?? []
  for (let i = 1; i < hides.length; i++) {
    const g = hides[i]
    const ss = shiShenOf(dayGan, g)
    if (ss === '比肩' || ss === '劫财') continue
    if (touGan(pillars, dayGan, ss)) {
      return mkResult(ss + '格', true, `月支${monthZhi}本气不透，取余气${g}（${ss}）透干定格。`, '')
    }
  }

  // 天干有力者（非日主，取月干优先）
  const monthPillar = pillars.find((p) => p.name === '月柱')
  if (monthPillar && monthPillar.gan !== dayGan) {
    const ss = shiShenOf(dayGan, monthPillar.gan)
    if (ss && !['比肩', '劫财'].includes(ss)) {
      return mkResult(ss + '格', true, `月令本气不透，取月干${monthPillar.gan}（${ss}）定格。`, '')
    }
  }

  // ---- 无格 ----
  return mkResult('无格', false, `月令${monthZhi}本气${monthBenQiGan}（${monthSs}）不透干，且无其他明显可取之神，属普通命局。`, '')
}

function mkResult(name: string, cheng: boolean, basis: string, poReason: string): GejuResult {
  const g = getGejuGuide(name)
  return {
    name,
    cheng,
    basis,
    poReason,
    oneLiner: g?.oneLiner ?? '',
    trait: g?.trait ?? '',
    advice: g?.advice ?? ''
  }
}

/** 破格检查：对已定格局检查破格因素 */
export function checkPoGe(geju: GejuResult, pillars: GejuPillar[], dayGan: string): GejuResult {
  if (!geju.cheng || geju.name === '无格') return geju
  const name = geju.name.replace('格', '')
  let po = ''

  switch (name) {
    case '正官':
      // 伤官见官
      if (touGan(pillars, dayGan, '伤官')) po = '伤官透干，伤官见官，破格。'
      // 七杀混杂
      else if (touGan(pillars, dayGan, '七杀')) po = '七杀透干，官杀混杂，破格。'
      break
    case '七杀':
      // 杀无制化
      if (!touGan(pillars, dayGan, '食神') && !touGan(pillars, dayGan, '伤官') && !touGan(pillars, dayGan, '正印') && !touGan(pillars, dayGan, '偏印')) {
        po = '七杀无制化（无食伤制、无印化），破格。'
      }
      break
    case '正财':
    case '偏财':
      // 比劫夺财
      if (touGan(pillars, dayGan, '比肩') || touGan(pillars, dayGan, '劫财')) po = '比劫透干夺财，破格。'
      break
    case '正印':
    case '偏印':
      // 财星坏印
      if (touGan(pillars, dayGan, '正财') || touGan(pillars, dayGan, '偏财')) po = '财星透干坏印，破格。'
      break
    case '食神':
      // 偏印夺食
      if (touGan(pillars, dayGan, '偏印')) po = '偏印透干夺食，破格。'
      break
    case '伤官':
      // 伤官见官
      if (touGan(pillars, dayGan, '正官')) po = '伤官见官，破格。'
      break
    case '建禄':
    case '羊刃':
      // 比劫太旺无制
      if (countGan(pillars, dayGan, '比肩') + countGan(pillars, dayGan, '劫财') >= 2 && !touGan(pillars, dayGan, '正官') && !touGan(pillars, dayGan, '七杀') && !touGan(pillars, dayGan, '食神') && !touGan(pillars, dayGan, '伤官')) {
        po = '比劫太旺无制（无官杀制、无食伤泄），破格。'
      }
      break
    default:
      break
  }

  if (po) {
    return { ...geju, cheng: false, poReason: po }
  }
  return geju
}

/** 完整流程：定格局 + 破格检查 */
export function gejuOf(pillars: GejuPillar[], dayGan: string, monthZhi: string): GejuResult {
  const geju = determineGeju(pillars, dayGan, monthZhi)
  return checkPoGe(geju, pillars, dayGan)
}