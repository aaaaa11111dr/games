<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ojStore, getAllSummary } from '../store/ojStore'
import { ojConfigs, getOJConfig } from '../config/ojConfigs'
import { Pie, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const router = useRouter()

const summary = ref<{ total: number; byOJ: Record<string, any> }>({
  total: 0,
  byOJ: {}
})

onMounted(() => {
  summary.value = getAllSummary()
})

function goBack() {
  router.push('/')
}

function refreshData() {
  summary.value = getAllSummary()
}

// 饼图数据
const pieChartData = computed(() => {
  const labels: string[] = []
  const data: number[] = []
  const colors: string[] = []

  for (const ojId of Object.keys(summary.value.byOJ)) {
    const config = getOJConfig(ojId)
    if (config) {
      labels.push(config.name)
      data.push(summary.value.byOJ[ojId]?.totalSolved || 0)
      colors.push(config.color)
    }
  }

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#000'
      }
    ]
  }
})

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        font: { size: 14, family: '"SimSun", "宋体", serif' },
        padding: 15,
        color: '#000'
      }
    },
    tooltip: {
      backgroundColor: '#000',
      titleFont: { size: 14 },
      bodyFont: { size: 13 },
      padding: 12
    }
  }
}

// 难度柱状图数据
const difficultyChartData = computed(() => {
  const labels: string[] = []
  const easy: number[] = []
  const medium: number[] = []
  const hard: number[] = []

  for (const ojId of Object.keys(summary.value.byOJ)) {
    const config = getOJConfig(ojId)
    if (config) {
      labels.push(config.name)
      easy.push(summary.value.byOJ[ojId]?.easySolved || 0)
      medium.push(summary.value.byOJ[ojId]?.mediumSolved || 0)
      hard.push(summary.value.byOJ[ojId]?.hardSolved || 0)
    }
  }

  return {
    labels,
    datasets: [
      {
        label: '简单',
        backgroundColor: '#16a34a',
        data: easy
      },
      {
        label: '中等',
        backgroundColor: '#f59e0b',
        data: medium
      },
      {
        label: '困难',
        backgroundColor: '#dc2626',
        data: hard
      }
    ]
  }
})

const difficultyChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        font: { size: 14, family: '"SimSun", "宋体", serif' },
        padding: 15,
        color: '#000'
      }
    }
  },
  scales: {
    x: {
      ticks: { color: '#000', font: { size: 12 } },
      grid: { color: '#e5e7eb' }
    },
    y: {
      ticks: { color: '#000', font: { size: 12 } },
      grid: { color: '#e5e7eb' }
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-white text-black font-songti">
    <header class="border-b-4 border-black py-4 px-4">
      <div class="max-w-6xl mx-auto flex justify-between items-center">
        <button @click="goBack" class="flex items-center hover:opacity-70">
          <span class="text-xl font-bold">← 返回首页</span>
        </button>
        <h1 class="text-3xl font-bold">统 计 报 告</h1>
        <button @click="refreshData" class="text-sm border-2 border-black px-4 py-1 font-bold hover:bg-gray-200">
          刷新数据
        </button>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 py-8">
      <!-- 总体概览 -->
      <section class="mb-10 border border-gray-800">
        <div class="bg-black text-white px-4 py-2">
          <h2 class="text-xl font-bold">总 体 概 览</h2>
        </div>
        <div class="p-6">
          <div class="text-center mb-8">
            <p class="text-sm text-gray-600 mb-2">累计做题总数</p>
            <p class="text-7xl font-bold">{{ summary.total }}</p>
            <p class="text-lg mt-2">题</p>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div
              v-for="ojId of Object.keys(summary.byOJ)"
              :key="ojId"
              class="p-4 border border-gray-300 text-center"
            >
              <p class="text-sm font-bold mb-1">
                {{ getOJConfig(ojId)?.name || ojId }}
              </p>
              <p class="text-3xl font-bold" :style="{ color: getOJConfig(ojId)?.color || '#000' }">
                {{ summary.byOJ[ojId]?.totalSolved || 0 }}
              </p>
              <p class="text-xs text-gray-600 mt-1">
                简{{ summary.byOJ[ojId]?.easySolved || 0 }}
                / 中{{ summary.byOJ[ojId]?.mediumSolved || 0 }}
                / 难{{ summary.byOJ[ojId]?.hardSolved || 0 }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 饼图：各 OJ 分布 -->
      <section class="mb-10 border border-gray-800">
        <div class="bg-gray-200 border-b-2 border-gray-800 px-4 py-2">
          <h2 class="text-xl font-bold">各 OJ 做题分布</h2>
        </div>
        <div class="p-6">
          <div v-if="summary.total > 0" style="height: 400px">
            <Pie
              v-if="pieChartData.datasets[0].data.length > 0"
              :data="pieChartData"
              :options="pieChartOptions"
            />
          </div>
          <div v-else class="text-center py-10 text-gray-500">
            <p>暂无数据，请先在各 OJ 页面输入用户名</p>
          </div>
        </div>
      </section>

      <!-- 柱状图：难度分布 -->
      <section class="mb-10 border border-gray-800">
        <div class="bg-gray-200 border-b-2 border-gray-800 px-4 py-2">
          <h2 class="text-xl font-bold">各 OJ 难度分布</h2>
        </div>
        <div class="p-6">
          <div v-if="summary.total > 0" style="height: 400px">
            <Bar
              v-if="difficultyChartData.datasets[0].data.length > 0"
              :data="difficultyChartData"
              :options="difficultyChartOptions"
            />
          </div>
          <div v-else class="text-center py-10 text-gray-500">
            <p>暂无数据</p>
          </div>
        </div>
      </section>

      <!-- 详细数据表 -->
      <section class="mb-10 border border-gray-800">
        <div class="bg-black text-white px-4 py-2">
          <h2 class="text-xl font-bold">详 细 数 据</h2>
        </div>
        <div class="p-6">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse border border-gray-400">
              <thead>
                <tr class="bg-gray-200">
                  <th class="border border-gray-400 p-3 text-left">平台</th>
                  <th class="border border-gray-400 p-3 text-center">用户名</th>
                  <th class="border border-gray-400 p-3 text-center">总计</th>
                  <th class="border border-gray-400 p-3 text-center">简单</th>
                  <th class="border border-gray-400 p-3 text-center">中等</th>
                  <th class="border border-gray-400 p-3 text-center">困难</th>
                  <th class="border border-gray-400 p-3 text-center">占比</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="ojId of Object.keys(summary.byOJ)"
                  :key="ojId"
                  class="hover:bg-gray-50"
                >
                  <td class="border border-gray-400 p-3 font-bold">
                    {{ getOJConfig(ojId)?.fullName || ojId }}
                  </td>
                  <td class="border border-gray-400 p-3 text-center">
                    {{ summary.byOJ[ojId]?.userId || '-' }}
                  </td>
                  <td class="border border-gray-400 p-3 text-center font-bold">
                    {{ summary.byOJ[ojId]?.totalSolved || 0 }}
                  </td>
                  <td class="border border-gray-400 p-3 text-center text-green-700">
                    {{ summary.byOJ[ojId]?.easySolved || 0 }}
                  </td>
                  <td class="border border-gray-400 p-3 text-center text-amber-700">
                    {{ summary.byOJ[ojId]?.mediumSolved || 0 }}
                  </td>
                  <td class="border border-gray-400 p-3 text-center text-red-700">
                    {{ summary.byOJ[ojId]?.hardSolved || 0 }}
                  </td>
                  <td class="border border-gray-400 p-3 text-center">
                    {{ summary.total > 0 ? ((summary.byOJ[ojId]?.totalSolved || 0) / summary.total * 100).toFixed(1) : '0' }}%
                  </td>
                </tr>
                <tr class="bg-gray-100 font-bold">
                  <td class="border border-gray-400 p-3">合计</td>
                  <td class="border border-gray-400 p-3 text-center">-</td>
                  <td class="border border-gray-400 p-3 text-center">{{ summary.total }}</td>
                  <td class="border border-gray-400 p-3 text-center text-green-700">
                    {{ Object.values(summary.byOJ).reduce((s, o: any) => s + (o?.easySolved || 0), 0) }}
                  </td>
                  <td class="border border-gray-400 p-3 text-center text-amber-700">
                    {{ Object.values(summary.byOJ).reduce((s, o: any) => s + (o?.mediumSolved || 0), 0) }}
                  </td>
                  <td class="border border-gray-400 p-3 text-center text-red-700">
                    {{ Object.values(summary.byOJ).reduce((s, o: any) => s + (o?.hardSolved || 0), 0) }}
                  </td>
                  <td class="border border-gray-400 p-3 text-center">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t-4 border-double border-black py-4 px-4">
      <div class="max-w-6xl mx-auto text-center text-sm">
        <p>OJ-Tracker · 统计报告 · 数据仅存储于本地浏览器</p>
      </div>
    </footer>
  </div>
</template>
