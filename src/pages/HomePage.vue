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
const activeOJCount = computed(() =>
  Object.keys(summary.value.byOJ).filter(key => summary.value.byOJ[key].totalSolved > 0).length
)

onMounted(() => { summary.value = getAllSummary() })

function goToOJ(ojId: string) { router.push(`/${ojId}`) }
function goToStatistics() { router.push('/statistics') }
function goToDaily() { router.push('/daily') }
function refreshData() { summary.value = getAllSummary() }
</script>

<template>
  <div class="min-h-screen bg-[#f5f1e8] font-fangsong text-black">

    <!-- 顶部报头 -->
    <header class="border-b-[6px] border-double border-black px-4 py-6 md:py-10">
      <div class="max-w-5xl mx-auto text-center">
        <p class="text-xs md:text-sm tracking-[0.4em] text-gray-700">{{ todayDate }} · 第 壹 期</p>
        <h1 class="italic text-5xl md:text-7xl font-bold tracking-[0.2em] leading-none mt-3">
          O J 刷 题 日 报
        </h1>
        <div class="border-y border-black my-4 md:my-6 py-2 md:py-3">
          <p class="text-sm md:text-base tracking-[0.5em]">追 踪 您 的 算 法 学 习 之 旅</p>
        </div>
        <div class="flex flex-wrap justify-center items-center text-xs md:text-sm gap-x-8 gap-y-2 text-gray-700">
          <span>总 做 题 {{ totalSolved }} 道</span>
          <span>活 跃 平 台 {{ activeOJCount }} 个</span>
          <span class="cursor-pointer hover:underline" @click="refreshData">[ 刷 新 数 据 ]</span>
        </div>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-5 md:px-10 py-8 md:py-12">

      <!-- OJ 平台：横版铺开，只用横线分隔 -->
      <section>
        <div class="flex items-center gap-4 md:gap-8 mb-6 md:mb-10">
          <div class="flex-1 border-t border-black"></div>
          <h2 class="italic text-2xl md:text-3xl font-bold tracking-[0.3em]">O J 平 台</h2>
          <div class="flex-1 border-t border-black"></div>
        </div>

        <!-- 每个 OJ 一行，用 border-b 分隔，没有方框 -->
        <div v-for="(config, idx) in ojConfigs" :key="config.id">
          <div
            class="flex flex-row items-center gap-4 md:gap-8 py-5 md:py-7 cursor-pointer hover:opacity-70 transition-opacity"
            @click="goToOJ(config.id)"
            :class="idx < ojConfigs.length - 1 ? 'border-b border-gray-500' : ''"
          >
            <!-- 左：大字号 OJ 名（斜体） + 小字描述 -->
            <div class="flex-1 min-w-0">
              <h3 class="italic text-4xl sm:text-5xl md:text-6xl font-bold tracking-[0.06em] leading-none truncate">
                {{ config.name }}
              </h3>
              <p class="text-xs md:text-sm text-gray-500 mt-2 tracking-widest">
                {{ config.description }}
              </p>
            </div>

            <!-- 右：做题数（大字） + 用户名（小字） -->
            <div class="text-right flex-shrink-0">
              <template v-if="ojStore.userData[config.id]?.data?.totalSolved">
                <p class="text-[10px] md:text-xs tracking-[0.3em] text-gray-600 mb-1">已 解 决</p>
                <p class="text-5xl md:text-7xl font-bold leading-none tabular-nums">
                  {{ ojStore.userData[config.id].data!.totalSolved }}
                </p>
                <p class="text-[10px] md:text-xs text-gray-500 mt-2 truncate">
                  @{{ ojStore.userData[config.id].userId }}
                </p>
              </template>
              <template v-else>
                <p class="text-[10px] md:text-xs tracking-[0.3em] text-gray-400 mb-1">暂 无 数 据</p>
                <p class="text-3xl md:text-5xl font-bold text-gray-400">—</p>
                <p class="text-[10px] md:text-xs text-gray-500 mt-2">点 击 进 入</p>
              </template>
            </div>
          </div>
        </div>
      </section>

      <!-- 快捷操作 -->
      <section class="mt-12 md:mt-16 border-t border-double border-black pt-6 md:pt-8">
        <div class="flex items-center gap-4 md:gap-8 mb-5 md:mb-7">
          <div class="flex-1 border-t border-black"></div>
          <h2 class="italic text-xl md:text-2xl font-bold tracking-[0.3em]">快 捷 栏</h2>
          <div class="flex-1 border-t border-black"></div>
        </div>

        <div class="flex flex-col sm:flex-row justify-center items-stretch gap-2 md:gap-6 text-center">
          <div
            class="flex-1 py-4 md:py-6 cursor-pointer hover:underline"
            @click="goToStatistics"
          >
            <p class="italic text-xl md:text-2xl font-bold tracking-[0.4em]">统 计 图 表</p>
            <p class="text-[10px] md:text-xs tracking-widest text-gray-500 mt-1">查看饼图汇总</p>
          </div>
          <div class="hidden sm:block w-px bg-gray-400"></div>
          <div
            class="flex-1 py-4 md:py-6 cursor-pointer hover:underline"
            @click="goToDaily"
          >
            <p class="italic text-xl md:text-2xl font-bold tracking-[0.4em]">每 日 记 录</p>
            <p class="text-[10px] md:text-xs tracking-widest text-gray-500 mt-1">打卡今日刷题</p>
          </div>
        </div>
      </section>

      <!-- 底部说明 -->
      <section class="mt-10 md:mt-14 border-t border-gray-400 pt-4 text-center text-[10px] md:text-xs text-gray-500 tracking-widest space-y-1">
        <p>本 报 数 据 来 源 于 各 OJ 官 方 接 口</p>
        <p>数 据 仅 存 储 在 本 地 浏 览 器 · 保 护 您 的 隐 私</p>
      </section>
    </main>

    <footer class="border-t-[6px] border-double border-black py-4 text-center text-xs md:text-sm tracking-[0.5em] text-gray-600">
      O J - T r a c k e r · 祝 您 刷 题 愉 快
    </footer>
  </div>
</template>
