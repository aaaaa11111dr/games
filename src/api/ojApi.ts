import type { OJData, UserStats, Problem, ProblemList } from '../types'

interface OJResponse {
  success: boolean
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
  error?: string
  needsManual?: boolean
  message?: string
}

async function fetchOJData(ojId: string, userId: string): Promise<OJResponse> {
  const response = await fetch(`/api/oj/${ojId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  })
  return response.json()
}

export async function fetchLeetCodeData(username: string): Promise<OJData> {
  const result = await fetchOJData('leetcode', username)
  if (!result.success) {
    throw new Error(result.error || '获取数据失败')
  }
  return {
    userId: username,
    totalSolved: result.totalSolved,
    easySolved: result.easySolved,
    mediumSolved: result.mediumSolved,
    hardSolved: result.hardSolved,
    lastUpdated: new Date().toISOString()
  }
}

export async function fetchCodeforcesData(username: string): Promise<OJData> {
  const result = await fetchOJData('codeforces', username)
  if (!result.success) {
    throw new Error(result.error || '获取数据失败')
  }
  return {
    userId: username,
    totalSolved: result.totalSolved,
    easySolved: result.easySolved,
    mediumSolved: result.mediumSolved,
    hardSolved: result.hardSolved,
    lastUpdated: new Date().toISOString()
  }
}

export async function fetchLanqiaoData(username: string): Promise<OJData> {
  const result = await fetchOJData('lanqiao', username)
  return {
    userId: username,
    totalSolved: result.totalSolved,
    easySolved: result.easySolved,
    mediumSolved: result.mediumSolved,
    hardSolved: result.hardSolved,
    lastUpdated: new Date().toISOString()
  }
}

export async function fetchHDUData(username: string): Promise<OJData> {
  const result = await fetchOJData('hdu', username)
  return {
    userId: username,
    totalSolved: result.totalSolved,
    easySolved: result.easySolved,
    mediumSolved: result.mediumSolved,
    hardSolved: result.hardSolved,
    lastUpdated: new Date().toISOString()
  }
}

export async function fetchLuoguData(username: string): Promise<OJData> {
  const result = await fetchOJData('luogu', username)
  return {
    userId: username,
    totalSolved: result.totalSolved,
    easySolved: result.easySolved,
    mediumSolved: result.mediumSolved,
    hardSolved: result.hardSolved,
    lastUpdated: new Date().toISOString()
  }
}

export async function fetchPTAData(username: string): Promise<OJData> {
  const result = await fetchOJData('pta', username)
  return {
    userId: username,
    totalSolved: result.totalSolved,
    easySolved: result.easySolved,
    mediumSolved: result.mediumSolved,
    hardSolved: result.hardSolved,
    lastUpdated: new Date().toISOString()
  }
}

export async function fetchAtCoderData(username: string): Promise<OJData> {
  const result = await fetchOJData('atcoder', username)
  return {
    userId: username,
    totalSolved: result.totalSolved,
    easySolved: result.easySolved,
    mediumSolved: result.mediumSolved,
    hardSolved: result.hardSolved,
    lastUpdated: new Date().toISOString()
  }
}

export async function fetchNowcoderData(username: string): Promise<OJData> {
  const result = await fetchOJData('nowcoder', username)
  return {
    userId: username,
    totalSolved: result.totalSolved,
    easySolved: result.easySolved,
    mediumSolved: result.mediumSolved,
    hardSolved: result.hardSolved,
    lastUpdated: new Date().toISOString()
  }
}

export async function parseProblemList(url: string): Promise<ProblemList> {
  const response = await fetch('/api/oj/problem-list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  })
  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || '解析失败')
  }
  return {
    title: result.title || '题单',
    problems: result.problems || []
  }
}

export { type OJResponse }
