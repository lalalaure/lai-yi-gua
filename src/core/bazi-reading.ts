// ============================================================
// 八字 · 白话解读者
// 面向「不懂术语的用户」：一切落点为是什么→意味着什么→你可以怎么做
// 十神释义出《渊海子平》，五行配属出《尚书·洪范》《三命通会》
// 大运指数为确定性规则推算（非命定），仅供趋势参考
// ============================================================

import { SHENG, KE, GAN_WUXING, ZHI_WUXING, ZHI_HIDEGAN, wangXiangFor, type Wuxing } from './tables'
import { getWuxingGuide } from '@/data/wuxing-guide'
import { getShishenGuide } from '@/data/shishen-guide'
import { getPillarGuide } from '@/data/pillar-guide'
import { gejuOf, type GejuResult } from './geju'

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const YANG = [true, false, true, false, true, false, true, false, true, false]
const ALL_WX: Wuxing[] = ['木', '火', '土', '金', '水']

/** 柱的轻量描述（避免与 bazi.ts 循环依赖） */
export interface PillarLike {
  name: string
  gan: string
  zhi: string
  wuxing: string
  hiddenGans: string[]
  shiShenGan: string
  shiShenZhi: string[]
  naYin: string
}

export interface DayunLike {
  index: number
  ganZhi: string
  startAge: number
  endAge: number
}

export interface LiuNianLike {
  year: number
  age: number
  ganZhi: string
  gan: string
  shiShen: string
}

export interface WuxingCountLike {
  wuxing: string
  count: number
}

// ---------- 十神 ----------

const SS_TABLE: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      const dw = GAN_WUXING[GAN[i]]
      const tw = GAN_WUXING[GAN[j]]
      const same = YANG[i] === YANG[j]
      let s: string
      if (dw === tw) s = same ? '比肩' : '劫财'
      else if (SHENG[dw as Wuxing] === tw) s = same ? '食神' : '伤官'
      else if (SHENG[tw as Wuxing] === dw) s = same ? '偏印' : '正印'
      else if (KE[dw as Wuxing] === tw) s = same ? '偏财' : '正财'
      else s = same ? '七杀' : '正官'
      map[GAN[i] + GAN[j]] = s
    }
  }
  return map
})()

function shiShenOf(dayGan: string, target: string): string {
  return SS_TABLE[dayGan + target] ?? ''
}

/** 生我（印）之五行 */
function shengWo(dayWx: Wuxing): Wuxing {
  return ALL_WX.find((e) => SHENG[e as Wuxing] === dayWx) ?? '水'
}
/** 克我（官杀）之五行 */
function keWo(dayWx: Wuxing): Wuxing {
  return ALL_WX.find((e) => KE[e as Wuxing] === dayWx) ?? '金'
}

// ---------- 日主强弱 → 喜忌 ----------

export interface XiJi {
  strong: boolean
  xi: Wuxing[]
  ji: Wuxing[]
}

export function determineXiJi(pillars: PillarLike[], dayGan: string, dayZhi: string, monthZhi: string): XiJi {
  const dayWx = GAN_WUXING[dayGan] as Wuxing
  const zhiWx = ZHI_WUXING[dayZhi] as Wuxing
  const state = wangXiangFor(monthZhi, dayWx)

  let score = 0
  if (state === '旺') score += 3
  else if (state === '相') score += 2
  else if (state === '休') score += 1
  const dayRootStrong = zhiWx === dayWx || SHENG[zhiWx as Wuxing] === dayWx

  for (const p of pillars) {
    const gw = GAN_WUXING[p.gan] as Wuxing
    if (gw === dayWx) score += 1
    else if (SHENG[gw as Wuxing] === dayWx) score += 1 // 印生我
    else if (SHENG[dayWx] === gw) score -= 1 // 我生（食伤）
    else if (KE[dayWx] === gw) score -= 1 // 我克（财）
    else score -= 0.5 // 克我（官）
    // 支本气
    const benQi = p.hiddenGans[0]
    if (benQi) {
      const bw = GAN_WUXING[benQi] as Wuxing
      if (bw === dayWx) score += 0.5
      else if (SHENG[bw as Wuxing] === dayWx) score += 0.5
      else if (SHENG[dayWx] === bw) score -= 0.5
      else if (KE[dayWx] === bw) score -= 0.5
      else score -= 0.25
    }
  }

  const strong = score + stateWeight(state) + (dayRootStrong ? 1.5 : 0) >= 4
  const xi: Wuxing[] = strong
    ? [SHENG[dayWx] as Wuxing, KE[dayWx] as Wuxing, keWo(dayWx)] // 食伤/财/官：泄耗克
    : [shengWo(dayWx), dayWx] // 印比
  const ji: Wuxing[] = strong
    ? [shengWo(dayWx), dayWx]
    : [SHENG[dayWx] as Wuxing, KE[dayWx] as Wuxing, keWo(dayWx)]
  return { strong, xi: [...new Set(xi)], ji: [...new Set(ji)] }
}

function stateWeight(state: string): number {
  return state === '旺' ? 3 : state === '相' ? 2 : state === '休' ? 1 : 0
}

// ---------- 大运指数 + 逐运白话 ----------

export interface DayunRead {
  index: number
  ganZhi: string
  startAge: number
  endAge: number
  score: number
  tag: '高' | '中' | '低'
  text: string
  advice: string
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

/** 大运干相对日主的作用模板 */
const YUN_SHISHEN_TALK: Record<string, { tag: string; text: string; advice: string }> = {
  印: { tag: '养', text: '印运主学习、贵人、靠山：思路清楚、易得人帮，是沉淀与充电的时段。', advice: '多读书进修、亲近长辈靠山，把本领攒扎实，别怕显得慢。' },
  比劫: { tag: '群', text: '比劫运主同辈合伙、人来人往：热闹、有人气，也易人多口杂、破财分利。', advice: '适合搭伙做事、扩张人脉；钱财往来先立字据，防兄弟分润。' },
  食伤: { tag: '秀', text: '食伤运主才华外露、表达展示：点子多、锋芒现，也易操劳思虑、口舌是非。', advice: '把才华做成作品与成绩，敢于表现；话到嘴边留三分，防祸从口出。' },
  财: { tag: '实', text: '财运主进项与利益：求财有力、想落实处，也易为钱奔忙、患得患失。', advice: '适合务实经营、谈成业务；理财求稳，别被快钱牵着走。' },
  官杀: { tag: '压', text: '官杀运主职位、责任与压力：有位置、有机会，也易紧张劳累、遇阻受制。', advice: '勇于扛事、纳福晋升；压力大时定住节奏，稳扎稳打别硬碰。' }
}

function yunTalk(ganZhi: string, dayGan: string): { tag: string; text: string; advice: string } {
  const gzs = shiShenOf(dayGan, ganZhi[0])
  let key = ''
  if (['正印', '偏印'].includes(gzs)) key = '印'
  else if (['比肩', '劫财'].includes(gzs)) key = '比劫'
  else if (['食神', '伤官'].includes(gzs)) key = '食伤'
  else if (['正财', '偏财'].includes(gzs)) key = '财'
  else key = '官杀'
  return YUN_SHISHEN_TALK[key]
}

export function dayunReadings(daYun: DayunLike[], dayGan: string, xi: Wuxing[]): DayunRead[] {
  return daYun.map((d) => {
    let delta = 0
    const jiWx = ALL_WX.filter((x) => !xi.includes(x)) as Wuxing[]
    const part = (wx: string | undefined, weight: number) => {
      if (!wx) return
      if (xi.includes(wx as Wuxing)) delta += 5 * weight
      else if (jiWx.includes(wx as Wuxing)) delta -= 5 * weight
    }
    part(GAN_WUXING[d.ganZhi[0]], 3)
    part(ZHI_WUXING[d.ganZhi[1]], 2)
    part(GAN_WUXING[(ZHI_HIDEGAN[d.ganZhi[1]] ?? [])[0] ?? ''], 1)

    const score = clamp(50 + delta, 5, 95)
    const tag: DayunRead['tag'] = score >= 66 ? '高' : score <= 34 ? '低' : '中'
    const talk = yunTalk(d.ganZhi, dayGan)
    const startText = d.index === 0 ? '起运前' : `${d.startAge}岁起`
    return {
      index: d.index,
      ganZhi: d.ganZhi,
      startAge: d.startAge,
      endAge: d.endAge,
      score,
      tag,
      text: `${startText}（${d.startAge}–${d.endAge}岁）${talk.tag}运：${talk.text}`,
      advice: talk.advice
    }
  })
}

// ---------- 柱位详解 ----------

export interface PillarExplain {
  name: string
  roleText: string
  span: string
  explain: string
  ganText: string
  hides: { gan: string; shishen: string; oneLiner: string }[]
  naYin: string
  advice: string
}

export function pillarExplains(pillars: PillarLike[], dayGan: string): PillarExplain[] {
  return pillars.map((p) => {
    const role = getPillarGuide(p.name)
    const ganSs = p.name === '日柱' ? '日主' : (p.shiShenGan || shiShenOf(dayGan, p.gan))
    const ganG = getShishenGuide(ganSs)
    const hides = p.hiddenGans.map((g, i) => {
      const ss = p.shiShenZhi[i] ?? shiShenOf(dayGan, g)
      return { gan: g, shishen: ss, oneLiner: getShishenGuide(ss)?.oneLiner ?? '' }
    })
    const advice = ganG?.advice ?? (p.name === '日柱' ? '先稳住自己，再向外发力。' : '')
    return {
      name: p.name,
      roleText: role?.scope ?? p.name,
      span: role?.span ?? '',
      explain: role?.explain ?? '',
      ganText: p.name === '日柱' ? `日主＝你自己：日干${p.gan}就是你的人设底色。` : `${ganSs}：${ganG?.meaning ?? ''}`,
      hides,
      naYin: p.naYin,
      advice
    }
  })
}

// ---------- 五行罗盘：意味着什么/适合什么/避免什么 ----------

export interface WuxingBoardCard {
  role: '强' | '缺' | '宜'
  note: string
}

export interface WuxingBoard {
  strongest: string
  missing: string[]
  favor: string
  cards: Record<string, WuxingBoardCard>
}

export function wuxingBoard(wuxing: WuxingCountLike[], xi: Wuxing[]): WuxingBoard {
  const present = new Set(wuxing.filter((w) => w.count > 0).map((w) => w.wuxing))
  const missing = ALL_WX.filter((w) => !present.has(w))
  const strongest = wuxing[0]?.wuxing ?? '木'
  const favor = xi[0] ?? missing[0] ?? '木'
  const cards: Record<string, WuxingBoardCard> = {}
  for (const w of ALL_WX) {
    if (w === strongest) cards[w] = { role: '强', note: `力量最足，是你的主场与惯性。` }
    else if (missing.includes(w)) cards[w] = { role: '缺', note: `八字中缺${w}：这一块比较淡，容易不上心。` }
    else if (w === favor) cards[w] = { role: '宜', note: `对你偏喜的${w}：多亲近它，容易顺。` }
    else cards[w] = { role: '宜', note: `平平中等，按需自取。` }
  }
  return { strongest, missing, favor, cards }
}

export function wuxingAdviceText(element: string): string {
  const g = getWuxingGuide(element)
  if (!g) return ''
  return `${g.symbol}。性格上${g.trait}适合${g.suited}注意：${g.avoid}`
}

// ---------- 流年提醒（今明两年） ----------

function flowTwo(liuNian: LiuNianLike[], birthYear: number): LiuNianLike[] {
  const now = new Date().getFullYear()
  const age = Math.max(0, now - birthYear + 1)
  const from = liuNian.filter((l) => l.age >= age).sort((a, b) => a.year - b.year)
  const list = from.length >= 2 ? from.slice(0, 2) : liuNian.slice(-2)
  return list
}

// ---------- 总体解读 ----------

export interface ReadingSection {
  title: string
  text: string
  source: string
}

export function overallReadings(
  pillars: PillarLike[], wuxing: WuxingCountLike[], daYun: DayunLike[], liuNian: LiuNianLike[],
  dayGan: string, dayZhi: string, monthZhi: string, birthYear: number,
  genderLabel: string, yunAge: number, forward: boolean
): ReadingSection[] {
  const dayWx = GAN_WUXING[dayGan]
  const dayG = getWuxingGuide(dayWx)
  const jj = determineXiJi(pillars, dayGan, dayZhi, monthZhi)
  const strong = jj.strong
  const strongestW = wuxing[0]
  const present = new Set(wuxing.filter((w) => w.count > 0).map((w) => w.wuxing))
  const missing = ALL_WX.filter((w) => !present.has(w))
  const strongestG = getWuxingGuide(strongestW.wuxing)

  // 格局判断（子平法：月令为纲）
  const geju: GejuResult = gejuOf(pillars, dayGan, monthZhi)
  const gejuText = `格局为「${geju.name}」${geju.cheng ? '，成格' : '，未成格'}。${geju.basis}${geju.poReason ? `破格：${geju.poReason}` : ''}${geju.trait ? `此格局之人：${geju.trait}` : ''}`

  const s1 = `你是「${dayGan}日主」，属${dayWx}。${dayG ? dayG.trait : ''}五行以${strongestW.wuxing}为最强${strongestG ? `：${strongestG.trait}` : ''}。${strong ? '日主有力，行事多凭自己主张，敢作敢当。' : '日主偏柔，更倾向借力而行、顺势而为。'}`
  const s2 =
    missing.length === 0
      ? `五行俱全，气势均衡，做人不太偏科，各领域都能沾。`
      : `五行里缺「${missing.join('、')}」，这些方面天生比较淡：${missing.map((m) => getWuxingGuide(m)?.trait ?? m).join('；')}。知道短板，不必强补，扬长即可。`
  const sXiangzi = `${wuxing.map((w) => `${w.wuxing}(${w.count})`).join('、')}。`
  const fav = jj.xi[0] ?? missing[0] ?? '木'
  const fg = getWuxingGuide(fav)
  const s3 = fg
    ? `对你偏喜的是「${fav}」${fg ? `：${fg.suited}` : ''}。方向可留意${fg.direction}，宜${fg.color}。${fg.life}`
    : ''
  const pillarLines = pillars.map((p) => {
    const r = getPillarGuide(p.name)
    const w = getWuxingGuide(GAN_WUXING[p.gan])
    const ssText = p.name === '日柱' ? '日主' : (p.shiShenGan || shiShenOf(dayGan, p.gan))
    const g = getShishenGuide(ssText)
    return `${p.name}（${p.gan}${p.zhi}）：${r?.scope ?? ''}。${g && ssText !== '日主' ? g.meaning : ''}${w && ssText !== '日主' ? w.trait : ''}`
  }).join(' ')
  const dy = daYun.find((d) => d.index === 1)
  const s5 = `${genderLabel}约${yunAge}岁起运，${forward ? '顺行' : '逆行'}。${dy ? `首步大运${dy.ganZhi}，行${dy.startAge}–${dy.endAge}岁。` : ''}运有高低，低时守、高时进。`
  const flow = flowTwo(liuNian, birthYear)
  const s6 = flow.map((l) => `${l.year}（${l.ganZhi}，${l.age}岁）行${l.shiShen}：${getShishenGuide(l.shiShen)?.meaning ?? ''}`).join('；')

  return [
    { title: '命主画像', text: s1, source: '《渊海子平》' },
    { title: '格局成否', text: gejuText, source: '《渊海子平·论格局》《子平真诠》' },
    { title: '五行格局与天赋短板', text: `五行分布${sXiangzi}${s2}`, source: '《三命通会》' },
    { title: '方向与相处建议', text: s3, source: '《三命通会》' },
    { title: '四柱各安其位', text: pillarLines, source: '《渊海子平·十二宫》' },
    { title: '大运走势概览', text: s5, source: '《渊海子平·论大运》' },
    { title: '眼前这两年', text: s6 || '流年平稳过渡，按部就班即可。', source: '《渊海子平·论流年》' }
  ]
}