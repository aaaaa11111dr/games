import express from 'express'
import axios from 'axios'
import * as cheerio from 'cheerio'

const router = express.Router()

async function proxyGet(url: string): Promise<string> {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    },
    timeout: 30000
  })
  return response.data
}

// LeetCode
router.post('/leetcode', async (req: express.Request, res: express.Response): Promise<void> => {
  const { userId } = req.body as { userId: string }

  if (!userId) {
    res.status(400).json({ success: false, error: '用户名不能为空' })
    return
  }

  try {
    const query = `query userProblemsProgress($username: String!) { matchedUser(username: $username) { submitStats { acSubmissionNum { difficulty count } } } }`
    const apiResponse = await axios.post('https://leetcode.com/graphql',
      { query, variables: { username: userId } }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 30000
    })

    const data = apiResponse.data
    let total = 0, easy = 0, medium = 0, hard = 0
    const stats = data.data?.matchedUser?.submitStats?.acSubmissionNum

    if (stats) {
      for (const item of stats) {
        const difficulty = item.difficulty?.toLowerCase()
        const count = item.count || 0
        if (difficulty === 'easy') easy = count
        else if (difficulty === 'medium') medium = count
        else if (difficulty === 'hard') hard = count
        else if (difficulty === 'all') total = count
      }
      if (total === 0) total = easy + medium + hard
      res.json({ success: true, totalSolved: total, easySolved: easy, mediumSolved: medium, hardSolved: hard })
      return
    }

    // Fallback: try Chinese API
    const cnResponse = await axios.post('https://leetcode.cn/graphql',
      { query, variables: { username: userId } }, {
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      timeout: 30000
    })
    const cnData = cnResponse.data
    const cnStats = cnData.data?.matchedUser?.submitStats?.acSubmissionNum

    if (cnStats) {
      total = 0, easy = 0, medium = 0, hard = 0
      for (const item of cnStats) {
        const difficulty = item.difficulty?.toLowerCase()
        const count = item.count || 0
        if (difficulty === 'easy') easy = count
        else if (difficulty === 'medium') medium = count
        else if (difficulty === 'hard') hard = count
        else if (difficulty === 'all') total = count
      }
      if (total === 0) total = easy + medium + hard
      res.json({ success: true, totalSolved: total, easySolved: easy, mediumSolved: medium, hardSolved: hard })
      return
    }

    res.status(404).json({ success: false, error: '无法获取数据，请检查用户名' })
  } catch (err) {
    console.error('LeetCode error:', err)
    res.json({ success: true, totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, needsManual: true, message: '请手动输入做题数量' })
  }
})

// Codeforces
router.post('/codeforces', async (req: express.Request, res: express.Response): Promise<void> => {
  const { userId } = req.body as { userId: string }

  if (!userId) {
    res.status(400).json({ success: false, error: '用户名不能为空' })
    return
  }

  try {
    const response = await axios.get(
      `https://codeforces.com/api/user.status?handle=${encodeURIComponent(userId)}`,
      { timeout: 30000 }
    )
    const data = response.data

    if (data.status !== 'OK') {
      res.status(404).json({ success: false, error: data.comment || '用户不存在' })
      return
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

    res.json({ success: true, totalSolved: solvedProblems.size, easySolved: easy, mediumSolved: medium, hardSolved: hard })
  } catch (err) {
    console.error('Codeforces error:', err)
    res.json({ success: true, totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, needsManual: true, message: '请手动输入做题数量' })
  }
})

// 通用 OJ 处理器
function createOJHandler(name: string) {
  return async (req: express.Request, res: express.Response): Promise<void> => {
    const { userId } = req.body as { userId: string }

    if (!userId) {
      res.status(400).json({ success: false, error: '用户名不能为空' })
      return
    }

    res.json({
      success: true,
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      needsManual: true,
      message: `请手动输入 ${name} 做题数量`
    })
  }
}

router.post('/lanqiao', createOJHandler('蓝桥杯'))
router.post('/hdu', createOJHandler('杭电 OJ'))
router.post('/luogu', createOJHandler('洛谷'))
router.post('/pta', createOJHandler('PTA'))
router.post('/atcoder', createOJHandler('AtCoder'))
router.post('/nowcoder', createOJHandler('牛客网'))

// 题单解析
router.post('/problem-list', async (req: express.Request, res: express.Response): Promise<void> => {
  const { url } = req.body as { url: string }

  if (!url) {
    res.status(400).json({ success: false, error: '链接不能为空' })
    return
  }

  try {
    const html = await proxyGet(url)
    const $ = cheerio.load(html)
    const problems: Array<{ id: string; title: string; difficulty: string }> = []
    const title = $('title').text().trim() || '题单'

    // 尝试解析表格中的题目
    $('tr').each((_, el) => {
      if (problems.length >= 100) return
      const text = $(el).text().trim()
      const match = text.match(/^(\d+)[\.\、\s]+(.+)$/)
      if (match && match[2].length < 200) {
        problems.push({ id: match[1], title: match[2].trim(), difficulty: 'Medium' })
      }
    })

    // 尝试解析链接中的题目
    if (problems.length === 0) {
      $('a[href*="problems"], a[href*="problem"]').each((_, el) => {
        if (problems.length >= 100) return
        const text = $(el).text().trim()
        const match = text.match(/^(\d+)[\.\、\s]+(.+)$/)
        if (match && match[2].length < 200) {
          problems.push({ id: match[1], title: match[2].trim(), difficulty: 'Medium' })
        }
      })
    }

    res.json({ success: true, title, problems })
  } catch (err) {
    console.error('Problem list error:', err)
    res.json({ success: true, title: '题单', problems: [], message: '未能自动解析，请手动添加' })
  }
})

export default router
