// lunar-javascript 类型声明（该库为纯 JS，无内置类型）
declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar
    static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Solar
    getYear(): number
    getMonth(): number
    getDay(): number
    getHour(): number
    toYmd(): string
    toYmdHms(): string
    getLunar(): Lunar
  }

  export class Lunar {
    getEightChar(): EightChar
    getYearInGanZhiExact(): string
    getYearInChinese(): string
    getMonthInChinese(): string
    getDayInChinese(): string
    getMonth(): number
    getDay(): number
  }

  export class EightChar {
    setSect(sect: number): void
    getYearGan(): string
    getYearZhi(): string
    getYearHideGan(): string[]
    getYearShiShenGan(): string
    getYearShiShenZhi(): string[]
    getYearNaYin(): string
    getMonthGan(): string
    getMonthZhi(): string
    getMonthHideGan(): string[]
    getMonthShiShenGan(): string
    getMonthShiShenZhi(): string[]
    getMonthNaYin(): string
    getDayGan(): string
    getDayZhi(): string
    getDayHideGan(): string[]
    getDayShiShenGan(): string
    getDayShiShenZhi(): string[]
    getDayNaYin(): string
    getTimeGan(): string
    getTimeZhi(): string
    getTimeHideGan(): string[]
    getTimeShiShenGan(): string
    getTimeShiShenZhi(): string[]
    getTimeNaYin(): string
    getYun(gender: 1 | 0, sect: number): Yun
  }

  export class Yun {
    isForward(): boolean
    getStartYear(): number
    getStartMonth(): number
    getStartDay(): number
    getStartHour(): number
    getStartSolar(): Solar
    getDaYun(num: number): DaYun[]
  }

  export class DaYun {
    getIndex(): number
    getGanZhi(): string
    getStartYear(): number
    getEndYear(): number
    getStartAge(): number
    getEndAge(): number
  }
}