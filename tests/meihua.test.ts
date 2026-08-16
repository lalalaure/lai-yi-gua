import { describe, it, expect } from 'vitest'
import { meihuaByTime, meihuaByNumber } from '../src/core/meihua'
import { HEXAGRAMS } from '../src/data/hexagrams'

describe('梅花易数', () => {
  it('观梅占：算法还原', () => {
    // 邵雍《观梅占》：辰年十二月十七日申时
    // 辰(5)+12+17=34，34÷8余2 → 兑；加申(9)得43，43÷8余3 → 离；43÷6余1 → 初爻动
    const pan = meihuaByTime('观梅', [5, 12, 17, 9])
    expect(pan.upper).toBe('兑')
    expect(pan.lower).toBe('离')
    expect(pan.movingLine).toBe(1)
    // 泽火革 → 初爻动变 泽山咸
    expect(pan.benData.name).toBe('革')
    expect(pan.bianData?.name).toBe('咸')
    // 互卦：下互(234爻)=巽，上互(345爻)=乾 → 巽下乾上 = 天风姤
    expect(pan.huData?.name).toBe('姤')
    expect(pan.huData?.lower).toBe('巽')
    expect(pan.huData?.upper).toBe('乾')
  })

  it('体用取法正确：动爻在下卦则上卦为体', () => {
    const pan = meihuaByTime('观梅', [5, 12, 17, 9])
    // 动爻在第1爻（下卦内），则体卦为上卦（兑），用卦为下卦（离）
    expect(pan.ti).toBe('兑')
    expect(pan.yong).toBe('离')
  })

  it('报数起卦正确', () => {
    const pan = meihuaByNumber('报数', 9, 12)
    // 9÷8余1 乾；12÷8余4 震；动爻 (9+12)÷6 余3
    expect(pan.upper).toBe('乾')
    expect(pan.lower).toBe('震')
    expect(pan.movingLine).toBe(3)
  })

  it('返回卦辞爻辞出处', () => {
    const pan = meihuaByNumber('报数', 9, 12)
    expect(pan.benData.guaci.length).toBeGreaterThan(0)
    expect(pan.verdicts.length).toBeGreaterThan(3)
    for (const v of pan.verdicts) expect(v.source.length).toBeGreaterThan(0)
  })

  it('互卦在表中有对应', () => {
    const pan = meihuaByTime('观梅', [5, 12, 17, 9])
    expect(HEXAGRAMS[`${pan.huData?.lower}${pan.huData?.upper}`]).toBeTruthy()
    expect(pan.bianData && HEXAGRAMS[`${pan.bianData.lower}${pan.bianData.upper}`]).toBeTruthy()
  })
})