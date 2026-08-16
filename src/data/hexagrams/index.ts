// ============================================================
// 六十四卦 · 卦辞爻辞 数据组装
// 出处：《周易》经文（公有领域）· 白话简解系本馆整理编撰
// 六十四卦按《序卦传》通行本次序，拆分为四个分片文件
// ============================================================

import type { TrigramKey } from '@/core/tables'
import { chunk1 } from './hexagrams-1'
import { chunk2 } from './hexagrams-2'
import { chunk3 } from './hexagrams-3'
import { chunk4 } from './hexagrams-4'

/** 卦数据条目（紧凑元组形式） */
export type HexagramTuple = [
  order: number,
  name: string,
  upper: TrigramKey,
  lower: TrigramKey,
  guaci: string,
  yaoci: string[],
  plain: string
]

export interface HexagramData {
  order: number
  name: string
  upper: TrigramKey
  lower: TrigramKey
  /** 卦辞 */
  guaci: string
  /** 爻辞（初→上） */
  yaoci: string[]
  /** 白话简解 */
  plain: string
}

function hex(t: HexagramTuple): HexagramData {
  return {
    order: t[0],
    name: t[1],
    upper: t[2],
    lower: t[3],
    guaci: t[4],
    yaoci: t[5],
    plain: t[6]
  }
}

const all: HexagramTuple[] = [...chunk1, ...chunk2, ...chunk3, ...chunk4]

export const HEXAGRAM_LIST: HexagramData[] = all.map(hex)

/** 以「下卦上卦」为键的查表 */
export const HEXAGRAMS: Record<string, HexagramData> = Object.fromEntries(
  all.map((t) => [`${t[3]}${t[2]}`, hex(t)])
)

/** 以卦名为键 */
export const HEXAGRAM_BY_NAME: Record<string, HexagramData> = Object.fromEntries(
  all.map((t) => [t[1], hex(t)])
)

export function getHexagram(lower: TrigramKey, upper: TrigramKey): HexagramData {
  return HEXAGRAMS[`${lower}${upper}`]
}

export function getHexagramByName(name: string): HexagramData | undefined {
  return HEXAGRAM_BY_NAME[name]
}

/** 校验六十四卦是否齐全 */
export function validateHexagrams(): boolean {
  return HEXAGRAM_LIST.length === 64
}