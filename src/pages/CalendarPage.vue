<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { training } from '../store/trainingStore'
import { timeStore } from '../store/timeStore'
import { dateKey, monthDays, remainingSeconds } from '../lib/calendar'
const now = ref(Date.now())
const year = ref(new Date().getFullYear()), month = ref(new Date().getMonth()), selected = ref(dateKey(new Date()))
const years = Array.from({ length: 201 }, (_, i) => 1900 + i)
const cells = computed(() => monthDays(year.value, month.value))
const today = computed(() => dateKey(new Date(now.value)))
const selectedDate = computed(() => new Date(`${selected.value}T12:00:00`))
const lunarFormat = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { month: 'long', day: 'numeric' })
function lunar(date: Date) { return lunarFormat.format(date) }
const selectedLunar = computed(() => new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { year: 'numeric', month: 'long', day: 'numeric' }).format(selectedDate.value))
const events = computed(() => [
  ...training.plans.filter(p => p.due).map(p => ({ ...p, kind: '训练题单' })),
  ...timeStore.alarms.map(a => ({ ...a, kind: '日程提醒' }))
].sort((a, b) => a.due.localeCompare(b.due)))
const selectedEvents = computed(() => events.value.filter(e => e.due.slice(0, 10) === selected.value))
const title = ref(''), alarmTime = ref('09:00'), error = ref(''), message = ref('')
const minutes = ref(25), countdownTitle = ref('专注训练')
const seconds = computed(() => timeStore.countdown.status === 'running' ? remainingSeconds(timeStore.countdown.end, now.value) : timeStore.countdown.remaining)
const displayTime = computed(() => `${String(Math.floor(seconds.value / 3600)).padStart(2, '0')}:${String(Math.floor(seconds.value % 3600 / 60)).padStart(2, '0')}:${String(seconds.value % 60).padStart(2, '0')}`)
function moveMonth(offset: number) {
  const date = new Date(year.value, month.value + offset, 1)
  if (date.getFullYear() < 1900 || date.getFullYear() > 2100) return
  year.value = date.getFullYear(); month.value = date.getMonth()
}
function selectDay(day: typeof cells.value[number]) { selected.value = day.key; year.value = day.date.getFullYear(); month.value = day.date.getMonth(); message.value = ''; error.value = '' }
function goToday() { const date = new Date(); year.value = date.getFullYear(); month.value = date.getMonth(); selected.value = dateKey(date) }
function addAlarm() {
  error.value = ''; message.value = ''
  const due = `${selected.value}T${alarmTime.value}`
  if (!title.value.trim() || !Number.isFinite(Date.parse(due)) || Date.parse(due) <= Date.now()) { error.value = '请填写提醒内容，并选择未来的日期和时间。'; return }
  timeStore.alarms.push({ id: crypto.randomUUID(), title: title.value.trim(), due, enabled: true, firedFor: '' })
  title.value = ''; message.value = '日程已记下，到时蜂鸣提醒。'
}
function start() {
  error.value = ''
  if (!Number.isFinite(minutes.value) || minutes.value < 1 || minutes.value > 1440) { error.value = '请输入 1–1440 分钟。'; return }
  const duration = Math.round(minutes.value * 60)
  Object.assign(timeStore.countdown, { title: countdownTitle.value.trim() || '专注训练', remaining: duration, end: Date.now() + duration * 1000, status: 'running' })
  now.value = Date.now()
}
function pause() { timeStore.countdown.remaining = remainingSeconds(timeStore.countdown.end, Date.now()); timeStore.countdown.status = 'paused' }
function resume() { timeStore.countdown.end = Date.now() + timeStore.countdown.remaining * 1000; timeStore.countdown.status = 'running'; now.value = Date.now() }
function reset() { Object.assign(timeStore.countdown, { status: 'idle', end: 0, remaining: Math.max(1, Number(minutes.value) || 25) * 60 }) }
let ticker: ReturnType<typeof setInterval>
onMounted(() => { ticker = setInterval(() => { now.value = Date.now() }, 250) })
onUnmounted(() => clearInterval(ticker))
</script>
<template>
  <div class="page-heading"><div><p class="eyebrow">THE DAILY ALMANAC · 日用历书</p><h1>万年历与定时</h1><p>公历、农历与训练日程。</p></div><div class="live-clock">{{ new Date(now).toLocaleTimeString('zh-CN', { hour12: false }) }}<small>本地时间 · {{ Intl.DateTimeFormat().resolvedOptions().timeZone }}</small></div></div>
  <div class="almanac-layout">
    <section class="panel calendar-panel">
      <div class="calendar-toolbar"><button class="small-button" aria-label="上个月" @click="moveMonth(-1)" :disabled="year === 1900 && month === 0">←</button><label>年份<select v-model="year" aria-label="年份"><option v-for="y in years" :value="y">{{ y }} 年</option></select></label><label>月份<select v-model="month" aria-label="月份"><option v-for="m in 12" :value="m - 1">{{ m }} 月</option></select></label><button class="small-button" aria-label="下个月" @click="moveMonth(1)" :disabled="year === 2100 && month === 11">→</button><button class="small-button" @click="goToday">回到今天</button></div>
      <div class="calendar-week"><span v-for="day in ['一','二','三','四','五','六','日']">周{{ day }}</span></div>
      <div class="calendar-grid"><button v-for="day in cells" :key="day.key" class="calendar-day" :class="{ outside: !day.current, selected: selected === day.key, today: today === day.key }" :aria-label="`${day.key} ${lunar(day.date)}`" :aria-pressed="selected === day.key" :disabled="day.date.getFullYear() < 1900 || day.date.getFullYear() > 2100" @click="selectDay(day)"><strong>{{ day.day }}</strong><small>{{ lunar(day.date) }}</small><span v-if="events.some(e => e.due.slice(0,10) === day.key && e.enabled)" class="event-mark" aria-label="有提醒">•</span></button></div>
      <p class="calendar-caption">公历 1900—2100 年 · 农历由浏览器历法换算 · 实心圆点表示当日有已启用的提醒</p>
    </section>
    <aside class="panel day-agenda"><p class="eyebrow">当日纪事</p><h2>{{ selectedDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }) }}</h2><p class="lunar-date">农历 {{ selectedLunar }}</p>
      <div v-if="!selectedEvents.length" class="empty">当日暂无日程</div>
      <div v-for="event in selectedEvents" :key="event.id" class="agenda-item"><strong>{{ event.due.slice(11,16) }} · {{ event.title }}</strong><small>{{ event.kind }} · {{ !event.enabled ? '已取消' : event.firedFor === event.due ? '已提醒' : '待提醒' }}</small><RouterLink v-if="event.kind === '训练题单'" to="/training">编辑题单 →</RouterLink><button v-else-if="event.enabled && event.firedFor !== event.due" class="danger" @click="timeStore.alarms.find(a => a.id === event.id)!.enabled = false">取消提醒</button></div>
      <form @submit.prevent="addAlarm" class="stack"><h2>添一则日程</h2><label>提醒内容<input v-model="title" required maxlength="100" placeholder="例如：晚间算法训练" /></label><label>时间<input type="time" v-model="alarmTime" required /></label><button class="primary">设置当日提醒</button></form>
    </aside>
  </div>
  <p v-if="error" class="error mt" role="alert">{{ error }}</p><p v-if="message" class="success mt" role="status">{{ message }}</p>
  <section class="panel timer-panel mt"><div><p class="eyebrow">MAKE TIME FOR PRACTICE</p><h2>专注倒计时</h2><p class="muted">{{ timeStore.countdown.status === 'running' ? `正在计时：${timeStore.countdown.title}` : timeStore.countdown.status === 'paused' ? '已暂停，可继续计时' : timeStore.countdown.status === 'finished' ? '本次计时已完成' : '尚未开始计时' }}</p><div class="timer-digits" role="timer" aria-label="剩余时间">{{ displayTime }}</div></div>
    <div class="stack"><div class="row"><label>计时名称<input v-model="countdownTitle" maxlength="100" :disabled="timeStore.countdown.status === 'running'" /></label><label>分钟（1–1440）<input type="number" v-model="minutes" min="1" max="1440" step="1" :disabled="timeStore.countdown.status === 'running'" /></label></div><div class="row"><button v-if="timeStore.countdown.status === 'running'" class="primary" @click="pause">暂停</button><button v-else-if="timeStore.countdown.status === 'paused'" class="primary" @click="resume">继续计时</button><button v-else class="primary" @click="start">开始计时</button><button class="small-button" @click="reset">重置</button><button v-if="timeStore.countdown.status === 'idle'" class="small-button" @click="minutes = 25; reset()">25 分钟</button><button v-if="timeStore.countdown.status === 'idle'" class="small-button" @click="minutes = 5; reset()">5 分钟</button></div></div>
  </section>
  <p class="calendar-caption">声音需点击页首「启用蜂鸣提醒」。计时跨页面生效并在刷新后保留；关闭页面或设备休眠时无法准点响铃，恢复页面后补发到期提醒。</p>
</template>
