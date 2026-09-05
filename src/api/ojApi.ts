import type { OJData, Problem, ProblemList } from '../types'

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

export async function fetchLuoguData(username: string): Promise<OJData> {
  const now = new Date().toISOString()
  try {
    // 通过搜索接口获取 uid
    const searchUrl = `https://www.luogu.com.cn/api/user/search?keyword=${encodeURIComponent(username)}`
    const searchRes = await fetch('https://corsproxy.io/?' + encodeURIComponent(searchUrl))
    const searchData = await searchRes.json()

    if (searchData.users && searchData.users.length > 0) {
      const uid = searchData.users[0].uid
      // 爬用户主页 JSON 获取做题数
      const profileUrl = `https://www.luogu.com.cn/user/${uid}`
      const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(profileUrl)
      const res = await fetch(proxyUrl, {
        headers: { 'x-luogu-type': 'content-only' }
      })
      const data = await res.json()
      const info = data.currentData?.user
      const total = info?.passedProblemCount ?? 0
      return {
        userId: username,
        totalSolved: total,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        lastUpdated: now
      }
    }
  } catch {}

  return {
    userId: username,
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    lastUpdated: now
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
