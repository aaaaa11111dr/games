<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import ReminderHost from './components/ReminderHost.vue'
const today = ref(new Date())
let ticker: ReturnType<typeof setInterval>
onMounted(() => { ticker = setInterval(() => { today.value = new Date() }, 1000) })
onUnmounted(() => clearInterval(ticker))
</script>
<template>
  <div class="web-app" dir="ltr">
    <header class="press-header">
      <div class="press-masthead">
        <div class="masthead-side"><span class="edition-seal">算法研习<br />OJ TRACKER</span><p>解题 · 比赛 · 题单</p><small>独立的个人算法学习报</small></div>
        <RouterLink to="/" class="press-title"><span>The Algorithm Times</span><strong>算法研习日报</strong></RouterLink>
        <div class="masthead-side masthead-clock"><span>本地时间</span><time :datetime="today.toISOString()" aria-label="当前本地时间">{{ today.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) }}</time><small>{{ today.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }) }}</small></div>
      </div>
      <div class="press-dateline"><span>{{ today.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) }}</span><span>CODEFORCES · LEETCODE · ATCODER · 洛谷</span><span>OJ TRACKER</span></div>
      <nav class="press-nav" aria-label="主导航"><RouterLink to="/">本报首页</RouterLink><RouterLink to="/ratings">分数趋势</RouterLink><RouterLink to="/recommendations">新题推荐</RouterLink><RouterLink to="/training">训练题单</RouterLink><RouterLink to="/calendar">万年历与定时</RouterLink><RouterLink to="/statistics">统计报告</RouterLink><RouterLink to="/daily">每日记录</RouterLink></nav>
    </header>
    <div class="app-content"><ReminderHost /><main><RouterView /></main><footer class="app-footer"><span>THE ALGORITHM TIMES · 算法研习日报</span><span>题单、分数历史与计时保存在当前浏览器</span></footer></div>
  </div>
</template>
