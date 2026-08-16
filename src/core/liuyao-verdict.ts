// ============================================================
// 六爻断语 · 规则引擎
// 取用神十二类出《增删卜易·用神章》；
// 旺衰月建法出《增删卜易·旺相章》；
// 动变生克出《增删卜易·动爻章》
// ============================================================

import type { YaoValue } from './liuyao-mount'
import { mountBenGua, computePalace, splitTrigrams, yaoToLine, zhiGuaValues, huGuaLines } from './liuyao-mount'
import { wangXiangFor, calcXunKong, type Wuxing } from './tables'
import { HEXAGRAMS, type HexagramData } from '@/data/hexagrams'

/** 占问类别 */
export type AskType =
  | 'cai'      // 求财
  | 'guan'     // 功名/事业
  | 'xue'      // 考学/文书
  | 'hun'      // 婚恋
  | 'guanlu'   // 官讼
  | 'chu'      // 出行
  | 'wu'       // 失物
  | 'xing'     // 行人
  | 'jia'      // 家宅
  | 'yun'      // 疾病
  | 'zi'       // 子孙/孕育
  | 'state'    // 运程/时运

export interface AskCat {
  id: AskType
  label: string
  /** 取用六亲 */
  yong: string
  /** 断语要点 */
  hints: string[]
}

export const ASK_CATEGORIES: AskCat[] = [
  { id: 'cai', label: '求财', yong: '妻财', hints: ['财爻为获利之本', '官爻生财则利市', '兄爻劫财须防分润'] },
  { id: 'guan', label: '功名事业', yong: '官鬼', hints: ['官爻为名位之象', '财爻生官则名成', '子孙克官,戒骄怠'] },
  { id: 'xue', label: '考学文书', yong: '父母', hints: ['父母为文书之象', '官爻为考官之象', '日辰相扶助笔力'] },
  { id: 'hun', label: '婚恋', yong: '妻财', hints: ['男占取财爻为女', '女占取官爻为男', '世应相生主相得'] },
  { id: 'guanlu', label: '官讼是非', yong: '官鬼', hints: ['官爻为官府之象', '世爻为我方之势', '青龙见喜,白虎见滞'] },
  { id: 'chu', label: '出行', yong: '世爻', hints: ['世爻为行人之身', '应爻为所向之处', '世爻旺相旅途安'] },
  { id: 'wu', label: '失物寻回', yong: '子孙', hints: ['子孙主吉可寻回', '官鬼为贼,防难寻', '青龙主近,玄武主远'] },
  { id: 'xing', label: '行人音讯', yong: '应爻', hints: ['应爻为远行之人', '世应相合归期近', '动爻卯时主速至'] },
  { id: 'jia', label: '家宅', yong: '父母', hints: ['父母为宅居之象', '官鬼为宅内之患', '六爻安静宅安宁'] },
  { id: 'yun', label: '安康', yong: '世爻', hints: ['世爻主己身之体', '子孙为药为医', '官鬼为病为祟'] },
  { id: 'zi', label: '子孙孕育', yong: '子孙', hints: ['子孙为后嗣之象', '卦爻旺则其福长', '官爻动须防动荡'] },
  { id: 'state', label: '运程时运', yong: '世爻', hints: ['世爻主我一身之运', '月令四季为其纲', '吉凶随卦而参详'] }
]

export function getAskCat(id: AskType): AskCat {
  return ASK_CATEGORIES.find((c) => c.id === id) ?? ASK_CATEGORIES[0]
}

/** 断语一条 */
export interface Verdict {
  /** 出处 */
  source: string
  /** 白话结论 */
  text: string
}

/** 六爻完整盘 */
export interface LiuyaoPan {
  /** 问卦 */
  question: string
  /** 占问类别 */
  ask: AskCat
  /** 六爻值 */
  values: YaoValue[]
  /** 本卦纳甲排盘 */
  benRows: ReturnType<typeof mountBenGua>
  /** 本卦名 */
  benName: string
  benData: HexagramData
  /** 变卦名 */
  zhiName: string
  zhiData?: HexagramData
  /** 互卦名 */
  huData?: HexagramData
  /** 四柱（时占） */
  timeGanzhi: { year: string; month: string; day: string; hour: string }
  /** 月建、日辰 */
  monthZhi: string
  dayGan: string
  dayZhi: string
  /** 旬空（日旬空） */
  xunkong: string
  /** 一句话结论 */
  conclusion: string
  /** 分维白话 / 出处 */
  verdicts: Verdict[]
  /** 推演步骤（透明展示） */
  steps: { title: string; desc: string; source: string }[]
}

/** 找用神爻（首现；若空则给缺断） */
function findYong(rows: ReturnType<typeof mountBenGua>, yongName: string) {
  return rows.find((r) => r.liuqin === yongName)
}

/** 柔和判定：用神状态词 */
type State = '旺' | '相' | '休' | '囚' | '死'

function vantage(rows: ReturnType<typeof mountBenGua>, idx: number, monthZhi: string): State {
  return wangXiangFor(monthZhi, rows[idx].wuxing) as State
}

/**
 * 主断卦：组装全盘 + 依规则生成断语
 */
export function divineLiuyao(
  question: string,
  askId: AskType,
  values: YaoValue[],
  timeGanzhi: { year: string; month: string; day: string; hour: string }
): LiuyaoPan {
  const ask = getAskCat(askId)
  const dayGan = timeGanzhi.day[0]
  const dayZhi = timeGanzhi.day[1]
  const monthZhi = timeGanzhi.month[1]

  const benRows = mountBenGua(values, dayGan)
  const benLines = values.map(yaoToLine)
  const { lower: benLower, upper: benUpper } = splitTrigrams(benLines)
  const benData = HEXAGRAMS[`${benLower}${benUpper}`]

  // 变卦
  const zhiVals = zhiGuaValues(values)
  const zhiLines = zhiVals.map(yaoToLine)
  const { lower: zhiLower, upper: zhiUpper } = splitTrigrams(zhiLines)
  const zhiData = HEXAGRAMS[`${zhiLower}${zhiUpper}`]

  // 互卦
  const huLines = huGuaLines(benLines)
  const { lower: huLower, upper: huUpper } = splitTrigrams(huLines)
  const huData = HEXAGRAMS[`${huLower}${huUpper}`]

  const xunkong = calcXunKong(timeGanzhi.day)
  const palace = computePalace(benLines)

  const steps: LiuyaoPan['steps'] = [
    {
      title: '起卦',
      desc: `以三枚铜钱摇六次，得六爻：${values.join(' ')}（6老阴·7少阳·8少阴·9老阳）`,
      source: '《增删卜易·铜钱课》'
    },
    {
      title: '成卦',
      desc: `下卦${benLower}，上卦${benUpper}，得《${benData.name}》。`,
      source: '《周易》六画卦'
    },
    {
      title: '定宫位世应',
      desc: `归属${palace.palace}宫（五行${palace.palaceWuxing}），${palace.level}，世在${palace.shi}爻，应在${palace.ying}爻。`,
      source: '《京房八宫卦次图》'
    },
    {
      title: '纳甲配六亲',
      desc: `以宫五行为我，配六亲；本卦${benData.name}。`,
      source: '《火珠林》纳甲装卦'
    },
    {
      title: '配六神',
      desc: `以日干${dayGan}起六神（${benRows[0].liushen}起于初爻）。`,
      source: '《增删卜易·六神章》'
    },
    {
      title: '查旬空',
      desc: `以日干支${timeGanzhi.day}查旬空：${xunkong}。`,
      source: '《增删卜易·旬空章》'
    }
  ]

  const verdicts: Verdict[] = []

  // ---- 取用神（十二类） ----
  const shiRow = benRows[palace.shi - 1]
  const yingRow = benRows[palace.ying - 1]

  // 六亲用神
  let useRow = shiRow
  if (ask.yong !== '世爻') {
    const found = findYong(benRows, ask.yong)
    useRow = found ?? shiRow
    if (found) {
      verdicts.push({
        source: '《增删卜易·用神章》',
        text: `问「${ask.label}」，以「${ask.yong}」为用神，落在${found.position}爻（${found.ganzhi}·${found.liushen}）。`
      })
    } else {
      verdicts.push({
        source: '《增删卜易·用神章》',
        text: `卦中不见「${ask.yong}」爻，此乃用神伏藏，事机尚未显露，需待时而出。`
      })
    }
  } else {
    verdicts.push({
      source: '《增删卜易·用神章》',
      text: `问「${ask.label}」，以世爻为己身用神，落在${shiRow.position}爻（${shiRow.ganzhi}·${shiRow.liushen}）。`
    })
  }

  // ---- 旺衰：月建 ----
  const useState = vantage(benRows, useRow.position - 1, monthZhi)
  const shiState = vantage(benRows, shiRow.position - 1, monthZhi)

  verdicts.push({
    source: '《增删卜易·旺相章》',
    text: `用神${useRow.ganzhi}属${useRow.wuxing}，现值${monthZhi}月，处于「${useState}」；
世爻${shiRow.ganzhi}属${shiRow.wuxing}，处于「${shiState}」。${useState === '旺' || useState === '相' ? '用神得力，事有可成之基。' : '用神偏弱，当蓄力以待，不宜强求。'}`
  })

  // ---- 动爻 ----
  const movers = benRows.filter((r) => r.moving)
  if (movers.length === 0) {
    verdicts.push({
      source: '《增删卜易·静卦章》',
      text: '六爻皆静，主事态平稳，当下按部就班、顺其自然即可。'
    })
  } else {
    const mv = movers.map((r) => `${r.position}爻${r.ganzhi}`).join('、')
    verdicts.push({
      source: '《增删卜易·动爻章》',
      text: `动爻为${mv}，事有变动之机，宜顺势而应，不可胶柱鼓瑟。`
    })
  }

  // ---- 旬空 ----
  if (xunkong) {
    const kongHit = benRows.filter((r) => xunkong.includes(r.zhi))
    if (kongHit.length > 0) {
      verdicts.push({
        source: '《增删卜易·旬空章》',
        text: `旬空${xunkong}，${kongHit.map((r) => `${r.position}爻${r.zhi}`).join('、')}临空。主虚有之象、事缓难速；待填空出空之期，自有应验。`
      })
    }
  }

  // ---- 变卦信息 ----
  verdicts.push({
    source: '《周易·杂卦传》',
    text: `本卦《${benData.name}》${benData.guaci}；有动则化《${zhiData.name}》${zhiData.guaci}。${movers.length === 0 ? '无动爻，不复卦变。' : '动而有归，观之卦以测终局。'}`
  })

  // ---- 世应生克（关系双方） ----
  const shiWx: Wuxing = shiRow.wuxing
  const yingWx: Wuxing = yingRow.wuxing
  const wxs = ['木', '火', '土', '金', '水']
  const sheng = (a: Wuxing, b: Wuxing) => (wxs.indexOf(a) + 1) % 5 === wxs.indexOf(b)
  const ke = (a: Wuxing, b: Wuxing) => (wxs.indexOf(a) + 2) % 5 === wxs.indexOf(b)
  if (shiWx === yingWx) {
    verdicts.push({ source: '《增删卜易·世应章》', text: '世应比和，主我彼同心，事多相合。' })
  } else if (sheng(shiWx, yingWx)) {
    verdicts.push({ source: '《增删卜易·世应章》', text: '世生应，我方待人以诚，诸事当主动付出、先忧后乐。' })
  } else if (sheng(yingWx, shiWx)) {
    verdicts.push({ source: '《增删卜易·世应章》', text: '应生世，外来相助，事有贵人扶持之象。' })
  } else if (ke(shiWx, yingWx)) {
    verdicts.push({ source: '《增删卜易·世应章》', text: '世克应，我方能主导局面，却须防用力过猛反伤和气。' })
  } else {
    verdicts.push({ source: '《增删卜易·世应章》', text: '应克世，外来有制，事存掣肘，宜谦逊周全。' })
  }

  // ---- 一句话结论（综合） ----
  let conclusion: string
  const movingOracle = movers.length > 0 ? zhiData.name : benData.name
  if (useState === '旺' || useState === '相') {
    if (ke(yingWx, shiWx) && yingRow.position === useRow.position) {
      conclusion = `${ask.label}一事，虽有旺象，然应位制我，宜稳中求进，忌操之过急。`
    } else {
      conclusion = `${ask.label}之事，用神旺相、根基尚稳，宜顺势而为，渐入佳境；终局之验，可参《${movingOracle}》一卦。`
    }
  } else if (useState === '休' || useState === '囚') {
    conclusion = `${ask.label}之事，时运未至、根基偏弱，当下宜守不宜攻；养势蓄力，静待「填空逢生」之期。`
  } else {
    conclusion = `${ask.label}之事，用神受制，阻力为多。此非凶语，乃劝君缓行；待月令更替、转机自来。`
  }

  return {
    question,
    ask,
    values,
    benRows,
    benName: benData.name,
    benData,
    zhiName: zhiData.name,
    zhiData,
    huData,
    timeGanzhi,
    monthZhi,
    dayGan,
    dayZhi,
    xunkong,
    conclusion,
    verdicts,
    steps
  }
}