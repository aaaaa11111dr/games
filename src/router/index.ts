import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/HomePage.vue')
  },
  {
    path: '/leetcode',
    name: 'LeetCode',
    component: () => import('../pages/LeetCodePage.vue')
  },
  {
    path: '/codeforces',
    name: 'Codeforces',
    component: () => import('../pages/CodeforcesPage.vue')
  },
  {
    path: '/lanqiao',
    name: 'Lanqiao',
    component: () => import('../pages/LanqiaoPage.vue')
  },
  {
    path: '/hdu',
    name: 'HDU',
    component: () => import('../pages/HDUPage.vue')
  },
  {
    path: '/luogu',
    name: 'Luogu',
    component: () => import('../pages/LuoguPage.vue')
  },
  {
    path: '/pta',
    name: 'PTA',
    component: () => import('../pages/PTAPage.vue')
  },
  {
    path: '/atcoder',
    name: 'AtCoder',
    component: () => import('../pages/AtCoderPage.vue')
  },
  {
    path: '/nowcoder',
    name: 'Nowcoder',
    component: () => import('../pages/NowcoderPage.vue')
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: () => import('../pages/StatisticsPage.vue')
  },
  {
    path: '/daily',
    name: 'Daily',
    component: () => import('../pages/DailyPage.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
