<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

export interface RadarAxis {
  label: string
  value: number
  /** 0-1 归一化半径（占最大半径比例） */
  ratio: number
}

const props = withDefaults(
  defineProps<{
    axes: RadarAxis[]
    color?: string
  }>(),
  {
    color: undefined
  }
)

const SIZE = 240
const CX = SIZE / 2
const CY = SIZE / 2
const R_MAX = 88

const inView = ref(false)
onMounted(() => {
  const t = window.setTimeout(() => (inView.value = true), 60)
  return () => window.clearTimeout(t)
})

function pt(ratio: number, i: number, ring: number) {
  const a = (Math.PI * 2 * i) / props.axes.length - Math.PI / 2
  const r = R_MAX * ring * ratio
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) }
}

const gridPolys = [0.3, 0.6, 0.9].map((ring) =>
  props.axes.map((_, i) => `${pt(1, i, ring).x},${pt(1, i, ring).y}`).join(' ')
)
const spokes = props.axes.map((_, i) => {
  const p = pt(1, i, 1)
  return { x1: CX, y1: CY, x2: p.x, y2: p.y }
})
const dataPoly = computed(() =>
  props.axes.map((_, i) => `${pt(props.axes[i].ratio, i, 1).x},${pt(props.axes[i].ratio, i, 1).y}`).join(' ')
)
const nodes = computed(() =>
  props.axes.map((a, i) => ({ ...a, x: pt(a.ratio, i, 1).x, y: pt(a.ratio, i, 1).y }))
)
const labels = computed(() =>
  props.axes.map((a, i) => ({ ...a, x: pt(1, i, 1.14).x, y: pt(1, i, 1.14).y }))
)
</script>

<template>
  <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" class="radar" :class="{ 'is-in': inView }" role="img" aria-label="五行力量雷达图">
    <defs>
      <radialGradient id="radarFill">
        <stop offset="0%" stop-color="var(--cinnabar)" stop-opacity="0.34" />
        <stop offset="100%" stop-color="var(--cinnabar)" stop-opacity="0.06" />
      </radialGradient>
      <radialGradient id="radarGlow">
        <stop offset="0%" stop-color="var(--cinnabar-soft)" stop-opacity="0.5" />
        <stop offset="100%" stop-color="var(--cinnabar-soft)" stop-opacity="0" />
      </radialGradient>
    </defs>

    <g class="radar__grid">
      <polygon v-for="(p, i) in gridPolys" :key="i" :points="p" />
      <line v-for="(s, i) in spokes" :key="i" :x1="s.x1" :y1="s.y1" :x2="s.x2" :y2="s.y2" />
    </g>

    <circle cx="128" cy="128" r="120" fill="url(#radarGlow)" class="radar__glow" />

    <polygon
      class="radar__data"
      :class="{ 'is-in': inView }"
      :points="dataPoly"
      fill="url(#radarFill)"
    />
    <polygon
      class="radar__stroke"
      :class="{ 'is-in': inView }"
      :points="dataPoly"
      fill="none"
      :stroke="color ?? 'var(--cinnabar)'"
    />

    <g class="radar__nodes" v-if="inView">
      <g v-for="a in nodes" :key="a.label">
        <circle :cx="a.x" :cy="a.y" r="7" class="radar__halo"></circle>
        <circle :cx="a.x" :cy="a.y" r="3.4" class="radar__dot"></circle>
      </g>
    </g>

    <g class="radar__labels">
      <g v-for="a in labels" :key="a.label">
        <circle
          :cx="a.x"
          :cy="a.y - 2"
          r="2.4"
          class="radar__dotlabel"
          :style="{ fill: 'var(--cinnabar)' }"
        ></circle>
        <text :x="a.x" :y="a.y + 16" text-anchor="middle" font-size="15" fill="var(--ink)">{{ a.label }}</text>
        <text :x="a.x" :y="a.y + 31" text-anchor="middle" font-size="11.5" fill="var(--ink-soft)">{{ a.value }} · {{ a.ratio >= 0.75 ? '旺' : a.ratio >= 0.4 ? '平' : '弱' }}</text>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.radar {
  width: 100%;
  height: auto;
  display: block;
}
.radar__grid polygon,
.radar__grid line {
  fill: none;
  stroke: var(--line);
  stroke-width: 0.8;
  stroke-dasharray: 2 3;
}
.radar__glow {
  opacity: 0;
  transition: opacity 1s var(--ease-ink) 0.6s;
}
.radar.is-in .radar__glow {
  opacity: 1;
}
.radar__data {
  opacity: 0;
  transform: scale(0.6);
  transform-origin: 50% 50%;
  transition: opacity 0.7s var(--ease-ink), transform 0.9s var(--ease-drop);
  transform-box: fill-box;
}
.radar__data.is-in {
  opacity: 1;
  transform: none;
}
.radar__stroke {
  stroke-width: 2.2;
  stroke-dasharray: 800;
  stroke-dashoffset: 800;
  transition: stroke-dashoffset 1.2s var(--ease-ink) 0.15s;
}
.radar__stroke.is-in {
  stroke-dashoffset: 0;
}
.radar__nodes {
  transition: opacity 0.4s ease 0.7s;
}
.radar__dot {
  fill: var(--cinnabar);
  stroke: #faf7f0;
  stroke-width: 1.5;
}
.radar__halo {
  fill: none;
  stroke: var(--cinnabar-soft);
  stroke-width: 1;
  opacity: 0.35;
}
.radar__dotlabel {
  fill: var(--cinnabar);
}
</style>
