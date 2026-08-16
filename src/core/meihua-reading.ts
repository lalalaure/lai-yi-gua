// ============================================================
// 梅花易数 · 读象篇
// 面向「不懂术语的用户」：用八卦取象把场面翻译成画面与动作
// 取象出《说卦传》：《乾》天、《兑》泽、《离》火、《震》雷、
// 《巽》风、《坎》水、《艮》山、《坤》地
// 措辞原则：只说倾向与建议，不下生死血光等断语
// ============================================================

import type { MeihuaPan } from './meihua'
import { TRIGRAM_XIANG, TRIGRAM_WUXING, type TrigramKey } from './tables'
import { getWuxingGuide } from '@/data/wuxing-guide'

export interface MeihuaReading {
  title: string
  text: string
  source: string
}

/** 八卦的白话意象：见到它，画面是什么 */
const XIANG_TALK: Record<TrigramKey, string> = {
  乾: '像天一样：刚健、主动、想当主导、爱定了就冲',
  兑: '像泽一样：开口则悦、靠沟通与笑脸成事，也主说得多、兑现慢',
  离: '像火一样：热情、明亮、盼看得见的成果，也容易心急上火',
  震: '像雷一样：忽然来劲、想动起来、行动快，但动静大、易反复',
  巽: '像风一样：绵柔渗透、随风转弯、靠耐心的巧劲，急不来',
  坎: '像水一样：有沟有坎、过程曲折、需低头淌过去，也主心机深藏',
  艮: '像山一样：局面会停一停、该止则止、多想清楚再动',
  坤: '像地一样：承载、顺势、不争抢，等人来合，胜在持久'
}

/** 五行在事态里的白话（读象用） */
const WX_ACTION: Record<string, string> = {
  木: '事情会往「生长、推进」的方向走，枝节会多，要不断照料',
  火: '事情会往「显著、张扬」的方向走，容易快出结果，也易烧过头',
  土: '事情实打实、有积累，慢但稳，守土比占地实在',
  金: '事情讲规则、讲分寸，快刀能斩乱麻，也容易不留情面',
  水: '事情流动变数大，方向常改，适合以静制动、见机行事'
}

function xiang(w: TrigramKey): string {
  return `${w}（${TRIGRAM_XIANG[w]}）`
}

/**
 * 梅花读象：把卦变成「画面 + 你该怎么动」。
 * 六段：场面→体用势→动爻→变卦→互卦→建议
 */
export function readMeihua(pan: MeihuaPan): MeihuaReading[] {
  const out: MeihuaReading[] = []
  const { upper, lower, movingLine, benData, bianData, huData, ti, yong, tiYongRelation, conclusion } = pan

  // ---- 1. 本卦画面 ----
  out.push({
    title: '场面：这是一出什么戏',
    text:
      `${xiang(upper)}在上、${xiang(lower)}在下，合成《${benData.name}》。` +
      `${XIANG_TALK[upper]}；${XIANG_TALK[lower]}。` +
      ` 整卦的意思：${benData.plain}。`,
    source: '《周易》卦辞' + ' / 《说卦传》'
  })

  // ---- 2. 体用势 ----
  out.push({
    title: '你与事情的相对位置',
    text:
      `不动的是「体」＝你（${xiang(ti)}，属${TRIGRAM_WUXING[ti]}）；动的是「用」＝事（${xiang(yong)}，属${TRIGRAM_WUXING[yong]}）。` +
      `${relationTalk(tiYongRelation)}`,
    source: '《梅花易数·体用篇》'
  })

  // ---- 3. 动爻 ----
  out.push({
    title: '动爻：扭转局面的那一下',
    text:
      movingLine <= 3
        ? `第 ${movingLine} 爻动，动在${lower}（下卦）——内在的那一侧先动：多半是你自己先变、先迈步，或家里/近处先有动静。`
        : `第 ${movingLine} 爻动，动在${upper}（上卦）——外在的那一侧先动：多半是外面的人/对方先出手，或时机由外部推着走。`,
    source: '《周易》爻辞'
  })

  // ---- 4. 变卦 ----
  out.push({
    title: '变卦：故事往哪儿走',
    text:
      `动过之后变成《${bianData ? bianData.name : ''}》${bianData ? `：${bianData.plain}` : ''}。` +
      `一句话：${conclusion}`,
    source: '《周易》卦辞'
  })

  // ---- 5. 互卦过程 ----
  if (huData) {
    out.push({
      title: '过程中的阶段',
      text: `中间会经过《${huData.name}》：${huData.plain}`,
      source: '《易》互体法'
    })
  }

  // ---- 6. 建议 ----
  out.push({
    title: '你可以怎么做',
    text: adviceFor(pan),
    source: '《梅花易数·体用篇》'
  })

  return out
}

function relationTalk(rel: string): string {
  switch (rel) {
    case '用生体':
      return `用（事）来生体（你）——外部在帮你的忙，顺势接住就好，别推辞也别贪多。`
    case '体生用':
      return `你（体）在生事（用）——这场是「你付出型」：投入时间心力能成，但先想清楚值不值、别掏空自己。`
    case '体克用':
      return `你（体）克住事（用）——局面你能做主，只是费点劲；节奏自己定，别贪快。`
    case '用克体':
      return `事（用）克你（体）——外部阻力还压着你，这时候硬顶不划算，先退半步、换条路再试。`
    default:
      return `体用同气（比和）——你与事是一路的，顺其自然往前推，反而容易成。`
  }
}

function adviceFor(pan: MeihuaPan): string {
  const wxt = WX_ACTION[TRIGRAM_WUXING[pan.ti]]
  const g = getWuxingGuide(TRIGRAM_WUXING[pan.ti])
  const gentle =
    pan.tiYongRelation === '用克体'
      ? '这几天先别急着行动，把条件备齐、把人脉理清，等风头过了再上。'
      : pan.tiYongRelation === '体生用'
        ? '把付出控制在你承受得起的范围，能谈的先谈，别一个人扛。'
        : pan.tiYongRelation === '体克用'
          ? '节奏稳一点，一次咬一小口，别想一口吃成胖子。'
          : '顺势而为，想到就做，卡住时往自己身上找原因、调整一下再走。'
  const lifeTip = g ? ` 五行上你属${TRIGRAM_WUXING[pan.ti]}：${g.life}` : ''
  return `${wxt}。${gentle}${lifeTip}`
}