import type { OJData, Problem, ProblemList } from '../types'

export async function fetchLeetCodeData(username: string): Promise<OJData> {
  const query = `query userProblemsProgress($username: String!) { matchedUser(username: $username) { submitStats { acSubmissionNum { difficulty count } } } }`
  
  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({ query, variables: { username } })
    })
    const data = await response.json()
    const stats = data.data?.matchedUser?.submitStats?.acSubmissionNum
    
    if (stats) {
      let total = 0, easy = 0, medium = 0, hard = 0
      for (const item of stats) {
        const diff = item.difficulty?.toLowerCase()
        const count = item.count || 0
        if (diff === 'easy') easy = count
        else if (diff === 'medium') medium = count
        else if (diff === 'hard') hard = count
        else if (diff === 'all') total = count
      }
      if (total === 0) total = easy + medium + hard
      return { userId: username, totalSolved: total, easySolved: easy, mediumSolved: medium, hardSolved: hard, lastUpdated: new Date().toISOString() }
    }
  } catch {}

  try {
    const response = await fetch('https://leetcode.cn/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({ query, variables: { username } })
    })
    const data = await response.json()
    const stats = data.data?.matchedUser?.submitStats?.acSubmissionNum
    
    if (stats) {
      let total = 0, easy = 0, medium = 0, hard = 0
      for (const item of stats) {
        const diff = item.difficulty?.toLowerCase()
        const count = item.count || 0
        if (diff === 'easy') easy = count
        else if (diff === 'medium') medium = count
        else if (diff === 'hard') hard = count
        else if (diff === 'all') total = count
      }
      if (total === 0) total = easy + medium + hard
      return { userId: username, totalSolved: total, easySolved: easy, mediumSolved: medium, hardSolved: hard, lastUpdated: new Date().toISOString() }
    }
  } catch {}

  throw new Error('无法获取 LeetCode 数据，请检查用户名或使用手动输入')
}

export async function fetchCodeforcesData(username: string): Promise<OJData> {
  const response = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(username)}`)
  const data = await response.json()
  
  if (data.status !== 'OK') {
    throw new Error(data.comment || '用户不存在')
  }
  
  const submissions = data.result || []
  const solvedProblems = new Set<string>()
  let easy = 0, medium = 0, hard = 0
  
  for (const sub of submissions) {
    if (sub.verdict === 'OK') {
      const key = `${sub.problem.contestId}-${sub.problem.index}`
      if (!solvedProblems.has(key)) {
        solvedProblems.add(key)
        const rating = sub.problem.rating || 0
        if (rating <= 1200) easy++
        else if (rating <= 2000) medium++
        else hard++
      }
    }
  }
  
  return {
    userId: username,
    totalSolved: solvedProblems.size,
    easySolved: easy,
    mediumSolved: medium,
    hardSolved: hard,
    lastUpdated: new Date().toISOString()
  }
}

export async function fetchLanqiaoData(username: string): Promise<OJData> {
  return {
    userId: username,
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    lastUpdated: new Date().toISOString()
  }
}

export async function fetchHDUData(username: string): Promise<OJData> {
  return {
    userId: username,
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    lastUpdated: new Date().toISOString()
  }
}

export async function fetchLuoguData(username: string): Promise<OJData> {
  try {
    const response = await fetch(`https://www.luogu.com.cn/api/user/search?keyword=${encodeURIComponent(username)}&type=user`)
    const data = await response.json()
    
    if (data.users && data.users.length > 0) {
      const user = data.users[0]
      return {
        userId: username,
        totalSolved: user.solvedCount || 0,
        easySolved: user.passedEasyCount || 0,
        mediumSolved: user.passedMediumCount || 0,
        hardSolved: user.passedHardCount || 0,
        lastUpdated: new Date().toISOString()
      }
    }
  } catch {}
  
  return {
    userId: username,
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    lastUpdated: new Date().toISOString()
  }
}

export async function fetchPTAData(username: string): Promise<OJData> {
  return {
    userId: username,
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    lastUpdated: new Date().toISOString()
  }
}

export async function fetchAtCoderData(username: string): Promise<OJData> {
  try {
    const response = await fetch(`https://atcoder.jp/users/${encodeURIComponent(username)}/history/json`)
    const data = await response.json()
    
    const solvedProblems = new Set<string>()
    let easy = 0, medium = 0, hard = 0
    
    for (const contest of data) {
      for (const problem of contest.problems) {
        if (problem.result === 'AC') {
          const key = `${contest.contestId}-${problem.problemId}`
          if (!solvedProblems.has(key)) {
            solvedProblems.add(key)
            const difficulty = problem.difficulty || 0
            if (difficulty <= 400) easy++
            else if (difficulty <= 1200) medium++
            else hard++
          }
        }
      }
    }
    
    return {
      userId: username,
      totalSolved: solvedProblems.size,
      easySolved: easy,
      mediumSolved: medium,
      hardSolved: hard,
      lastUpdated: new Date().toISOString()
    }
  } catch {
    return {
      userId: username,
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      lastUpdated: new Date().toISOString()
    }
  }
}

export async function fetchNowcoderData(username: string): Promise<OJData> {
  return {
    userId: username,
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    lastUpdated: new Date().toISOString()
  }
}

export async function parseProblemList(url: string): Promise<ProblemList> {
  try {
    const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url)
    const response = await fetch(proxyUrl)
    const html = await response.text()
    
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : '题单'
    
    const problems: Problem[] = []
    
    const $ = await import('cheerio').then(m => m.default)
    const doc = $.load(html)
    
    doc('tr').each((_, el) => {
      if (problems.length >= 100) return
      const text = doc(el).text().trim()
      const match = text.match(/^(\d+)[\.\、\s]+(.+)$/)
      if (match && match[2].length < 200) {
        problems.push({ id: match[1], title: match[2].trim(), difficulty: 'Medium' })
      }
    })
    
    if (problems.length === 0) {
      doc('a[href*="problems"], a[href*="problem"]').each((_, el) => {
        if (problems.length >= 100) return
        const text = doc(el).text().trim()
        const match = text.match(/^(\d+)[\.\、\s]+(.+)$/)
        if (match && match[2].length < 200) {
          problems.push({ id: match[1], title: match[2].trim(), difficulty: 'Medium' })
        }
      })
    }
    
    return { title, problems }
  } catch {
    return { title: '题单', problems: [] }
  }
}
