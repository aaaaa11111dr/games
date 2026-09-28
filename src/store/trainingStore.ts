import { reactive, watch } from 'vue'
export interface TaskProblem { id: string; title: string; url: string; platform: string; difficulty: string; done: boolean }
export interface TrainingPlan { id: string; title: string; notes: string; due: string; enabled: boolean; firedFor: string; problems: TaskProblem[] }
export interface RatingPoint { date: string; rating: number; label: string }
export interface RatingSeries { platform: string; username: string; site: string; points: RatingPoint[]; updated: string }
const key = 'oj_training_v1'
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}')
    return { plans: Array.isArray(saved.plans) ? saved.plans : [], ratings: Array.isArray(saved.ratings) ? saved.ratings : [] }
  } catch { return { plans: [], ratings: [] } }
}
export const training = reactive<{ plans: TrainingPlan[]; ratings: RatingSeries[]; storageError: string }>({ ...load(), storageError: '' })
watch(() => [training.plans, training.ratings], () => {
  try { localStorage.setItem(key, JSON.stringify({ plans: training.plans, ratings: training.ratings })); training.storageError = '' }
  catch { training.storageError = '浏览器存储已满或不可用，当前更改无法持久保存。' }
}, { deep: true, flush: 'sync' })
export function createPlan(title: string) {
  const plan: TrainingPlan = { id: crypto.randomUUID(), title: title.trim(), notes: '', due: '', enabled: false, firedFor: '', problems: [] }
  training.plans.push(plan)
  return plan.id
}
export function safeUrl(url: string) {
  try { const parsed = new URL(url); return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : '' } catch { return '' }
}
