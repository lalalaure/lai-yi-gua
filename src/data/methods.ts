// ============================================================
// 占法之道 · 方法元数据
// 每种方法定位、适用问题、三步引导、解读要点
// 数据层面：供首页智能路由与各方法页基础引导共用
// ============================================================

export type MethodId = 'bazi' | 'liuyao' | 'meihua' | 'liuren'

export interface Intention {
  text: string
  method: MethodId
  hint: string
}

export interface Step {
  title: string
  desc: string
}

export interface MethodMeta {
  id: MethodId
  /** 名称 */
  name: string
  /** 一句话定位 */
  tagline: string
  /** 金句式记忆点 */
  motto: string
  /** 适合问什么 */
  suitedFor: string
  /** 门槛 1最低-3最高 */
  threshold: 1 | 2 | 3
  /** 单次时长 */
  duration: string
  /** 输出形态 */
  output: string
  /** 解读语言风格 */
  readingStyle: string
  /** 三步白话引导 */
  steps: Step[]
  /** 解读要点（白话） */
  readingPoints: string[]
  /** 边界红线 */
  bounds: string[]
  /** 路由 */
  to: string
  available: boolean
}

/** 首页接待文案 */
export const welcomeIntents: Intention[] = [
  {
    text: '我想更了解自己、看看今年的趋势',
    method: 'bazi',
    hint: '人人有生辰，一盘看一生'
  },
  {
    text: '我有一件具体的事拿不准',
    method: 'liuyao',
    hint: '一事一验，铜钱问到底'
  },
  {
    text: '就随便测测，凭直觉来一下',
    method: 'meihua',
    hint: '心念一到，随手成卦，最快'
  },
  {
    text: '我自己懂，直接选',
    method: 'meihua',
    hint: '四法均已备'
  }
]

export const methods: MethodMeta[] = [
  {
    id: 'bazi',
    name: '八字',
    tagline: '知命之明 · 一生一盘',
    motto: '八字看命：你是谁，天赋予你什么',
    suitedFor: '认识自己——性格、天赋、合适的方向、一生大体走势、今年运势',
    threshold: 1,
    duration: '一次排盘，长久回看',
    output: '四柱盘 · 五行雷达图 · 大运波形图',
    readingStyle: '性格画像 + 方向与时段建议，措辞理性、附依据',
    steps: [
      { title: '填生辰', desc: '输入公历出生年月日时（时区可选手动修正）' },
      { title: '成盘', desc: '自动排四柱干支，算五行强弱与十神' },
      { title: '读势', desc: '看性格特质、天赋方向，与今明两年大运流年趋势' }
    ],
    readingPoints: [
      '性格画像：从日主、十神格局讲你是什么样的人',
      '天赋方向：按五行喜用提示行业、方位、相处之道',
      '时段趋势：大运波形图直观展示人生阶段的起落',
      '依据可见：喜用神从何来、大运从何起，均可展开核对'
    ],
    bounds: [
      '不判寿命、生死、血光',
      '不下“你是注定如此”的宿命定论',
      '解读只说倾向与建议，落脚点永远是「你可以怎么做」'
    ],
    to: '/bazi',
    available: true
  },
  {
    id: 'liuyao',
    name: '六爻',
    tagline: '决事之断 · 一事一验',
    motto: '六爻断事：这一件，成在何时',
    suitedFor: '具体的一件事——这单能不能成、东西找不找得回、要不要答应',
    threshold: 2,
    duration: '一次约三分钟，专注一问',
    output: '本卦 / 变卦爻象 · 纳甲盘 · 吉凶断语',
    readingStyle: '按所占事类取用神，直接回答“成 / 不成 / 宜缓 / 何时”',
    steps: [
      { title: '凝神一问', desc: '心里想清那一件事，一字一句默念' },
      { title: '摇卦六次', desc: '三枚铜钱掷六次，由初爻至上爻成卦' },
      { title: '看断语', desc: '取用神、判旺衰，读吉凶与应期' }
    ],
    readingPoints: [
      '用神取用：按“问哪类事”找关键爻，如问财看妻财',
      '旺衰判断：月建日辰对用神的生扶克泄',
      '一句话结论 + 术语盘可展开，原理透明',
      '动爻变爻是本卦通向变卦的关键，逐个可看'
    ],
    bounds: [
      '只断所问这一件事，不越到命、寿、健康',
      '一事不二占：同一事当日不重复摇'
    ],
    to: '/liuyao',
    available: true
  },
  {
    id: 'meihua',
    name: '梅花',
    tagline: '应机之灵 · 随手成卦',
    motto: '梅花应机：一念所动，万象皆卦',
    suitedFor: '一时心动——此刻的心情、与人的氛围、随手一试',
    threshold: 1,
    duration: '最快，两步成卦',
    output: '本卦 / 互卦 / 变卦 · 体用关系 · 情势吉凶',
    readingStyle: '以“象”讲卦，趣味鲜活，体用分主客、定宜静宜动',
    steps: [
      { title: '心起一念', desc: '默想此刻想知道的那个念头' },
      { title: '成卦', desc: '用当前时间或你报的三个数字，立刻成卦' },
      { title: '读象', desc: '看体用生克，明当前情势与宜静宜动' }
    ],
    readingPoints: [
      '体用之分：体为你，用为事与对方，生克即态势',
      '白话语译：卦名先给出画面感，再讲人情世故',
      '轻快不沉重：适合碎片时间随手一测'
    ],
    bounds: [
      '观当下之势，不作远期人生论断',
      '一句不得重占，重占则再起一念'
    ],
    to: '/meihua',
    available: true
  },
  {
    id: 'liuren',
    name: '六壬',
    tagline: '探微之秘 · 起于时机',
    motto: '六壬是最深的学问，此处待续',
    suitedFor: '同一件大事反复斟酌时，去粗取精看个分明',
    threshold: 3,
    duration: '重盘，需十数分钟细看',
    output: '天地盘 · 四课 · 三传 · 十二天将',
    readingStyle: '为进阶研习者准备的深度盘，术语完整',
    steps: [
      { title: '择时', desc: '取当下时辰，定月将与天地盘' },
      { title: '起课', desc: '布四课、寻三传、配十二天将' },
      { title: '详参', desc: '细看传变、类神与旺衰' }
    ],
    readingPoints: [
      '三式之首，功底要求最高',
      '此处作进阶彩蛋，先行预告'
    ],
    bounds: ['敬请期待', '敬请期待'],
    to: '/heritage',
    available: false
  }
]

export function getMethod(id: MethodId): MethodMeta {
  return methods.find((m) => m.id === id) ?? methods[0]
}