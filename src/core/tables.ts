// ============================================================
// 五行 · 干支 · 八卦 基础参考表
// 出处：【京房纳甲】《火珠林》/《卜筮正宗》；【干支五行】《渊海子平》
// ============================================================

export const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

export const WUXING_LIST = ['木', '火', '土', '金', '水'] as const
export type Wuxing = (typeof WUXING_LIST)[number]

/** 天干五行 */
export const GAN_WUXING: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水'
}

/** 地支五行 */
export const ZHI_WUXING: Record<string, Wuxing> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水'
}

/** 地支藏干（出《渊海子平·地支藏遁篇》） */
export const ZHI_HIDEGAN: Record<string, string[]> = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '戊', '庚'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲']
}

/** 地支生肖 */
export const ZHI_SHENGXIAO: Record<string, string> = {
  子: '鼠', 丑: '牛', 寅: '虎', 卯: '兔', 辰: '龙', 巳: '蛇', 午: '马', 未: '羊', 申: '猴', 酉: '鸡', 戌: '狗', 亥: '猪'
}

/** 六冲：子午、丑未、寅申、卯酉、辰戌、巳亥 */
export const ZHI_CHONG: Record<string, string> = {
  子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅',
  卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳'
}

/** 六合：子丑合土、寅亥合木、卯戌合火、辰酉合金、巳申合水、午未合土 */
export const ZHI_HE: Record<string, string> = {
  子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午'
}

/** 五行相生：X 生 Y */
export const SHENG: Record<Wuxing, Wuxing> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
/** 五行相克：X 克 Y */
export const KE: Record<Wuxing, Wuxing> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }

/** 判断 A 是否生 B */
export function isSheng(a: Wuxing, b: Wuxing): boolean {
  return SHENG[a] === b
}
/** 判断 A 是否克 B */
export function isKe(a: Wuxing, b: Wuxing): boolean {
  return KE[a] === b
}

/**
 * 以"宫"五行为我，定六亲
 * 同我兄弟 · 我生子孙 · 生我父母 · 克我官鬼 · 我克妻财
 * 出《增删卜易·六亲章》
 */
export function liuQinFor(gongWuxing: Wuxing, yaoWuxing: Wuxing): string {
  if (yaoWuxing === gongWuxing) return '兄弟'
  if (isSheng(gongWuxing, yaoWuxing)) return '子孙'
  if (isSheng(yaoWuxing, gongWuxing)) return '父母'
  if (isKe(gongWuxing, yaoWuxing)) return '妻财'
  return '官鬼'
}

/** 六神起例：甲乙青龙 → 丙丁朱雀 → 戊勾陈 → 己螣蛇 → 庚辛白虎 → 壬癸玄武（初爻起顺排） */
export const LIU_SHEN_ORDER = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'] as const

export function liuShenStart(dayGan: string): number {
  switch (dayGan) {
    case '甲':
    case '乙':
      return 0
    case '丙':
    case '丁':
      return 1
    case '戊':
      return 2
    case '己':
      return 3
    case '庚':
    case '辛':
      return 4
    default:
      return 5
  }
}

// ---------- 八卦 ----------

export type TrigramKey = '乾' | '兑' | '离' | '震' | '巽' | '坎' | '艮' | '坤'

/** 八卦五行（先天卦象之德） */
export const TRIGRAM_WUXING: Record<TrigramKey, Wuxing> = {
  乾: '金', 兑: '金', 离: '火', 震: '木', 巽: '木', 坎: '水', 艮: '土', 坤: '土'
}

/** 八卦取象（出《说卦传》） */
export const TRIGRAM_XIANG: Record<TrigramKey, string> = {
  乾: '天', 兑: '泽', 离: '火', 震: '雷', 巽: '风', 坎: '水', 艮: '山', 坤: '地'
}

/** 八卦方位（后天八卦，出《说卦传》） */
export const TRIGRAM_POSITION: Record<TrigramKey, string> = {
  乾: '西北', 兑: '西', 离: '南', 震: '东', 巽: '东南', 坎: '北', 艮: '东北', 坤: '西南'
}

/**
 * 纳甲：内卦（下卦）三爻与 外卦（上卦）三爻的干支。
 * 出《火珠林·纳甲法》：乾纳甲壬、坤纳乙癸、震纳庚、巽纳辛、坎纳戊、离纳己、艮纳丙、兑纳丁；
 * 阳卦顺排，阴卦逆排。
 */
export const NAJIA: Record<TrigramKey, { inner: string[]; outer: string[] }> = {
  乾: { inner: ['甲子', '甲寅', '甲辰'], outer: ['壬午', '壬申', '壬戌'] },
  兑: { inner: ['丁巳', '丁卯', '丁丑'], outer: ['丁亥', '丁酉', '丁未'] },
  离: { inner: ['己卯', '己丑', '己亥'], outer: ['己酉', '己未', '己巳'] },
  震: { inner: ['庚子', '庚寅', '庚辰'], outer: ['庚午', '庚申', '庚戌'] },
  巽: { inner: ['辛丑', '辛亥', '辛酉'], outer: ['辛未', '辛巳', '辛卯'] },
  坎: { inner: ['戊寅', '戊辰', '戊午'], outer: ['戊申', '戊戌', '戊子'] },
  艮: { inner: ['丙辰', '丙午', '丙申'], outer: ['丙戌', '丙子', '丙寅'] },
  坤: { inner: ['乙未', '乙巳', '乙卯'], outer: ['癸丑', '癸亥', '癸酉'] }
}

/** 旬空：以日干之首定旬，旬首配地支，余二支为空 */
export const XUNKONG: Record<string, string> = {
  甲子: '戌亥', 甲戌: '申酉', 甲申: '午未', 甲午: '辰巳', 甲辰: '寅卯', 甲寅: '子丑'
}

/** 旬首表：十干每旬首之干 */
const XUN_SHOU_GAN = ['甲', '甲', '甲', '甲', '甲', '甲']

/** 由日干支求旬空（出《增删卜易·旬空章》） */
export function calcXunKong(ganZhi: string): string {
  const gan = ganZhi[0]
  const zhi = ganZhi[1]
  const ganIdx = TIANGAN.indexOf(gan as never)
  const zhiIdx = DIZHI.indexOf(zhi as never)
  if (ganIdx < 0 || zhiIdx < 0) return ''
  const shift = Math.floor((zhiIdx - ganIdx + 12) % 12 / 2)
  // 旬首干恒为甲
  const xunShouZhi = (zhiIdx - ((zhiIdx - ganIdx + 12) % 10) + 12) % 12
  const xunShou = XUN_SHOU_GAN[shift] + DIZHI[xunShouZhi]
  const kong = XUNKONG[xunShou]
  return kong ?? ''
}

/** 旺相休囚死（以月令断，出《增删卜易》） */
const WANG_TOKEN: Record<string, Wuxing> = { 春: '木', 夏: '火', 秋: '金', 冬: '水', 四时: '土' }

/**
 * 五行旺衰状态：旺 / 相 / 休 / 囚 / 死
 * 出《淮南子·天文训》与《增删卜易·旺相章》
 * @param monthZhi 月建地支
 * @param wx 所断五行
 */
export function wangXiangFor(monthZhi: string, wx: Wuxing): string {
  const zhi = DIZHI.indexOf(monthZhi as never)
  // 子亥冬 · 丑辰未戌四季 · 寅卯春 · 巳午夏 · 申酉秋
  const seasonToken = ['冬', '四时', '春', '春', '四时', '夏', '夏', '四时', '秋', '秋', '四时', '冬'][zhi] as string
  const season = WANG_TOKEN[seasonToken]
  // 当令者旺，令所生者相，生令者休，克令者囚，令所克者死
  if (wx === season) return '旺'
  if (SHENG[season] === wx) return '相'
  if (SHENG[wx] === season) return '休'
  if (KE[wx] === season) return '囚'
  return '死'
}