<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { ojStore, getAllSummary } from '../store/ojStore'
import { training } from '../store/trainingStore'
import { timeStore } from '../store/timeStore'
import { ojConfigs } from '../config/ojConfigs'
import { monthDays, dateKey, remainingSeconds } from '../lib/calendar'
const summary = computed(getAllSummary)
const now = ref(new Date())
const miniDays = computed(() => monthDays(now.value.getFullYear(), now.value.getMonth()))
const todayKey = computed(() => dateKey(now.value))
const lunar = computed(() => new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { month: 'long', day: 'numeric' }).format(now.value))
const completed = computed(() => training.plans.reduce((n, p) => n + p.problems.filter(q => q.done).length, 0))
const next = computed(() => [...training.plans, ...timeStore.alarms].filter(p => p.enabled && p.due && p.firedFor !== p.due).sort((a,b) => a.due.localeCompare(b.due))[0])
const timerLeft = computed(() => remainingSeconds(timeStore.countdown.end, now.value.getTime()))
let ticker: ReturnType<typeof setInterval>
onMounted(() => { ticker = setInterval(() => { now.value = new Date() }, 1000) })
onUnmounted(() => clearInterval(ticker))
</script>
<template>
  <div class="frontpage-kicker"><span>学习专刊 · PERSONAL ALGORITHM JOURNAL</span></div>
  <div class="newspaper-grid">
    <aside class="news-column briefs-column"><h2 class="column-title">研习快讯</h2><div class="brief"><span class="article-label">壹 / 积累</span><strong class="news-number">{{ summary.total }}</strong><h3>累计解题</h3></div><div class="brief"><span class="article-label">贰 / 计划</span><strong class="news-number">{{ training.plans.length }}</strong><h3>自建训练题单</h3><p>已完成 {{ completed }} 道训练题</p><RouterLink to="/training" class="editorial-link">编排我的题单 →</RouterLink></div><div class="brief"><span class="article-label">叁 / 记录</span><h3>分数记录</h3><p>已添加 {{ training.ratings.length }} 条分数曲线</p><RouterLink to="/ratings" class="editorial-link">阅览分数趋势 →</RouterLink></div></aside>
    <section class="news-column lead-column"><span class="article-label">本期头条 / THE DAILY PRACTICE</span><h1 class="lead-headline">算法训练</h1>
      <div class="engraving" aria-hidden="true"><svg viewBox="0 0 540 180"><defs><pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(25)"><path d="M0 0V5" stroke="currentColor" stroke-width=".6"/></pattern></defs><g fill="none" stroke="currentColor"><path d="M34 159H507M48 163H492M76 168H477"/><path d="M82 148L239 132L360 149L205 169Z" fill="url(#hatch)"/><path d="M83 140L238 126L360 143L205 160Z M83 140V148M205 160V169M360 143V149"/><path d="M103 128L239 114L341 130L202 145Z M103 128V137L201 154L341 139V130M201 145V154"/><path d="M113 124V49Q174 36 225 60Q276 36 326 46V122Q271 109 225 137Q171 110 113 124Z" fill="url(#hatch)"/><path d="M225 60V137M120 52Q174 41 218 63V128Q172 107 120 118Z M232 63Q278 42 319 50V116Q273 107 232 128Z" fill="none"/><path d="M131 65Q171 59 205 73M131 75Q171 69 205 83M131 85Q171 79 205 93M131 95Q171 89 205 103M245 74Q277 59 309 62M245 84Q277 69 309 72M245 94Q277 79 309 82M245 104Q277 89 309 92"/><path d="M382 145H434L427 119H389Z M391 119L396 102H422L427 119M395 101H422V97H395Z" fill="url(#hatch)"/><path d="M408 98Q414 46 463 14Q451 70 414 88M408 98L458 22M426 66L427 42M436 54L438 32M419 79L444 70M426 67L452 54"/><path d="M58 156L51 80L56 77L67 155M52 83L58 83M58 155L65 154"/></g></svg></div>
      <div class="lead-copy"><p>Codeforces 与 LeetCode 新题，支持按难度筛选并加入题单。</p><p>自定义训练题单、比赛分数记录、日程提醒与倒计时。</p></div><div class="lead-actions"><RouterLink to="/recommendations" class="primary">阅览新题 →</RouterLink><RouterLink to="/training" class="editorial-link">自建训练计划 ↗</RouterLink></div>
    </section>
    <aside class="news-column almanac-column"><h2 class="column-title">日用万年历</h2><div class="today-folio"><span>{{ now.getFullYear() }} 年 {{ now.getMonth() + 1 }} 月</span><strong>{{ now.getDate() }}</strong><p>{{ now.toLocaleDateString('zh-CN', { weekday: 'long' }) }} · 农历 {{ lunar }}</p></div><div class="mini-calendar"><b v-for="day in ['一','二','三','四','五','六','日']">{{ day }}</b><RouterLink v-for="day in miniDays" :key="day.key" to="/calendar" :class="{ faded: !day.current, current: day.key === todayKey }">{{ day.day }}</RouterLink></div><RouterLink to="/calendar" class="calendar-entry">查阅万年历 / 安排日程 →</RouterLink><div class="schedule-brief"><h3>定时小札</h3><p v-if="next"><strong>{{ next.title }}</strong><br />{{ new Date(next.due).toLocaleString('zh-CN') }}</p><p v-else>暂无待办提醒</p><p v-if="timeStore.countdown.status === 'running'">专注计时中 · 剩余 {{ Math.floor(timerLeft / 60) }} 分 {{ timerLeft % 60 }} 秒</p><RouterLink to="/calendar" class="small-button">设置提醒与倒计时</RouterLink></div></aside>
  </div>
  <div class="press-section-title"><span>各地题库 · OJ PLATFORMS</span><RouterLink to="/statistics">查看统计报告 →</RouterLink></div>
  <div class="platform-grid"><RouterLink v-for="(config, i) in ojConfigs" :key="config.id" :to="`/${config.id}`" class="panel platform-card"><div class="row spread"><span class="article-label">第 {{ ['一','二','三','四'][i] }} 专栏</span><span>↗</span></div><h2>{{ config.name }}</h2><p class="muted">{{ ojStore.userData[config.id]?.userId || '未连接账号' }}</p><div class="row spread"><strong>{{ ojStore.userData[config.id]?.data?.totalSolved ?? '—' }}</strong><small>题已解决</small></div></RouterLink></div>
  <div class="newspaper-bottom"><RouterLink to="/daily">写下今日刷题记录 →</RouterLink></div>
</template>
