import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/calendar', name: 'Calendar', component: () => import('../pages/CalendarPage.vue') },
  { path: '/ratings', name: 'Ratings', component: () => import('../pages/RatingsPage.vue') },
  { path: '/recommendations', name: 'Recommendations', component: () => import('../pages/RecommendationsPage.vue') },
  { path: '/training', name: 'Training', component: () => import('../pages/TrainingPage.vue') },
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
    path: '/luogu',
    name: 'Luogu',
    component: () => import('../pages/LuoguPage.vue')
  },
  {
    path: '/atcoder',
    name: 'AtCoder',
    component: () => import('../pages/AtCoderPage.vue')
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
