<script setup lang="ts">
import { useReveal } from '@/composables/useReveal'

useReveal()
const sources = [
  {
    book: '《周易》',
    abbr: '周',
    detail: '六十四卦卦辞爻辞，占法之本，推天道以明人事。',
    era: '周',
    use: '卦辞 / 爻辞取意'
  },
  {
    book: '《增删卜易》',
    abbr: '增',
    detail: '野鹤老人著，铜钱起卦与用神断法之集大成，去繁就简。',
    era: '清 · 康熙',
    use: '六爻起卦、取用神、旺衰断语'
  },
  {
    book: '《卜筮正宗》',
    abbr: '卜',
    detail: '王洪绪著，京房纳甲装卦法详录，六亲六神世应之法。',
    era: '清',
    use: '六爻纳甲、世应、六亲六神'
  },
  {
    book: '《梅花易数》',
    abbr: '梅',
    detail: '邵雍一脉相传，万物皆可起卦，体用分主客之势。',
    era: '宋',
    use: '梅花起卦、体用生克'
  },
  {
    book: '《渊海子平》',
    abbr: '渊',
    detail: '四柱论命之法，五虎遁月起月，十神分六亲之亲疏。',
    era: '宋 · 徐子平',
    use: '八字排盘、十神、大运'
  },
  {
    book: '《三命通会》',
    abbr: '三',
    detail: '万民英著，集子平大运、神煞、纳音之大成。',
    era: '明',
    use: '八字大运、神煞、纳音'
  },
  {
    book: '《六壬大全》',
    abbr: '壬',
    detail: '四课三传、九宗门及十二天将之法。',
    era: '明',
    use: '大六壬排盘（待续）'
  }
]

const citations = [
  {
    feature: '铜钱起卦：背多则动',
    quote: '「用三文钱，掷地有字者为阴、为背者为阳，三个背为老阳，无背为老阴，谓之动爻。」',
    src: '《增删卜易·铜钱课》'
  },
  {
    feature: '取用神：一事一神',
    quote: '「卦有体用，卜有六亲；财为妻财，官为官鬼。问何事，即取何者为用。」',
    src: '《增删卜易·用神章》'
  },
  {
    feature: '旺衰看月建',
    quote: '「旺相休囚死，以月令为纲：当令者旺，令生者相。」',
    src: '《增删卜易·旺相章》'
  },
  {
    feature: '动爻为变机',
    quote: '「动则有变，动而化之，成之卦以观其终。」',
    src: '《增删卜易·动爻章》'
  },
  {
    feature: '体用分主客',
    quote: '「体为己，用为事。用生体吉，体克用可成，用克体凶而宜守。」',
    src: '《梅花易数·体用篇》'
  },
  {
    feature: '月令定旺衰',
    quote: '「得时则旺，失时则衰；月令者，气候之提纲也。」',
    src: '《渊海子平·论月令》'
  },
  {
    feature: '神煞入命',
    quote: '「驿马主奔波，桃花主人缘，禄神主衣食，羊刃主刚决。」',
    src: '《三命通会·神煞章》'
  }
]

const lessons = [
  {
    id: 'shengke',
    name: '五行相生相克',
    desc: '生者资其源，克者制其过——万物才得以平衡。读四柱、剖体用都靠这张图。'
  },
  {
    id: 'zhugua',
    name: '体用与动爻',
    desc: '本卦定基，动爻为变机，化作之卦以测其终；不动为体，动者为用。'
  },
  {
    id: 'liuqin',
    name: '以宫为我的六亲',
    desc: '以本宫五行为「我」，其余各爻按生克与我论亲：生我者父母，同我者兄弟，我生者子孙，我克者妻财，克我者官鬼。'
  }
]

// ---- SVG：五行生克星图 ----
const WX_STAR = [
  { name: '木', x: 140, y: 34 },
  { name: '火', x: 241, y: 121 },
  { name: '土', x: 202, y: 236 },
  { name: '金', x: 78, y: 236 },
  { name: '水', x: 39, y: 121 }
]
/** 相生路径（顺时针相邻） */
const shengPaths = [
  'M140,34 L241,121',
  'M241,121 L202,236',
  'M202,236 L78,236',
  'M78,236 L39,121',
  'M39,121 L140,34'
]
/** 相克路径（隔一） */
const kePaths = [
  'M140,34 Q202,120 202,236',
  'M241,121 Q140,250 78,236',
  'M202,236 Q39,180 39,121',
  'M78,236 Q140,60 140,34',
  'M39,121 Q180,-10 140,34'
]
/** 相克目标：0木→2土、1火→3金、2土→4水、3金→0木、4水→1火 */
const keTarget = [2, 3, 4, 0, 1]
/** 相生目标（顺时针下一个） */
const shengTarget = [1, 2, 3, 4, 0]

// ---- SVG：体用与动爻 ----
const TIYONG = {
  upperToLower: [
    { upper: '离', lower: '兑', lines: [1, 0, 1, 1, 1, 0], moving: 1, ben: '革', bian: '咸' },
    { upper: '乾', lower: '震', lines: [1, 1, 1, 1, 0, 0], moving: 4, ben: '大壮', bian: '大有' }
  ]
}

// ---- SVG：六亲关系（五角） ----
const LIUQIN_POS = [
  { name: '父母', y: 30 },
  { name: '兄弟', y: 70 },
  { name: '子孙', y: 110 },
  { name: '妻财', y: 150 },
  { name: '官鬼', y: 190 }
]
</script>

<template>
  <div class="hz">
    <header class="hz__head">
      <span class="hz__tag">典 籍 之 源</span>
      <h1 class="hz__title">传承志</h1>
      <p class="hz__sub faint">
        本站每一处算式、每一条断语皆可上溯至此。学术有本，方敢言验。
      </p>
    </header>

    <!-- 典籍书架 -->
    <section class="panel reveal">
      <h2 class="panel__title">典籍书架 <span class="panel__sub faint">引擎的出处 · 七种占法之学</span></h2>
      <div class="shelf">
        <article v-for="s in sources" :key="s.book" class="shelf__book">
          <div class="shelf__spine">
            <span class="shelf__abbr">{{ s.abbr }}</span>
            <span class="shelf__bookname">{{ s.book }}</span>
            <span class="shelf__era">{{ s.era }}</span>
          </div>
          <div class="shelf__body">
            <h3 class="shelf__title">{{ s.book }}</h3>
            <p class="shelf__detail">{{ s.detail }}</p>
            <p class="shelf__at">
              <span class="shelf__era2">{{ s.era }}</span>
              <span class="shelf__use">{{ s.use }}</span>
            </p>
          </div>
        </article>
      </div>
    </section>

    <!-- 引用实例：断语出处对得上 -->
    <section class="panel reveal">
      <h2 class="panel__title">引用实例 <span class="panel__sub faint">你看到的每句话，都可能原样出自这里</span></h2>
      <ul class="cite">
        <li v-for="(c, i) in citations" :key="i" class="cite__item">
          <span class="cite__feature">{{ c.feature }}</span>
          <p class="cite__quote">「{{ c.quote }}」</p>
          <span class="cite__src">{{ c.src }}</span>
        </li>
      </ul>
    </section>

    <!-- 易理小课堂：图解 -->
    <section class="panel reveal">
      <h2 class="panel__title">易理小课堂 <span class="panel__sub faint">三张图，看懂引擎的骨架</span></h2>
      <div class="lessons">
        <!-- 五行生克 -->
        <div v-for="l in lessons" :key="l.id" class="lesson">
          <h3 class="lesson__name">{{ l.name }}</h3>
          <p class="lesson__desc faint">{{ l.desc }}</p>

          <!-- 生克星图 -->
          <svg v-if="l.id === 'shengke'" viewBox="0 0 280 280" role="img" :aria-label="l.name">
            <defs>
              <marker id="arrowHead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L7,3 L0,6 z" fill="var(--cinnabar)" stroke="none" />
              </marker>
            </defs>
            <g fill="none">
              <path v-for="(p, i) in kePaths" :key="'k' + i" :d="p" stroke="rgba(123,138,147,0.55)" stroke-width="1.1" stroke-dasharray="4 3" />
              <path v-for="(p, i) in shengPaths" :key="'s' + i" :d="p" stroke="var(--cinnabar-soft)" stroke-width="1.6" marker-end="url(#arrowHead)" class="sheng-flow" />
            </g>
            <g font-size="14" text-anchor="middle">
              <g v-for="(w, i) in WX_STAR" :key="w.name">
                <circle :cx="w.x" :cy="w.y" r="20" fill="var(--paper)" stroke="var(--ink-soft)" stroke-width="1" />
                <text :x="w.x" :y="w.y + 5" fill="var(--ink)">{{ w.name }}</text>
                <text :x="w.x" :y="w.y + 32" font-size="9.5" fill="var(--cinnabar)">生{{ WX_STAR[shengTarget[i]].name }}</text>
                <text :x="w.x" :y="w.y + 44" font-size="9.5" fill="rgba(123,138,147,0.85)">克{{ WX_STAR[keTarget[i]].name }}</text>
              </g>
            </g>
          </svg>

          <!-- 体用与动爻 -->
          <div v-if="l.id === 'zhugua'" class="tiyong-demo">
            <div v-for="(ex, i) in TIYONG.upperToLower" :key="i" class="tiyong-demo__row">
              <div class="tiyong-demo__gua">
                <span class="tiyong-demo__label faint">本卦 · {{ ex.ben }}</span>
                <div class="tiyong-demo__lines">
                  <span
                    v-for="(b, j) in ex.lines"
                    :key="j"
                    class="tiyong-demo__bar"
                    :class="['tiyong-demo__bar--' + (b === 1 ? 'yang' : 'yin'), { 'is-move': j === ex.moving - 1 }]"
                  >{{ j === ex.moving - 1 ? '动' : '' }}</span>
                </div>
                <span v-if="ex.moving <= 3" class="tiyong-demo__tag">动在下卦 → 体为{{ ex.upper }}</span>
                <span v-else class="tiyong-demo__tag">动在上卦 → 体为{{ ex.lower }}</span>
              </div>
              <span class="tiyong-demo__arrow">⟶</span>
              <div class="tiyong-demo__gua">
                <span class="tiyong-demo__label faint">变卦 · {{ ex.bian }}</span>
                <div class="tiyong-demo__lines">
                  <span
                    v-for="(b, j) in ex.lines"
                    :key="j"
                    class="tiyong-demo__bar"
                    :class="['tiyong-demo__bar--' + (b === 1 ? 'yang' : 'yin'), { 'is-move': j === ex.moving - 1 }]"
                  ></span>
                </div>
                <span class="tiyong-demo__tag faint">{{ ex.upper }}{{ ex.lower }} 经动爻化作 {{ ex.bian }}</span>
              </div>
            </div>
          </div>

          <!-- 六亲关系 -->
          <svg v-if="l.id === 'liuqin'" viewBox="0 0 320 220" role="img" :aria-label="l.name">
            <g text-anchor="middle" font-size="13">
              <!-- 中心：宫五行=我 -->
              <circle cx="160" cy="110" r="34" fill="rgba(176,58,46,0.12)" stroke="var(--cinnabar)" stroke-width="1.4" />
              <text x="160" y="108" fill="var(--cinnabar)" font-size="15" font-weight="600">宫五行</text>
              <text x="160" y="126" fill="var(--cinnabar)" font-size="11">＝ 我</text>
              <g v-for="q in LIUQIN_POS" :key="q.name">
                <line :x1="160" :y1="110" :x2="160" :y2="q.y" stroke="var(--line)" stroke-width="1" />
                <rect :x="160 - 38" :y="q.y - 13" width="76" height="26" rx="13" fill="var(--paper)" stroke="var(--ink-soft)" stroke-width="1" />
                <text x="160" :y="q.y + 4" fill="var(--ink)">{{ q.name }}</text>
              </g>
            </g>
          </svg>
        </div>
      </div>
    </section>

    <p class="hz__closing faint">
      古籍均出自公有领域。算法以可视化推演呈现，供研究与娱乐参考，
      <b>不判寿命、生死、血光，也不下「你是注定如此」的断语</b>。
    </p>
  </div>
</template>

<style scoped>
.hz {
  padding-top: 40px;
}
.hz__head {
  text-align: center;
  padding: 28px 0 32px;
}
.hz__tag {
  font-size: 13px;
  letter-spacing: 0.4em;
  color: var(--cinnabar);
}
.hz__title {
  font-size: clamp(40px, 8vw, 58px);
  letter-spacing: 0.3em;
  margin: 12px 0;
}
.hz__sub {
  font-size: 15px;
  letter-spacing: 0.04em;
}
.panel {
  margin-top: 20px;
  padding: 26px 30px;
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

/* 书架 */
.shelf {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
.shelf__book {
  display: flex;
  min-height: 150px;
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
  background: var(--paper);
  transition: transform 0.35s var(--ease-ink), box-shadow 0.35s var(--ease-ink);
}
.shelf__book:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-ink);
}
.shelf__spine {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  width: 54px;
  padding: 14px 6px;
  background: linear-gradient(160deg, #1a1816, #3a3126);
  color: #efe9dc;
}
.shelf__abbr {
  font-family: var(--font-title);
  font-size: 18px;
}
.shelf__bookname {
  writing-mode: vertical-rl;
  letter-spacing: 0.2em;
  font-size: 13px;
}
.shelf__era {
  font-size: 10.5px;
  color: #cbbda7;
}
.shelf__body {
  flex: 1;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
}
.shelf__title {
  font-size: 18px;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}
.shelf__detail {
  flex: 1;
  font-size: 13.5px;
  line-height: 1.75;
  color: var(--ink-soft);
}
.shelf__at {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 10px;
}
.shelf__era2 {
  font-family: var(--font-title);
  font-size: 12px;
  color: var(--cinnabar);
}
.shelf__use {
  font-size: 11.5px;
  color: var(--ink-faint);
}

/* 引用实例 */
.cite {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cite__item {
  padding: 14px 18px;
  border: 1px solid var(--line);
  border-left: 3px solid var(--cinnabar-soft);
  border-radius: 0 10px 10px 0;
  background: var(--paper);
}
.cite__feature {
  font-family: var(--font-title);
  font-size: 15px;
  display: block;
  margin-bottom: 6px;
}
.cite__quote {
  font-size: 14px;
  line-height: 1.85;
  color: var(--ink-soft);
}
.cite__src {
  display: inline-block;
  margin-top: 8px;
  font-size: 12px;
  color: var(--cinnabar);
}

/* 小课堂 */
.lessons {
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.lesson {
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--paper);
}
.lesson__name {
  font-size: 17px;
  margin-bottom: 4px;
}
.lesson__desc {
  font-size: 13px;
  margin-bottom: 14px;
  line-height: 1.7;
}
.lesson svg {
  height: auto;
}
.lesson svg[viewBox="0 0 280 280"] {
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  display: block;
}
.lesson svg[viewBox="0 0 320 220"] {
  width: 100%;
  max-width: 340px;
  margin: 0 auto;
  display: block;
}

/* 生克流动光斑 */
.sheng-flow {
  stroke-dasharray: 7 5;
  animation: shengflow 3.2s linear infinite;
}
@keyframes shengflow {
  to { stroke-dashoffset: -24; }
}

/* 体用演示 */
.tiyong-demo {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.tiyong-demo__row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.tiyong-demo__gua {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}
.tiyong-demo__label {
  font-size: 12px;
}
.tiyong-demo__lines {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 90px;
}
.tiyong-demo__bar {
  position: relative;
  width: 90px;
  height: 5px;
  border-radius: 2px;
  background: var(--ink);
}
.tiyong-demo__bar--yin {
  background: transparent;
  border-top: 5px solid var(--ink);
  height: 0;
}
.tiyong-demo__bar.is-move {
  background-color: var(--cinnabar);
  color: transparent;
}
.tiyong-demo__bar.is-move::after {
  content: '动';
  position: absolute;
  right: -22px;
  top: -6px;
  font-size: 11px;
  color: var(--cinnabar);
}
.tiyong-demo__bar.is-move.tiyong-demo__bar--yin {
  border-color: var(--cinnabar);
}
.tiyong-demo__arrow {
  font-size: 24px;
  color: var(--ink-faint);
  flex-shrink: 0;
}
.tiyong-demo__tag {
  font-size: 12px;
  color: var(--ink-soft);
}

.hz__closing {
  text-align: center;
  margin-top: 36px;
  font-size: 13px;
  line-height: 1.9;
}
.hz__closing b {
  color: var(--cinnabar);
  font-weight: 500;
}

@media (max-width: 640px) {
  .panel {
    padding: 20px 18px;
  }
  .tiyong-demo__row {
    flex-direction: column;
  }
  .tiyong-demo__arrow {
    transform: rotate(90deg);
  }
}
</style>