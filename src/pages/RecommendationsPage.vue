<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { training, createPlan } from '../store/trainingStore'
interface Problem { id: string; platform: string; title: string; url: string; difficulty: string; rating?: number; tags: string[]; paid: boolean }
const platform = ref('codeforces'), site = ref('com'), difficulty = ref('all'), search = ref(''), freeOnly = ref(true)
const problems = ref<Problem[]>([]), loading = ref(false), error = ref(''), message = ref(''), fetchedAt = ref(''), stale = ref(false)
const selected = ref(training.plans[0]?.id || '')
let request = 0
async function fetchProblems() {
  const token = ++request; loading.value = true; error.value = ''
  try {
    const response = await fetch(`/api/training/problems?platform=${platform.value}&site=${site.value}`)
    const result = await response.json()
    if (token !== request) return
    if (!response.ok) throw new Error(result.error || '获取失败')
    problems.value = result.data; fetchedAt.value = result.fetchedAt; stale.value = result.stale
  } catch (e: any) { if (token === request) error.value = e.message }
  finally { if (token === request) loading.value = false }
}
watch([platform, site], () => { problems.value = []; fetchedAt.value = ''; difficulty.value = 'all'; fetchProblems() })
onMounted(fetchProblems)
const filtered = computed(() => problems.value.filter(p => {
  const matches = difficulty.value === 'all' || p.difficulty === difficulty.value || (difficulty.value === 'beginner' && p.rating != null && p.rating <= 1200) || (difficulty.value === 'intermediate' && p.rating != null && p.rating > 1200 && p.rating <= 2000) || (difficulty.value === 'advanced' && p.rating != null && p.rating > 2000)
  return matches && (!freeOnly.value || !p.paid) && `${p.id} ${p.title} ${p.tags.join(' ')}`.toLowerCase().includes(search.value.toLowerCase())
}))
function add(p: Problem) {
  message.value = ''
  let plan = training.plans.find(p => p.id === selected.value)
  if (!plan) { selected.value = createPlan('新题训练'); plan = training.plans.find(p => p.id === selected.value)! }
  if (plan.problems.some(q => q.url === p.url)) { message.value = '该题已在题单中'; return }
  plan.problems.push({ ...p, id: crypto.randomUUID(), done: false }); message.value = `已将「${p.title}」加入「${plan.title}」`
}
</script>
<template>
  <div class="page-heading"><div><p class="eyebrow">FRESH CHALLENGES</p><h1>新题推荐</h1><p>从最新题库中按难度选题，一键加入自己的训练计划。</p></div><button class="primary" :disabled="loading" @click="fetchProblems">{{ loading ? '抓取中…' : '刷新新题' }}</button></div>
  <section class="panel">
    <div class="filters"><label>平台<select v-model="platform"><option value="codeforces">Codeforces</option><option value="leetcode">LeetCode</option></select></label><label v-if="platform === 'leetcode'">站点<select v-model="site"><option value="com">国际站</option><option value="cn">中国站</option></select></label>
      <label>难度<select v-model="difficulty"><option value="all">全部难度</option><template v-if="platform === 'codeforces'"><option value="beginner">入门 ≤ 1200</option><option value="intermediate">进阶 1300–2000</option><option value="advanced">挑战 &gt; 2000</option><option value="未评级">未评级</option></template><template v-else><option>Easy</option><option>Medium</option><option>Hard</option></template></select></label>
      <label class="grow">搜索<input v-model="search" placeholder="题号、名称或标签" /></label><label>加入题单<select v-model="selected"><option value="">自动创建「新题训练」</option><option v-for="p in training.plans" :key="p.id" :value="p.id">{{ p.title }}</option></select></label>
    </div>
    <div class="row spread muted"><p>{{ platform === 'codeforces' ? '按比赛编号倒序，同场按题号排序' : '按题号倒序（近似上新顺序）' }} · 最近 150 题 · 缓存 5 分钟</p><label class="row"><input type="checkbox" v-model="freeOnly" /> 只看免费题</label></div>
    <p v-if="fetchedAt" class="muted">更新于 {{ new Date(fetchedAt).toLocaleString() }}{{ stale ? ' · 上游不可用，当前展示缓存' : '' }}</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p><p v-if="message" class="success" role="status">{{ message }}</p>
    <div v-if="loading && !problems.length" class="empty">正在连接 {{ platform === 'codeforces' ? 'Codeforces' : 'LeetCode' }} 题库…</div>
    <div v-else-if="!filtered.length" class="empty">{{ error ? '暂时没有可展示的题目，请重试。' : '没有符合条件的题目，试试调整筛选。' }}</div>
    <div v-for="p in filtered" :key="p.id" class="problem-row"><span class="problem-id">{{ p.id }}</span><div class="grow"><a :href="p.url" target="_blank" rel="noopener noreferrer">{{ p.title }} ↗</a><small>{{ p.tags.join(' · ') || (p.platform === 'leetcode' ? 'LeetCode 题库' : '暂无标签') }}{{ p.paid ? ' · 会员题' : '' }}</small></div><span class="badge">{{ p.difficulty }}</span><button class="small-button" @click="add(p)">＋ 加入题单</button></div>
  </section>
</template>
