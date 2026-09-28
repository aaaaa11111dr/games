<script setup lang="ts">
import { computed, ref } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
import { training } from '../store/trainingStore'
ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend)
const platform = ref('codeforces'), site = ref('com'), username = ref(''), loading = ref(false), error = ref(''), message = ref(''), period = ref('all')
const manualPlatform = ref('luogu'), manualUser = ref(''), manualDate = ref(''), manualRating = ref<number | null>(null)
const names: Record<string, string> = { codeforces: 'Codeforces', leetcode: 'LeetCode', atcoder: 'AtCoder', luogu: '洛谷' }
const colors: Record<string, string> = { codeforces: '#4b69dc', leetcode: '#d99320', atcoder: '#149a88', luogu: '#a66aca' }
const data = computed(() => ({ datasets: training.ratings.map(series => ({
  label: `${names[series.platform]} · ${series.username}${series.site === 'manual' ? '（手动）' : series.platform === 'leetcode' ? `（${series.site === 'cn' ? '中国站' : '国际站'}）` : ''}`,
  borderColor: colors[series.platform], backgroundColor: colors[series.platform], borderWidth: 2, pointRadius: 3, tension: .15,
  data: series.points.filter(p => period.value === 'all' || Date.parse(p.date) >= Date.now() - Number(period.value) * 86400000).map(p => ({ x: Date.parse(p.date), y: p.rating, label: p.label }))
})) }))
const options = { responsive: true, maintainAspectRatio: false, parsing: false as const, scales: { x: { type: 'linear' as const, ticks: { maxTicksLimit: 7, callback: (v: string | number) => new Date(Number(v)).toLocaleDateString() } }, y: { title: { display: true, text: '比赛分数 / 平台分数' } } }, plugins: { tooltip: { callbacks: { title: (items: any[]) => items[0] ? new Date(items[0].parsed.x).toLocaleDateString() : '', afterLabel: (item: any) => item.raw.label } } } }
async function sync() {
  if (!username.value.trim()) return
  const account = username.value.trim(), oj = platform.value, region = site.value
  loading.value = true; error.value = ''; message.value = ''
  try {
    const response = await fetch(`/api/training/ratings?${new URLSearchParams({ platform: oj, username: account, site: region })}`)
    const result = await response.json()
    if (!response.ok) throw new Error(result.error)
    const id = training.ratings.findIndex(s => s.platform === oj && s.username === account && s.site === region)
    const series = { platform: oj, username: account, site: region, points: result.data, updated: result.fetchedAt }
    if (id >= 0) training.ratings[id] = series; else training.ratings.push(series)
    message.value = result.data.length ? `已同步 ${result.data.length} 场比赛${result.stale ? '（上游不可用，使用缓存）' : ''}` : '该账号暂无已评级比赛记录'
  } catch (e: any) { error.value = e.message || '同步失败' }
  finally { loading.value = false }
}
function addManual() {
  error.value = ''; message.value = ''
  if (!manualUser.value.trim() || !manualDate.value || manualRating.value === null || !Number.isFinite(manualRating.value)) { error.value = '请填写完整的账号、日期和有效分数'; return }
  let series = training.ratings.find(s => s.platform === manualPlatform.value && s.username === manualUser.value.trim() && s.site === 'manual')
  if (!series) { training.ratings.push({ platform: manualPlatform.value, username: manualUser.value.trim(), site: 'manual', points: [], updated: '' }); series = training.ratings[training.ratings.length - 1] }
  const date = new Date(`${manualDate.value}T12:00:00`).toISOString()
  series.points = series.points.filter(p => p.date !== date)
  series.points.push({ date, rating: manualRating.value, label: '手动录入' }); series.points.sort((a,b) => a.date.localeCompare(b.date)); series.updated = new Date().toISOString()
  message.value = '分数已保存（同一天的手动记录会更新）'
}
</script>
<template>
  <div class="page-heading"><div><p class="eyebrow">RATING INSIGHTS</p><h1>分数趋势</h1><p>按真实时间展示各 OJ 分数变化；平台评分体系不同，请结合各自曲线阅读。</p></div></div>
  <section class="panel stack"><form @submit.prevent="sync" class="filters"><label>平台<select v-model="platform"><option value="codeforces">Codeforces</option><option value="leetcode">LeetCode</option><option value="atcoder">AtCoder</option></select></label><label v-if="platform === 'leetcode'">站点<select v-model="site"><option value="com">国际站</option><option value="cn">中国站</option></select></label><label class="grow">用户名<input v-model="username" required maxlength="80" placeholder="输入对应平台的公开用户名" /></label><button class="primary" :disabled="loading">{{ loading ? '同步中…' : '同步比赛分数' }}</button></form>
    <p v-if="error" class="error" role="alert">{{ error }}</p><p v-if="message" class="success" role="status">{{ message }}</p>
    <div class="row spread"><h2>分数走势</h2><select aria-label="时间范围" v-model="period"><option value="all">全部时间</option><option value="365">近一年</option><option value="90">近 90 天</option><option value="30">近 30 天</option></select></div>
    <div v-if="data.datasets.some(s => s.data.length)" class="rating-chart"><Line :data="data" :options="options" /></div><div v-else class="empty">{{ training.ratings.length ? '所选时间范围内暂无分数记录。' : '暂无分数记录，请添加 OJ 账号。' }}</div>
    <div v-for="(series, i) in training.ratings" :key="`${series.platform}:${series.username}:${series.site}`" class="problem-row"><span class="dot" :style="{ background: colors[series.platform] }" /><div class="grow">{{ names[series.platform] }} · {{ series.username }} <small>{{ series.site === 'manual' ? '手动记录' : series.platform === 'leetcode' ? (series.site === 'cn' ? '中国站' : '国际站') : '官方比赛记录' }} · {{ series.points.length }} 条 · 更新于 {{ new Date(series.updated).toLocaleString() }}</small></div><strong>{{ series.points.at(-1)?.rating ?? '—' }}</strong><button class="danger" @click="training.ratings.splice(i, 1)">移除</button></div>
  </section>
  <section class="panel mt"><h2>手动记录分数</h2><p class="muted">洛谷等未接入自动分数接口的平台可在此记录；手动记录与自动同步分别展示。</p><form @submit.prevent="addManual" class="filters"><label>平台<select v-model="manualPlatform"><option v-for="(name, id) in names" :value="id">{{ name }}</option></select></label><label>用户名<input v-model="manualUser" required maxlength="80" /></label><label>日期<input type="date" v-model="manualDate" required /></label><label>分数<input type="number" step="1" v-model="manualRating" required /></label><button class="primary">保存分数</button></form></section>
</template>
