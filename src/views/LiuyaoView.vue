<script setup lang="ts">
import { ref, computed } from 'vue'
import { getMethod } from '@/data/methods'
import { ASK_CATEGORIES, divineLiuyao, type AskCat, type LiuyaoPan } from '@/core/liuyao-verdict'
import type { TossResult } from '@/core/liuyao-cast'
import { zhiGuaValues, yaoToLine, huGuaLines } from '@/core/liuyao-mount'
import { readLiuyao } from '@/core/liuyao-reading'
import { nowGanzhi } from '@/core/clock'
import { useEvidence } from '@/composables/useEvidence'
import { useSfx } from '@/composables/useSfx'
import CastScene from '@/components/CastScene.vue'
import GuideSteps from '@/components/GuideSteps.vue'

const meta = getMethod('liuyao')
const { records, add, updateNote, remove } = useEvidence()
const evOpen = ref(false)
const mine = computed(() => records.value.filter((r) => r.method === 'liuyao'))
const sfx = useSfx()

function saveEvidence() {
  if (!pan.value) return
  add({
    method: 'liuyao',
    question: pan.value.question,
    gua: pan.value.benName + (pan.value.zhiName !== pan.value.benName ? `→${pan.value.zhiName}` : ''),
    conclusion: pan.value.conclusion
  })
  evOpen.value = true
}

const question = ref('')
const ask = ref<AskCat>(ASK_CATEGORIES[0])

const tosses = ref<TossResult[]>([])
const done = ref(false)
const pan = ref<LiuyaoPan | null>(null)

const step = ref(1)
const tossCount = computed(() => tosses.value.length)
const ready = computed(() => tossCount.value >= 6)
const canDescend = computed(() => question.value.trim().length > 0)

function pickAsk(c: AskCat) {
  ask.value = c
}

function clearTosses() {
  tosses.value = []
  pan.value = null
  done.value = false
  step.value = 2
}

function onTossed(r: TossResult) {
  tosses.value.push(r)
}

function divine() {
  if (!ready.value) return
  const values = tosses.value.map((t) => t.value)
  pan.value = divineLiuyao(question.value.trim(), ask.value.id, values, nowGanzhi().pillars)
  done.value = true
  step.value = 3
  sfx.reveal()
}

const viewRows = computed(() => {
  if (!pan.value) return []
  return [...pan.value.benRows].reverse()
})

function lineCls(row: { yin: boolean; moving: boolean }) {
  return {
    hexbar: true,
    'hexbar--yin': row.yin,
    'hexbar--yang': !row.yin,
    'hexbar--move': row.moving
  }
}

const triCompare = computed(() => {
  if (!pan.value) return null
  const zhiLines = zhiGuaValues(pan.value.values).map((v) => ({ yin: v === 8, moving: false }))
  const huLines = huGuaLines(pan.value.values.map(yaoToLine)).map((l) => ({
    yin: l === 0,
    moving: false
  }))
  return {
    // 本卦取装卦行的阴阳（含动）
    ben: pan.value.benRows.map((r) => ({ yin: r.yin, moving: r.moving })),
    zhi: [...zhiLines].reverse(),
    hu: [...huLines].reverse()
  }
})

const readings = computed(() => (pan.value ? readLiuyao(pan.value) : []))

const detailOpen = ref(false)

function smallBar(l: { yin: boolean; moving?: boolean }) {
  return {
    sbar: true,
    'sbar--yin': l.yin,
    'sbar--move': !!l.moving
  }
}
</script>

<template>
  <div class="lv">
    <header class="lv__head">
      <span class="lv__tag">{{ meta.tagline }}</span>
      <h1 class="lv__title">{{ meta.name }}</h1>
      <p class="lv__motto">{{ meta.motto }}</p>
    </header>

    <!-- 三步引导 -->
    <section class="panel">
      <GuideSteps :steps="meta.steps" :current="step" />
    </section>

    <!-- 第一步：凝神一问 -->
    <section v-if="step === 1" class="panel">
      <h2 class="panel__title">这一件，是什么事</h2>
      <textarea
        v-model="question"
        class="q"
        rows="3"
        maxlength="120"
        placeholder="一字一句写下来：这单生意能不能成？东西还能不能找回来？…"
      ></textarea>
      <div class="ask">
        <span class="ask__label faint">占问何事</span>
        <button
          v-for="c in ASK_CATEGORIES"
          :key="c.id"
          class="ask__chip"
          :class="{ 'is-on': ask.id === c.id }"
          @click="pickAsk(c)"
        >
          {{ c.label }}
        </button>
      </div>
      <div class="panel__foot">
        <p class="panel__hint faint">一事不二占：同一件事，当日不重复摇。</p>
        <button class="btn" :disabled="!canDescend" @click="(step = 2)">凝神已定，去摇卦</button>
      </div>
    </section>

    <!-- 第二步：摇卦六次 -->
    <section v-if="step === 2" class="panel">
      <h2 class="panel__title">三枚铜钱掷六次</h2>
      <CastScene @tossed="onTossed" @clear="clearTosses" />
      <div class="panel__foot">
        <p class="panel__hint faint">每掷一爻，铜钱落定后爻画便写入卦位。六爻齐后即可请断语。</p>
        <div class="panel__btns">
          <button class="btn btn--primary" :disabled="!ready" @click="divine">六爻已成，请断语</button>
        </div>
      </div>
    </section>

    <!-- 第三部分：结果盘 -->
    <template v-if="step === 3 && pan">
      <section class="panel result">
        <div class="result__badge faint">本卦 · 变卦 · 断语</div>
        <h2 class="result__conclusion">{{ pan.conclusion }}</h2>

        <div class="boards">
          <div class="board">
            <h3 class="board__title">本卦 · {{ pan.benName }}
              <span v-if="pan.zhiName !== pan.benName" class="board__sub faint">动化 {{ pan.zhiName }}</span>
            </h3>
            <div class="hexrow" aria-hidden="true">
              <div v-for="row in viewRows" :key="row.position" :class="lineCls(row)">
                <span v-if="row.moving" class="hexrow__dot">●</span>
              </div>
            </div>
            <table class="najia">
              <thead>
                <tr><th>六神</th><th>干支</th><th>五行</th><th>六亲</th><th>爻</th><th>世应</th></tr>
              </thead>
              <tbody>
                <tr v-for="row in viewRows" :key="row.position" :class="{ 'is-move': row.moving }">
                  <td>{{ row.liushen }}</td>
                  <td>{{ row.ganzhi }}</td>
                  <td>{{ row.wuxing }}</td>
                  <td>{{ row.liuqin }}</td>
                  <td class="yao">{{ row.yin ? '⚋' : '⚊' }}{{ row.moving ? '·动' : '' }}</td>
                  <td>{{ row.shiying || '' }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="pan.zhiData" class="board__vbi faint">{{ pan.timeGanzhi.year }} 年 {{ pan.timeGanzhi.month }} 月 {{ pan.timeGanzhi.day }} 日 {{ pan.timeGanzhi.hour }} 时 · 月建{{ pan.monthZhi }} · 旬空{{ pan.xunkong }}</p>
          </div>

          <!-- 卦变一览：本 / 变 / 互 -->
          <div v-if="triCompare" class="board tri">
            <h3 class="board__title">卦变一览</h3>
            <div class="tri__cols">
              <div class="tri__col">
                <span class="tri__label">本卦 · {{ pan.benName }}</span>
                <div class="tri__lines">
                  <span v-for="(l, i) in triCompare.ben" :key="i" :class="smallBar(l)"></span>
                </div>
              </div>
              <div class="tri__col">
                <span class="tri__label">变卦 · {{ pan.zhiName }}</span>
                <div class="tri__lines">
                  <span v-for="(l, i) in triCompare.zhi" :key="i" :class="smallBar(l)"></span>
                </div>
              </div>
              <div v-if="pan.huData" class="tri__col">
                <span class="tri__label">互卦 · {{ pan.huData.name }}</span>
                <div class="tri__lines">
                  <span v-for="(l, i) in triCompare.hu" :key="i" :class="smallBar(l)"></span>
                </div>
              </div>
            </div>
            <p class="tri__note faint">动爻为变机：本卦老阴老阳处变，化作之卦；互卦为中途之势。（《易》互体法）</p>
          </div>
        </div>
      </section>

      <!-- 白话解读 -->
      <section class="panel">
        <h2 class="panel__title">白话解读 <span class="panel__sub faint">这件事对你意味着什么</span></h2>
        <ul class="readings">
          <li v-for="(r, i) in readings" :key="i" class="reading">
            <b class="reading__title">{{ r.title }}</b>
            <p class="reading__text">{{ r.text }}</p>
            <span class="reading__source">{{ r.source }}</span>
          </li>
        </ul>
      </section>

      <!-- 卦象细目（出处可见） -->
      <section class="panel">
        <h2 class="panel__title is-btn" @click="detailOpen = !detailOpen">
          卦象细目 · 每条附出处
          <span class="panel__caret">{{ detailOpen ? '收起' : '展开' }}</span>
        </h2>
        <p v-if="!detailOpen" class="faint panel__hint">想看盘面如何一步步断出，可展开；不想看术语，直接跳过也行。</p>
        <ul v-if="detailOpen" class="verdicts">
          <li v-for="(v, i) in pan.verdicts" :key="i" class="verdict">
            <p class="verdict__text">{{ v.text }}</p>
            <span class="verdict__source">{{ v.source }}</span>
          </li>
        </ul>
      </section>

      <section class="bounds">
        <p v-for="(b, i) in meta.bounds" :key="i" class="bounds__item faint">{{ b }}</p>
        <button class="btn" @click="saveEvidence">存入应验簿</button>
      </section>

      <!-- 应验簿 -->
      <section class="panel ev">
        <h2 class="panel__title is-btn" @click="evOpen = !evOpen">
          应验簿 · {{ mine.length }} 笔
          <span class="panel__caret">{{ evOpen ? '收起' : '展开' }}</span>
        </h2>
        <p v-if="!evOpen" class="faint ev__hint">翻一翻旧占，看当时之言验与未验。</p>
        <ul v-if="evOpen" class="ev__list">
          <li v-if="mine.length === 0" class="faint ev__empty">尚无记录。成一卦后点「存入应验簿」，日后回看。</li>
          <li v-for="r in mine" :key="r.id" class="ev__item">
            <div class="ev__head">
              <b class="ev__gua">{{ r.gua }}</b>
              <span class="ev__date faint">{{ r.createdAt }}</span>
              <button class="ev__del" @click="remove(r.id)">删</button>
            </div>
            <p class="ev__q faint">问：{{ r.question }}</p>
            <p class="ev__c">{{ r.conclusion }}</p>
            <input
              v-model="r.note"
              class="ev__note"
              placeholder="应验了吗？随手记一句…"
              @change="updateNote(r.id, r.note ?? '')"
            />
          </li>
        </ul>
      </section>
    </template>

    <!-- 未成卦时的占前守则 -->
    <section v-if="step === 1" class="bounds">
      <p class="bounds__item faint">只断所问这一件事，不越到命、寿、健康。</p>
      <p class="bounds__item faint">一事不二占：同一件事，当日不重复摇。</p>
    </section>
  </div>
</template>

<style scoped>
.lv {
  padding-top: 32px;
}
.lv__head {
  text-align: center;
  padding: 24px 0 28px;
}
.lv__tag {
  font-size: 13px;
  letter-spacing: 0.3em;
  color: var(--cinnabar);
}
.lv__title {
  font-size: clamp(40px, 8vw, 58px);
  letter-spacing: 0.3em;
  margin: 12px 0 8px;
}
.lv__motto {
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
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 20px;
  margin-bottom: 18px;
}
.panel__title.is-btn {
  cursor: pointer;
  justify-content: space-between;
}
.panel__sub {
  font-size: 12.5px;
  font-weight: 400;
}
.panel__caret {
  font-size: 13px;
  font-weight: 400;
  color: var(--ink-faint);
}
.panel__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 22px;
}
.panel__btns {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.panel__hint {
  font-size: 13px;
}

/* 引导条样式已迁移至 GuideSteps 组件 */

/* 问题输入 */
.q {
  width: 100%;
  resize: vertical;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.7;
}
.q:focus {
  outline: none;
  border-color: var(--cinnabar-soft);
}
.ask {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 16px;
}
.ask__label {
  font-size: 13px;
  margin-right: 4px;
}
.ask__chip {
  padding: 6px 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 13.5px;
  color: var(--ink-soft);
  background: transparent;
  transition: all 0.25s;
}
.ask__chip:hover {
  border-color: var(--cinnabar-soft);
  color: var(--cinnabar);
}
.ask__chip.is-on {
  border-color: var(--cinnabar);
  background: rgba(176, 58, 46, 0.08);
  color: var(--cinnabar);
}

/* 铜钱场景样式已迁移至 CastScene 组件 */

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

/* 结果 */
.result__badge {
  font-size: 12.5px;
  letter-spacing: 0.2em;
  margin-bottom: 10px;
}
.result__conclusion {
  font-family: var(--font-title);
  font-size: clamp(20px, 3.4vw, 26px);
  line-height: 1.8;
  padding: 4px 0 22px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 22px;
}
.board__title {
  font-size: 19px;
  margin-bottom: 12px;
}
.board__sub {
  font-size: 13px;
  font-weight: 400;
}
.hexrow {
  display: flex;
  flex-direction: column-reverse;
  gap: 6px;
  margin: 6px 0 16px;
}
.hexbar {
  position: relative;
  width: 148px;
  height: 8px;
  border-radius: 3px;
  background: var(--ink);
}
.hexbar--yin {
  background: transparent;
  border-top: 8px solid var(--ink);
  height: 0;
}
.hexbar--move {
  background-color: var(--cinnabar);
}
.hexbar--yin.hexbar--move {
  border-color: var(--cinnabar);
}
.hexrow__dot {
  position: absolute;
  right: -22px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--cinnabar);
  font-size: 12px;
}
.najia {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.najia th,
.najia td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--line);
  text-align: center;
}
.najia th {
  font-weight: 600;
  color: var(--ink-soft);
  font-size: 12.5px;
}
.najia tr.is-move {
  background: rgba(176, 58, 46, 0.05);
}
.najia tr.is-move td:first-child {
  border-left: 3px solid var(--cinnabar);
}
.yao {
  letter-spacing: 0.1em;
}
.board__vbi {
  font-size: 12.5px;
  margin-top: 12px;
}

/* 卦变一览 */
.tri {
  margin-top: 18px;
}
.tri__cols {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.tri__col {
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
}
.tri__label {
  font-size: 13px;
  color: var(--ink-soft);
  letter-spacing: 0.06em;
}
.tri__lines {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: flex-start;
  margin-top: 12px;
}
.sbar {
  width: 92px;
  height: 6px;
  border-radius: 2px;
  background: var(--ink);
}
.sbar--yin {
  background: transparent;
  border-top: 6px solid var(--ink);
  height: 0;
}
.sbar--move {
  background-color: var(--cinnabar);
}
.sbar--yin.sbar--move {
  border-color: var(--cinnabar);
}
.tri__note {
  font-size: 12.5px;
  margin-top: 12px;
}

/* 白话解读 */
.readings {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.reading {
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-left: 3px solid var(--cinnabar-soft);
  border-radius: 0 10px 10px 0;
  background: var(--paper);
}
.reading__title {
  font-family: var(--font-title);
  font-size: 16px;
  display: block;
  margin-bottom: 6px;
}
.reading__text {
  line-height: 1.8;
  font-size: 14.5px;
  color: var(--ink-soft);
}
.reading__source {
  display: inline-block;
  margin-top: 8px;
  font-size: 12px;
  color: var(--cinnabar);
  letter-spacing: 0.06em;
}

/* 断语细目 */
.verdicts {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.verdict {
  padding: 14px 16px;
  border-left: 3px solid var(--line);
  background: var(--paper);
  border-radius: 0 8px 8px 0;
  transition: border-color 0.3s;
}
.verdict:hover {
  border-color: var(--cinnabar-soft);
}
.verdict__text {
  line-height: 1.8;
  font-size: 15px;
}
.verdict__source {
  display: inline-block;
  margin-top: 8px;
  font-size: 12px;
  color: var(--cinnabar);
  letter-spacing: 0.06em;
}

.bounds {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 22px;
  margin-top: 18px;
  justify-content: center;
  align-items: center;
}
.bounds__item {
  font-size: 13px;
  letter-spacing: 0.04em;
}

/* 应验簿 */
.ev__hint {
  font-size: 13px;
}
.ev__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ev__empty {
  font-size: 13.5px;
}
.ev__item {
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
}
.ev__head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ev__gua {
  font-family: var(--font-title);
  font-size: 17px;
}
.ev__date {
  flex: 1;
  font-size: 12px;
}
.ev__del {
  border: none;
  background: none;
  color: var(--ink-faint);
  font-size: 12px;
  cursor: pointer;
}
.ev__del:hover {
  color: var(--cinnabar);
}
.ev__q {
  font-size: 13px;
  margin-top: 6px;
}
.ev__c {
  font-size: 14.5px;
  line-height: 1.7;
  margin-top: 6px;
  color: var(--ink-soft);
}
.ev__note {
  width: 100%;
  margin-top: 10px;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--paper-mist);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 13.5px;
}

@media (max-width: 640px) {
  .panel {
    padding: 20px 18px;
  }
  .najia {
    font-size: 12.5px;
  }
  .najia th,
  .najia td {
    padding: 7px 4px;
  }
}
</style>