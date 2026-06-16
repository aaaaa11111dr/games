import { reactive, watch } from 'vue'
import type { OJData, DailyRecord, AllOJSummary } from '../types'

const STORAGE_KEY_OJ = 'oj_tracker_data'
const STORAGE_KEY_DAILY = 'oj_tracker_daily'
const STORAGE_KEY_USERS = 'oj_tracker_users'

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Failed to save to localStorage', e)
  }
}

export interface OJUserData {
  [ojId: string]: {
    userId: string
    data: OJData | null
  }
}

export const ojStore = reactive({
  userData: loadFromStorage<OJUserData>(STORAGE_KEY_OJ, {}),
  users: loadFromStorage<{ [ojId: string]: string[] }>(STORAGE_KEY_USERS, {}),
  dailyRecords: loadFromStorage<DailyRecord[]>(STORAGE_KEY_DAILY, [])
})

watch(
  () => ojStore.userData,
  (val) => saveToStorage(STORAGE_KEY_OJ, val),
  { deep: true }
)

watch(
  () => ojStore.users,
  (val) => saveToStorage(STORAGE_KEY_USERS, val),
  { deep: true }
)

watch(
  () => ojStore.dailyRecords,
  (val) => saveToStorage(STORAGE_KEY_DAILY, val),
  { deep: true }
)

export function setOJData(ojId: string, userId: string, data: OJData) {
  if (!ojStore.userData[ojId]) {
    ojStore.userData[ojId] = { userId: '', data: null }
  }
  ojStore.userData[ojId].userId = userId
  ojStore.userData[ojId].data = data

  if (!ojStore.users[ojId]) {
    ojStore.users[ojId] = []
  }
  if (!ojStore.users[ojId].includes(userId)) {
    ojStore.users[ojId].push(userId)
  }
}

export function getOJData(ojId: string): OJData | null {
  return ojStore.userData[ojId]?.data || null
}

export function getUserId(ojId: string): string {
  return ojStore.userData[ojId]?.userId || ''
}

export function getAllSummary(): AllOJSummary {
  const summary: AllOJSummary = {
    total: 0,
    byOJ: {},
    lastUpdated: new Date().toISOString()
  }

  for (const ojId of Object.keys(ojStore.userData)) {
    const data = ojStore.userData[ojId].data
    if (data) {
      summary.byOJ[ojId] = data
      summary.total += data.totalSolved
    }
  }

  return summary
}

export function addDailyProblem(ojId: string, problemId: string, title: string) {
  const today = new Date().toISOString().split('T')[0]
  const time = new Date().toTimeString().split(' ')[0]

  let record = ojStore.dailyRecords.find(r => r.date === today)
  if (!record) {
    record = {
      date: today,
      problems: [],
      totalCount: 0
    }
    ojStore.dailyRecords.push(record)
  }

  record.problems.push({
    oj: ojId,
    problemId,
    title,
    time
  })
  record.totalCount++
}

export function getDailyRecords(days: number = 30): DailyRecord[] {
  const result: DailyRecord[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const existing = ojStore.dailyRecords.find(r => r.date === dateStr)
    if (existing) {
      result.push(existing)
    } else {
      result.push({
        date: dateStr,
        problems: [],
        totalCount: 0
      })
    }
  }

  return result
}

export function clearAllData() {
  ojStore.userData = {}
  ojStore.dailyRecords = []
  ojStore.users = {}
}
