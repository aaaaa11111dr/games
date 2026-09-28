<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { training } from '../store/trainingStore'
import { dueReminders } from '../lib/reminders'
import { timeStore } from '../store/timeStore'
const enabled = ref(false)
const message = ref('')
const alerts = ref<{ id: string; title: string }[]>([])
let audio: AudioContext | undefined
let timer: ReturnType<typeof setInterval>
function beep() {
  if (!audio || audio.state !== 'running') { enabled.value = false; return }
  for (let i = 0; i < 3; i++) {
    const oscillator = audio.createOscillator(), gain = audio.createGain()
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.frequency.value = 880
    const start = audio.currentTime + i * .4
    gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.18, start + .02); gain.gain.exponentialRampToValueAtTime(.001, start + .25)
    oscillator.start(start); oscillator.stop(start + .3)
  }
}
async function enable() {
  try { audio ||= new AudioContext(); await audio.resume(); enabled.value = audio.state === 'running'; beep(); message.value = enabled.value ? '声音已启用，本次打开期间有效' : '浏览器未允许音频，请再次点击' }
  catch { message.value = '此浏览器暂无法启用声音，仍会显示提醒' }
}
function check() {
  const due = dueReminders([...training.plans, ...timeStore.alarms])
  for (const plan of due) {
    plan.firedFor = plan.due
    alerts.value.push({ id: `${plan.id}:${plan.due}`, title: plan.title })
  }
  let timerDone = false
  if (timeStore.countdown.status === 'running' && timeStore.countdown.end <= Date.now()) {
    timerDone = true
    timeStore.countdown.status = 'finished'; timeStore.countdown.remaining = 0
    alerts.value.push({ id: `timer:${timeStore.countdown.end}`, title: `${timeStore.countdown.title} · 倒计时完成` })
  }
  if (due.length || timerDone) beep()
}
onMounted(() => { check(); timer = setInterval(check, 1000); window.addEventListener('focus', check); document.addEventListener('visibilitychange', check) })
onUnmounted(() => { clearInterval(timer); window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', check); void audio?.close() })
</script>
<template>
  <div class="reminder-control"><button class="small-button" @click="enable">{{ enabled ? '♫ 试听提醒' : '♬ 启用蜂鸣提醒' }}</button><span role="status">{{ message }}</span></div>
  <div v-if="alerts.length" class="reminder-alert" role="alert">
    <strong>⏰ 时间到了</strong><p v-for="item in alerts" :key="item.id">{{ item.title }}</p>
    <p v-if="!enabled">声音尚未启用，请点击顶部按钮。</p>
    <RouterLink to="/calendar">查看日程</RouterLink><button class="primary" @click="alerts = []">知道了</button>
  </div>
  <p v-if="training.storageError" class="error" role="alert">{{ training.storageError }}</p>
  <p v-if="timeStore.storageError" class="error" role="alert">{{ timeStore.storageError }}</p>
</template>
