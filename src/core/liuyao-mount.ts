// ============================================================
// 六爻装卦 · 京房八宫法
// 出处：《京房易传》六十四卦八宫次序；《增删卜易》装卦篇
// ============================================================

import {
  NAJIA, TRIGRAM_WUXING, liuQinFor, liuShenStart, ZHI_WUXING,
  type TrigramKey, type Wuxing
} from './tables'

/** 爻值：6 老阴(动) 7 少阳 8 少阴 9 老阳(动) */
export type YaoValue = 6 | 7 | 8 | 9

/** 八卦阳阴序（用于八宫法） */
const TRIGRAM_BITS: Record<TrigramKey, number[]> = {
  乾: [1, 1, 1], 兑: [1, 1, 0], 离: [1, 0, 1], 震: [1, 0, 0],
  巽: [0, 1, 1], 坎: [0, 1, 0], 艮: [0, 0, 1], 坤: [0, 0, 0]
}

/** 由三爻(底→顶)得三爻卦名 */
export function triName(bits: [number, number, number]): TrigramKey {
  const keys = Object.keys(TRIGRAM_BITS) as TrigramKey[]
  for (const k of keys) {
    const b = TRIGRAM_BITS[k]
    if (b[0] === bits[0] && b[1] === bits[1] && b[2] === bits[2]) return k
  }
  throw new Error('invalid trigram bits')
}

/** 六爻(1=阳,0=阴，底→顶)分解为下卦、上卦 */
export function splitTrigrams(lines: number[]): { lower: TrigramKey; upper: TrigramKey } {
  return {
    lower: triName([lines[0], lines[1], lines[2]]),
    upper: triName([lines[3], lines[4], lines[5]])
  }
}

/** 宫位信息 */
export interface PalaceInfo {
  /** 所属宫卦名 */
  palace: TrigramKey
  /** 宫五行 */
  palaceWuxing: Wuxing
  /** 宫内等级：本宫/一世…五世/游魂/归魂 */
  level: string
  /** 世爻位(1-6) */
  shi: number
  /** 应爻位(1-6) */
  ying: number
}

/**
 * 按京房八宫法求宫位与世应
 * 起法与宫序见《京房八宫卦次图》
 */
export function computePalace(lines: number[]): PalaceInfo {
  const palaces: TrigramKey[] = ['乾', '坎', '艮', '震', '巽', '离', '坤', '兑']
  for (const palace of palaces) {
    const [p0, p1, p2] = TRIGRAM_BITS[palace]
    // 京房八宫次序：自本宫纯卦逐爻翻转（初爻始）
    // 游魂：内卦三爻全变，外卦仅四爻变（五爻恢复本宫）
    // 归魂：内卦恢复本宫，四爻仍变
    const variants: number[][] = [
      [p0, p1, p2, p0, p1, p2],
      [1 - p0, p1, p2, p0, p1, p2],
      [1 - p0, 1 - p1, p2, p0, p1, p2],
      [1 - p0, 1 - p1, 1 - p2, p0, p1, p2],
      [1 - p0, 1 - p1, 1 - p2, 1 - p0, p1, p2],
      [1 - p0, 1 - p1, 1 - p2, 1 - p0, 1 - p1, p2],
      [1 - p0, 1 - p1, 1 - p2, p0, 1 - p1, p2],
      [p0, p1, p2, p0, 1 - p1, p2]
    ]
    const levels = ['本宫', '一世', '二世', '三世', '四世', '五世', '游魂', '归魂']
    const shiPos = [6, 1, 2, 3, 4, 5, 4, 3]
    const yingPos = [3, 4, 5, 6, 1, 2, 1, 6]
    for (let v = 0; v < variants.length; v++) {
      if (variants[v].every((b, i) => b === lines[i])) {
        return {
          palace,
          palaceWuxing: TRIGRAM_WUXING[palace],
          level: levels[v],
          shi: shiPos[v],
          ying: yingPos[v]
        }
      }
    }
  }
  throw new Error('invalid hexagram lines')
}

/** 爻的完整装卦信息 */
export interface YaoRow {
  /** 爻位 1-6（初→上） */
  position: number
  /** 阴阳（爻值奇偶：7/9 阳，6/8 阴） */
  yin: boolean
  /** 动爻标记 */
  moving: boolean
  /** 纳甲干支 */
  ganzhi: string
  /** 天干 */
  gan: string
  /** 地支 */
  zhi: string
  /** 爻五行（以地支定） */
  wuxing: Wuxing
  /** 六亲（以宫五行为我） */
  liuqin: string
  /** 六神 */
  liushen: string
  /** 世/应 */
  shiying: '世' | '应' | ''
}

/**
 * 六爻装卦（本卦）：
 * 1. 分上下卦
 * 2. 查纳甲表配干支
 * 3. 以宫五行为我定六亲
 * 4. 按日干起例排六神（初爻起）
 * 5. 标世应
 */
export function mountBenGua(values: YaoValue[], dayGan: string): YaoRow[] {
  const lines = values.map(yaoToLine)
  const { lower, upper } = splitTrigrams(lines)
  const palace = computePalace(lines)

  const rows: YaoRow[] = []
  for (let i = 0; i < 6; i++) {
    const trig = i < 3 ? lower : upper
    const najia = NAJIA[trig]
    const list = i < 3 ? najia.inner : najia.outer
    const ganzhi = list[i % 3]
    const zhi = ganzhi[1]
    const yaoWuxing = ZHI_WUXING[zhi]
    rows.push({
      position: i + 1,
      yin: values[i] === 6 || values[i] === 8,
      moving: values[i] === 6 || values[i] === 9,
      ganzhi,
      gan: ganzhi[0],
      zhi,
      wuxing: yaoWuxing,
      liuqin: liuQinFor(palace.palaceWuxing, yaoWuxing),
      liushen: '',
      shiying: ''
    })
  }
  const start = liuShenStart(dayGan)
  const names = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'] as const
  for (let i = 0; i < 6; i++) {
    rows[i].liushen = names[(start + i) % 6]
    if (palace.shi === i + 1) rows[i].shiying = '世'
    if (palace.ying === i + 1) rows[i].shiying = '应'
  }
  return rows
}

/** 爻值 → 阴阳线 */
export function yaoToLine(v: YaoValue): number {
  return v === 7 || v === 9 ? 1 : 0
}

/**
 * 推导变卦爻值：动爻（6/9）阴阳互换为 7/8
 * 变卦六亲仍以本卦宫五行为准（《增删卜易》占变卦法）
 */
export function zhiGuaValues(primary: YaoValue[]): YaoValue[] {
  return primary.map((v) => {
    if (v === 6) return 8
    if (v === 9) return 7
    return v
  })
}

/**
 * 求互卦：取下卦(2,3,4爻)与上卦(3,4,5爻)
 * 《易》互体法：二三四爻为下互，三四五爻为上互
 */
export function huGuaLines(lines: number[]): number[] {
  return [lines[1], lines[2], lines[3], lines[2], lines[3], lines[4]]
}