// ============================================================
// 六爻 · 白话读盘
// 面向「不懂术语的用户」：把盘面翻译成人话
// 含义要点：六亲出《增删卜易·用神章》，旺衰出《旺相章》，动变出《动爻章》
// 措辞原则：只说倾向与建议，不判存亡、不言注定
// ============================================================

import type { LiuyaoPan } from './liuyao-verdict'
import { wangXiangFor } from './tables'
import { getLiuqinGuide } from '@/data/liuqin-guide'
import { getWuxingGuide } from '@/data/wuxing-guide'

export interface LiuyaoReading {
  title: string
  text: string
  source: string
}

const SHENG: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }

function shengOf(a: string, b: string): boolean {
  return SHENG[a] === b
}

function wuxingDesc(wx: string): string {
  const g = getWuxingGuide(wx)
  return g ? `${wx}（${g.trait}）` : wx
}

/**
 * 把一卦盘读成几条白话，落点永远是「你可以怎么做」
 */
export function readLiuyao(pan: LiuyaoPan): LiuyaoReading[] {
  const out: LiuyaoReading[] = []
  const { ask, benRows, benData, zhiData, xunkong, monthZhi } = pan

  const shiRow = benRows.find((r) => r.shiying === '世') ?? benRows[0]
  const yingRow = benRows.find((r) => r.shiying === '应') ?? benRows[3]

  // ---- 用神这一维度 ----
  const useRow = ask.yong === '世爻' ? shiRow : (benRows.find((r) => r.liuqin === ask.yong) ?? shiRow)
  const useG = getLiuqinGuide(useRow.liuqin)
  const useState = wangXiangFor(monthZhi, useRow.wuxing)
  out.push({
    title: ask.yong === '世爻' ? '你自己这一爻' : `用神「${ask.yong}」`,
    text:
      `问「${ask.label}」，看的是「${useRow.liuqin}」之爻——它代表${useG?.represents ?? '事情本身'}。` +
      (useG ? useG.meaning : '') +
      `这一爻落在 ${useRow.position} 爻（${useRow.ganzhi}），属${wuxingDesc(useRow.wuxing)}，` +
      `${monthZhi}月里偏「${useState}」${useState === '旺' || useState === '相' ? '，底子不错。' : '，底子偏薄、需要蓄力。'} ` +
      (useG?.ifStrong ?? ''),
    source: '《增删卜易·用神章》'
  })

  // ---- 自己（世爻）与对方（应爻） ----
  const shiG = getLiuqinGuide('世爻')
  const shiState = wangXiangFor(monthZhi, shiRow.wuxing)
  const yingState = wangXiangFor(monthZhi, yingRow.wuxing)
  const rel =
    shiRow.wuxing === yingRow.wuxing
      ? '世应同气，你与对方/事情在一个频道上，容易谈拢。'
      : shengOf(shiRow.wuxing, yingRow.wuxing)
        ? '世生应：你这边愿意先付出，对方会领情，先主动多是好棋。'
        : shengOf(yingRow.wuxing, shiRow.wuxing)
          ? '应生世：对方/外部在成全你，有贵人援手之象。'
          : shiRow.wuxing === SHENG[yingRow.wuxing]
            ? '应克世：外部对你有约束，先别硬顶，迂回几次再谈。'
            : '世克应：局面你能主导，但别用力过猛，留三分和气。'
  out.push({
    title: '你现在的状态',
    text:
      `世爻代表你自己，落 ${shiRow.position} 爻（${shiRow.ganzhi}），${monthZhi}月属「${shiState}」` +
      (shiState === '旺' || shiState === '相' ? '：当下底气足，适合主动出击。' : '：当下偏蓄力期，稳住比冲锋实在。') +
      (shiG?.ifStrong ? ` ${shiG.ifStrong}` : '') +
      `应爻代表对方，落 ${yingRow.position} 爻（${yingRow.ganzhi}），这月属「${yingState}」。${rel}`,
    source: '《增删卜易·世应章》'
  })

  // ---- 动爻在说什么 ----
  const movers = benRows.filter((r) => r.moving)
  if (movers.length === 0) {
    out.push({
      title: '事情在动吗',
      text:
        `六爻皆静，说明事情眼下没有大波澜，平稳推进就好；变化会来，不必去催。本卦《${benData.name}》：${benData.plain}`,
      source: '《增删卜易·静卦章》'
    })
  } else {
    const mvText = movers
      .map((r) => {
        const g = getLiuqinGuide(r.liuqin)
        return `${r.position}爻${r.ganzhi}（${r.liuqin}）动${g?.ifStrong ? '，' + g.ifStrong : ''}`
      })
      .join('；')
    out.push({
      title: '动爻在提示你',
      text:
        `有 ${movers.length} 个爻在动：${mvText}。动爻代表眼下要变的地方，不必紧张——它只是把变化提前摆给你看，${zhiData ? `事态将走向《${zhiData.name}》：${zhiData.plain}` : '走向因变卦而另有所归。'}`,
      source: '《增删卜易·动爻章》'
    })
  }

  // ---- 时间提醒（旬空 + 应期） ----
  let timeText = `用神「${useRow.liuqin}」在${monthZhi}月偏「${useState}」${useState === '旺' || useState === '相' ? '：事情有基础，等个时机就能起。' : '：事情眼下偏缓，适合先用功攒条件。'}`
  if (xunkong) {
    const kongHit = benRows.filter((r) => xunkong.includes(r.zhi))
    if (kongHit.length > 0) {
      timeText += `旬空在「${xunkong}」，${kongHit.map((r) => `${r.position}爻`).join('、')}临空：这几爻代表的事眼下「虚着」、不落实，出空之期（一般一两旬内）再看。`
    }
  }
  out.push({ title: '时间的提醒', text: timeText, source: '《增删卜易·旺相章》' })

  // ---- 你可以怎么做（总建议） ----
  const advice =
    useState === '旺' || useState === '相'
      ? '大势偏利：该主动就主动，该谈就谈，把日子定下来。'
      : '大势偏缓：把能做的准备先做足，别急着逼结果；时机到了自然会转。'
  const kongNote = xunkong && ask.yong !== '世爻' ? ' 特别提醒：用神临空则慢在半拍，别把「没音信」理解成「没戏」。' : ''
  out.push({
    title: '你可以怎么做',
    text: `${advice} ${pan.conclusion}${kongNote}`,
    source: '《增删卜易》断卦总纲'
  })

  return out
}