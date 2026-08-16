import { describe, it, expect } from 'vitest'
import { divineLiuyao } from '../src/core/liuyao-verdict'
import { readLiuyao } from '../src/core/liuyao-reading'
import type { YaoValue } from '../src/core/liuyao-mount'

const TIME = { year: '庚午', month: '壬午', day: '辛亥', hour: '乙未' }

describe('六爻白话读盘', () => {
  it('读盘分维齐全，每条都有出处，落点是可做什么', () => {
    const values: YaoValue[] = [7, 8, 8, 6, 7, 9]
    const pan = divineLiuyao('这次合作能成吗', 'cai', values, TIME)
    const rs = readLiuyao(pan)
    expect(rs.length).toBeGreaterThanOrEqual(5)
    const titles = rs.map((r) => r.title)
    expect(titles).toContain('用神「妻财」')
    expect(titles).toContain('你现在的状态')
    expect(titles).toContain('动爻在提示你')
    expect(titles).toContain('你可以怎么做')
    for (const r of rs) {
      expect(r.text.length).toBeGreaterThan(10)
      expect(r.source.length).toBeGreaterThan(0)
    }
    const last = rs[rs.length - 1]
    expect(last.text).toMatch(/怎么做|等待|主动|时机/) // 有落脚点
  })

  it('静卦读盘：提示平稳、无动爻专项', () => {
    const values: YaoValue[] = [7, 7, 7, 7, 7, 7]
    const pan = divineLiuyao('问家宅', 'jia', values, TIME)
    const rs = readLiuyao(pan)
    expect(rs.some((r) => r.title === '事情在动吗')).toBe(true)
    expect(rs.some((r) => r.title === '动爻在提示你')).toBe(false)
  })

  it('用神在世爻时读盘口径正确', () => {
    const values: YaoValue[] = [8, 8, 7, 6, 7, 8]
    const pan = divineLiuyao('问出行', 'chu', values, TIME)
    const rs = readLiuyao(pan)
    expect(rs.some((r) => r.title === '你自己这一爻')).toBe(true)
  })
})