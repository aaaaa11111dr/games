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

onMounted(() => { summary.value = getAllSummary() })

function goToOJ(ojId: string) { router.push(`/${ojId}`) }
function goToStatistics() { router.push('/statistics') }
function goToDaily() { router.push('/daily') }
function refreshData() { summary.value = getAllSummary() }
</script>

<template>
  <div class="min-h-screen">

    <!-- 顶部报头：双下划线 + 大标题 + 副标题双线包 -->
    <header class="px-4 pt-8 pb-4 md:pt-12 md:pb-6">
      <div class="max-w-4xl mx-auto text-center">
        <!-- 日期行 -->
        <p class="text-sm md:text-base tracking-[0.4em] text-gray-600">
          {{ todayDate }} · 第 壹 期
        </p>

        <!-- 大标题：仿宋斜体，不用任何粗体 -->
        <h1 class="newspaper-headline text-5xl md:text-7xl my-4 md:my-6">
          O J 刷 题 日 报
        </h1>

        <!-- 副标题：双线包住 -->
        <div class="border-y border-black py-2 md:py-3">
          <p class="text-sm md:text-lg tracking-[0.5em] text-gray-700">
            追 踪 您 的 算 法 学 习 之 旅
          </p>
        </div>

        <!-- 统计行 -->
        <div class="flex flex-wrap justify-center gap-x-6 md:gap-x-10 mt-4 md:mt-5 text-xs md:text-sm text-gray-600">
          <span>总做题 {{ summary.total }} 道</span>
          <span>活跃平台 {{ Object.keys(summary.byOJ).filter(k => summary.byOJ[k].totalSolved > 0).length }} 个</span>
          <span class="cursor-pointer underline" @click="refreshData">[ 刷 新 ]</span>
        </div>
      </div>

      <!-- 报头下方双线 -->
      <div class="max-w-4xl mx-auto newspaper-double-line mt-5"></div>
    </header>

    <main class="max-w-4xl mx-auto px-5 md:px-10 pb-16">

      <!-- ======== OJ 平台区：横版列表，纯横线分隔 ======== -->
      <section class="mt-6 md:mt-10">
        <!-- 区标题：两侧横线 + 中间斜体 -->
        <div class="flex items-center gap-3 md:gap-6 mb-4 md:mb-6">
          <div class="flex-1 border-t border-black"></div>
          <h2 class="newspaper-section-title text-xl md:text-3xl tracking-[0.3em]">O J 平 台</h2>
          <div class="flex-1 border-t border-black"></div>
        </div>

        <!-- 每个 OJ 一行，横线分隔，没有任何方框/底色/色块 -->
        <div v-for="(config, idx) in ojConfigs" :key="config.id"
             class="flex items-center gap-4 md:gap-6 py-5 md:py-6 cursor-pointer hover:opacity-60"
             :class="idx < ojConfigs.length - 1 ? 'border-b border-gray-400' : 'border-b border-black'">
          <!-- 左：OJ 名（大字号，仿宋斜体，**正常字重不加粗**） + 小字描述 -->
          <div class="flex-1 min-w-0">
            <h3 class="oj-title-italic text-3xl sm:text-4xl md:text-5xl leading-none truncate">
              {{ config.name }}
            </h3>
            <p class="text-[11px] md:text-xs text-gray-500 mt-1 tracking-widest truncate">
              {{ config.description }}
            </p>
          </div>

          <!-- 右：做题数（大号数字，不加粗） + 用户名（小字） -->
          <div class="text-right flex-shrink-0 pl-2">
            <template v-if="ojStore.userData[config.id]?.data?.totalSolved">
              <p class="text-[10px] md:text-xs tracking-[0.3em] text-gray-600 mb-1">已 解 决</p>
              <p class="text-4xl md:text-6xl leading-none tabular-nums">
                {{ ojStore.userData[config.id].data!.totalSolved }}
              </p>
              <p class="text-[10px] md:text-xs text-gray-500 mt-1 truncate">
                @{{ ojStore.userData[config.id].userId }}
              </p>
            </template>
            <template v-else>
              <p class="text-[10px] md:text-xs tracking-[0.3em] text-gray-400 mb-1">暂 无 数 据</p>
              <p class="text-3xl md:text-5xl text-gray-400">—</p>
              <p class="text-[10px] md:text-xs text-gray-500 mt-1">点 击 进 入</p>
            </template>
          </div>
        </div>
      </section>

      <!-- ======== 快捷栏 ======== -->
      <section class="mt-12 md:mt-16">
        <div class="flex items-center gap-3 md:gap-6 mb-4 md:mb-6">
          <div class="flex-1 border-t border-black"></div>
          <h2 class="newspaper-section-title text-lg md:text-2xl tracking-[0.3em]">快 捷 栏</h2>
          <div class="flex-1 border-t border-black"></div>
        </div>

        <div class="flex items-stretch text-center">
          <div class="flex-1 py-4 md:py-6 cursor-pointer hover:underline" @click="goToStatistics">
            <p class="oj-title-italic text-lg md:text-xl tracking-[0.4em]">统 计 图 表</p>
            <p class="text-[10px] md:text-xs tracking-widest text-gray-500 mt-1">饼图汇总 · 难度分布</p>
          </div>
          <div class="w-px bg-gray-400 my-3 md:my-4"></div>
          <div class="flex-1 py-4 md:py-6 cursor-pointer hover:underline" @click="goToDaily">
            <p class="oj-title-italic text-lg md:text-xl tracking-[0.4em]">每 日 记 录</p>
            <p class="text-[10px] md:text-xs tracking-widest text-gray-500 mt-1">打卡今日刷题</p>
          </div>
        </div>
      </section>

      <!-- ======== 底部说明 ======== -->
      <section class="mt-10 md:mt-14 border-t border-gray-400 pt-4 text-center text-[10px] md:text-xs text-gray-500 tracking-widest space-y-1">
        <p>本 报 数 据 来 源 于 各 OJ 官 方 接 口</p>
        <p>数 据 按 IP 存 储 · 不 上 云</p>
      </section>
    </main>

    <footer class="border-t-[6px] border-double border-black py-4 text-center text-xs md:text-sm tracking-[0.5em] text-gray-600">
      O J - T r a c k e r · 祝 您 刷 题 愉 快
    </footer>
  </div>
</template>
