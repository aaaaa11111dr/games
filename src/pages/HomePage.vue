<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ojConfigs } from '../config/ojConfigs'
import { ojStore, getAllSummary } from '../store/ojStore'
import type { AllOJSummary } from '../types'

const router = useRouter()
const summary = ref<AllOJSummary>({ total: 0, byOJ: {}, lastUpdated: '' })

const todayDate = computed(() => {
  const now = new Date()
  const weekDay = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()]
  return `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日 ${weekDay}`
})

const totalSolved = computed(() => summary.value.total)

const activeOJCount = computed(() => {
  return Object.keys(summary.value.byOJ).filter(key => summary.value.byOJ[key].totalSolved > 0).length
})

onMounted(() => { summary.value = getAllSummary() })

function goToOJ(ojId: string) { router.push(`/${ojId}`) }
function goToStatistics() { router.push('/statistics') }
function goToDaily() { router.push('/daily') }
function refreshData() { summary.value = getAllSummary() }
</script>

<template>
  <div class="min-h-screen bg-[#f5f1e8] font-fangsong text-black">

    <!-- 顶部报头 -->
    <header class="border-b-[10px] border-black px-4 py-5 md:py-8">
      <div class="max-w-4xl mx-auto text-center">
        <p class="text-xs md:text-sm tracking-[0.3em] text-gray-700 mb-2">{{ todayDate }} · 第 壹 期</p>
        <h1 class="text-5xl md:text-7xl font-bold tracking-[0.2em] leading-none">
          O J 刷 题 日 报
        </h1>
        <div class="border-y-2 border-black my-3 md:my-5 py-2 md:py-3">
          <p class="text-sm md:text-base tracking-[0.4em]">追 踪 您 的 算 法 学 习 之 旅</p>
        </div>
        <div class="flex flex-wrap justify-between items-center text-xs md:text-sm gap-2">
          <span class="tracking-widest">总 做 题 {{ totalSolved }} 道</span>
          <span class="tracking-widest">活 跃 平 台 {{ activeOJCount }} 个</span>
          <span class="cursor-pointer hover:underline tracking-widest" @click="refreshData">[ 刷 新 数 据 ]</span>
        </div>
      </div>
    </header>

    <!-- OJ 平台横版列表 -->
    <main class="max-w-4xl mx-auto px-3 md:px-6 py-6 md:py-10">

      <!-- 横版分割标题 -->
      <div class="flex items-center gap-3 md:gap-6 mb-6 md:mb-8">
        <div class="flex-1 border-t border-black"></div>
        <h2 class="text-xl md:text-2xl font-bold tracking-[0.3em]">O J 平 台</h2>
        <div class="flex-1 border-t border-black"></div>
      </div>

      <!-- 每个 OJ 一张横版大卡片 -->
      <section class="space-y-4 md:space-y-6">
        <div
          v-for="config in ojConfigs"
          :key="config.id"
          class="relative border-2 border-black bg-white cursor-pointer hover:bg-[#eae4d4] transition-colors"
          @click="goToOJ(config.id)"
        >
          <!-- 报纸式横线布局 -->
          <div class="flex items-stretch">

            <!-- 左侧色块角标 -->
            <div
              class="w-3 md:w-5 flex-shrink-0"
              :style="{ backgroundColor: config.color }"
            ></div>

            <!-- 主内容 -->
            <div class="flex-1 px-4 md:px-6 py-4 md:py-5 flex flex-row items-center gap-4 md:gap-6">

              <!-- 大标题：OJ 名称 -->
              <div class="flex-1 min-w-0">
                <h3 class="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[0.08em] leading-tight truncate">
                  {{ config.name }}
                </h3>
                <p class="text-xs md:text-sm text-gray-600 mt-1 tracking-widest">
                  {{ config.description }}
                </p>
              </div>

              <!-- 右侧：做题数据 -->
              <div class="text-right flex-shrink-0 border-l border-dashed border-gray-400 pl-4 md:pl-6">
                <template v-if="ojStore.userData[config.id]?.data?.totalSolved">
                  <p class="text-[10px] md:text-xs tracking-widest text-gray-600 mb-1">已 解 决</p>
                  <p class="text-4xl md:text-6xl font-bold leading-none">{{ ojStore.userData[config.id].data!.totalSolved }}</p>
                  <p class="text-[10px] md:text-xs text-gray-500 mt-1 truncate max-w-[120px] md:max-w-none">
                    @{{ ojStore.userData[config.id].userId }}
                  </p>
                </template>
                <template v-else>
                  <p class="text-[10px] md:text-xs tracking-widest text-gray-400 mb-1">暂 无 数 据</p>
                  <p class="text-2xl md:text-3xl font-bold text-gray-400">—</p>
                  <p class="text-[10px] md:text-xs text-gray-500 mt-1">点 击 进 入</p>
                </template>
              </div>
            </div>
          </div>

          <!-- 底部双线装饰 -->
          <div class="border-t border-double border-black"></div>
        </div>
      </section>

      <!-- 快捷操作栏 -->
      <section class="mt-10 md:mt-14">
        <div class="flex items-center gap-3 md:gap-6 mb-4 md:mb-6">
          <div class="flex-1 border-t border-black"></div>
          <h2 class="text-xl md:text-2xl font-bold tracking-[0.3em]">快 捷 栏</h2>
          <div class="flex-1 border-t border-black"></div>
        </div>

        <div class="grid grid-cols-2 gap-3 md:gap-4">
          <button
            @click="goToStatistics"
            class="border-2 border-black bg-white px-4 py-4 md:py-6 hover:bg-black hover:text-white transition-colors text-center"
          >
            <p class="text-base md:text-lg font-bold tracking-[0.3em]">统 计 图 表</p>
            <p class="text-[10px] md:text-xs mt-1 tracking-widest text-gray-500">查看饼图汇总</p>
          </button>
          <button
            @click="goToDaily"
            class="border-2 border-black bg-white px-4 py-4 md:py-6 hover:bg-black hover:text-white transition-colors text-center"
          >
            <p class="text-base md:text-lg font-bold tracking-[0.3em]">每 日 记 录</p>
            <p class="text-[10px] md:text-xs mt-1 tracking-widest text-gray-500">打卡今日刷题</p>
          </button>
        </div>
      </section>

      <!-- 底部说明 -->
      <section class="mt-10 md:mt-14 border-t-2 border-black pt-4 text-center text-[10px] md:text-xs text-gray-500 tracking-widest space-y-1">
        <p>本 报 数 据 来 源 于 各 OJ 官 方 接 口</p>
        <p>数 据 仅 存 储 在 本 地 浏 览 器 · 保 护 您 的 隐 私</p>
      </section>
    </main>

    <!-- 页脚 -->
    <footer class="border-t-[10px] border-black py-4 text-center text-xs md:text-sm tracking-[0.4em] text-gray-700">
      O J - T r a c k e r · 祝 您 刷 题 愉 快
    </footer>
  </div>
</template>
