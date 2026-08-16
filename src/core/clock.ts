// ============================================================
// 当下四柱 · 由 lunar-javascript 依此刻公历推算
// 供六爻（月建日辰）与梅花（年支时支序）取时用
// ============================================================

import { Solar } from 'lunar-javascript'

export interface NowGanzhi {
  /** 四柱：年/月/日/时 */
  pillars: { year: string; month: string; day: string; hour: string }
  /** 公历串（显示用） */
  solar: string
}

export function nowGanzhi(): NowGanzhi {
  const d = new Date()
  const s = Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds())
  const ec = s.getLunar().getEightChar()
  ec.setSect(2)
  return {
    pillars: {
      year: ec.getYearGan() + ec.getYearZhi(),
      month: ec.getMonthGan() + ec.getMonthZhi(),
      day: ec.getDayGan() + ec.getDayZhi(),
      hour: ec.getTimeGan() + ec.getTimeZhi()
    },
    solar: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  }
}

const ZHI_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

/** 取单一时辰支序号（子=1…亥=12，作梅花时间起卦的年支/时支数） */
export function zhiSeq(zhi: string): number {
  return ZHI_ORDER.indexOf(zhi) + 1
}

/** 当下梅花四数：年支序/农历月/农历日/时支序 */
export function meihuaNowNums(): [number, number, number, number] {
  const d = new Date()
  const s = Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds())
  const l = s.getLunar()
  const ec = l.getEightChar()
  ec.setSect(2)
  return [zhiSeq(ec.getYearZhi()), l.getMonth(), l.getDay(), zhiSeq(ec.getTimeZhi())]
}