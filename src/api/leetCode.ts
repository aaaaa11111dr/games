import type { UserStats, Problem, ProblemList } from '../types'

// 获取用户做题统计 - 通过后端代理
export async function fetchUserStats(username: string): Promise<UserStats> {
  const response = await fetch('/api/problems/user-stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  })

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch user stats')
  }

  return result.data
}

// 获取用户已做的题目 ID 列表 - 通过后端代理
export async function fetchUserSolvedProblems(username: string): Promise<Set<string>> {
  const response = await fetch('/api/problems/user-solved-problems', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  })

  const result = await response.json()

  if (!result.success) {
    return new Set()
  }

  return new Set(result.data || [])
}

// 通过后端 API 解析题单
export async function parseProblemList(url: string): Promise<ProblemList> {
  const response = await fetch('/api/problems/parse-problem-list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  })

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'Failed to parse problem list')
  }

  return {
    title: result.title || '题单',
    problems: result.problems || []
  }
}
