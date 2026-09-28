<script setup lang="ts">
import { computed, ref } from 'vue'
import { training, createPlan, safeUrl } from '../store/trainingStore'
const title = ref(''), selected = ref(training.plans[0]?.id || ''), error = ref(''), saved = ref('')
const plan = computed(() => training.plans.find(p => p.id === selected.value))
const problemTitle = ref(''), url = ref(''), difficulty = ref('自定义')
function addPlan() { if (title.value.trim()) { selected.value = createPlan(title.value); title.value = '' } }
function addProblem() {
  error.value = ''
  if (!plan.value || !problemTitle.value.trim()) return
  const link = safeUrl(url.value)
  if (url.value && !link) { error.value = '题目链接必须是有效的 http / https 地址'; return }
  if (link && plan.value.problems.some(p => p.url === link)) { error.value = '该题已经在题单中'; return }
  plan.value.problems.push({ id: crypto.randomUUID(), title: problemTitle.value.trim(), url: link, platform: '自定义', difficulty: difficulty.value, done: false })
  problemTitle.value = ''; url.value = ''
}
function schedule() {
  if (!plan.value) return
  error.value = ''; saved.value = ''
  if (!plan.value.due || Date.parse(plan.value.due) <= Date.now()) { error.value = '请选择未来的提醒时间'; return }
  plan.value.firedFor = ''; plan.value.enabled = true; saved.value = '提醒已设定；请保持页面打开并启用蜂鸣声音。'
}
function removePlan() {
  if (!plan.value || !confirm(`删除「${plan.value.title}」及其中题目？`)) return
  training.plans = training.plans.filter(p => p.id !== selected.value); selected.value = training.plans[0]?.id || ''
}
</script>
<template>
  <div class="page-heading"><div><p class="eyebrow">PERSONAL TRAINING</p><h1>训练计划</h1><p>自建题单、完成记录与定时提醒。</p></div></div>
  <div class="training-layout">
    <aside class="panel"><h2>我的题单 <small>{{ training.plans.length }}</small></h2>
      <form @submit.prevent="addPlan" class="stack"><label>新题单名称<input v-model="title" required maxlength="100" placeholder="例如：动态规划专项" /></label><button class="primary">创建题单</button></form>
      <button v-for="p in training.plans" :key="p.id" class="plan-option" :class="{ active: selected === p.id }" @click="selected = p.id; saved = ''; error = ''">{{ p.title }}<small>{{ p.problems.filter(q => q.done).length }} / {{ p.problems.length }} 已完成</small></button>
    </aside>
    <section v-if="plan" class="panel stack">
      <div class="row spread"><h2>训练计划</h2><button class="danger" @click="removePlan">删除题单</button></div>
      <label>题单名称<input v-model="plan.title" maxlength="100" /></label>
      <label>训练目标 / 备注<textarea v-model="plan.notes" rows="2" maxlength="2000" placeholder="本周完成 10 道二分查找，复盘边界条件…" /></label>
      <div class="reminder-box"><div class="row"><label>提醒时间（本地时区）<input type="datetime-local" v-model="plan.due" @change="plan.enabled = false; saved = ''" /></label><button class="primary" @click="schedule">设定提醒</button><button v-if="plan.enabled" class="small-button" @click="plan.enabled = false">取消提醒</button></div>
        <p>{{ plan.enabled ? (plan.firedFor === plan.due ? '已提醒' : '等待提醒') : '未启用提醒' }} · 单次提醒，刷新后保留；重新打开页面会补发到期提醒。</p>
        <p>请保持页面打开并点击顶部「启用蜂鸣提醒」。设备休眠或关闭页面时无法准时响铃。</p>
      </div>
      <p v-if="saved" class="success" role="status">{{ saved }}</p><p v-if="error" class="error" role="alert">{{ error }}</p>
      <div><div class="row spread"><h2>题目清单</h2><span>{{ plan.problems.filter(p => p.done).length }} / {{ plan.problems.length }}</span></div><progress :value="plan.problems.filter(p => p.done).length" :max="plan.problems.length || 1" /></div>
      <form @submit.prevent="addProblem" class="problem-form"><label>题目名称<input v-model="problemTitle" required maxlength="200" placeholder="输入题目名称" /></label><label>题目链接（可选）<input v-model="url" type="url" placeholder="https://…" /></label><label>难度<input v-model="difficulty" maxlength="30" /></label><button class="primary">添加题目</button></form>
      <p v-if="!plan.problems.length" class="empty">题单还是空的。手动添加题目，或去新题推荐中一键加入。</p>
      <div v-for="p in plan.problems" :key="p.id" class="problem-row"><input type="checkbox" v-model="p.done" :aria-label="`完成 ${p.title}`" /><div class="grow" :class="{ completed: p.done }"><a v-if="safeUrl(p.url)" :href="safeUrl(p.url)" target="_blank" rel="noopener noreferrer">{{ p.title }} ↗</a><span v-else>{{ p.title }}</span><small>{{ p.platform }} · {{ p.difficulty }}</small></div><button class="danger" @click="plan.problems = plan.problems.filter(q => q.id !== p.id)">移除</button></div>
    </section>
    <section v-else class="panel empty"><h2>暂无训练计划</h2><p>创建题单后可添加题目和提醒。</p></section>
  </div>
</template>
