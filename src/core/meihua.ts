// ============================================================
// 梅花易数 · 引擎
// 起卦法出《梅花易数·观梅占》邵雍：
//  上卦 = 年月日数之和 ÷ 8 之余（余0取8）
//  下卦 = 加入时辰数之和 ÷ 8 之余
//  动爻 = 总数 ÷ 6 之余（余0取6）
// ============================================================

import type { TrigramKey } from './tables'
import { TRIGRAM_WUXING, TRIGRAM_XIANG, isSheng, isKe, type Wuxing } from './tables'
import { splitTrigrams, yaoToLine, huGuaLines, type YaoValue } from './liuyao-mount'
import { HEXAGRAMS, type HexagramData } from '@/data/hexagrams'

/** 先天八卦序数：乾一兑二离三震四巽五坎六艮七坤八（出《梅花易数》） */
export const XIAN_TIAN: Record<TrigramKey, number> = {
  乾: 1, 兑: 2, 离: 3, 震: 4, 巽: 5, 坎: 6, 艮: 7, 坤: 8
}

const NUM_TO_TRI: Record<number, TrigramKey> = { 1: '乾', 2: '兑', 3: '离', 4: '震', 5: '巽', 6: '坎', 7: '艮', 8: '坤' }

/** 梅花盘 */
export interface MeihuaPan {
  question: string
  /** 起卦法说明 */
  method: string
  /** 上卦下卦动爻 */
  upper: TrigramKey
  lower: TrigramKey
  movingLine: number
  /** 本卦 */
  benData: HexagramData
  /** 互卦 */
  huData?: HexagramData
  /** 变卦 */
  bianData?: HexagramData
  /** 体卦 / 用卦 */
  ti: TrigramKey
  yong: TrigramKey
  /** 体用关系 */
  tiYongRelation: string
  /** 一句话结论 */
  conclusion: string
  /** 分维白话 */
  verdicts: { title: string; text: string; source: string }[]
  /** 推演步骤 */
  steps: { title: string; desc: string; source: string }[]
}

/** 余数算法：÷8 余 0 即 8 */
function mod8(n: number): number {
  const r = n % 8
  return r === 0 ? 8 : r
}

function mod6(n: number): number {
  const r = n % 6
  return r === 0 ? 6 : r
}

/** 由两个三爻卦 + 动爻位成六爻值数组 */
function buildValues(lower: TrigramKey, upper: TrigramKey, movingPos: number): YaoValue[] {
  const triBits: Record<TrigramKey, number[]> = {
    乾: [1, 1, 1], 兑: [1, 1, 0], 离: [1, 0, 1], 震: [1, 0, 0],
    巽: [0, 1, 1], 坎: [0, 1, 0], 艮: [0, 0, 1], 坤: [0, 0, 0]
  }
  const l = triBits[lower]
  const u = triBits[upper]
  const lines = [...l, ...u]
  return (lines.map((b, i) => {
    const pos = i + 1
    if (pos === movingPos) {
      // 动爻：阳变老阴6，阴变老阳9
      return (b === 1 ? 9 : 6) as YaoValue
    }
    return (b === 1 ? 7 : 8) as YaoValue
  }) as YaoValue[])
}

function concatPan(
  question: string, method: string,
  upper: TrigramKey, lower: TrigramKey, movingLine: number
): MeihuaPan {
  const values = buildValues(lower, upper, movingLine)
  const lines = values.map(yaoToLine)
  const benData = HEXAGRAMS[`${lower}${upper}`]

  const huLines = huGuaLines(lines)
  const hl = splitTrigrams(huLines)
  const huData = HEXAGRAMS[`${hl.lower}${hl.upper}`]

  const { lower: tLower, upper: tUpper } = (() => {
    const bianLines = [...lines]
    bianLines[movingLine - 1] = lines[movingLine - 1] === 1 ? 0 : 1
    return splitTrigrams(bianLines)
  })()
  const bianData = HEXAGRAMS[`${tLower}${tUpper}`]

  // 体用：动爻在上卦则用卦为下卦（体）；动爻在下卦则体为下卦。体即不动之卦，用即动之卦
  const yongTrigram = movingLine <= 3 ? lower : upper
  const tiTrigram = movingLine <= 3 ? upper : lower

  const twx: Wuxing = TRIGRAM_WUXING[tiTrigram]
  const ywx: Wuxing = TRIGRAM_WUXING[yongTrigram]

  let relation = ''
  if (twx === ywx) relation = '体用比和'
  else if (isSheng(twx, ywx)) relation = '体生用'
  else if (isSheng(ywx, twx)) relation = '用生体'
  else if (isKe(twx, ywx)) relation = '体克用'
  else relation = '用克体'

  // ---- 断语 ----
  const verdicts: MeihuaPan['verdicts'] = []
  const sense = { title: '体用生克', text: '', source: '《梅花易数·体用篇》' }
  switch (relation) {
    case '用生体':
      sense.text = `用卦${yongTrigram}（${TRIGRAM_XIANG[yongTrigram]}）生体卦${tiTrigram}（${TRIGRAM_XIANG[tiTrigram]}），外力来助、施恩于我，谋事多得扶持，是为上吉之象。`
      verdicts.push(sense)
      break
    case '体克用':
      sense.text = `我（体卦${tiTrigram}）克制事（用卦${yongTrigram}），主自主可控、可化被动为主动；但克中带耗，须防劳心费力、得失参半。`
      verdicts.push(sense)
      break
    case '体生用':
      sense.text = `我（体卦${tiTrigram}）生事（用卦${yongTrigram}），为付出之局——我舍己成全，事虽可成，须防出力不讨好，宜先谈条件再全力。`
      verdicts.push(sense)
      break
    case '用克体':
      sense.text = `事（用卦${yongTrigram}）来克我（体卦${tiTrigram}），外部阻力方大、力不从心；此象宜退守观察、择机再动，忌硬碰硬。`
      verdicts.push(sense)
      break
    default:
      sense.text = `体用同气相生，比和之象，主内外如一、谋事顺遂，忌临门犹豫反生枝节。`
      verdicts.push(sense)
  }

  // 卦德
  verdicts.push({
    title: '卦象卦义',
    text: `本卦《${benData.name}》——${benData.plain}`,
    source: '《周易》卦辞'
  })
  if (movingLine) {
    const yaoCi = benData.yaoci[movingLine - 1]
    verdicts.push({
      title: '动爻爻辞',
      text: `第${movingLine}爻动，爻辞「${yaoCi}」。动而为变，观变卦《${bianData.name}》以推其终。`,
      source: '《周易》爻辞'
    })
  }
  verdicts.push({
    title: '变卦取意',
    text: `变卦《${bianData.name}》——${bianData.plain}`,
    source: '《周易》卦辞'
  })

  // 互卦
  if (huData) {
    verdicts.push({
      title: '互卦承势',
      text: `互卦《${huData.name}》为过程之象：${huData.plain}`,
      source: '《易》互体法'
    })
  }

  let conclusion: string
  if (relation === '用生体' || relation === '体用比和') {
    conclusion = `此刻之势，得《${benData.name}》，体用相${relation === '体用比和' ? '和' : '生'}，天时人和俱在，宜放手而行。`
  } else if (relation === '体克用') {
    conclusion = `此占本卦《${benData.name}》，我克其事，可为而须费周章；稳步推进，忌贪快。`
  } else if (relation === '体生用') {
    conclusion = `此占本卦《${benData.name}》，我为事耗，其成在付出；先掂量值当，再定行止。`
  } else {
    conclusion = `此占本卦《${benData.name}》，事克于我，外阻已现；宜守其身，静待其变。`
  }

  return { question, method, upper, lower, movingLine, benData, huData, bianData, ti: tiTrigram, yong: yongTrigram, tiYongRelation: relation, conclusion, verdicts, steps: [] }
}

/** 时间起卦（子=1…亥=12，以农历年月日时） */
export function meihuaByTime(question: string, nums: [number, number, number, number]): MeihuaPan {
  const [yearZhi, month, day, hourZhi] = nums
  const upper = mod8(yearZhi + month + day)
  const lower = mod8(yearZhi + month + day + hourZhi)
  const moving = mod6(yearZhi + month + day + hourZhi)
  const base = concatPan(question, `时间起卦：年支序${yearZhi}＋月${month}＋日${day}为上卦，加时支序${hourZhi}为下卦。`, NUM_TO_TRI[upper], NUM_TO_TRI[lower], moving)
  base.steps = [
    { title: '取数', desc: `年支数 ${yearZhi} ＋ 月 ${month} ＋ 日 ${day} ＝ ${yearZhi + month + day}`, source: '《梅花易数》' },
    { title: '定上卦', desc: `和数 ${yearZhi + month + day} ÷ 8 余 ${mod8(yearZhi + month + day) % 8 === 0 ? '0即8' : mod8(yearZhi + month + day)}，得${NUM_TO_TRI[upper]}。`, source: '《梅花易数》' },
    { title: '定下卦', desc: `加时支数 ${hourZhi} 得 ${yearZhi + month + day + hourZhi} ÷ 8 余 ${NUM_TO_TRI[lower]}。`, source: '《梅花易数》' },
    { title: '定动爻', desc: `总数 ${yearZhi + month + day + hourZhi} ÷ 6 余 ${mod6(yearZhi + month + day + hourZhi)}，动爻位 ${moving} 爻。`, source: '《梅花易数》' }
  ]
  return base
}

/** 报数起卦：三数/两数皆可（《梅花易数·字数占》） */
export function meihuaByNumber(question: string, num1: number, num2: number, num3?: number): MeihuaPan {
  const upper = mod8(num1)
  const lower = mod8(num2)
  const moving = num3 === undefined ? mod6(num1 + num2) : mod6(num3)
  const base = concatPan(question, `报数起卦：${num1}取上卦，${num2}取下卦${num3 !== undefined ? `，${num3}定动爻` : '，两数之和定动爻'}。`, NUM_TO_TRI[upper], NUM_TO_TRI[lower], moving)
  base.steps = [
    { title: '取数', desc: `第一数 ${num1}，第二数 ${num2}${num3 !== undefined ? `，第三数 ${num3}` : ''}`, source: '《梅花易数》' },
    { title: '定上卦', desc: `${num1} ÷ 8 余 ${mod8(num1)}，得上卦${NUM_TO_TRI[upper]}。`, source: '《梅花易数》' },
    { title: '定下卦', desc: `${num2} ÷ 8 余 ${mod8(num2)}，得下卦${NUM_TO_TRI[lower]}。`, source: '《梅花易数》' },
    { title: '定动爻', desc: `总数 ${num3 === undefined ? num1 + num2 : num3} ÷ 6 余 ${moving}，动爻位第 ${moving} 爻。`, source: '《梅花易数》' }
  ]
  return base
}