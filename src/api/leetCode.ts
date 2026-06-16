import type { UserStats, Problem, ProblemList } from '../types'

const LEETCODE_GRAPHQL_CN = 'https://leetcode.cn/graphql'
const LEETCODE_GRAPHQL_COM = 'https://leetcode.com/graphql'

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

// 获取用户做题统计
export async function fetchUserStats(username: string): Promise<UserStats> {
  const query = `
    query userProblemsProgress($username: String!) {
      matchedUser(username: $username) {
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `

  const variables = { username }

  // 尝试中文站
  let response = await fetch(LEETCODE_GRAPHQL_CN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  })

  let data: GraphQLResponse<any> = await response.json()

  // 如果中文站失败，尝试英文站
  if (!data.data?.matchedUser) {
    response = await fetch(LEETCODE_GRAPHQL_COM, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    })
    data = await response.json()
  }

  if (!data.data?.matchedUser) {
    throw new Error(data.errors?.[0]?.message || 'User not found')
  }

  const stats = data.data.matchedUser.submitStats.acSubmissionNum
  const result: UserStats = {
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0
  }

  for (const item of stats) {
    const count = item.count || 0
    result.totalSolved += count

    const difficulty = item.difficulty?.toLowerCase()
    if (difficulty === 'easy') result.easySolved = count
    else if (difficulty === 'medium') result.mediumSolved = count
    else if (difficulty === 'hard') result.hardSolved = count
  }

  return result
}

// 获取用户已做的题目 ID 列表
export async function fetchUserSolvedProblems(username: string): Promise<Set<string>> {
  const query = `
    query userProblems($username: String!) {
      matchedUser(username: $username) {
        problemsNum(difficulty: all) {
          difficulty
          count
        }
        allQuestions {
          questionId
          title
          difficulty
          status
        }
      }
    }
  `

  const variables = { username }

  let response = await fetch(LEETCODE_GRAPHQL_CN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  })

  let data: GraphQLResponse<any> = await response.json()

  if (!data.data?.matchedUser) {
    response = await fetch(LEETCODE_GRAPHQL_COM, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    })
    data = await response.json()
  }

  if (!data.data?.matchedUser) {
    return new Set()
  }

  const allQuestions = data.data.matchedUser.allQuestions || []
  const solvedIds = new Set<string>()

  for (const q of allQuestions) {
    if (q.status === 'ac' || q.status === 'solved') {
      solvedIds.add(String(q.questionId))
    }
  }

  return solvedIds
}

// 通过后端 API 解析题单
export async function parseProblemList(url: string): Promise<ProblemList> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  const response = await fetch(`${apiUrl}/api/problems/parse-problem-list`, {
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

// 获取题目详情
export async function fetchProblemDetails(problemId: string): Promise<Problem | null> {
  const query = `
    query questionDetail($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        title
        difficulty
      }
    }
  `

  // 尝试中文站
  const variables = { titleSlug: `problem-${problemId}` }

  let response = await fetch(LEETCODE_GRAPHQL_CN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  })

  let data: GraphQLResponse<any> = await response.json()

  if (!data.data?.question) {
    // 尝试英文站
    response = await fetch(LEETCODE_GRAPHQL_COM, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    })
    data = await response.json()
  }

  if (!data.data?.question) {
    return null
  }

  const q = data.data.question
  return {
    id: q.questionId,
    title: q.title,
    difficulty: q.difficulty
  }
}
