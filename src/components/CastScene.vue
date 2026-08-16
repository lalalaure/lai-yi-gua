<script setup lang="ts">
import { ref, computed } from 'vue'
import { tossOnce, type TossResult } from '@/core/liuyao-cast'
import { useSfx } from '@/composables/useSfx'

const emit = defineEmits<{
  (e: 'tossed', r: TossResult): void
  (e: 'clear'): void
}>()

const sfx = useSfx()

/** 三枚铜钱（含已落定的） */
interface FlyingCoin {
  id: number
  face: 'bei' | 'zi'
  delay: number
  landed: boolean
  variant: number
}

const tossing = ref(false)
const coins = ref<FlyingCoin[]>([])
/** 已落定的三枚计数（-1=尚未落定） */
const allLanded = computed(() => coins.value.length > 0 && coins.value.every((c) => c.landed))

const outcome = ref<{ n: number; backs: number; label: string; moving: boolean } | null>(null)

/** 爻位：由初爻到上爻依次写入 */
const written = ref<Array<{ yin: boolean; moving: boolean } | null>>([null, null, null, null, null, null])
const writtenCount = computed(() => written.value.filter(Boolean).length)

const canToss = computed(() => !tossing.value && writtenCount.value < 6)
const label = computed(() => {
  const n = writtenCount.value
  if (n >= 6) return '六爻已齐'
  return `掷第 ${n + 1} 爻`
})

function toss() {
  if (!canToss.value) return
  sfx.rattle()
  const r = tossOnce()
  coins.value = r.coins.map((c, i) => ({
    id: Date.now() + i,
    face: c === 1 ? 'bei' : 'zi',
    delay: 180 + i * 130,
    landed: false,
    variant: i
  }))
  outcome.value = null
  tossing.value = true
  coins.value.forEach((c) => {
    window.setTimeout(() => {
      c.landed = true
      sfx.clink(c.variant)
    }, c.delay + 720)
  })
  window.setTimeout(() => {
    tossing.value = false
    const target = writtenCount.value
    written.value = written.value.map((w, idx) =>
      idx === target
        ? { yin: r.value === 8 || r.value === 6, moving: r.moving }
        : w
    )
    outcome.value = {
      n: target + 1,
      backs: r.coins.reduce((s, x) => s + x, 0),
      label: r.label,
      moving: r.moving
    }
    if (r.moving) sfx.shift()
    else sfx.tick()
    emit('tossed', r)
  }, 180 + 2 * 130 + 720 + 460)
}

function clearAll() {
  written.value = [null, null, null, null, null, null]
  coins.value = []
  outcome.value = null
  tossing.value = false
  emit('clear')
}
</script>

<template>
  <div class="cast" :class="{ 'is-done': writtenCount >= 6 }">
    <!-- 罩顶丝绸 + 香雾 + 尘埃 -->
    <div class="cast__smoke" aria-hidden="true"></div>
    <div class="cast__dust" aria-hidden="true">
      <span v-for="n in 6" :key="n" class="cast__mote"></span>
    </div>

    <div class="cast__stage">
      <!-- 卦位书写区：爻画逐笔写入 -->
      <div class="cast__board">
        <span class="cast__board-label faint">卦 位 · 由初爻至上爻</span>
        <div class="cast__lines">
          <div
            v-for="(y, i) in written"
            :key="i"
            class="cast__line"
            :class="{
              'is-filled': !!y,
              'is-move': !!y && y.moving
            }"
          >
            <span v-if="y" class="cast__bar" :class="y.yin ? 'cast__bar--yin' : 'cast__bar--yang'"></span>
            <span v-else class="cast__bar cast__bar--empty"></span>
          </div>
        </div>
      </div>

      <!-- 三枚铜钱（落定后保持显示，附字/背标注） -->
      <div
        class="cast__coins"
        :class="{ 'is-settled': allLanded && !tossing, 'is-done': writtenCount >= 6 }"
      >
        <div
          v-for="c in coins"
          :key="c.id"
          class="coin3d"
          :class="[`coin3d--${c.face}`, { 'is-landed': c.landed, 'is-flying': tossing }]"
          :style="{ '--d': c.delay + 'ms', '--face': c.face === 'zi' ? '180deg' : '0deg' }"
        >
          <div class="coin3d__inner">
            <!-- 字面：乾隆通宝 -->
            <div class="coin3d__face coin3d__face--zi">
              <svg viewBox="0 0 100 100" class="coin3d__svg" aria-hidden="true">
                <defs>
                  <radialGradient id="coinBr" cx="35%" cy="30%" r="85%">
                    <stop offset="0%" stop-color="#f5e3ad" />
                    <stop offset="45%" stop-color="#cfa049" />
                    <stop offset="80%" stop-color="#8a5c1f" />
                    <stop offset="100%" stop-color="#4d2f0b" />
                  </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="47" fill="url(#coinBr)" />
                <circle cx="50" cy="50" r="43" fill="none" stroke="#f8e7b8" stroke-width="1.6" opacity="0.7" />
                <rect x="35" y="35" width="30" height="30" rx="4" fill="#2d1a05" />
                <rect x="35" y="35" width="30" height="30" rx="4" fill="none" stroke="#0f0800" stroke-width="1" stroke-opacity="0.8" />
                <g font-family="var(--font-title)" fill="#3a2307" text-anchor="middle" font-size="17">
                  <text x="50" y="27" transform="rotate(0 50 30)">乾</text>
                  <text x="75" y="55" transform="rotate(90 75 55)">隆</text>
                  <text x="50" y="80" transform="rotate(180 50 80)">通</text>
                  <text x="25" y="55" transform="rotate(-90 25 55)">寶</text>
                </g>
              </svg>
            </div>
            <!-- 背面：背 + 满文装饰 -->
            <div class="coin3d__face coin3d__face--bei">
              <svg viewBox="0 0 100 100" class="coin3d__svg" aria-hidden="true">
                <defs>
                  <radialGradient id="coinBrB" cx="35%" cy="30%" r="85%">
                    <stop offset="0%" stop-color="#f5e3ad" />
                    <stop offset="45%" stop-color="#cfa049" />
                    <stop offset="80%" stop-color="#8a5c1f" />
                    <stop offset="100%" stop-color="#4d2f0b" />
                  </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="47" fill="url(#coinBrB)" />
                <circle cx="50" cy="50" r="43" fill="none" stroke="#f8e7b8" stroke-width="1.6" opacity="0.7" />
                <rect x="35" y="35" width="30" height="30" rx="4" fill="#2d1a05" />
                <g font-family="var(--font-title)" fill="#3a2307" text-anchor="middle">
                  <text x="50" y="54" font-size="26">背</text>
                  <text x="50" y="30" font-size="8" fill="#6b4613">宝</text>
                  <text x="70" y="56" font-size="8" fill="#6b4613">泉</text>
                  <text x="50" y="78" font-size="8" fill="#6b4613">宝</text>
                  <text x="30" y="56" font-size="8" fill="#6b4613">泉</text>
                </g>
              </svg>
            </div>
          </div>
        </div>

        <!-- 空闲提示 -->
        <div v-if="coins.length === 0" class="cast__rest">
          <span class="cast__rest-note">三枚铜钱，掷于卦案</span>
        </div>
      </div>

      <!-- 本爻结果宣告 -->
      <transition name="outcome">
        <div v-if="outcome" class="cast__outcome" :class="{ 'is-move': outcome.moving }">
          <span class="cast__outcome-no">第 {{ outcome.n }} 爻</span>
          <span class="cast__outcome-label">{{ outcome.label }}</span>
          <span class="cast__outcome-detail">
            {{ outcome.backs }} 背 · {{ 3 - outcome.backs }} 字
            <span v-if="outcome.moving" class="cast__outcome-move">← 动爻</span>
          </span>
        </div>
      </transition>

      <!-- 控台 -->
      <div class="cast__ctrl">
        <p class="cast__hint faint">
          一个背为少阳 · 两个背为少阴 · 三个背为老阳（动） · 无背为老阴（动）
        </p>
        <div class="cast__btns">
          <button class="btn btn--primary" :disabled="!canToss" @click="toss">
            {{ tossing ? '掷落中…' : label }}
          </button>
          <button v-if="writtenCount > 0" class="btn btn--ghost" :disabled="tossing" @click="clearAll">
            清盘重摇
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ---------- 舞台布景 ---------- */
.cast {
  --stage-w: min(680px, 100%);
  position: relative;
  border-radius: calc(var(--radius) + 4px);
  background:
    radial-gradient(ellipse 90% 70% at 50% -10%, rgba(168, 132, 44, 0.16), transparent 60%),
    radial-gradient(ellipse 70% 50% at 50% 110%, rgba(176, 58, 46, 0.1), transparent 65%),
    linear-gradient(175deg, #26211b, #171310 55%, #1c1713);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 0 0 1px rgba(0, 0, 0, 0.35),
    var(--shadow-ink-lg);
  overflow: hidden;
}
/* 织锦纹理 */
.cast::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 26px 26px;
  pointer-events: none;
}
.cast::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px var(--gold-line);
  pointer-events: none;
}

/* 香雾 */
.cast__smoke {
  position: absolute;
  left: 50%;
  bottom: -30px;
  width: 6px;
  height: 150px;
  margin-left: -3px;
  background: radial-gradient(ellipse, rgba(255, 242, 210, 0.28), transparent 70%);
  filter: blur(4px);
  animation: smoke 6s ease-in-out infinite;
  opacity: 0;
  pointer-events: none;
}
@keyframes smoke {
  0% { transform: translateY(0) scaleX(1); opacity: 0; }
  12% { opacity: 0.9; }
  50% { transform: translateY(-70px) scaleX(1.6); opacity: 0.6; }
  100% { transform: translateY(-150px) scaleX(2.4); opacity: 0; }
}

/* 尘埃微光 */
.cast__mote {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(255, 226, 170, 0.5);
  filter: blur(0.5px);
  animation: mote var(--dur, 7s) ease-in-out infinite;
  opacity: 0;
}
.cast__mote:nth-child(1) { --dur: 6.5s; left: 12%; top: 40%; }
.cast__mote:nth-child(2) { --dur: 8s; left: 84%; top: 30%; animation-delay: 1.2s; }
.cast__mote:nth-child(3) { --dur: 7s; left: 30%; top: 15%; animation-delay: 2.1s; }
.cast__mote:nth-child(4) { --dur: 9s; left: 64%; top: 8%; animation-delay: 0.6s; }
.cast__mote:nth-child(5) { --dur: 7.5s; left: 18%; top: 60%; animation-delay: 2.8s; }
.cast__mote:nth-child(6) { --dur: 8.4s; left: 74%; top: 55%; animation-delay: 1.8s; }
@keyframes mote {
  0%, 100% { transform: translate(0, 0); opacity: 0; }
  30% { opacity: 0.8; }
  60% { transform: translate(6px, -26px); opacity: 0.4; }
}

.cast__stage {
  position: relative;
  max-width: var(--stage-w);
  margin: 0 auto;
  padding: 26px 28px 22px;
}

/* ---------- 卦位书写区 ---------- */
.cast__board-label {
  display: block;
  text-align: center;
  font-size: 12px;
  letter-spacing: 0.24em;
  color: rgba(224, 208, 178, 0.55);
  margin-bottom: 12px;
}
.cast__lines {
  display: flex;
  flex-direction: column-reverse;
  gap: 7px;
  align-items: center;
  padding: 14px 20px;
  border: 1px solid rgba(224, 208, 178, 0.14);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.22);
  min-height: 148px;
}
.cast__line {
  display: flex;
  justify-content: center;
}
.cast__bar {
  display: block;
  height: 6px;
  border-radius: 3px;
  transition: all 0.45s var(--ease-ink);
}
.cast__bar--yang {
  width: 110px;
  background: linear-gradient(to right, transparent, #e8d9b0 18%, #e8d9b0 82%, transparent);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
.cast__bar--yin {
  width: 46px;
  background: linear-gradient(to right, transparent, #e8d9b0 18%, #e8d9b0 82%, transparent);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  margin: 0 32px;
}
.cast__bar--empty {
  width: 110px;
  background: rgba(255, 255, 255, 0.05);
}
.cast__line.is-filled {
  animation: linepop 0.5s var(--ease-drop);
}
@keyframes linepop {
  0% { transform: scaleY(0.2); opacity: 0.3; }
  100% { transform: scaleY(1); opacity: 1; }
}
.cast__line.is-move .cast__bar {
  background: linear-gradient(to right, transparent, var(--cinnabar-soft) 18%, var(--cinnabar-soft) 82%, transparent);
  box-shadow: 0 0 10px rgba(201, 106, 92, 0.6);
}

/* ---------- 铜钱 ---------- */
.cast__coins {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 34px;
  align-items: flex-start;
  min-height: 156px;
  padding: 26px 0 26px;
  perspective: 700px;
}
/* 落定后的案面阴影 */
.cast__coins.is-settled .coin3d::after {
  content: '';
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: -8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(0, 0, 0, 0.45), transparent 70%);
  filter: blur(2px);
  animation: settle-shade 0.4s var(--ease-ink);
}
@keyframes settle-shade {
  from { transform: scaleX(1.4); opacity: 0; }
  to { transform: scaleX(1); opacity: 1; }
}

.coin3d {
  --d: 0ms;
  position: relative;
  width: 64px;
  height: 64px;
  transform-style: preserve-3d;
}

.coin3d__inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  animation: fly 720ms var(--d) var(--ease-drop) both;
}
@keyframes fly {
  0% { transform: translateY(0) rotateX(6deg) rotateZ(0deg) rotateY(0deg); opacity: 0; }
  8% { opacity: 1; }
  35% { transform: translateY(-120px) rotateX(260deg) rotateZ(40deg) rotateY(120deg); }
  60% { transform: translateY(-30px) rotateX(420deg) rotateZ(-30deg) rotateY(240deg); }
  100% { transform: translateY(0) rotateX(480deg) rotateZ(24deg) rotateY(360deg); opacity: 1; }
}
.coin3d.is-landed .coin3d__inner {
  animation: settle 380ms var(--ease-drop) both;
}
@keyframes settle {
  0% { transform: translateY(-16px) rotateX(520deg) rotateZ(24deg) rotateY(720deg); }
  100% { transform: translateY(0) rotateY(var(--face, 0deg)) rotateX(0deg) rotateZ(12deg); }
}

.coin3d__face {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  backface-visibility: hidden;
  overflow: hidden;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.45);
}
.coin3d__svg {
  width: 100%;
  height: 100%;
  display: block;
}
/* 字面在背面：落定朝向以 --face 决定显背或显字 */
.coin3d__face--zi {
  transform: rotateY(180deg);
}
.coin3d__face--bei {
  transform: rotateY(0deg);
}

.cast__rest {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 13px;
  letter-spacing: 0.14em;
  color: rgba(224, 208, 178, 0.4);
}

/* ---------- 结果宣告 ---------- */
.cast__outcome {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 12px;
  margin: 6px auto 0;
  max-width: 460px;
  padding: 10px 18px;
  border: 1px solid var(--gold-line);
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(168, 132, 44, 0.18), rgba(168, 132, 44, 0.06));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
.cast__outcome.is-move {
  border-color: rgba(201, 106, 92, 0.7);
  background: linear-gradient(135deg, rgba(176, 58, 46, 0.22), rgba(176, 58, 46, 0.06));
}
.cast__outcome-no {
  font-size: 12px;
  letter-spacing: 0.14em;
  color: rgba(224, 208, 178, 0.6);
}
.cast__outcome-label {
  font-family: var(--font-title);
  font-size: 20px;
  color: #e8d9b0;
  letter-spacing: 0.08em;
}
.cast__outcome.is-move .cast__outcome-label {
  color: #f0b2a0;
}
.cast__outcome-detail {
  font-size: 12px;
  color: rgba(224, 208, 178, 0.55);
}
.cast__outcome-move {
  color: #f0b2a0;
  margin-left: 2px;
}
.outcome-enter-active,
.outcome-leave-active {
  transition: opacity 0.3s var(--ease-ink), transform 0.3s var(--ease-ink);
}
.outcome-enter-from,
.outcome-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* ---------- 控台 ---------- */
.cast__ctrl {
  margin-top: 14px;
  text-align: center;
}
.cast__hint {
  font-size: 12.5px;
  color: rgba(224, 208, 178, 0.5);
  margin-bottom: 14px;
}
.cast__btns {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--paper);
  color: var(--ink-soft);
  font-size: 14.5px;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all 0.25s;
}
.btn:hover {
  border-color: var(--cinnabar-soft);
  color: var(--cinnabar);
}
.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.btn--primary {
  background: var(--cinnabar);
  border-color: var(--cinnabar);
  color: #faf7f0;
}
.btn--primary:hover {
  background: var(--cinnabar-soft);
  color: #faf7f0;
}
.btn--ghost {
  background: transparent;
  color: rgba(224, 208, 178, 0.8);
}
.btn--ghost:hover {
  color: var(--cinnabar-soft);
}

@media (max-width: 640px) {
  .cast__stage {
    padding: 20px 16px 18px;
  }
  .coin3d {
    width: 52px;
    height: 52px;
  }
  .cast__coins {
    gap: 26px;
  }
  .cast__bar--yang,
  .cast__bar--empty {
    width: 88px;
  }
  .cast__bar--yin {
    width: 36px;
    margin: 0 26px;
  }
}
</style>