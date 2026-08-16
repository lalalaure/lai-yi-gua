// ============================================================
// 六爻起卦 · 铜钱/时间/数字
// 铜钱法出《增删卜易·铜钱课》：三枚铜钱，字背观象
// 一个背记少阳(7)、两个背记少阴(8)、三个背记老阳(9、动)、无背记老阴(6、动)
// ============================================================

import type { YaoValue } from './liuyao-mount'

export type CastMethod = 'coin' | 'time' | 'manual'

export interface TossResult {
  /** 三枚铜钱：1=背(阳)，0=字(阴) */
  coins: [number, number, number]
  /** 爻值 */
  value: YaoValue
  /** 爻名 */
  label: string
  /** 动爻 */
  moving: boolean
}

const LABELS: Record<number, string> = {
  6: '老阴·动',
  7: '少阳',
  8: '少阴',
  9: '老阳·动'
}

function coinValue(backs: number): YaoValue {
  // 背数：3→老阳9 · 2→少阴8 · 1→少阳7 · 0→老阴6
  if (backs === 3) return 9
  if (backs === 2) return 8
  if (backs === 1) return 7
  return 6
}

function randomBit(): number {
  // 加密级随机：crypto.getRandomValues
  const arr = new Uint32Array(1)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr)
  } else {
    arr[0] = Math.floor(Math.random() * 0xffffffff)
  }
  return arr[0] % 2
}

/** 摇一枚铜钱（一次为三枚齐掷，逐次回归） */
export function tossOnce(): TossResult {
  const coins: [number, number, number] = [randomBit(), randomBit(), randomBit()]
  const backs = coins[0] + coins[1] + coins[2]
  const value = coinValue(backs)
  return {
    coins,
    value,
    label: LABELS[value],
    moving: value === 6 || value === 9
  }
}

/** 摇满六次（初爻→上爻） */
export function tossSix(): TossResult[] {
  const out: TossResult[] = []
  for (let i = 0; i < 6; i++) out.push(tossOnce())
  return out
}

/** 手动录入：六位 6/7/8/9 */
export function manualValues(input: number[]): YaoValue[] {
  if (input.length !== 6 || input.some((v) => ![6, 7, 8, 9].includes(v))) {
    throw new Error('六爻须为 6 个 6/7/8/9')
  }
  return input as YaoValue[]
}