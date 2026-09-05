<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { getOJConfig } from '../config/ojConfigs'
import { ojStore, setOJData, addDailyProblem } from '../store/ojStore'
import { parseProblemList } from '../api/ojApi'
import type { Problem, ComparisonResult, OJData } from '../types'

const props = defineProps<{
  ojId: string
  fetchFn: (userId: string) => Promise<OJData>
}>()

const router = useRouter()
const config = getOJConfig(props.ojId)

const userId = ref('')
const loading = ref(false)
const error = ref('')
const message = ref('')

const data = ref<OJData | null>(null)

const problemListUrl = ref('')
const problemListTitle = ref('')
const problemList = ref<Problem[]>([])
const comparison = ref<ComparisonResult | null>(null)
const manualSolvedIds = ref<Set<string>>(new Set())

const manualData = reactive({ total: 0, easy: 0, medium: 0, hard: 0 })

const difficultyLabel: Record<string, string> = { Easy: '简单', Medium: '中等', Hard: '困难' }
const difficultyClass: Record<string, string> = {
  Easy: 'text-green-800',
  Medium: 'text-amber-800',
  Hard: 'text-red-800'
}

onMounted(() => {
  const existing = ojStore.userData[props.ojId]
  if (existing) { userId.value = existing.userId; data.value = existing.data }
})

async function loadData() {
  if (!userId.value.trim()) { error.value = '请输入用户名'; return }
  loading.value = true; error.value = ''; message.value = ''
  try {
    const result = await props.fetchFn(userId.value.trim())
    data.value = result
    setOJData(props.ojId, userId.value, result)
    message.value = '数据获取成功'
  } catch (e: any) {
    error.value = e.message || '获取失败，请稍后重试'
  } finally { loading.value = false }
}

async function loadProblemList() {
  if (!problemListUrl.value.trim()) { error.value = '请输入题单链接'; return }
  loading.value = true; error.value = ''
  try {
    const list = await parseProblemList(problemListUrl.value.trim())
    problemListTitle.value = list.title
    problemList.value = list.problems
    doCompare()
  } catch (e: any) { error.value = e.message || '解析失败' }
  finally { loading.value = false }
}

function doCompare() {
  const done: Problem[] = []
  const notDone: Problem[] = []
  for (const problem of problemList.value) {
    if (manualSolvedIds.value.has(problem.id)) done.push(problem)
    else notDone.push(problem)
  }
  const progress = problemList.value.length > 0
    ? Math.round((done.length / problemList.value.length) * 100) : 0
  comparison.value = { done, notDone, progress }
}

function toggleSolved(problemId: string) {
  if (manualSolvedIds.value.has(problemId)) manualSolvedIds.value.delete(problemId)
  else {
    manualSolvedIds.value.add(problemId)
    const problem = problemList.value.find(p => p.id === problemId)
    if (problem) addDailyProblem(props.ojId, problem.id, problem.title)
  }
  doCompare()
}

function goBack() { router.push('/') }
function refreshData() { if (data.value) loadData() }
function clearAllData() {
  if (confirm('确定要清除所有数据吗？')) {
    data.value = null
    delete ojStore.userData[props.ojId]
    problemList.value = []; comparison.value = null
  }
}
function manualUpdate() {
  const now = new Date().toISOString()
  const newData: OJData = {
    userId: userId.value,
    totalSolved: manualData.total || manualData.easy + manualData.medium + manualData.hard,
    easySolved: manualData.easy,
    mediumSolved: manualData.medium,
    hardSolved: manualData.hard,
    lastUpdated: now
  }
  data.value = newData
  setOJData(props.ojId, userId.value, newData)
  message.value = '数据保存成功'
}
</script>

<template>
  <div class="min-h-screen">

    <!-- ====== 报头：双线 + 斜体大标题 + 横线分隔 ====== -->
    <header class="px-4 pt-8 pb-3 md:pt-10">
      <div class="max-w-4xl mx-auto">
        <!-- 顶部行：左返回 · 中OJ名 · 右操作 -->
        <div class="flex items-center justify-between mb-4">
          <button @click="goBack" class="text-sm md:text-base tracking-[0.3em] hover:underline">
            ← 返 回 首 页
          </button>
          <h1 class="newspaper-headline text-3xl md:text-5xl !my-0">
            {{ config?.fullName || config?.name || 'O J' }}
          </h1>
          <button
            v-if="data"
            @click="clearAllData"
            class="text-xs md:text-sm text-gray-500 hover:text-red-700 tracking-widest"
          >
            清 除
          </button>
        </div>
        <!-- 双线分隔 -->
        <div class="newspaper-double-line"></div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-5 md:px-10 pb-16">

      <!-- ====== 用户信息 ====== -->
      <section class="mt-4 md:mt-8">
        <div class="flex items-center gap-3 md:gap-6 mb-4 md:mb-5">
          <div class="flex-1 border-t border-black"></div>
          <h2 class="newspaper-section-title text-lg md:text-2xl tracking-[0.3em]">用 户 信 息</h2>
          <div class="flex-1 border-t border-black"></div>
        </div>

        <div class="space-y-3">
          <p class="text-sm md:text-base text-gray-600">请输入您的 {{ config?.name }} 用户名，系统将自动拉取做题数据。</p>

          <div class="flex flex-col md:flex-row gap-2 md:gap-3 items-stretch">
            <input
              v-model="userId"
              type="text"
              :placeholder="'请输入 ' + config?.name + ' 用户名'"
              class="flex-1 px-3 md:px-4 py-2 md:py-3 bg-transparent border-b border-black outline-none text-base md:text-lg placeholder:text-gray-400"
            />
            <div class="flex gap-2">
              <button
                @click="loadData"
                :disabled="loading"
                class="px-5 md:px-7 py-2 md:py-3 border border-black text-sm md:text-base tracking-[0.3em] hover:bg-black hover:text-white disabled:text-gray-400 disabled:border-gray-400 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
              >
                {{ loading ? '加 载 中' : '查 询' }}
              </button>
              <button
                v-if="data"
                @click="refreshData"
                class="px-5 md:px-7 py-2 md:py-3 border border-gray-500 text-sm md:text-base tracking-[0.3em] text-gray-700 hover:bg-gray-200 transition-colors"
              >
                刷 新
              </button>
            </div>
          </div>

          <p v-if="error" class="text-sm text-red-700 tracking-widest mt-2">※ {{ error }}</p>
          <p v-if="message" class="text-sm text-green-800 tracking-widest mt-2">✓ {{ message }}</p>
        </div>
      </section>

      <!-- ====== 做题统计（横版表格，无边框） ====== -->
      <section v-if="data" class="mt-10 md:mt-14">
        <div class="flex items-center gap-3 md:gap-6 mb-4 md:mb-5">
          <div class="flex-1 border-t border-black"></div>
          <h2 class="newspaper-section-title text-lg md:text-2xl tracking-[0.3em]">做 题 统 计</h2>
          <div class="flex-1 border-t border-black"></div>
        </div>

        <p class="text-sm text-gray-600 mb-4 tracking-widest">用 户：{{ data.userId }}</p>

        <!-- 数字横向铺开，用竖线分隔 -->
        <div class="flex items-stretch text-center border-y border-black">
          <div class="flex-1 py-4 md:py-6">
            <p class="text-[10px] md:text-xs tracking-[0.3em] text-gray-600 mb-1">总 计</p>
            <p class="text-4xl md:text-6xl tabular-nums">{{ data.totalSolved }}</p>
          </div>
          <div class="w-px bg-black my-3 md:my-4"></div>
          <div class="flex-1 py-4 md:py-6">
            <p class="text-[10px] md:text-xs tracking-[0.3em] text-green-800 mb-1">简 单</p>
            <p class="text-4xl md:text-6xl tabular-nums text-green-800">{{ data.easySolved }}</p>
          </div>
          <div class="w-px bg-black my-3 md:my-4"></div>
          <div class="flex-1 py-4 md:py-6">
            <p class="text-[10px] md:text-xs tracking-[0.3em] text-amber-800 mb-1">中 等</p>
            <p class="text-4xl md:text-6xl tabular-nums text-amber-800">{{ data.mediumSolved }}</p>
          </div>
          <div class="w-px bg-black my-3 md:my-4"></div>
          <div class="flex-1 py-4 md:py-6">
            <p class="text-[10px] md:text-xs tracking-[0.3em] text-red-800 mb-1">困 难</p>
            <p class="text-4xl md:text-6xl tabular-nums text-red-800">{{ data.hardSolved }}</p>
          </div>
        </div>

        <p class="text-[10px] md:text-xs text-gray-500 text-right mt-2 tracking-widest">
          最后更新：{{ new Date(data.lastUpdated).toLocaleString('zh-CN') }}
        </p>
      </section>

      <!-- ====== 题单对比 ====== -->
      <section class="mt-10 md:mt-14">
        <div class="flex items-center gap-3 md:gap-6 mb-4 md:mb-5">
          <div class="flex-1 border-t border-black"></div>
          <h2 class="newspaper-section-title text-lg md:text-2xl tracking-[0.3em]">题 单 对 比</h2>
          <div class="flex-1 border-t border-black"></div>
        </div>

        <div class="flex flex-col md:flex-row gap-2 md:gap-3 mb-4">
          <input
            v-model="problemListUrl"
            type="url"
            placeholder="输入题单链接..."
            class="flex-1 px-3 md:px-4 py-2 md:py-3 bg-transparent border-b border-black outline-none text-base placeholder:text-gray-400"
          />
          <button
            @click="loadProblemList"
            :disabled="loading"
            class="px-5 md:px-7 py-2 md:py-3 border border-black text-sm md:text-base tracking-[0.3em] hover:bg-black hover:text-white disabled:text-gray-400 disabled:border-gray-400 transition-colors"
          >
            {{ loading ? '加 载 中' : '解 析' }}
          </button>
        </div>

        <div v-if="problemList.length > 0" class="mt-6">
          <p class="text-sm text-gray-700 mb-1">题单：{{ problemListTitle }}</p>
          <p class="text-xs text-gray-500 tracking-widest mb-4">共 {{ problemList.length }} 题 · 点击切换已完成状态</p>

          <div v-if="comparison" class="space-y-6">
            <!-- 已完成 -->
            <div v-if="comparison.done.length > 0">
              <h4 class="oj-title-italic text-base md:text-lg mb-2 tracking-widest">已完 成（{{ comparison.done.length }}）</h4>
              <ul class="border-t border-gray-400">
                <li
                  v-for="problem in comparison.done"
                  :key="problem.id"
                  @click="toggleSolved(problem.id)"
                  class="flex items-start gap-3 py-2 border-b border-gray-200 cursor-pointer text-sm md:text-base"
                >
                  <span class="text-gray-400 select-none">✓</span>
                  <span class="font-mono text-gray-600 w-12 shrink-0">{{ problem.id }}</span>
                  <span class="flex-1 truncate">{{ problem.title }}</span>
                  <span :class="['text-xs tracking-widest shrink-0', difficultyClass[problem.difficulty]]">
                    {{ difficultyLabel[problem.difficulty] }}
                  </span>
                </li>
              </ul>
            </div>

            <!-- 未完成 -->
            <div>
              <h4 class="oj-title-italic text-base md:text-lg mb-2 tracking-widest">未完 成（{{ comparison.notDone.length }}）</h4>
              <ul class="border-t border-gray-400">
                <li
                  v-for="(problem, index) in comparison.notDone"
                  :key="problem.id"
                  @click="toggleSolved(problem.id)"
                  class="flex items-start gap-3 py-2 border-b border-gray-200 cursor-pointer text-sm md:text-base hover:bg-gray-100 transition-colors"
                >
                  <span class="text-gray-300 select-none">{{ index + 1 }}.</span>
                  <span class="font-mono text-gray-600 w-12 shrink-0">{{ problem.id }}</span>
                  <span class="flex-1 truncate">{{ problem.title }}</span>
                  <span :class="['text-xs tracking-widest shrink-0', difficultyClass[problem.difficulty]]">
                    {{ difficultyLabel[problem.difficulty] }}
                  </span>
                </li>
              </ul>
            </div>

            <!-- 进度 -->
            <div class="border-t border-black pt-4">
              <p class="text-xs md:text-sm tracking-widest text-gray-700 mb-2">
                完 成 进 度  —  {{ comparison.progress }}%
              </p>
              <div class="h-2 bg-gray-200 border border-black">
                <div
                  class="h-full bg-black transition-all duration-500"
                  :style="{ width: `${comparison.progress}%` }"
                ></div>
              </div>
              <p v-if="comparison.notDone.length === 0" class="text-center mt-4 text-base md:text-lg tracking-[0.3em]">
                ★ 恭 喜 您 · 全 部 完 成 ★
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- ====== 手动输入 ====== -->
      <section class="mt-10 md:mt-14">
        <div class="flex items-center gap-3 md:gap-6 mb-4 md:mb-5">
          <div class="flex-1 border-t border-black"></div>
          <h2 class="newspaper-section-title text-lg md:text-2xl tracking-[0.3em]">手 动 输 入</h2>
          <div class="flex-1 border-t border-black"></div>
        </div>

        <p class="text-sm text-gray-600 mb-4">如自动获取失败，可手动输入做题数</p>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div>
            <label class="block text-xs tracking-widest text-gray-600 mb-1">总 计</label>
            <input
              v-model.number="manualData.total"
              type="number" min="0"
              class="w-full px-2 py-1 bg-transparent border-b border-black outline-none text-base text-center tabular-nums"
            />
          </div>
          <div>
            <label class="block text-xs tracking-widest text-green-800 mb-1">简 单</label>
            <input
              v-model.number="manualData.easy"
              type="number" min="0"
              class="w-full px-2 py-1 bg-transparent border-b border-black outline-none text-base text-center tabular-nums"
            />
          </div>
          <div>
            <label class="block text-xs tracking-widest text-amber-800 mb-1">中 等</label>
            <input
              v-model.number="manualData.medium"
              type="number" min="0"
              class="w-full px-2 py-1 bg-transparent border-b border-black outline-none text-base text-center tabular-nums"
            />
          </div>
          <div>
            <label class="block text-xs tracking-widest text-red-800 mb-1">困 难</label>
            <input
              v-model.number="manualData.hard"
              type="number" min="0"
              class="w-full px-2 py-1 bg-transparent border-b border-black outline-none text-base text-center tabular-nums"
            />
          </div>
        </div>

        <div class="text-center mt-5">
          <button
            @click="manualUpdate"
            class="px-7 md:px-10 py-2 md:py-3 border border-black text-sm md:text-base tracking-[0.3em] hover:bg-black hover:text-white transition-colors"
          >
            保 存 数 据
          </button>
        </div>
      </section>
    </main>

    <!-- 页脚 -->
    <footer class="border-t-[6px] border-double border-black py-4 text-center text-xs md:text-sm tracking-[0.5em] text-gray-600">
      O J - T r a c k e r · 保 护 您 的 隐 私
    </footer>
  </div>
</template>
