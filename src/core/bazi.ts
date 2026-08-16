// ============================================================
// 八字排盘 · 引擎
// 历法与四柱由 lunar-javascript 精确计算（立春换年、节令换月）
// 神煞：驿马/桃花/禄神/羊刃/天乙 出《三命通会》《渊海子平》
// ============================================================

import { Solar } from 'lunar-javascript'
import {
  dayunReadings,
  pillarExplains,
  wuxingBoard,
  overallReadings,
  determineXiJi,
  type DayunRead,
  type PillarExplain,
  type WuxingBoard,
  type ReadingSection
} from './bazi-reading'
import { gejuOf, type GejuResult } from './geju'

export interface Gender {
  sex: 1 | 0 // 1男 0女
  label: string
}

/** 四柱一柱 */
export interface Pillar {
  name: string
  gan: string
  zhi: string
  ganZhi: string
  wuxing: string
  hiddenGans: string[]
  shiShenGan: string
  shiShenZhi: string[]
  naYin: string
}

/** 五行统计 */
export interface WuxingCount {
  wuxing: string
  count: number
}

export interface DaYun {
  index: number
  ganZhi: string
  startYear: number
  endYear: number
  startAge: number
  endAge: number
  label: string
}

export interface LiuNian {
  year: number
  age: number
  ganZhi: string
  gan: string
  zhi: string
  wuxing: string
  shiShen: string
}

export interface BaziPan {
  solar: string
  lunar: string
  gender: Gender
  pillars: Pillar[]
  dayGan: string
  dayZhi: string
  wuxing: WuxingCount[]
  seasonStem: string
  yun: { startAge: string; startYmd: string; forward: boolean; label: string }
  daYun: DaYun[]
  liuNian: LiuNian[]
  shenSha: string[]
  /** 逐运指数与白话（折线图及逐运卡片） */
  dayunRead: DayunRead[]
  /** 四柱展开详解 */
  pillarExplains: PillarExplain[]
  /** 五行白话罗盘 */
  wuxingBoard: WuxingBoard
  /** 五行力量强弱（供界面高亮） */
  xiJi: { strong: boolean; xi: string[]; ji: string[] }
  /** 格局判断（子平法） */
  geju: GejuResult
  conclusion: string
  readings: ReadingSection[]
}

// ---------- 五行 & 十神 ----------

const G_WX: Record<string, string> = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' }
const Z_WX: Record<string, string> = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' }
const SHENG: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
const KE: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const YANG = [true, false, true, false, true, false, true, false, true, false]

/** 十神表：以日主(行)对目标干(列) */
const SS_TABLE: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      const dW = G_WX[GAN[i]]
      const tW = G_WX[GAN[j]]
      const same = YANG[i] === YANG[j]
      let s: string
      if (dW === tW) s = same ? '比肩' : '劫财'
      else if (SHENG[dW] === tW) s = same ? '食神' : '伤官'
      else if (SHENG[tW] === dW) s = same ? '偏印' : '正印'
      else if (KE[dW] === tW) s = same ? '偏财' : '正财'
      else s = same ? '七杀' : '正官'
      map[GAN[i] + GAN[j]] = s
    }
  }
  return map
})()

function shiShenOf(dayGan: string, targetGan: string): string {
  return SS_TABLE[dayGan + targetGan] ?? ''
}

// ---------- 主流程 ----------

interface RawBazi {
  pillars: Pillar[]
  dayGan: string
  dayZhi: string
  monthZhi: string
  daYun: DaYun[]
  liuNian: LiuNian[]
  yunAge: number
  yunStartYmd: string
  forward: boolean
  shenSha: string[]
}

function mkPillar(
  name: string, gan: string, zhi: string,
  shiShenGan: string, shiShenZhi: string[], naYin: string, hiddenGans: string[]
): Pillar {
  return { name, gan, zhi, ganZhi: gan + zhi, wuxing: G_WX[gan], hiddenGans, shiShenGan, shiShenZhi, naYin }
}

function collectRaw(gender: { sex: 1 | 0 }, input: { year: number; month: number; day: number; hour: number }): RawBazi {
  const s = Solar.fromYmdHms(input.year, input.month, input.day, input.hour, 0, 0)
  const lunar = s.getLunar()
  const ec = lunar.getEightChar()
  ec.setSect(2)
  const dayGan = ec.getDayGan()

  const pillars: Pillar[] = [
    mkPillar('年柱', ec.getYearGan(), ec.getYearZhi(), ec.getYearShiShenGan(), ec.getYearShiShenZhi(), ec.getYearNaYin(), ec.getYearHideGan()),
    mkPillar('月柱', ec.getMonthGan(), ec.getMonthZhi(), ec.getMonthShiShenGan(), ec.getMonthShiShenZhi(), ec.getMonthNaYin(), ec.getMonthHideGan()),
    mkPillar('日柱', ec.getDayGan(), ec.getDayZhi(), '日主', ec.getDayShiShenZhi(), ec.getDayNaYin(), ec.getDayHideGan()),
    mkPillar('时柱', ec.getTimeGan(), ec.getTimeZhi(), ec.getTimeShiShenGan(), ec.getTimeShiShenZhi(), ec.getTimeNaYin(), ec.getTimeHideGan())
  ]

  const yun = ec.getYun(gender.sex, 2)
  const daYun: DaYun[] = []
  for (const d of yun.getDaYun(9)) {
    daYun.push({
      index: d.getIndex(),
      ganZhi: d.getGanZhi(),
      startYear: d.getStartYear(),
      endYear: d.getEndYear(),
      startAge: d.getStartAge(),
      endAge: d.getEndAge(),
      label: d.getIndex() === 0 ? '起运前' : `${d.getStartAge()}岁起 · ${d.getStartYear()}-${d.getEndYear()}`
    })
  }

  const liuNian: LiuNian[] = []
  const firstYun = daYun.find((d) => d.index === 1)
  if (firstYun) {
    for (let i = 0; i < 10; i++) {
      const yy = firstYun.startYear + i
      const gz = Solar.fromYmd(yy, Math.max(1, Math.min(12, input.month)), 1).getLunar().getYearInGanZhiExact()
      liuNian.push({
        year: yy,
        age: yy - input.year + 1,
        ganZhi: gz,
        gan: gz[0],
        zhi: gz[1],
        wuxing: G_WX[gz[0]],
        shiShen: shiShenOf(dayGan, gz[0])
      })
    }
  }

  const startSolar = yun.getStartSolar()
  const yunAge = Math.round((yun.getStartYear() * 12 + yun.getStartMonth()) / 12)

  return {
    pillars,
    dayGan,
    dayZhi: ec.getDayZhi(),
    monthZhi: ec.getMonthZhi(),
    daYun,
    liuNian,
    yunAge: Math.max(1, yunAge),
    yunStartYmd: `${startSolar.getYear()}-${startSolar.getMonth()}-${startSolar.getDay()}`,
    forward: yun.isForward(),
    shenSha: calcShenSha(pillars, dayGan)
  }
}

/** 神煞（出《三命通会·神煞》） */
function calcShenSha(pillars: Pillar[], dayGan: string): string[] {
  const out: string[] = []
  const zhiz = pillars.map((p) => p.zhi)
  const set = new Set(zhiz)

  // 驿马：三合局之冲
  const yima: Record<string, string> = { 寅: '申', 午: '申', 戌: '申', 申: '寅', 子: '寅', 辰: '寅', 巳: '亥', 酉: '亥', 丑: '亥', 亥: '巳', 卯: '巳', 未: '巳' }
  if (set.has(yima[zhiz[1]])) out.push('驿马')

  // 桃花
  const tao: Record<string, string> = { 寅: '卯', 午: '卯', 戌: '卯', 申: '酉', 子: '酉', 辰: '酉', 巳: '午', 酉: '午', 丑: '午', 亥: '子', 卯: '子', 未: '子' }
  if (set.has(tao[zhiz[1]])) out.push('桃花')

  // 禄神
  const lu: Record<string, string> = { 甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' }
  if (set.has(lu[dayGan])) out.push('禄神')

  // 羊刃（阳干）
  const yangRen: Record<string, string> = { 甲: '卯', 丙: '午', 戊: '午', 庚: '酉', 壬: '子' }
  if (set.has(yangRen[dayGan])) out.push('羊刃')

  // 天乙贵人
  const tianyi: Record<string, string[]> = {
    甲: ['丑', '未'], 戊: ['丑', '未'], 庚: ['丑', '未'],
    乙: ['子', '申'], 己: ['子', '申'],
    丙: ['亥', '酉'], 丁: ['亥', '酉'],
    辛: ['午', '寅'],
    壬: ['卯', '巳'], 癸: ['卯', '巳']
  }
  if (zhiz.some((z) => tianyi[dayGan]?.includes(z))) out.push('天乙贵人')

  return [...new Set(out)]
}

/** 五行力量（干各算一，支藏本气各算一） */
function countWuxing(pillars: Pillar[]): WuxingCount[] {
  const m: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
  for (const p of pillars) {
    m[G_WX[p.gan]]++
    m[Z_WX[p.zhi]]++
  }
  return Object.entries(m)
    .map(([w, count]) => ({ wuxing: w, count }))
    .sort((a, b) => b.count - a.count)
}

function buildConclusion(wuxing: WuxingCount[], raw: RawBazi): string {
  const strongest = wuxing[0]
  const missing = ['木', '火', '土', '金', '水'].filter((w) => !wuxing.some((x) => x.wuxing === w && x.count > 0))
  return `命属${raw.dayGan}日主（${G_WX[raw.dayGan]}），以${strongest.wuxing}五行为最旺。${missing.length ? `五行缺${missing.join('')}。` : '五行俱全。'}吉凶不在五行多寡，而在调候、运程与人事经营；此为一生大盘，非一时之断。`
}

export function paiPan(input: { year: number; month: number; day: number; hour: number }, sex: 1 | 0): BaziPan {
  const gender: Gender = { sex, label: sex === 1 ? '乾造' : '坤造' }
  const raw = collectRaw(gender, input)
  const wuxing = countWuxing(raw.pillars)
  const s = Solar.fromYmdHms(input.year, input.month, input.day, input.hour, 0, 0)
  const l = s.getLunar()

  const xiJi = determineXiJi(raw.pillars, raw.dayGan, raw.dayZhi, raw.monthZhi)
  const geju = gejuOf(raw.pillars, raw.dayGan, raw.monthZhi)

  return {
    solar: s.toYmdHms(),
    lunar: `${l.getYearInChinese()}年${l.getMonthInChinese()}月${l.getDayInChinese()}`,
    gender,
    pillars: raw.pillars,
    dayGan: raw.dayGan,
    dayZhi: raw.dayZhi,
    wuxing,
    seasonStem: raw.monthZhi,
    yun: {
      startAge: `约${raw.yunAge}岁`,
      startYmd: `${raw.yunStartYmd}起运`,
      forward: raw.forward,
      label: raw.forward ? '顺行' : '逆行'
    },
    daYun: raw.daYun,
    liuNian: raw.liuNian,
    shenSha: raw.shenSha,
    dayunRead: dayunReadings(raw.daYun, raw.dayGan, xiJi.xi),
    pillarExplains: pillarExplains(raw.pillars, raw.dayGan),
    wuxingBoard: wuxingBoard(wuxing, xiJi.xi),
    xiJi,
    geju,
    conclusion: buildConclusion(wuxing, raw),
    readings: overallReadings(
      raw.pillars,
      wuxing,
      raw.daYun,
      raw.dayGan,
      raw.dayZhi,
      raw.monthZhi,
      gender.label,
      raw.yunAge,
      raw.forward
    )
  }
}