// ============================================================
// 滚动显现：让 .reveal / .stagger 在进入视口时「is-visible / is-in」
// 支持动态追加的元素（结果区在交互后才渲染）
// ============================================================

import { onMounted, onBeforeUnmount } from 'vue'

export function useReveal(root?: HTMLElement | null) {
  let observer: IntersectionObserver | null = null
  let mo: MutationObserver | null = null

  function register(el: Element) {
    observer?.observe(el)
  }

  onMounted(() => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            e.target.classList.add('is-in')
            observer?.unobserve(e.target)
          }
        })
      },
      { threshold: 0.08 }
    )
    const scope = root ?? document
    scope.querySelectorAll('.reveal').forEach(register)

    // 动态追加的 .reveal（如「排盘」「成卦」后渲染的结果区）也要接上观察
    mo = new MutationObserver((muts) => {
      for (const m of muts) {
        if (!m.addedNodes) continue
        for (const node of Array.from(m.addedNodes)) {
          if (!(node instanceof Element)) continue
          if (node.classList?.contains('reveal')) register(node)
          node.querySelectorAll?.('.reveal').forEach(register)
        }
      }
    })
    mo.observe(document.documentElement, { childList: true, subtree: true })
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    mo?.disconnect()
  })
}