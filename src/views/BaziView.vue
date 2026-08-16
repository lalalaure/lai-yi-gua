<script setup lang="ts">
import { ref, computed } from 'vue'
import { getMethod } from '@/data/methods'
import { paiPan, type BaziPan } from '@/core/bazi'
import { getWuxingGuide } from '@/data/wuxing-guide'
import { useReveal } from '@/composables/useReveal'
import GuideSteps from '@/components/GuideSteps.vue'
import RadarChart from '@/components/RadarChart.vue'
import LineChart from '@/components/LineChart.vue'

const meta = getMethod('bazi')

const date = ref('1990-06-15')
const hour = ref(14)
const sex = ref<1 | 0>(1)
const step = ref(1)
const pan = ref<BaziPan | null>(null)

useReveal()

const parts = computed(() => {
  const [y, m, d] = date.value.split('-').map(Number)
  return { y, m, d }
})
const valid = computed(() => {
  const { y, m, d } = parts.value
  return Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d) && m >= 1 && m <= 12 && d >= 1 && d <= 31
})

function build() {
  if (!valid.value) return
  const { y, m, d } = parts.value
  pan.value = paiPan({ year: y, month: m, day: d, hour: hour.value }, sex.value)
  step.value = 3
}

function reset() {
  pan.value = null
  step.value = 1
}

const hoursOpts = Array.from({ length: 24 }, (_, i) => i)

// 雷达图数据（五行）
const radarAxes = computed(() => {
  if (!pan.value) return []
  const max = Math.max(1, ...pan.value.wuxing.map((w) => w.count))
  return pan.value.wuxing.map((w) => ({
    label: w.wuxing,
    value: w.count,
    ratio: Math.max(0.18, w.count / max)
  }))
})

// ---- 四柱点开详解 ----
const openPillar = ref<string | null>(null)
function togglePillar(name: string) {
  openPillar.value = openPillar.value === name ? null : name
}
const activeExplain = computed(() =>
  pan.value ? (pan.value.pillarExplains.find((p) => p.name === openPillar.value) ?? null) : null
)

// ---- 五行白话卡 ----
const wxOrder = ['木', '火', '土', '金', '水']

// ---- 大运折线图数据 ----
const dayunPoints = computed(() => {
  if (!pan.value) return []
  return pan.value.dayunRead.map((d) => ({
    label: d.ganZhi,
    value: d.score,
    sub: d.index === 0 ? '起运前' : `${d.startAge}岁`
  }))
})
const dayunGuides = [95, 66, 50, 34, 5]

function getWxSuited(wx: string): string {
  return getWuxingGuide(wx)?.suited ?? ''
}
function getWxTrait(wx: string): string {
  return getWuxingGuide(wx)?.trait ?? ''
}
</script>

<template>
  <div class="bz">
    <header class="bz__head">
      <span class="bz__tag">{{ meta.tagline }}</span>
      <h1 class="bz__title">{{ meta.name }}</h1>
      <p class="bz__motto">{{ meta.motto }}</p>
    </header>

    <!-- 逐步引导 -->
    <section class="panel">
      <GuideSteps :steps="meta.steps" :current="step" />
    </section>

    <!-- 生表单 -->
    <section v-if="step === 1" class="panel">
      <h2 class="panel__title">你的生辰</h2>
      <div class="form">
        <label class="form__item">
          <span class="form__label">出生日期</span>
          <input v-model="date" type="date" class="form__input" />
        </label>
        <label class="form__item">
          <span class="form__label">出生时辰</span>
          <select v-model.number="hour" class="form__input">
            <option v-for="h in hoursOpts" :key="h" :value="h">{{ h }} 时{{ h >= 23 || h < 1 ? '（子时）' : '' }}{{ h === 1 ? '（丑时）' : '' }}</option>
          </select>
        </label>
        <div class="form__item">
          <span class="form__label">性别</span>
          <div class="form__sex">
            <button class="sex-btn" :class="{ 'is-on': sex === 1 }" @click="sex = 1">乾造 · 男</button>
            <button class="sex-btn" :class="{ 'is-on': sex === 0 }" @click="sex = 0">坤造 · 女</button>
          </div>
        </div>
      </div>
      <p class="form__note faint">按公历填写即可，节气（立春换年、节令换月）由历法自动校准。若闭关差一小时以上可手动微调。</p>
      <div class="panel__foot">
        <button class="btn btn--primary" :disabled="!valid" @click="build">排盘读势</button>
      </div>
    </section>

    <!-- 结果盘 -->
    <template v-if="step >= 2 && pan">
      <section class="panel result reveal reveal--scale">
        <div class="result__badge faint">{{ pan.gender.label }} · 公历 {{ pan.solar }} · 农历 {{ pan.lunar }}</div>
        <h2 class="result__conclusion">{{ pan.conclusion }}</h2>

        <!-- 四柱盘（点开详解） -->
        <div class="four">
          <div
            v-for="(p, pIdx) in pan.pillarExplains"
            :key="p.name"
            class="four__col"
            :class="{ 'is-open': openPillar === p.name }"
            @click="togglePillar(p.name)"
          >
            <h3 class="four__name">{{ p.name }} <span class="four__expand faint">{{ openPillar === p.name ? '收起' : '点开' }}</span></h3>
            <p class="four__naYin faint">{{ pan.pillars[pIdx].naYin }}</p>
            <div class="four__gan">
              <span class="four__sheng faint">{{ pan.pillars[pIdx].shiShenGan }}</span>
              <span class="four__zi">{{ pan.pillars[pIdx].gan }}</span>
            </div>
            <div class="four__zhi">
              <span v-for="(g, i) in pan.pillars[pIdx].hiddenGans" :key="i" class="four__hide">
                <span class="four__hide-sheng faint">{{ pan.pillars[pIdx].shiShenZhi[i] ?? '' }}</span>
                {{ g }}
              </span>
            </div>
          </div>
        </div>
        <p class="four__foot faint">点击柱位可展开白话详解 · 日柱天干即“日主”：{{ pan.dayGan }}（{{ pan.dayZhi }}生）</p>

        <!-- 四柱详解（点开） -->
        <transition name="fade">
          <div v-if="activeExplain" class="pdetail">
            <h4 class="pdetail__role">{{ activeExplain.roleText }} · {{ activeExplain.span }}</h4>
            <p class="pdetail__explain">{{ activeExplain.explain }}</p>
            <p class="pdetail__gan">
              <b>{{ activeExplain.ganText.split('：')[0] }}</b>：{{ activeExplain.ganText.split('：').slice(1).join('：') }}
            </p>
            <div class="pdetail__hides">
              <span v-for="h in activeExplain.hides" :key="h.gan" class="pdetail__hide">
                {{ h.gan }}·{{ h.shishen }}<i class="faint">{{ h.oneLiner }}</i>
              </span>
            </div>
            <p class="pdetail__advice">{{ activeExplain.advice }}</p>
          </div>
        </transition>

        <!-- 五行势 -->
        <div class="wuxing reveal reveal--scale">
          <div class="wuxing__chart">
            <RadarChart :axes="radarAxes" />
          </div>
          <ul class="wuxing__bars">
            <li v-for="w in pan.wuxing" :key="w.wuxing" class="bar">
              <span class="bar__name">{{ w.wuxing }}</span>
              <span class="bar__track">
                <span class="bar__fill" :style="{ width: (w.count / Math.max(1, pan.wuxing[0].count)) * 100 + '%' }"></span>
              </span>
              <span class="bar__val">{{ w.count }}</span>
            </li>
          </ul>
        </div>

        <!-- 大运走势：折线图 + 逐运白话 -->
        <div v-if="dayunPoints.length" class="dayun reveal">
          <h3 class="dayun__title">大运走势指数
            <span class="faint">{{ pan.yun.label }} · {{ pan.yun.startAge }} 起运 · {{ pan.yun.startYmd }} · 规则推演，仅供趋势参考</span>
          </h3>
          <div class="dayun__chart">
            <LineChart :points="dayunPoints" :guides="dayunGuides" />
          </div>
          <ol class="dayun__list stagger">
            <li v-for="(d, i) in pan.dayunRead" :key="d.index" class="dayun__card" :class="`dayun__card--${d.tag}`" :style="{ '--i': i }">
              <div class="dayun__head">
                <span class="dayun__gz">{{ d.ganZhi }}</span>
                <span class="dayun__range faint">{{ d.index === 0 ? '起运前' : d.startAge + '岁起' }} · {{ d.startAge }}–{{ d.endAge }}岁</span>
                <span class="dayun__score" :class="`is-${d.tag}`">{{ d.score }} <i class="faint">指数{{ d.tag }}</i></span>
              </div>
              <p class="dayun__text">{{ d.text }}</p>
              <p class="dayun__advice">建议：{{ d.advice }}</p>
            </li>
          </ol>
        </div>

        <!-- 神煞 -->
        <div v-if="pan.shenSha.length" class="shensha">
          <h3 class="shensha__title">入命神煞</h3>
          <span v-for="s in pan.shenSha" :key="s" class="shensha__chip">{{ s }}</span>
        </div>

        <!-- 格局成否 -->
        <div class="geju reveal">
          <h3 class="geju__title">格局成否
            <span class="faint">子平法 · 以月令为纲，出《渊海子平·论格局》《子平真诠》</span>
          </h3>
          <div class="geju__head">
            <span class="geju__name">{{ pan.geju.name }}</span>
            <span class="geju__badge" :class="pan.geju.cheng ? 'is-cheng' : 'is-po'">{{ pan.geju.cheng ? '成格' : '未成格' }}</span>
          </div>
          <p class="geju__basis">{{ pan.geju.basis }}</p>
          <p v-if="pan.geju.poReason" class="geju__po">{{ pan.geju.poReason }}</p>
          <p v-if="pan.geju.oneLiner" class="geju__one">{{ pan.geju.oneLiner }}</p>
          <p v-if="pan.geju.trait" class="geju__trait"><b>此格局之人：</b>{{ pan.geju.trait }}</p>
          <p v-if="pan.geju.advice" class="geju__advice"><b>发挥建议：</b>{{ pan.geju.advice }}</p>
        </div>
      </section>

      <!-- 总体解读（读势） -->
      <section class="panel reveal">
        <h2 class="panel__title">读势 · 总体解读 <span class="panel__sub faint">性格画像 · 天赋方向 · 大运流年，每条附出处</span></h2>
        <ul class="reads">
          <li v-for="(r, i) in pan.readings" :key="i" class="read">
            <h3 class="read__title">{{ r.title }}</h3>
            <p class="read__text">{{ r.text }}</p>
            <span class="read__source">{{ r.source }}</span>
          </li>
        </ul>
      </section>

      <!-- 五行白话罗盘 -->
      <section class="panel reveal">
        <h2 class="panel__title">五行白话罗盘 <span class="panel__sub faint">每一种五行对你意味着什么</span></h2>
        <div class="wxboard">
          <div
            v-for="wx in wxOrder"
            :key="wx"
            class="wxcard"
            :class="`wxcard--${pan.wuxingBoard.cards[wx].role}`"
          >
            <span class="wxcard__name">{{ wx }}</span>
            <span class="wxcard__role">{{ pan.wuxingBoard.cards[wx].role }}</span>
            <p class="wxcard__note">{{ pan.wuxingBoard.cards[wx].note }}</p>
            <p v-if="pan.wuxingBoard.favor === wx || pan.wuxingBoard.strongest === wx" class="wxcard__extra faint">
              {{ pan.wuxingBoard.favor === wx ? `偏喜 ${wx}：适合${getWxSuited(wx)}` : `最旺 ${wx}：${getWxTrait(wx)}` }}
            </p>
          </div>
        </div>
      </section>

      <section class="bounds">
        <p v-for="(b, i) in meta.bounds" :key="i" class="bounds__item faint">{{ b }}</p>
        <button class="btn btn--ghost" @click="reset">重排一盘</button>
      </section>
    </template>
  </div>
</template>

<style scoped>
.bz {
  padding-top: 32px;
}
.bz__head {
  text-align: center;
  padding: 24px 0 28px;
}
.bz__tag {
  font-size: 13px;
  letter-spacing: 0.3em;
  color: var(--cinnabar);
}
.bz__title {
  font-size: clamp(40px, 8vw, 58px);
  letter-spacing: 0.3em;
  margin: 12px 0 8px;
}
.bz__motto {
  font-family: var(--font-accent);
  color: var(--ink-soft);
  letter-spacing: 0.08em;
}
.panel {
  margin-top: 20px;
  padding: 28px 32px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--paper-mist);
}
.panel__title {
  font-size: 20px;
  margin-bottom: 18px;
}
.panel__sub {
  font-size: 12.5px;
  font-weight: 400;
}
.panel__foot {
  margin-top: 22px;
}

/* 引导条样式已迁移至 GuideSteps 组件 */

.form {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.form__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form__label {
  font-size: 13px;
  color: var(--ink-soft);
  letter-spacing: 0.06em;
}
.form__input {
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 15px;
}
.form__input:focus {
  outline: none;
  border-color: var(--cinnabar-soft);
}
.form__sex {
  display: flex;
  gap: 8px;
}
.sex-btn {
  flex: 1;
  padding: 10px 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
  color: var(--ink-soft);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.25s;
}
.sex-btn.is-on {
  border-color: var(--cinnabar);
  background: rgba(176, 58, 46, 0.08);
  color: var(--cinnabar);
}
.form__note {
  font-size: 13px;
  margin-top: 14px;
  line-height: 1.7;
}

.result__badge {
  font-size: 12.5px;
  letter-spacing: 0.16em;
  margin-bottom: 10px;
}
.result__conclusion {
  font-family: var(--font-title);
  font-size: clamp(18px, 3vw, 24px);
  line-height: 1.8;
  padding: 4px 0 20px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 24px;
}

.four {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.four__col {
  text-align: center;
  padding: 18px 12px 20px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
  cursor: pointer;
  transition: border-color 0.25s, box-shadow 0.25s;
}
.four__col:hover {
  border-color: var(--cinnabar-soft);
}
.four__col.is-open {
  border-color: var(--cinnabar);
  box-shadow: 0 0 0 1px var(--cinnabar-soft);
}
.four__name {
  font-size: 14px;
  color: var(--ink-soft);
  letter-spacing: 0.2em;
  margin-bottom: 6px;
}
.four__naYin {
  font-size: 11.5px;
  margin-bottom: 14px;
}
.four__gan {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-bottom: 12px;
}
.four__sheng {
  font-size: 12px;
}
.four__zi {
  font-size: 34px;
  font-family: var(--font-title);
}
.four__zhi {
  display: flex;
  justify-content: center;
  gap: 8px;
  font-size: 15px;
}
.four__hide {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 17px;
}
.four__hide-sheng {
  font-size: 10px;
}
.four__foot {
  font-size: 12.5px;
  margin-top: 12px;
}
.four__expand {
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0;
  margin-left: 4px;
}

/* 四柱详解 */
.pdetail {
  margin-top: 16px;
  padding: 18px 20px;
  border: 1px solid var(--cinnabar-soft);
  border-radius: 12px;
  background: rgba(176, 58, 46, 0.04);
}
.pdetail__role {
  font-size: 15px;
  color: var(--cinnabar);
  margin-bottom: 8px;
}
.pdetail__explain {
  font-size: 14px;
  line-height: 1.85;
  color: var(--ink-soft);
}
.pdetail__gan {
  font-size: 14px;
  line-height: 1.8;
  margin-top: 10px;
  color: var(--ink-soft);
}
.pdetail__gan b {
  color: var(--ink);
}
.pdetail__hides {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.pdetail__hide {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 4px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--paper);
  font-size: 13px;
}
.pdetail__hide i {
  font-style: normal;
  font-size: 12px;
}
.pdetail__advice {
  font-size: 13.5px;
  line-height: 1.7;
  margin-top: 12px;
  padding: 8px 12px;
  background: var(--paper);
  border-radius: 8px;
  color: var(--ink);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 五行白话罗盘 */
.wxboard {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}
.wxcard {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
}
.wxcard__name {
  font-family: var(--font-title);
  font-size: 22px;
}
.wxcard__role {
  align-self: flex-start;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--paper-mist);
  border: 1px solid var(--line);
  color: var(--ink-soft);
}
.wxcard__note {
  font-size: 13px;
  line-height: 1.7;
  color: var(--ink-soft);
}
.wxcard__extra {
  font-size: 12px;
  line-height: 1.6;
}

.wuxing {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: center;
  margin-top: 24px;
}
.wuxing__chart {
  display: grid;
  place-items: center;
}
.wuxing__chart svg {
  width: 100%;
  max-width: 250px;
  height: auto;
}
.wuxing__bars {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bar {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}
.bar__name {
  width: 20px;
  text-align: center;
}
.bar__track {
  flex: 1;
  height: 10px;
  border-radius: 5px;
  background: rgba(26, 24, 22, 0.08);
  overflow: hidden;
}
.bar__fill {
  display: block;
  height: 100%;
  border-radius: 5px;
  background: var(--cinnabar);
}
.bar__val {
  width: 18px;
  text-align: right;
  color: var(--ink-soft);
}

.dayun {
  margin-top: 28px;
}
.dayun__title {
  font-size: 16px;
  margin-bottom: 14px;
}
.dayun__title .faint {
  font-size: 13px;
  font-weight: 400;
  margin-left: 6px;
}
.dayun__chart {
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
  padding: 10px 6px 4px;
  margin-bottom: 14px;
  overflow-x: auto;
}
.dayun__chart svg {
  width: 100%;
  min-width: 420px;
  height: auto;
}
.dayun__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dayun__card {
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-left-width: 3px;
  border-radius: 0 10px 10px 0;
  background: var(--paper);
}
.dayun__card--高 {
  border-left-color: var(--cinnabar);
}
.dayun__card--中 {
  border-left-color: #b09a6a;
}
.dayun__card--低 {
  border-left-color: #7b8a93;
}
.dayun__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}
.dayun__gz {
  font-family: var(--font-title);
  font-size: 17px;
}
.dayun__range {
  font-size: 12px;
  flex: 1;
}
.dayun__score {
  font-family: var(--font-title);
  font-size: 17px;
}
.dayun__score i {
  font-size: 11px;
  font-style: normal;
  margin-left: 4px;
}
.dayun__score.is-高 {
  color: var(--cinnabar);
}
.dayun__score.is-低 {
  color: #7b8a93;
}
.dayun__text {
  font-size: 14px;
  line-height: 1.8;
  color: var(--ink-soft);
  margin-top: 8px;
}
.dayun__advice {
  font-size: 13.5px;
  line-height: 1.7;
  margin-top: 6px;
  color: var(--ink);
  background: rgba(176, 58, 46, 0.05);
  padding: 6px 10px;
  border-radius: 6px;
  display: inline-block;
}

.shensha {
  margin-top: 24px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.shensha__title {
  font-size: 15px;
  margin-right: 4px;
}
.shensha__chip {
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid var(--cinnabar-soft);
  color: var(--cinnabar);
  font-size: 13px;
  background: rgba(176, 58, 46, 0.05);
}

.geju {
  margin-top: 24px;
  padding: 18px 20px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: linear-gradient(135deg, rgba(176, 58, 46, 0.04), rgba(176, 58, 46, 0.01));
}
.geju__title {
  font-size: 15px;
  margin-bottom: 14px;
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}
.geju__head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.geju__name {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--cinnabar);
}
.geju__badge {
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}
.geju__badge.is-cheng {
  background: rgba(46, 125, 50, 0.12);
  color: #2e7d32;
  border: 1px solid rgba(46, 125, 50, 0.35);
}
.geju__badge.is-po {
  background: rgba(176, 58, 46, 0.1);
  color: var(--cinnabar);
  border: 1px solid var(--cinnabar-soft);
}
.geju__basis {
  font-size: 14.5px;
  line-height: 1.9;
  color: var(--ink-soft);
}
.geju__po {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--cinnabar);
  background: rgba(176, 58, 46, 0.06);
  border-radius: 8px;
  padding: 8px 12px;
}
.geju__one {
  margin-top: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
}
.geju__trait,
.geju__advice {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--ink-soft);
}
.geju__trait b,
.geju__advice b {
  color: var(--ink);
}

.reads {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.read {
  padding: 16px 18px;
  border-left: 3px solid var(--line);
  background: var(--paper);
  border-radius: 0 8px 8px 0;
}
.read:hover {
  border-color: var(--cinnabar-soft);
}
.read__title {
  font-size: 16px;
  margin-bottom: 8px;
  letter-spacing: 0.06em;
}
.read__text {
  font-size: 14.5px;
  line-height: 1.9;
  color: var(--ink-soft);
}
.read__source {
  display: inline-block;
  margin-top: 10px;
  font-size: 12px;
  color: var(--cinnabar);
}

.bounds {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 22px;
  margin-top: 20px;
  justify-content: center;
  align-items: center;
}
.bounds__item {
  font-size: 13px;
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
}

@media (max-width: 640px) {
  .panel {
    padding: 20px 18px;
  }
  .form {
    grid-template-columns: 1fr;
  }
  .four {
    grid-template-columns: repeat(2, 1fr);
  }
  .wuxing {
    grid-template-columns: 1fr;
  }
  .wxboard {
    grid-template-columns: 1fr;
  }
}
</style>