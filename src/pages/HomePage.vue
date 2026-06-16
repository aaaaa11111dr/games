<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ojConfigs, getOJConfig } from '../config/ojConfigs'
import { ojStore, getAllSummary } from '../store/ojStore'
import type { AllOJSummary } from '../types'

const router = useRouter()
const summary = ref<AllOJSummary>({ total: 0, byOJ: {}, lastUpdated: '' })

const todayDate = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const weekDay = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()]
  return `${year}年${month}月${day}日 ${weekDay}`
})

const totalSolved = computed(() => summary.value.total)

const activeOJCount = computed(() => {
  return Object.keys(summary.value.byOJ).filter(key => summary.value.byOJ[key].totalSolved > 0).length
})

onMounted(() => {
  summary.value = getAllSummary()
})

function goToOJ(ojId: string) {
  router.push(`/${ojId}`)
}

function goToStatistics() {
  router.push('/statistics')
}

function goToDaily() {
  router.push('/daily')
}

function refreshData() {
  summary.value = getAllSummary()
}

function getFormattedDate(isoString: string) {
  if (!isoString) return '-'
  try {
    const date = new Date(isoString)
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  } catch {
    return '-'
  }
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- 顶部报头 -->
    <header class="border-b-8 border-black py-6 px-4">
      <div class="max-w-6xl mx-auto">
        <div class="flex justify-between items-end border-b-4 border-double border-gray-800 pb-2">
          <div class="text-left">
            <span class="text-sm tracking-widest">{{ todayDate }}</span>
          </div>
          <div class="text-center flex-1">
            <h1 class="text-5xl md:text-6xl font-bold tracking-widest">
              OJ 刷题日报
            </h1>
            <p class="text-lg tracking-widest mt-1 text-gray-700">
              追踪您的算法学习之旅
            </p>
          </div>
          <div class="text-right text-sm">
            <span class="tracking-widest">第 壹期</span>
          </div>
        </div>
        <div class="flex justify-between items-center pt-3 text-sm">
          <span>官方网站：OJ-Tracker.com</span>
          <span>总发行量：{{ totalSolved }} 题</span>
          <span class="cursor-pointer hover:underline" @click="refreshData">
            [刷新数据]
          </span>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="max-w-6xl mx-auto px-4 py-8">
      <!-- 头条新闻卡片 -->
      <section class="mb-10 border border-gray-800">
        <div class="bg-black text-white px-4 py-2">
          <h2 class="text-xl font-bold">要 闻</h2>
        </div>
        <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- 总数统计 -->
          <div class="md:col-span-1 border-r border-gray-300 md:pr-6">
            <h3 class="text-2xl font-bold mb-2">累计做题</h3>
            <p class="text-6xl font-bold text-center my-4">{{ totalSolved }}</p>
            <p class="text-sm text-center text-gray-600">
              已在 {{ activeOJCount }} 个OJ平台刷题
            </p>
            <div class="mt-4">
              <button
                @click="goToStatistics"
                class="w-full border-2 border-black px-4 py-2 font-bold hover:bg-black hover:text-white transition-colors"
              >
                查看详细统计
              </button>
            </div>
          </div>

          <!-- 每日做题 -->
          <div class="md:col-span-1 border-r border-gray-300 md:pr-6">
            <h3 class="text-2xl font-bold mb-2">每日追踪</h3>
            <p class="text-lg mt-2">
              记录您的每日刷题情况
            </p>
            <div class="text-center my-4">
              <div class="w-32 h-32 border-4 border-black rounded-full flex items-center justify-center mx-auto cursor-pointer hover:bg-gray-100 transition-colors" @click="goToDaily">
                <div class="text-center">
                  <div class="text-4xl font-bold">{{ new Date().getDate() }}</div>
                  <div class="text-sm">点击记录</div>
                </div>
              </div>
            </div>
            <div class="mt-4">
              <button
                @click="goToDaily"
                class="w-full border-2 border-black px-4 py-2 font-bold hover:bg-black hover:text-white transition-colors"
              >
                进入每日页面
              </button>
            </div>
          </div>

          <!-- 二维码扫描 -->
          <div class="md:col-span-1">
            <h3 class="text-2xl font-bold mb-2">快捷操作</h3>
            <div class="space-y-3 mt-4">
              <p class="text-sm">
                在下方各 OJ 平台输入用户名或二维码，开始追踪您的学习进度。
              </p>
              <div class="mt-4 p-4 bg-gray-100 border border-gray-400">
                <p class="font-bold mb-2">使用说明：</p>
                <ul class="text-sm list-disc list-inside space-y-1">
                  <li>点击下方平台卡片进入详情</li>
                  <li>输入用户名或扫描二维码</li>
                  <li>数据自动保存到本地</li>
                  <li>在统计页查看汇总数据</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 各 OJ 平台 -->
      <section class="mb-10">
        <div class="border-b-4 border-double border-gray-800 pb-2 mb-6">
          <h2 class="text-3xl font-bold">八 大 OJ 平 台 快 报</h2>
          <p class="text-sm text-gray-600">以下是各主流算法平台的刷题统计</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="config in ojConfigs"
            :key="config.id"
            class="border-2 border-gray-800 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            @click="goToOJ(config.id)"
          >
            <!-- 标题条 -->
            <div
              class="px-3 py-2 text-white font-bold text-center"
              :style="{ backgroundColor: config.color }"
            >
              <span class="text-2xl mr-2">{{ config.icon }}</span>
              <span class="text-lg">{{ config.name }}</span>
            </div>

            <!-- 内容 -->
            <div class="p-4">
              <h3 class="font-bold text-lg mb-2">{{ config.fullName }}</h3>
              <p class="text-xs text-gray-600 mb-4">{{ config.description }}</p>

              <!-- 数据 -->
              <div class="border-t border-dashed border-gray-400 pt-3">
                <div v-if="ojStore.userData[config.id]?.data" class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-sm">用户：</span>
                    <span class="font-bold">{{ ojStore.userData[config.id].userId }}</span>
                  </div>
                  <div class="flex justify-between items-baseline">
                    <span class="text-sm">已解决：</span>
                    <span class="text-3xl font-bold">{{ ojStore.userData[config.id].data?.totalSolved || 0 }}</span>
                  </div>
                  <div class="flex justify-between text-xs text-gray-600">
                    <span>简 {{ ojStore.userData[config.id].data?.easySolved || 0 }}</span>
                    <span>中 {{ ojStore.userData[config.id].data?.mediumSolved || 0 }}</span>
                    <span>难 {{ ojStore.userData[config.id].data?.hardSolved || 0 }}</span>
                  </div>
                  <div class="text-xs text-gray-500 text-right mt-2">
                    更新: {{ getFormattedDate(ojStore.userData[config.id].data?.lastUpdated || '') }}
                  </div>
                </div>
                <div v-else class="text-center text-gray-500 py-4">
                  <p class="text-sm mb-2">暂无数据</p>
                  <p class="text-xs">点击进入设置</p>
                </div>
              </div>
            </div>

            <!-- 底部 -->
            <div class="border-t-2 border-gray-800 px-3 py-2 bg-gray-100 text-center">
              <span class="text-sm font-bold tracking-wider">点 击 进 入 →</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 统计概览 -->
      <section class="mb-10 border border-gray-800">
        <div class="bg-gray-200 border-b-2 border-gray-800 px-4 py-2">
          <h2 class="text-xl font-bold">数据统计</h2>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-4 border border-gray-300">
              <p class="text-sm text-gray-600 mb-1">LeetCode</p>
              <p class="text-2xl font-bold">{{ summary.byOJ['leetcode']?.totalSolved || 0 }}</p>
            </div>
            <div class="text-center p-4 border border-gray-300">
              <p class="text-sm text-gray-600 mb-1">Codeforces</p>
              <p class="text-2xl font-bold">{{ summary.byOJ['codeforces']?.totalSolved || 0 }}</p>
            </div>
            <div class="text-center p-4 border border-gray-300">
              <p class="text-sm text-gray-600 mb-1">洛谷</p>
              <p class="text-2xl font-bold">{{ summary.byOJ['luogu']?.totalSolved || 0 }}</p>
            </div>
            <div class="text-center p-4 border border-gray-300">
              <p class="text-sm text-gray-600 mb-1">其他</p>
              <p class="text-2xl font-bold">
                {{ 
                  (summary.byOJ['lanqiao']?.totalSolved || 0) +
                  (summary.byOJ['hdu']?.totalSolved || 0) +
                  (summary.byOJ['pta']?.totalSolved || 0) +
                  (summary.byOJ['atcoder']?.totalSolved || 0) +
                  (summary.byOJ['nowcoder']?.totalSolved || 0)
                }}
              </p>
            </div>
          </div>
          <div class="mt-4 text-center">
            <button
              @click="goToStatistics"
              class="border-2 border-black px-8 py-2 font-bold hover:bg-black hover:text-white transition-colors"
            >
              查看饼图统计
            </button>
          </div>
        </div>
      </section>

      <!-- 广告位 / 提示 -->
      <section class="text-center text-xs text-gray-500 pb-6">
        <p>本报表数据来源于各大OJ平台官方数据接口</p>
        <p>数据仅存储在您的本地浏览器中 · 保护您的隐私</p>
      </section>
    </main>

    <!-- 底部 -->
    <footer class="border-t-4 border-double border-black py-4 px-4">
      <div class="max-w-6xl mx-auto text-center text-sm">
        <p>OJ-Tracker · 2024 · 祝您刷题愉快！</p>
      </div>
    </footer>
  </div>
</template>
