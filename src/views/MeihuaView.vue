<script setup lang="ts">
import { ref, computed } from 'vue'
import { getMethod } from '@/data/methods'
import { meihuaByNumber, meihuaByTime, type MeihuaPan } from '@/core/meihua'
import { readMeihua } from '@/core/meihua-reading'
import { meihuaNowNums } from '@/core/clock'
import { useEvidence } from '@/composables/useEvidence'
import { useReveal } from '@/composables/useReveal'
import { useSfx } from '@/composables/useSfx'
import GuideSteps from '@/components/GuideSteps.vue'

const meta = getMethod('meihua')
const { records, add, updateNote, remove } = useEvidence()
const evOpen = ref(false)
const mine = computed(() => records.value.filter((r) => r.method === 'meihua'))
const sfx = useSfx()
useReveal()

function saveEvidence() {
  if (!pan.value) return
  add({
    method: 'meihua',
    question: pan.value.question,
    gua: pan.value.benData.name + '·' + pan.value.tiYongRelation,
    conclusion: pan.value.conclusion
  })
  evOpen.value = true
}

const mode = ref<'time' | 'number'>('time')
const question = ref('')
const n1 = ref(1)
const n2 = ref(2)
const n3 = ref(3)
const pan = ref<MeihuaPan | null>(null)
const step = ref(1)

const canDivine = computed(() =>
  question.value.trim().length > 0 && [n1.value, n2.value, n3.value].every((n) => n >= 1 && n <= 999)
)

function pickMode(m: 'time' | 'number') {
  mode.value = m
  pan.value = null
}

/** 三爻单卦的卦画 */
function triBits(t: string): number[] {
  const map: Record<string, number[]> = {
    乾: [1, 1, 1], 兑: [1, 1, 0], 离: [1, 0, 1], 震: [1, 0, 0],
    巽: [0, 1, 1], 坎: [0, 1, 0], 艮: [0, 0, 1], 坤: [0, 0, 0]
  }
  return map[t] ?? []
}

function triCls(b: number) {
  return { mini: true, 'mini--yang': b === 1, 'mini--yin': b === 0 }
}

const readings = computed(() => (pan.value ? readMeihua(pan.value) : []))
const detailOpen = ref(false)

function divine() {
  if (!canDivine.value) return
  const q = question.value.trim()
  if (mode.value === 'time') {
    pan.value = meihuaByTime(q, meihuaNowNums())
  } else {
    pan.value = meihuaByNumber(q, n1.value, n2.value, n3.value)
  }
  step.value = 3
  sfx.reveal()
}

function reset() {
  pan.value = null
  step.value = 1
}
</script>

<template>
  <div class="mh">
    <header class="mh__head">
      <span class="mh__tag">{{ meta.tagline }}</span>
      <h1 class="mh__title">{{ meta.name }}</h1>
      <p class="mh__motto">{{ meta.motto }}</p>
    </header>

    <section class="panel">
      <GuideSteps :steps="meta.steps" :current="step" />
    </section>

    <!-- 第一步 -->
    <section v-if="step === 1" class="panel">
      <h2 class="panel__title">这一念，是什么</h2>
      <textarea
        v-model="question"
        class="q"
        rows="2"
        maxlength="80"
        placeholder="此刻的心念，随手一句话即可：眼前这件事的气象如何？"
      ></textarea>

      <div class="mode">
        <button class="mode__btn" :class="{ 'is-on': mode === 'time' }" @click="pickMode('time')">
          <span class="mode__t">用此刻时间</span>
          <span class="mode__d faint">当下年内月日时 · 最快</span>
        </button>
        <button class="mode__btn" :class="{ 'is-on': mode === 'number' }" @click="pickMode('number')">
          <span class="mode__t">报三个数字</span>
          <span class="mode__d faint">心念所得 1–999 · 任选</span>
        </button>
      </div>

      <div v-if="mode === 'number'" class="nums">
        <label class="num">
          <span class="num__label faint">一数</span>
          <input v-model.number="n1" type="number" min="1" max="999" class="num__input" />
        </label>
        <label class="num">
          <span class="num__label faint">二数</span>
          <input v-model.number="n2" type="number" min="1" max="999" class="num__input" />
        </label>
        <label class="num">
          <span class="num__label faint">三数</span>
          <input v-model.number="n3" type="number" min="1" max="999" class="num__input" />
        </label>
      </div>
      <p v-else class="form__note faint">起卦以此刻农历年月日时：年支序＋月＋日为上卦，加时支序为下卦，总额定动爻。（《梅花易数·观梅占》）</p>

      <div class="panel__foot">
        <button class="btn btn--primary" :disabled="!canDivine" @click="divine">一念入卦</button>
      </div>
    </section>

    <!-- 结果 -->
    <template v-if="step >= 2 && pan">
      <section class="panel result reveal reveal--scale">
        <div class="result__badge faint">{{ pan.method }}</div>
        <h2 class="result__conclusion">{{ pan.conclusion }}</h2>

        <!-- 体用示意 -->
        <div class="tiyong">
          <div class="tiyong__col">
            <span class="tiyong__tag" style="background: var(--ink)">体</span>
            <p class="tiyong__name">{{ pan.ti }}</p>
            <small class="tiyong__x faint">{{ '天地水火雷风山泽'['乾坤坎离震巽艮兑'.indexOf(pan.ti)] || '—' }}</small>
            <div class="mini-h">
              <span v-for="(b, i) in triBits(pan.ti)" :key="i" :class="triCls(b)"></span>
            </div>
          </div>
          <div class="tiyong__rel">
            <span class="tiyong__rel-txt">{{ pan.tiYongRelation }}</span>
            <span class="tiyong__rel-sub faint">体为我 · 用为事</span>
          </div>
          <div class="tiyong__col">
            <span class="tiyong__tag" style="background: var(--cinnabar)">用</span>
            <p class="tiyong__name">{{ pan.yong }}</p>
            <small class="tiyong__x faint">{{ '天地水火雷风山泽'['乾坤坎离震巽艮兑'.indexOf(pan.yong)] || '—' }}</small>
            <div class="mini-h">
              <span v-for="(b, i) in triBits(pan.yong)" :key="i" :class="triCls(b)"></span>
            </div>
          </div>
        </div>

        <!-- 本卦变卦 -->
        <div class="gua">
          <div class="gua__col">
            <span class="gua__kind faint">本卦</span>
            <h3 class="gua__name">{{ pan.benData.name }}</h3>
            <p class="gua__plain faint">{{ pan.benData.plain }}</p>
          </div>
          <div v-if="pan.bianData" class="gua__col">
            <span class="gua__kind faint">变卦 · 第{{ pan.movingLine }}爻动</span>
            <h3 class="gua__name">{{ pan.bianData.name }}</h3>
            <p class="gua__plain faint">{{ pan.bianData.plain }}</p>
          </div>
          <div v-if="pan.huData" class="gua__col">
            <span class="gua__kind faint">互卦 · 过程</span>
            <h3 class="gua__name">{{ pan.huData.name }}</h3>
            <p class="gua__plain faint">{{ pan.huData.plain }}</p>
          </div>
        </div>
      </section>

      <!-- 读象篇 -->
      <section class="panel reveal">
        <h2 class="panel__title">读象篇 <span class="panel__sub faint">把卦当成一幅画来读</span></h2>
        <ul class="readings">
          <li v-for="(r, i) in readings" :key="i" class="reading">
            <b class="reading__title">{{ r.title }}</b>
            <p class="reading__text">{{ r.text }}</p>
            <span class="reading__source">{{ r.source }}</span>
          </li>
        </ul>
      </section>

      <!-- 盘面细目（出处可见） -->
      <section class="panel">
        <h2 class="panel__title is-btn" @click="detailOpen = !detailOpen">
          盘面细目 · 出处可查
          <span class="panel__caret">{{ detailOpen ? '收起' : '展开' }}</span>
        </h2>
        <div v-if="detailOpen">
          <ul class="verdicts">
            <li v-for="(v, i) in pan.verdicts" :key="i" class="verdict">
              <p class="verdict__text">{{ v.text }}</p>
              <span class="verdict__source">{{ v.source }}</span>
            </li>
          </ul>
          <ol class="steps">
            <li v-for="(s, i) in pan.steps" :key="i" class="step">
              <span class="step__no">{{ i + 1 }}</span>
              <p class="step__txt"><b>{{ s.title }}</b> · {{ s.desc }}</p>
              <span class="step__src">{{ s.source }}</span>
            </li>
          </ol>
        </div>
      </section>

      <section class="bounds">
        <p v-for="(b, i) in meta.bounds" :key="i" class="bounds__item faint">{{ b }}</p>
        <button class="btn btn--ghost" @click="reset">再起一念</button>
        <button class="btn" @click="saveEvidence">存入应验簿</button>
      </section>

      <!-- 应验簿 -->
      <section class="panel ev">
        <h2 class="panel__title is-btn" @click="evOpen = !evOpen">
          应验簿 · {{ mine.length }} 笔
          <span class="panel__caret">{{ evOpen ? '收起' : '展开' }}</span>
        </h2>
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
  </div>
</template>

<style scoped>
.mh {
  padding-top: 32px;
}
.mh__head {
  text-align: center;
  padding: 24px 0 28px;
}
.mh__tag {
  font-size: 13px;
  letter-spacing: 0.3em;
  color: var(--cinnabar);
}
.mh__title {
  font-size: clamp(40px, 8vw, 58px);
  letter-spacing: 0.3em;
  margin: 12px 0 8px;
}
.mh__motto {
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
.panel__title.is-btn {
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.panel__caret {
  font-size: 13px;
  font-weight: 400;
  color: var(--ink-faint);
}
.panel__sub {
  font-size: 12.5px;
  font-weight: 400;
}
.panel__foot {
  margin-top: 22px;
}

/* 引导条样式已迁移至 GuideSteps 组件 */

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

.mode {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-top: 18px;
}
.mode__btn {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
  text-align: left;
  cursor: pointer;
  transition: all 0.25s;
}
.mode__btn:hover {
  border-color: var(--cinnabar-soft);
}
.mode__btn.is-on {
  border-color: var(--cinnabar);
  background: rgba(176, 58, 46, 0.06);
}
.mode__t {
  font-size: 16px;
  font-family: var(--font-title);
}
.mode__d {
  font-size: 12.5px;
}

.nums {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 18px;
}
.num {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.num__label {
  font-size: 13px;
}
.num__input {
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
  color: var(--ink);
  font-size: 15px;
}
.form__note {
  font-size: 13px;
  margin-top: 14px;
  line-height: 1.7;
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

.result__badge {
  font-size: 12.5px;
  letter-spacing: 0.16em;
  margin-bottom: 10px;
  line-height: 1.8;
}
.result__conclusion {
  font-family: var(--font-title);
  font-size: clamp(20px, 3.4vw, 26px);
  line-height: 1.8;
  padding: 4px 0 22px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 24px;
}

.tiyong {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 18px;
  align-items: center;
  justify-items: center;
}
.tiyong__col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 18px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--paper);
  width: 100%;
}
.tiyong__tag {
  padding: 2px 10px;
  border-radius: 4px;
  color: #faf7f0;
  font-size: 12px;
  letter-spacing: 0.1em;
}
.tiyong__name {
  font-size: 34px;
  font-family: var(--font-title);
}
.tiyong__x {
  font-size: 12px;
  margin-top: -4px;
}
.mini-h {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 4px;
}
.mini {
  width: 42px;
  height: 4px;
  border-radius: 2px;
  background: var(--ink);
}
.mini--yin {
  background: transparent;
  border-top: 4px solid var(--ink);
  height: 0;
}
.tiyong__rel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.tiyong__rel-txt {
  font-family: var(--font-title);
  font-size: 20px;
  color: var(--cinnabar);
  white-space: nowrap;
}
.tiyong__rel-sub {
  font-size: 11.5px;
  white-space: nowrap;
}

.gua {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 22px;
}
.gua__col {
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
}
.gua__kind {
  font-size: 11.5px;
  letter-spacing: 0.14em;
}
.gua__name {
  font-size: 24px;
  font-family: var(--font-title);
  margin: 6px 0;
}
.gua__plain {
  font-size: 12.5px;
  line-height: 1.7;
}

/* 读象篇 */
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
}

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
}

.steps {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.step {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.step__no {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid var(--line);
  font-size: 12.5px;
  color: var(--ink-soft);
}
.step__txt {
  flex: 1;
  font-size: 14.5px;
  line-height: 1.7;
  color: var(--ink-soft);
}
.step__txt b {
  color: var(--ink);
}
.step__src {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--ink-faint);
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

/* 应验簿 */
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
  .mode {
    grid-template-columns: 1fr;
  }
  .tiyong {
    grid-template-columns: 1fr;
  }
  .gua {
    grid-template-columns: 1fr;
  }
  .nums {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>