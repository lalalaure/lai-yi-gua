// ============================================================
// 音效合成 · Web Audio API
// 零音频资源：摇钱、落地清响、动爻磬、揭晓铃、面板 whoosh、按钮 tick
// 遵循自动播放策略：首次用户手势后初始化；静音记忆于 localStorage
// ============================================================

import { ref, watch } from 'vue'

const STORE_KEY = 'laiyigua.sfx.muted'

const muted = ref(localStorage.getItem(STORE_KEY) === '1')

let ctx: AudioContext | null = null
let master: GainNode | null = null
let ready = false

/** 在用户第一次交互时懒初始化（满足浏览器自动播放策略） */
export function initSfx() {
  if (ready || muted.value) {
    ready = true
    return
  }
  if (typeof window === 'undefined') return
  // 系统偏好减弱动态效果时，一并安静
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  if (reduce) {
    muted.value = true
    localStorage.setItem(STORE_KEY, '1')
    ready = true
    return
  }
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (AC) {
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = 0.5
      master.connect(ctx.destination)
    }
  } catch {
    ctx = null
  }
  ready = true
}

export function setSfxMuted(v: boolean) {
  muted.value = v
  localStorage.setItem(STORE_KEY, v ? '1' : '0')
}
export function getSfxMuted() {
  return muted.value
}

watch(muted, (v) => {
  if (master) {
    master.gain.setTargetAtTime(v ? 0 : 0.5, ctx!.currentTime, 0.02)
  }
})

function node() {
  if (!ctx || !master) return null
  if (ctx.state === 'suspended') void ctx.resume()
  return { ctx, master }
}

/** 噪声源（用于沙沙/落地打击） */
function noise(duration: number, filterFreq: number, q = 1, peak = 0.3, type: BiquadFilterType = 'bandpass') {
  const n = node()
  if (!n) return
  const { ctx, master } = n
  const len = Math.floor(ctx.sampleRate * duration)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1

  const src = ctx.createBufferSource()
  src.buffer = buf
  const filter = ctx.createBiquadFilter()
  filter.type = type
  filter.frequency.value = filterFreq
  filter.Q.value = q
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)

  src.connect(filter).connect(gain).connect(master)
  src.start()
  src.stop(ctx.currentTime + duration + 0.05)
}

/** 金属正弦打击（铜钱清响） */
function ping(freq: number, duration: number, peak = 0.24) {
  const n = node()
  if (!n) return
  const { ctx, master } = n
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = freq
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, ctx.currentTime)
  g.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
  osc.connect(g).connect(master)
  osc.start()
  osc.stop(ctx.currentTime + duration + 0.05)
}

/** 泛音叠加营造"磬"的余韵 */
function partials(base: number, count = 4, duration = 0.5, peak = 0.12) {
  const n = node()
  if (!n) return
  const { ctx, master } = n
  for (let i = 1; i <= count; i++) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = base * (i + 1)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(peak / i, ctx.currentTime + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
    osc.connect(g).connect(master)
    osc.start()
    osc.stop(ctx.currentTime + duration + 0.05)
  }
}

export interface Sfx {
  /** 摇钱沙沙（掷前） */
  rattle(): void
  /** 一枚铜钱落地 */
  clink(variant?: number): void
  /** 动爻变机 · 磬音 */
  shift(): void
  /** 结果揭晓 · 铃音 */
  reveal(): void
  /** 面板/区块浮现 */
  whoosh(): void
  /** 按钮轻响 */
  tick(): void
}

export function useSfx(): Sfx {
  initSfx()

  return {
    rattle() {
      if (muted.value || !ready) return
      noise(0.5, 2600, 1.4, 0.12)
      noise(0.45, 5200, 2.4, 0.08, 'highpass')
    },
    clink(variant = 0) {
      if (muted.value || !ready) return
      const bases = [1720, 1290, 2080, 1520]
      ping(bases[variant % bases.length], 0.32, 0.2)
      ping(bases[variant % bases.length] * 2.7, 0.22, 0.06)
      noise(0.06, 6200, 3, 0.1, 'highpass')
    },
    shift() {
      if (muted.value || !ready) return
      // 动爻：磬一声 + 轻和音
      partials(440, 4, 0.6, 0.1)
      window.setTimeout(() => ping(660, 0.5, 0.08), 90)
    },
    reveal() {
      if (muted.value || !ready) return
      partials(520, 5, 0.9, 0.1)
      window.setTimeout(() => partials(780, 3, 0.7, 0.06), 140)
    },
    whoosh() {
      if (muted.value || !ready) return
      noise(0.28, 900, 0.7, 0.06)
    },
    tick() {
      if (muted.value || !ready) return
      ping(880, 0.12, 0.06)
    }
  }
}