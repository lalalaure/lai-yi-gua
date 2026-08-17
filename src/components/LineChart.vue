<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

export interface ChartPoint {
  label: string
  value: number
  /** 次要说明（如年龄段） */
  sub?: string
}

const props = withDefaults(
  defineProps<{
    points: ChartPoint[]
    /** 数据范围 [min, max]，超出范围也允许 */
    min?: number
    max?: number
    /** 参考刻度线数值列表 */
    guides?: number[]
    color?: string
  }>(),
  {
    min: undefined,
    max: undefined,
    guides: undefined,
    color: undefined
  }
)

const W = 720
const H = 220
const padL = 44
const padR = 24
const padT = 26
const padB = 38

const inView = ref(false)
onMounted(() => {
  const t = window.setTimeout(() => (inView.value = true), 120)
  return () => window.clearTimeout(t)
})

/** 数据值域（含参考线） */
const vmin = computed(() => {
  const g = props.guides?.length ? Math.min(...props.guides) : Infinity
  const p = props.points.length ? Math.min(...props.points.map((q) => q.value)) : Infinity
  return Math.min(props.min ?? Infinity, g, p)
})
const vmax = computed(() => {
  const g = props.guides?.length ? Math.max(...props.guides) : -Infinity
  const p = props.points.length ? Math.max(...props.points.map((q) => q.value)) : -Infinity
  return Math.max(props.max ?? -Infinity, g, p)
})
const span = computed(() => Math.max(1, vmax.value - vmin.value))

function px(i: number) {
  const n = props.points.length
  return padL + ((W - padL - padR) / Math.max(1, n - 1)) * i
}
function py(v: number) {
  return padT + (H - padT - padB) * (1 - (v - vmin.value) / span.value)
}

const pts = computed(() => props.points.map((p, i) => ({ x: px(i), y: py(p.value), ...p })))

/** Catmull-Rom → 三次贝塞尔平滑路径 */
const line = computed(() => {
  const d = pts.value
  if (d.length < 2) return ''
  let out = `M${d[0].x.toFixed(1)},${d[0].y.toFixed(1)}`
  for (let i = 0; i < d.length - 1; i++) {
    const p0 = d[Math.max(0, i - 1)]
    const p1 = d[i]
    const p2 = d[i + 1]
    const p3 = d[Math.min(d.length - 1, i + 2)]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    out += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }
  return out
})
const area = computed(() => {
  const d = pts.value
  if (d.length < 2) return ''
  const base = H - padB
  return `${line.value} L${d[d.length - 1].x.toFixed(1)},${base.toFixed(1)} L${d[0].x.toFixed(1)},${base.toFixed(1)} Z`
})

const guideLines = computed(
  () => (props.guides ?? []).map((g) => ({ v: g, y: py(g), label: String(g) }))
)
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" class="linechart" :class="{ 'is-in': inView }" role="img" aria-label="走势折线图">
    <defs>
      <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--cinnabar)" stop-opacity="0.22" />
        <stop offset="100%" stop-color="var(--cinnabar)" stop-opacity="0.02" />
      </linearGradient>
    </defs>

    <g class="linechart__guides">
      <g v-for="g in guideLines" :key="g.v">
        <line :x1="padL" :x2="W - padR" :y1="g.y" :y2="g.y" />
        <text :x="padL - 6" :y="g.y + 3" text-anchor="end" font-size="10">{{ g.label }}</text>
      </g>
    </g>

    <path class="linechart__area" :class="{ 'is-in': inView }" :d="area" fill="url(#chartArea)" />

    <path
      class="linechart__line"
      :class="{ 'is-in': inView }"
      :d="line"
      :stroke="color ?? 'var(--cinnabar)'"
    />

    <g class="linechart__labels">
      <g v-for="p in pts" :key="p.label">
        <text :x="p.x" :y="H - 16" text-anchor="middle" font-size="11.5" fill="var(--ink)">{{ p.label }}</text>
        <text v-if="p.sub" :x="p.x" :y="H - 3" text-anchor="middle" font-size="9.5" fill="var(--ink-faint)">{{ p.sub }}</text>
      </g>
    </g>

    <g class="linechart__nodes" :class="{ 'is-in': inView }">
      <g v-for="p in pts" :key="p.label">
        <circle :cx="p.x" :cy="p.y" r="6" class="linechart__node"></circle>
        <circle :cx="p.x" :cy="p.y" r="2.6" class="linechart__core"></circle>
        <text class="linechart__val" :x="p.x" :y="p.y - 9" text-anchor="middle" font-size="11">{{ p.value }}</text>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.linechart {
  width: 100%;
  min-width: 0;
  height: auto;
  display: block;
}
.linechart__guides line {
  stroke: var(--line);
  stroke-width: 0.8;
  stroke-dasharray: 3 4;
}
.linechart__guides text {
  fill: var(--ink-faint);
}
.linechart__area {
  opacity: 0;
  transition: opacity 1s var(--ease-ink) 0.4s;
}
.linechart__area.is-in {
  opacity: 1;
}
.linechart__line {
  fill: none;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1600;
  stroke-dashoffset: 1600;
  transition: stroke-dashoffset 1.6s var(--ease-ink) 0.2s;
}
.linechart__line.is-in {
  stroke-dashoffset: 0;
}
.linechart__labels {
  opacity: 0;
  transition: opacity 0.5s ease 1s;
}
.linechart.is-in .linechart__labels {
  opacity: 1;
}
.linechart__nodes {
  opacity: 0;
  transition: opacity 0.5s ease 1.2s;
}
.linechart__nodes.is-in {
  opacity: 1;
}
.linechart__node {
  fill: var(--paper-mist);
  stroke: var(--cinnabar);
  stroke-width: 1.4;
}
.linechart__core {
  fill: var(--cinnabar);
}
.linechart__val {
  fill: var(--ink-soft);
  font-family: var(--font-title);
}
</style>
