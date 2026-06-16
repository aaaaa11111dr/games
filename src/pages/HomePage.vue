<script setup lang="ts">
import { ref, computed } from 'vue'
import { fetchUserStats, fetchUserSolvedProblems, parseProblemList } from '../api/leetCode'
import type { UserStats, Problem, ComparisonResult } from '../types'

// 状态
const username = ref('')
const problemListUrl = ref('')
const userStats = ref<UserStats | null>(null)
const problemListTitle = ref('')
const problemList = ref<Problem[]>([])
const comparison = ref<ComparisonResult | null>(null)
const loading = ref(false)
const error = ref('')
const loadingStats = ref(false)
const loadingProblemList = ref(false)

// 错误状态
const statsError = ref('')
const problemListError = ref('')

// 难度显示
const difficultyLabel = {
  Easy: '简单',
  Medium: '中等',
  Hard: '困难'
}

// 难度颜色
const difficultyClass = {
  Easy: 'text-green-700',
  Medium: 'text-amber-700',
  Hard: 'text-red-700'
}

// 加载用户统计
async function loadUserStats() {
  if (!username.value.trim()) {
    statsError.value = '请输入 LeetCode 用户名'
    return
  }

  loadingStats.value = true
  statsError.value = ''
  userStats.value = null

  try {
    userStats.value = await fetchUserStats(username.value.trim())
  } catch (e: any) {
    statsError.value = e.message || '获取用户数据失败'
  } finally {
    loadingStats.value = false
  }
}

// 加载题单
async function loadProblemList() {
  if (!problemListUrl.value.trim()) {
    problemListError.value = '请输入题单链接'
    return
  }

  loadingProblemList.value = true
  problemListError.value = ''
  problemList.value = []
  problemListTitle.value = ''
  comparison.value = null

  try {
    const result = await parseProblemList(problemListUrl.value.trim())
    problemListTitle.value = result.title
    problemList.value = result.problems

    // 如果已有用户统计数据，自动进行对比
    if (userStats.value && username.value) {
      await compareResults()
    }
  } catch (e: any) {
    problemListError.value = e.message || '解析题单失败'
  } finally {
    loadingProblemList.value = false
  }
}

// 对比用户做题与题单
async function compareResults() {
  if (!username.value.trim() || problemList.value.length === 0) {
    return
  }

  loading.value = true
  error.value = ''
  comparison.value = null

  try {
    const solvedIds = await fetchUserSolvedProblems(username.value.trim())
    const done: Problem[] = []
    const notDone: Problem[] = []

    for (const problem of problemList.value) {
      if (solvedIds.has(problem.id)) {
        done.push(problem)
      } else {
        notDone.push(problem)
      }
    }

    const progress = problemList.value.length > 0
      ? Math.round((done.length / problemList.value.length) * 100)
      : 0

    comparison.value = { done, notDone, progress }
  } catch (e: any) {
    error.value = e.message || '对比失败'
  } finally {
    loading.value = false
  }
}

// 加载所有数据
async function loadAll() {
  if (!username.value.trim()) {
    statsError.value = '请输入 LeetCode 用户名'
    return
  }

  loading.value = true
  error.value = ''
  statsError.value = ''
  problemListError.value = ''

  try {
    // 并行获取用户统计和题单
    const [stats, solvedIds] = await Promise.all([
      fetchUserStats(username.value.trim()),
      fetchUserSolvedProblems(username.value.trim())
    ])

    userStats.value = stats

    // 如果有题单链接，继续解析
    if (problemListUrl.value.trim()) {
      const result = await parseProblemList(problemListUrl.value.trim())
      problemListTitle.value = result.title
      problemList.value = result.problems

      // 进行对比
      const done: Problem[] = []
      const notDone: Problem[] = []

      for (const problem of problemList.value) {
        if (solvedIds.has(problem.id)) {
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
  } catch (e: any) {
    error.value = e.message || '加载数据失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-white text-black font-songti">
    <!-- 顶部标题 -->
    <header class="border-b-4 border-black py-8 px-4">
      <div class="max-w-5xl mx-auto text-center">
        <h1 class="text-4xl md:text-5xl newspaper-title tracking-widest mb-2">
          LEETCODE 题单追踪器
        </h1>
        <p class="text-lg text-gray-600 tracking-wide">
          追踪您的刷题进度 · 轻松掌握面试技能
        </p>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="max-w-5xl mx-auto px-4 py-8">
      <!-- 输入区域 -->
      <section class="mb-10">
        <div class="grid md:grid-cols-2 gap-6 mb-6">
          <!-- 用户名输入 -->
          <div>
            <label class="block text-sm font-heiti font-bold mb-2 tracking-wider">
              LEETCODE 用户名
            </label>
            <input
              v-model="username"
              type="text"
              placeholder="请输入用户名"
              class="w-full px-4 py-3 border-2 border-black bg-white text-black focus:outline-none focus:border-gray-600 transition-colors"
            />
            <p v-if="statsError" class="text-red-700 text-sm mt-1">{{ statsError }}</p>
          </div>

          <!-- 题单链接输入 -->
          <div>
            <label class="block text-sm font-heiti font-bold mb-2 tracking-wider">
              题单链接（可选）
            </label>
            <input
              v-model="problemListUrl"
              type="url"
              placeholder="https://leetcode.cn/problem-list/..."
              class="w-full px-4 py-3 border-2 border-black bg-white text-black focus:outline-none focus:border-gray-600 transition-colors"
            />
            <p v-if="problemListError" class="text-red-700 text-sm mt-1">{{ problemListError }}</p>
          </div>
        </div>

        <!-- 查询按钮 -->
        <div class="text-center">
          <button
            @click="loadAll"
            :disabled="loading"
            class="px-12 py-3 bg-black text-white font-heiti font-bold tracking-wider hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors border-2 border-black"
          >
            <span v-if="loading" class="inline-block animate-pulse">加载中...</span>
            <span v-else>查 询</span>
          </button>
        </div>
      </section>

      <!-- 错误提示 -->
      <div v-if="error" class="mb-8 p-4 border-2 border-red-700 bg-red-50">
        <p class="text-red-700 font-heiti">{{ error }}</p>
      </div>

      <!-- 用户统计 -->
      <section v-if="userStats" class="mb-10 newspaper-section">
        <h2 class="text-2xl font-heiti font-bold mb-6 pb-2 border-b-2 border-black">
          用户做题统计
        </h2>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-4 border border-gray-300">
            <p class="text-sm text-gray-600 mb-1">总计</p>
            <p class="text-3xl font-bold">{{ userStats.totalSolved }}</p>
            <p class="text-xs text-gray-500">题</p>
          </div>

          <div class="text-center p-4 border border-gray-300">
            <p class="text-sm text-green-700 mb-1">{{ difficultyLabel.Easy }}</p>
            <p class="text-3xl font-bold text-green-700">{{ userStats.easySolved }}</p>
            <p class="text-xs text-gray-500">简单</p>
          </div>

          <div class="text-center p-4 border border-gray-300">
            <p class="text-sm text-amber-700 mb-1">{{ difficultyLabel.Medium }}</p>
            <p class="text-3xl font-bold text-amber-700">{{ userStats.mediumSolved }}</p>
            <p class="text-xs text-gray-500">中等</p>
          </div>

          <div class="text-center p-4 border border-gray-300">
            <p class="text-sm text-red-700 mb-1">{{ difficultyLabel.Hard }}</p>
            <p class="text-3xl font-bold text-red-700">{{ userStats.hardSolved }}</p>
            <p class="text-xs text-gray-500">困难</p>
          </div>
        </div>
      </section>

      <!-- 题单对比结果 -->
      <section v-if="comparison && problemList.length > 0" class="mb-10">
        <div class="border-b-2 border-black pb-2 mb-6">
          <h2 class="text-2xl font-heiti font-bold">题单对比结果</h2>
        </div>

        <!-- 题单信息 -->
        <div class="mb-6 p-4 bg-gray-50 border border-gray-300">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-heiti font-bold">题单：{{ problemListTitle }}</h3>
            <span class="text-lg">
              完成度：{{ comparison.done.length }}/{{ problemList.length }}
              <span class="font-bold">({{ comparison.progress }}%)</span>
            </span>
          </div>

          <!-- 进度条 -->
          <div class="h-4 bg-gray-200 border border-gray-400">
            <div
              class="h-full bg-black transition-all duration-500"
              :style="{ width: `${comparison.progress}%` }"
            ></div>
          </div>
        </div>

        <!-- 已完成题目 -->
        <div v-if="comparison.done.length > 0" class="mb-8">
          <h4 class="text-lg font-heiti font-bold mb-4 flex items-center">
            <span class="text-xl mr-2">&#10003;</span>
            已完成 ({{ comparison.done.length }})
          </h4>
          <ul class="space-y-1">
            <li
              v-for="(problem, index) in comparison.done"
              :key="problem.id"
              class="flex items-start py-1 border-b border-gray-200"
            >
              <span class="font-mono text-gray-500 w-12 shrink-0">{{ problem.id }}.</span>
              <span class="flex-1">{{ problem.title }}</span>
              <span :class="['ml-2 text-sm', difficultyClass[problem.difficulty]]">
                {{ difficultyLabel[problem.difficulty] }}
              </span>
            </li>
          </ul>
        </div>

        <!-- 未完成题目 - 报纸风格显示 -->
        <div v-if="comparison.notDone.length > 0">
          <h4 class="text-lg font-heiti font-bold mb-4 flex items-center">
            <span class="text-xl mr-2">&#10007;</span>
            未完成 ({{ comparison.notDone.length }})
          </h4>
          <ul class="space-y-2">
            <li
              v-for="(problem, index) in comparison.notDone"
              :key="problem.id"
              class="py-2 border-b border-gray-200 font-songti"
            >
              <span class="font-songti">未做{{ problemListTitle }}题单的第{{ index + 1 }}题 - </span>
              <span class="font-songti font-bold">{{ problem.title }}</span>
              <span :class="['ml-2 text-sm', difficultyClass[problem.difficulty]]">
                ({{ difficultyLabel[problem.difficulty] }})
              </span>
            </li>
          </ul>
        </div>

        <!-- 无未完成题目 -->
        <div v-if="comparison.notDone.length === 0 && comparison.done.length > 0" class="text-center py-8">
          <p class="text-xl font-heiti">恭喜！您已完成本题单全部题目！</p>
        </div>
      </section>

      <!-- 无数据提示 -->
      <section v-if="!userStats && !loading" class="text-center py-16 text-gray-500">
        <p class="text-lg">请输入 LeetCode 用户名开始查询</p>
        <p class="text-sm mt-2">输入题单链接可进行做题对比</p>
      </section>
    </main>

    <!-- 页脚 -->
    <footer class="border-t-4 border-black mt-16 py-6 px-4">
      <div class="max-w-5xl mx-auto text-center text-gray-600 text-sm">
        <p>LeetCode 题单追踪器 · 数据来源于 LeetCode 官方 API</p>
      </div>
    </footer>
  </div>
</template>
