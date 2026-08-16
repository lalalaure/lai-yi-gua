import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  // hash 模式：无需服务器重写规则，GitHub Pages 最稳
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/liuyao',
      name: 'liuyao',
      component: () => import('@/views/LiuyaoView.vue')
    },
    {
      path: '/bazi',
      name: 'bazi',
      component: () => import('@/views/BaziView.vue')
    },
    {
      path: '/meihua',
      name: 'meihua',
      component: () => import('@/views/MeihuaView.vue')
    },
    {
      path: '/heritage',
      name: 'heritage',
      component: () => import('@/views/HeritageView.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router