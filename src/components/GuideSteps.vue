<script setup lang="ts">
import type { Step } from '@/data/methods'

const props = defineProps<{
  steps: Step[]
  current: number
}>()

const cls = (i: number) => ({
  'guide__item': true,
  'is-on': props.current === i + 1,
  'is-done': props.current > i + 1
})
</script>

<template>
  <ol class="guide" role="list" aria-label="步骤引导">
    <li v-for="(s, i) in props.steps" :key="i" :class="cls(i)">
      <span class="guide__rail" aria-hidden="true"></span>
      <span class="guide__no" :class="{ 'is-check': props.current > i + 1 }">
        {{ props.current > i + 1 ? '✓' : i + 1 }}
      </span>
      <div class="guide__txt">
        <b class="guide__title">{{ s.title }}</b>
        <span class="guide__desc faint">{{ s.desc }}</span>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.guide {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.guide__item {
  position: relative;
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--paper);
  transition: border-color 0.35s var(--ease-ink), background-color 0.35s var(--ease-ink),
    box-shadow 0.35s var(--ease-ink);
}
/* 连接线：从当前项向前延长 */
.guide__rail {
  position: absolute;
  top: -1px;
  left: 25px;
  right: -14px;
  height: 2px;
  background: linear-gradient(to right, var(--cinnabar), transparent);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}
.guide__item:not(:last-child).is-on .guide__rail {
  opacity: 1;
}
.guide__item.is-on {
  border-color: var(--cinnabar-soft);
  background: rgba(176, 58, 46, 0.05);
  box-shadow: var(--shadow-cinnabar);
}
.guide__item.is-done {
  border-color: var(--line);
  background: var(--paper-mist);
}
.guide__no {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid var(--line);
  font-family: var(--font-title);
  font-size: 14px;
  transition: all 0.3s var(--ease-ink);
}
.guide__item.is-on .guide__no {
  background: var(--cinnabar);
  border-color: var(--cinnabar);
  color: #faf7f0;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.18);
}
.guide__item.is-done .guide__no {
  border-color: var(--cinnabar-soft);
  color: var(--cinnabar);
  font-size: 13px;
}
.guide__txt {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.guide__title {
  letter-spacing: 0.06em;
}
.guide__desc {
  font-size: 12.5px;
}

@media (max-width: 640px) {
  .guide {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .guide__item {
    padding: 10px 12px;
  }
  .guide__rail {
    top: auto;
    bottom: -9px;
    left: 28px;
    right: auto;
    width: 2px;
    height: 10px;
    background: linear-gradient(to bottom, var(--cinnabar), transparent);
  }
  .guide__item:not(:last-child).is-on .guide__rail {
    opacity: 1;
  }
}
</style>
