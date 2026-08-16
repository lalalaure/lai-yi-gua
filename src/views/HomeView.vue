<script setup lang="ts">
import { useRouter } from 'vue-router'
import { welcomeIntents, methods, type MethodMeta } from '@/data/methods'
import { useReveal } from '@/composables/useReveal'

const router = useRouter()

const selected = methods.filter((m) => m.available)
const awaiting = methods.filter((m) => !m.available)

useReveal()

function pickMethod(id: MethodMeta['id']) {
  const meta = methods.find((m) => m.id === id)
  if (!meta) return
  if (meta.available) {
    router.push(meta.to)
  }
}

function goDirect(m: MethodMeta) {
  if (m.available) {
    router.push(m.to)
  }
}
</script>

<template>
  <div class="home">
    <!-- 题字匾额 -->
    <section class="hero reveal">
      <div class="hero__inner">
        <div class="hero__ornament" aria-hidden="true">
          <span class="hero__ring"></span>
        </div>
        <p class="hero__sub">易 道 · 术 数 · 窥 见 一 隅</p>
        <h1 class="hero__title">
          <span class="hero__title-main">来一卦</span>
        </h1>
        <p class="hero__verse">一卦一诚，一言一验<br />看得见每一步根据的国风术数</p>
        <div class="hero__seal-row">
          <span class="seal">透明推演</span>
          <span class="seal">有据可查</span>
        </div>
      </div>
    </section>

    <!-- 智能路由 -->
    <section class="section routing reveal">
      <div class="section-title">
        <h2 class="section-title__cn">你想问点什么？</h2>
        <span class="section-title__en">Ask</span>
      </div>
      <div class="routing__grid">
        <button
          v-for="item in welcomeIntents"
          :key="item.text"
          class="intent"
          @click="pickMethod(item.method)"
        >
          <span class="intent__text">{{ item.text }}</span>
          <span class="intent__hint">{{ item.hint }}</span>
        </button>
      </div>
    </section>

    <!-- 占法选择卡 -->
    <section class="section methods reveal">
      <div class="section-title">
        <h2 class="section-title__cn">占法之道</h2>
        <span class="section-title__en">Methods</span>
      </div>
      <p class="lead">
        八字看“命”，六爻断“事”，梅花应“机”。<br />
        一辈子的自己问八字，这一件的事问六爻，这一刻的念头问梅花。
      </p>

      <div class="method-grid">
        <article
          v-for="m in selected"
          :key="m.id"
          class="method-card"
          @click="goDirect(m)"
        >
          <div class="method-card__head">
            <span class="method-card__tag">{{ m.tagline }}</span>
            <h3 class="method-card__name">{{ m.name }}</h3>
            <span class="method-card__motto">{{ m.motto }}</span>
          </div>
          <div class="method-card__body">
            <dl class="field">
              <dt>适合</dt>
              <dd>{{ m.suitedFor }}</dd>
            </dl>
            <dl class="field">
              <dt>时长</dt>
              <dd>{{ m.duration }}</dd>
            </dl>
            <ol class="steps">
              <li v-for="(s, i) in m.steps" :key="i">
                <span class="steps__no">{{ i + 1 }}</span>
                <span class="steps__txt"><b>{{ s.title }}</b> · {{ s.desc }}</span>
              </li>
            </ol>
          </div>
          <div class="method-card__foot">
            <span class="method-card__go">前往 →</span>
          </div>
        </article>

        <article
          v-for="m in awaiting"
          :key="m.id"
          class="method-card method-card--muted"
        >
          <div class="method-card__head">
            <span class="method-card__tag">{{ m.tagline }}</span>
            <h3 class="method-card__name">{{ m.name }}</h3>
            <span class="method-card__motto">{{ m.motto }}</span>
          </div>
          <div class="method-card__foot">
            <span class="method-card__go">待续 · 敬请期待</span>
          </div>
        </article>
      </div>
    </section>

    <!-- 修身三不占 -->
    <section class="section edict reveal">
      <div class="section-title">
        <h2 class="section-title__cn">占前守则</h2>
        <span class="section-title__en">Rites</span>
      </div>
      <div class="edict__inner">
        <p class="edict__vertical vertical">不 诚 不 占</p>
        <p class="edict__vertical vertical">不 义 不 占</p>
        <p class="edict__vertical vertical">不 确 不 占</p>
      </div>
      <p class="edict__note faint">
        古之善为易者不占则已，占则守正。诚其意、问其事、敬其答——此四法之共守。
      </p>
    </section>
  </div>
</template>

<style scoped>
.home {
  padding-top: 28px;
}

/* ---------- Hero ---------- */
.hero {
  text-align: center;
  padding: 64px 0 24px;
}
.hero__ornament {
  position: relative;
  width: 148px;
  height: 148px;
  margin: 0 auto -40px;
  display: grid;
  place-items: center;
  pointer-events: none;
}
.hero__ring {
  position: absolute;
  inset: 12px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 32% 30%, rgba(176, 58, 46, 0.1), transparent 46%),
    radial-gradient(circle, rgba(168, 132, 44, 0.06), transparent 70%);
  box-shadow:
    inset 0 0 0 1px var(--gold-line),
    0 0 34px rgba(168, 132, 44, 0.08);
  animation: ring-breathe 7s var(--ease-ink) infinite;
}
@keyframes ring-breathe {
  0%, 100% { transform: scale(0.94); opacity: 0.7; }
  50% { transform: scale(1.02); opacity: 1; }
}
.hero__sub {
  font-size: 13px;
  letter-spacing: 0.5em;
  color: var(--ink-faint);
  margin-bottom: 20px;
}
.hero__title {
  font-family: var(--font-title);
  letter-spacing: 0.3em;
}
.hero__title-main {
  font-size: clamp(56px, 12vw, 92px);
}
.hero__verse {
  margin: 22px auto 34px;
  font-family: var(--font-accent);
  font-size: clamp(18px, 3.6vw, 24px);
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  line-height: 2;
}
.hero__seal-row {
  display: flex;
  justify-content: center;
  gap: 16px;
}

/* ---------- Routing ---------- */
.routing__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}
.intent {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  text-align: left;
  padding: 24px 26px;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  background: var(--paper-mist);
  transition: transform 0.35s var(--ease-ink), box-shadow 0.35s var(--ease-ink),
    border-color 0.35s;
}
.intent:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-ink);
  border-color: var(--cinnabar-soft);
}
.intent__text {
  font-size: 18px;
  font-family: var(--font-title);
  letter-spacing: 0.04em;
}
.intent__hint {
  font-size: 13px;
  color: var(--ink-faint);
  letter-spacing: 0.08em;
}
.intent__hint::before {
  content: '· ';
  color: var(--cinnabar);
}

/* ---------- Methods ---------- */
.lead {
  font-size: 16px;
  color: var(--ink-soft);
  line-height: 2;
  margin-bottom: 28px;
}
.method-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}
.method-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--paper-mist);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.35s var(--ease-ink), box-shadow 0.35s var(--ease-ink);
}
.method-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-ink-lg);
}
.method-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(to right, transparent, var(--gold-line), transparent);
  opacity: 0;
  transition: opacity 0.4s var(--ease-ink);
}
.method-card:hover::before {
  opacity: 1;
}
.method-card:hover .method-card__go {
  color: var(--cinnabar);
  letter-spacing: 0.18em;
}
.method-card--muted {
  cursor: default;
  opacity: 0.75;
}

.method-card__head {
  padding: 26px 26px 18px;
  border-bottom: 1px solid var(--line);
}
.method-card__tag {
  display: inline-block;
  font-size: 12px;
  letter-spacing: 0.18em;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--cinnabar-soft);
  color: var(--cinnabar);
  margin-bottom: 14px;
}
.method-card__name {
  font-size: 30px;
  letter-spacing: 0.2em;
  margin-bottom: 8px;
}
.method-card__motto {
  font-size: 14px;
  color: var(--ink-faint);
  letter-spacing: 0.04em;
}

.method-card__body {
  flex: 1;
  padding: 18px 26px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.field {
  display: flex;
  gap: 10px;
  font-size: 14px;
}
.field dt {
  flex-shrink: 0;
  font-family: var(--font-title);
  color: var(--cinnabar);
  letter-spacing: 0.1em;
}
.field dd {
  color: var(--ink-soft);
  line-height: 1.6;
}

.steps {
  list-style: none;
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.steps li {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--ink-soft);
}
.steps__no {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--line);
  font-size: 12px;
  color: var(--ink-soft);
  margin-top: 2px;
}
.steps__txt b {
  color: var(--ink);
  font-weight: 600;
}

.method-card__foot {
  padding: 14px 26px;
  border-top: 1px solid var(--line);
}
.method-card__go {
  font-size: 14px;
  letter-spacing: 0.1em;
  transition: color 0.3s, letter-spacing 0.4s var(--ease-ink);
}

/* ---------- Edict ---------- */
.edict__inner {
  display: flex;
  justify-content: center;
  gap: clamp(28px, 8vw, 72px);
  padding: 20px 0 8px;
}
.edict__vertical {
  font-family: var(--font-title);
  font-size: clamp(26px, 4vw, 34px);
  color: var(--ink);
}
.edict__note {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
}

@media (max-width: 900px) {
  .method-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .routing__grid {
    grid-template-columns: 1fr;
  }
  .hero {
    padding-top: 40px;
  }
}
</style>