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

const manualData = reactive({
  total: 0,
  easy: 0,
  medium: 0,
  hard: 0
})

const difficultyLabel: Record<string, string> = {
  Easy: '简单',
  Medium: '中等',
  Hard: '困难'
}

const difficultyClass: Record<string, string> = {
  Easy: 'text-green-700',
  Medium: 'text-amber-700',
  Hard: 'text-red-700'
}

onMounted(() => {
  const existing = ojStore.userData[props.ojId]
  if (existing) {
    userId.value = existing.userId
    data.value = existing.data
  }
})

async function loadData() {
  if (!userId.value.trim()) {
    error.value = '请输入用户名'
    return
  }

  loading.value = true
  error.value = ''
  message.value = ''

  try {
    const result = await props.fetchFn(userId.value.trim())
    data.value = result
    setOJData(props.ojId, userId.value, result)
    message.value = '数据获取成功'
  } catch (e: any) {
    error.value = e.message || '获取失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function loadProblemList() {
  if (!problemListUrl.value.trim()) {
    error.value = '请输入题单链接'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const list = await parseProblemList(problemListUrl.value.trim())
    problemListTitle.value = list.title
    problemList.value = list.problems
    doCompare()
  } catch (e: any) {
    error.value = e.message || '解析失败'
  } finally {
    loading.value = false
  }
}

function doCompare() {
  const done: Problem[] = []
  const notDone: Problem[] = []

  for (const problem of problemList.value) {
    if (manualSolvedIds.value.has(problem.id)) {
      done.push(problem)
    } else {
      notDone.push(problem)
    }
  }

  const progress = problemList.value.length > 0
    ? Math.round((done.length / problemList.value.length) * 100)
    : 0

  comparison.value = { done, notDone, progress }
}

function toggleSolved(problemId: string) {
  if (manualSolvedIds.value.has(problemId)) {
    manualSolvedIds.value.delete(problemId)
  } else {
    manualSolvedIds.value.add(problemId)
    const problem = problemList.value.find(p => p.id === problemId)
    if (problem) {
      addDailyProblem(props.ojId, problem.id, problem.title)
    }
  }
  doCompare()
}

function goBack() {
  router.push('/')
}

function refreshData() {
  if (data.value) {
    loadData()
  }
}

function clearAllData() {
  if (confirm('确定要清除所有数据吗？')) {
    data.value = null
    delete ojStore.userData[props.ojId]
    problemList.value = []
    comparison.value = null
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
  <div class="min-h-screen bg-white text-black font-songti">
    <header class="border-b-4 border-black py-4 px-4">
      <div class="max-w-5xl mx-auto flex justify-between items-center">
        <button @click="goBack" class="flex items-center hover:opacity-70">
          <span class="text-xl font-bold">← 返回首页</span>
        </button>
        <h1 class="text-2xl md:text-3xl font-bold flex items-center">
          <span v-if="config" class="mr-3" :style="{ color: config.color }">{{ config.icon }}</span>
          <span>{{ config?.fullName || 'OJ 平台' }}</span>
        </h1>
        <button
          v-if="data"
          @click="clearAllData"
          class="text-sm text-gray-600 hover:text-red-700"
        >
          清除数据
        </button>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 py-8">
      <!-- 用户信息输入 -->
      <section class="mb-10 border border-gray-800">
        <div class="bg-gray-200 border-b-2 border-gray-800 px-4 py-2">
          <h2 class="text-xl font-bold">用户信息</h2>
        </div>
        <div class="p-6">
          <label class="block text-sm font-bold mb-2">用户名</label>
          <input
            v-model="userId"
            type="text"
            placeholder="请输入用户名或用户ID"
            class="w-full px-4 py-2 mb-4 border-2 border-black bg-white text-black focus:outline-none focus:border-gray-600"
          />
          <div class="flex gap-3 justify-center">
            <button
              @click="loadData"
              :disabled="loading"
              class="px-8 py-2 bg-black text-white font-bold hover:bg-gray-800 disabled:bg-gray-400 transition-colors border-2 border-black"
            >
              {{ loading ? '加载中...' : '查询' }}
            </button>
            <button
              v-if="data"
              @click="refreshData"
              class="px-8 py-2 border-2 border-black font-bold hover:bg-gray-200 transition-colors"
            >
              刷新
            </button>
          </div>
          <div v-if="error" class="mt-4 p-3 border-2 border-red-700 bg-red-50 text-red-700 text-sm text-center">
            {{ error }}
          </div>
          <div v-if="message" class="mt-4 p-3 border-2 border-green-700 bg-green-50 text-green-700 text-sm text-center">
            {{ message }}
          </div>
        </div>
      </section>

      <!-- 统计数据展示 -->
      <section v-if="data" class="mb-10">
        <div class="border-b-4 border-double border-gray-800 pb-2 mb-6">
          <h2 class="text-2xl font-bold">做题统计</h2>
          <p class="text-sm text-gray-600">用户：{{ data.userId }}</p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div class="text-center p-4 border border-gray-300">
            <p class="text-sm text-gray-600 mb-1">总计</p>
            <p class="text-4xl font-bold">{{ data.totalSolved }}</p>
          </div>
          <div class="text-center p-4 border border-gray-300">
            <p class="text-sm text-green-700 mb-1">简单</p>
            <p class="text-4xl font-bold text-green-700">{{ data.easySolved }}</p>
          </div>
          <div class="text-center p-4 border border-gray-300">
            <p class="text-sm text-amber-700 mb-1">中等</p>
            <p class="text-4xl font-bold text-amber-700">{{ data.mediumSolved }}</p>
          </div>
          <div class="text-center p-4 border border-gray-300">
            <p class="text-sm text-red-700 mb-1">困难</p>
            <p class="text-4xl font-bold text-red-700">{{ data.hardSolved }}</p>
          </div>
        </div>
        <p class="text-xs text-gray-500 text-right">
          最后更新：{{ new Date(data.lastUpdated).toLocaleString('zh-CN') }}
        </p>
      </section>

      <!-- 题单对比 -->
      <section class="mb-10 border border-gray-800">
        <div class="bg-gray-200 border-b-2 border-gray-800 px-4 py-2">
          <h2 class="text-xl font-bold">题单对比</h2>
        </div>
        <div class="p-6">
          <label class="block text-sm font-bold mb-2">题单链接（可选）</label>
          <div class="flex gap-2 mb-4">
            <input
              v-model="problemListUrl"
              type="url"
              placeholder="输入题单链接..."
              class="flex-1 px-4 py-2 border-2 border-black bg-white text-black focus:outline-none focus:border-gray-600"
            />
            <button
              @click="loadProblemList"
              :disabled="loading"
              class="px-6 py-2 border-2 border-black font-bold hover:bg-gray-200 transition-colors"
            >
              解析
            </button>
          </div>

          <div v-if="problemList.length > 0" class="mt-6">
            <div class="mb-4 p-3 bg-gray-100 border border-gray-400">
              <h3 class="text-lg font-bold">题单：{{ problemListTitle }}</h3>
              <p class="text-sm">共 {{ problemList.length }} 题，勾选已完成的题目</p>
            </div>

            <div v-if="comparison" class="space-y-4">
              <div>
                <h4 class="text-lg font-bold mb-3 border-b-2 border-gray-400 pb-1">
                  已完成（{{ comparison.done.length }}）
                </h4>
                <ul class="space-y-1 max-h-60 overflow-y-auto">
                  <li
                    v-for="(problem, index) in comparison.done"
                    :key="problem.id"
                    class="py-2 border-b border-gray-200 flex items-start"
                  >
                    <input
                      type="checkbox"
                      :checked="true"
                      @change="toggleSolved(problem.id)"
                      class="mr-3 mt-1"
                    />
                    <span class="font-mono text-gray-600 w-16 shrink-0">{{ problem.id }}</span>
                    <span class="flex-1">{{ problem.title }}</span>
                    <span :class="['ml-2 text-sm', difficultyClass[problem.difficulty]]">
                      {{ difficultyLabel[problem.difficulty] }}
                    </span>
                  </li>
                </ul>
              </div>

              <div class="mt-6">
                <h4 class="text-lg font-bold mb-3 border-b-2 border-gray-400 pb-1">
                  未完成（{{ comparison.notDone.length }}）
                </h4>
                <ul class="space-y-2 max-h-80 overflow-y-auto">
                  <li
                    v-for="(problem, index) in comparison.notDone"
                    :key="problem.id"
                    class="py-3 border-b border-gray-200 flex items-start cursor-pointer hover:bg-gray-50"
                    @click="toggleSolved(problem.id)"
                  >
                    <input
                      type="checkbox"
                      :checked="false"
                      class="mr-3 mt-1"
                    />
                    <span class="font-songti text-lg font-bold">
                      未做{{ problemListTitle }}题单的第{{ index + 1 }}题 - {{ problem.title }}
                    </span>
                  </li>
                </ul>
              </div>

              <div class="mt-6">
                <p class="text-sm font-bold mb-2">完成进度：{{ comparison.progress }}%</p>
                <div class="h-3 bg-gray-200 border border-gray-400">
                  <div
                    class="h-full bg-black transition-all duration-500"
                    :style="{ width: `${comparison.progress}%` }"
                  ></div>
                </div>
              </div>

              <div v-if="comparison.notDone.length === 0 && comparison.done.length > 0" class="text-center py-4">
                <p class="text-xl font-bold">恭喜！您已完成本题单全部题目！</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 手动输入 -->
      <section class="mb-10 border border-gray-800">
        <div class="bg-gray-200 border-b-2 border-gray-800 px-4 py-2">
          <h2 class="text-xl font-bold">手动输入</h2>
        </div>
        <div class="p-6">
          <p class="text-sm text-gray-600 mb-4">如自动获取失败，可手动输入做题数进行记录</p>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-bold mb-1">总计</label>
              <input
                v-model.number="manualData.total"
                type="number"
                min="0"
                class="w-full px-3 py-2 border-2 border-black text-black"
              />
            </div>
            <div>
              <label class="block text-sm font-bold mb-1">简单</label>
              <input
                v-model.number="manualData.easy"
                type="number"
                min="0"
                class="w-full px-3 py-2 border-2 border-black text-black"
              />
            </div>
            <div>
              <label class="block text-sm font-bold mb-1">中等</label>
              <input
                v-model.number="manualData.medium"
                type="number"
                min="0"
                class="w-full px-3 py-2 border-2 border-black text-black"
              />
            </div>
            <div>
              <label class="block text-sm font-bold mb-1">困难</label>
              <input
                v-model.number="manualData.hard"
                type="number"
                min="0"
                class="w-full px-3 py-2 border-2 border-black text-black"
              />
            </div>
          </div>
          <div class="mt-4 text-center">
            <button
              @click="manualUpdate"
              class="px-8 py-2 border-2 border-black font-bold hover:bg-gray-200 transition-colors"
            >
              保存数据
            </button>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t-4 border-double border-black py-4 px-4">
      <div class="max-w-5xl mx-auto text-center text-sm">
        <p>OJ-Tracker · 数据仅存储于本地浏览器</p>
      </div>
    </footer>
  </div>
</template>
