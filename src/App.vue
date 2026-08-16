<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { getSfxMuted, initSfx, setSfxMuted, useSfx } from '@/composables/useSfx'

const route = useRoute()
const scrolled = ref(false)
const muted = ref(getSfxMuted())
const { tick } = useSfx()

function onScroll() {
  scrolled.value = window.scrollY > 24
}

function toggleMute() {
  initSfx()
  if (muted.value) {
    setSfxMuted(false)
    initSfx()
    tick()
  } else {
    setSfxMuted(true)
  }
  muted.value = getSfxMuted()
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  // 首次手势：初始化音频上下文（满足自动播放策略）
  const unlock = () => initSfx()
  window.addEventListener('pointerdown', unlock, { once: true })
  window.addEventListener('keydown', unlock, { once: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="site">
    <aside class="masthead" aria-hidden="true"></aside>
    <header class="topbar" :class="{ 'is-scrolled': scrolled }">
      <nav class="topbar__inner">
        <router-link to="/" class="brand">
          <span class="brand__seal">來</span>
          <span class="brand__name">来一卦</span>
        </router-link>
        <ul class="nav">
          <li>
            <router-link to="/bazi" class="nav__link">八字</router-link>
          </li>
          <li>
            <router-link to="/liuyao" class="nav__link">六爻</router-link>
          </li>
          <li>
            <router-link to="/meihua" class="nav__link">梅花</router-link>
          </li>
          <li>
            <router-link to="/heritage" class="nav__link">传承志</router-link>
          </li>
        </ul>
        <button
          class="sound-toggle"
          :class="{ 'is-off': muted }"
          :aria-label="muted ? '音效已关，点击开启' : '音效已开，点击静音'"
          :title="muted ? '音效已关' : '音效已开'"
          @click="toggleMute"
        >
          <span class="sound-toggle__glyph" aria-hidden="true">{{ muted ? '静' : '音' }}</span>
        </button>
      </nav>
    </header>

    <main class="content">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>

    <footer class="footer">
      <p class="footer__rule">不诚不占 · 不义不占 · 不急不占</p>
      <p class="footer__note">本应用供传统文化研究与娱乐参考，不作医疗、财务、法律等重大决策依据。</p>
    </footer>
  </div>
</template>

<style scoped>
.site {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 顶部水墨山峦缎带 */
.masthead {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 240px;
  z-index: 0;
  pointer-events: none;
  background:
    linear-gradient(to bottom, rgba(26, 24, 22, 0.06), transparent),
    radial-gradient(ellipse 120% 100% at 50% -40%, rgba(26, 24, 22, 0.05), transparent 70%);
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  transition: background-color 0.4s var(--ease-ink), box-shadow 0.4s var(--ease-ink);
}
.topbar.is-scrolled {
  background: color-mix(in srgb, var(--paper) 82%, transparent);
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 0 var(--line);
}

.topbar__inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-title);
}
.brand__seal {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--cinnabar);
  color: #faf7f0;
  font-family: var(--font-title);
  font-size: 22px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
}
.brand__name {
  font-size: 22px;
  letter-spacing: 0.16em;
}

.nav {
  display: flex;
  gap: 6px;
  list-style: none;
}
.nav__link {
  display: inline-block;
  padding: 8px 14px;
  font-size: 15px;
  letter-spacing: 0.12em;
  color: var(--ink-soft);
  border-radius: 8px;
  transition: color 0.3s, background-color 0.3s;
}
.nav__link:hover {
  color: var(--ink);
  background: rgba(26, 24, 22, 0.05);
}
.nav__link.router-link-active {
  color: var(--cinnabar);
  background: rgba(176, 58, 46, 0.08);
}

.sound-toggle {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--paper-mist);
  transition: all 0.25s var(--ease-ink);
}
.sound-toggle:hover {
  border-color: var(--cinnabar-soft);
  box-shadow: 0 2px 10px rgba(176, 58, 46, 0.12);
}
.sound-toggle.is-off {
  opacity: 0.55;
}
.sound-toggle__glyph {
  font-family: var(--font-title);
  font-size: 14px;
  color: var(--cinnabar);
  letter-spacing: 0.1em;
}
.sound-toggle.is-off .sound-toggle__glyph {
  color: var(--ink-faint);
}

.content {
  flex: 1;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 24px 40px;
}

.footer {
  max-width: 1080px;
  margin: 0 auto;
  padding: 56px 24px 40px;
  width: 100%;
  text-align: center;
}
.footer__rule {
  font-family: var(--font-accent);
  font-size: 20px;
  letter-spacing: 0.24em;
  color: var(--ink-soft);
  margin-bottom: 10px;
}
.footer__note {
  font-size: 13px;
  color: var(--ink-faint);
}

/* 页面切换 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.35s var(--ease-ink), transform 0.35s var(--ease-ink);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 640px) {
  .brand__name {
    display: none;
  }
  .nav__link {
    padding: 8px 10px;
    font-size: 14px;
  }
}
</style>