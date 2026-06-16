<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ojStore, getDailyRecords, addDailyProblem } from '../store/ojStore'
import { ojConfigs, getOJConfig } from '../config/ojConfigs'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const router = useRouter()

const records = ref<any[]>([])
const newProblem = reactive({
  oj: 'leetcode',
  problemId: '',
  title: ''
})

onMounted(() => {
  records.value = getDailyRecords(30)
})

function goBack() {
  router.push('/')
}

function refreshData() {
  records.value = getDailyRecords(30)
}

function addNewProblem() {
  if (!newProblem.problemId.trim()) {
    alert('请输入题目编号')
    return
  }
  if (!newProblem.title.trim()) {
    alert('请输入题目名称')
    return
  }
  addDailyProblem(newProblem.oj, newProblem.problemId.trim(), newProblem.title.trim())
  newProblem.problemId = ''
  newProblem.title = ''
  records.value = getDailyRecords(30)
}

// 图表数据
const chartData = computed(() => {
  const labels = records.value.map(r => {
    const date = new Date(r.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })
  const data = records.value.map(r => r.totalCount || 0)

  return {
    labels,
    datasets: [
      {
        label: '每日做题数',
        data,
        borderColor: '#000',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  }
})

const chartOptions = {
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
      beginAtZero: true,
      ticks: { color: '#000', font: { size: 12 }, stepSize: 1 },
      grid: { color: '#e5e7eb' }
    }
  }
}

const totalIn30Days = computed(() => {
  return records.value.reduce((sum, r) => sum + (r.totalCount || 0), 0)
})

const activeDays = computed(() => {
  return records.value.filter(r => (r.totalCount || 0) > 0).length
})

const todayCount = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  const todayRecord = records.value.find(r => r.date === today)
  return todayRecord?.totalCount || 0
})

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const ojNameMap = computed(() => {
  const map: Record<string, string> = {}
  for (const config of ojConfigs) {
    map[config.id] = config.name
  }
  return map
})
</script>

<template>
  <div class="min-h-screen bg-white text-black font-songti">
    <header class="border-b-4 border-black py-4 px-4">
      <div class="max-w-6xl mx-auto flex justify-between items-center">
        <button @click="goBack" class="flex items-center hover:opacity-70">
          <span class="text-xl font-bold">← 返回首页</span>
        </button>
        <h1 class="text-3xl font-bold">每 日 做 题 统 计</h1>
        <button @click="refreshData" class="text-sm border-2 border-black px-4 py-1 font-bold hover:bg-gray-200">
          刷新
        </button>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 py-8">
      <!-- 今日统计 -->
      <section class="mb-10 border border-gray-800">
        <div class="bg-black text-white px-4 py-2">
          <h2 class="text-xl font-bold">今 日 概 览</h2>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-3 gap-6">
            <div class="text-center">
              <p class="text-sm text-gray-600 mb-2">今日已做题</p>
              <p class="text-6xl font-bold">{{ todayCount }}</p>
              <p class="text-lg mt-2">题</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-gray-600 mb-2">30 天做题</p>
              <p class="text-6xl font-bold">{{ totalIn30Days }}</p>
              <p class="text-lg mt-2">题</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-gray-600 mb-2">活跃天数</p>
              <p class="text-6xl font-bold">{{ activeDays }}/30</p>
              <p class="text-lg mt-2">天</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 手动添加题目 -->
      <section class="mb-10 border border-gray-800">
        <div class="bg-gray-200 border-b-2 border-gray-800 px-4 py-2">
          <h2 class="text-xl font-bold">记 录 今 日 做 题</h2>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label class="block text-sm font-bold mb-2">OJ 平台</label>
              <select
                v-model="newProblem.oj"
                class="w-full px-3 py-2 border-2 border-black bg-white text-black focus:outline-none focus:border-gray-600"
              >
                <option v-for="config in ojConfigs" :key="config.id" :value="config.id">
                  {{ config.icon }} {{ config.name }}
                </option>
              </select>
            </div>
            <div class="md:col-span-1">
              <label class="block text-sm font-bold mb-2">题目编号</label>
              <input
                v-model="newProblem.problemId"
                type="text"
                placeholder="1234"
                class="w-full px-3 py-2 border-2 border-black bg-white text-black focus:outline-none focus:border-gray-600"
              />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-bold mb-2">题目名称</label>
              <input
                v-model="newProblem.title"
                type="text"
                placeholder="题目描述..."
                class="w-full px-3 py-2 border-2 border-black bg-white text-black focus:outline-none focus:border-gray-600"
              />
            </div>
          </div>
          <div class="mt-4 text-center">
            <button
              @click="addNewProblem"
              class="px-8 py-2 bg-black text-white font-bold border-2 border-black hover:bg-gray-800 transition-colors"
            >
              记录到今日
            </button>
          </div>
        </div>
      </section>

      <!-- 趋势图 -->
      <section class="mb-10 border border-gray-800">
        <div class="bg-gray-200 border-b-2 border-gray-800 px-4 py-2">
          <h2 class="text-xl font-bold">30 天趋势图</h2>
        </div>
        <div class="p-6">
          <div v-if="totalIn30Days > 0" style="height: 400px">
            <Line :data="chartData" :options="chartOptions" />
          </div>
          <div v-else class="text-center py-10 text-gray-500">
            <p>暂无数据，请记录您的做题情况</p>
          </div>
        </div>
      </section>

      <!-- 每日详情 -->
      <section class="mb-10 border border-gray-800">
        <div class="bg-black text-white px-4 py-2">
          <h2 class="text-xl font-bold">每 日 详 情</h2>
        </div>
        <div class="p-6">
          <div class="space-y-6">
            <div
              v-for="record in [...records].reverse()"
              :key="record.date"
              class="border border-gray-300"
            >
              <div class="bg-gray-100 px-4 py-2 flex justify-between items-center border-b border-gray-300">
                <span class="font-bold">{{ formatDate(record.date) }}</span>
                <span class="text-sm">
                  共 {{ record.totalCount || 0 }} 题
                </span>
              </div>
              <div class="p-4">
                <div v-if="record.problems && record.problems.length > 0">
                  <ul class="space-y-2">
                    <li
                      v-for="(problem, idx) in record.problems"
                      :key="idx"
                      class="flex items-start py-1 border-b border-gray-100 last:border-0"
                    >
                      <span class="text-xs text-gray-500 mr-3 whitespace-nowrap">
                        {{ problem.time || '' }}
                      </span>
                      <span
                        class="font-bold mr-2 text-xs px-2 py-0.5 border border-gray-400"
                      >
                        {{ ojNameMap[problem.oj] || problem.oj }}
                      </span>
                      <span class="font-mono text-gray-600 mr-2">{{ problem.problemId }}.</span>
                      <span class="flex-1">{{ problem.title }}</span>
                    </li>
                  </ul>
                </div>
                <div v-else class="text-center text-gray-500 py-2">
                  今日未记录做题
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t-4 border-double border-black py-4 px-4">
      <div class="max-w-6xl mx-auto text-center text-sm">
        <p>OJ-Tracker · 每日做题统计 · 数据仅存储于本地浏览器</p>
      </div>
    </footer>
  </div>
</template>
