import { Router, type Request, type Response } from 'express'
import axios from 'axios'
import * as cheerio from 'cheerio'

const router = Router()

interface Problem {
  id: string
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

interface ParseResponse {
  success: boolean
  title?: string
  problems?: Problem[]
  error?: string
}

// 代理请求 LeetCode GraphQL API - 获取用户统计
router.post('/user-stats', async (req: Request, res: Response): Promise<void> => {
  const { username }: { username: string } = req.body

  if (!username) {
    res.status(400).json({
      success: false,
      error: 'Username is required'
    })
    return
  }

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

  try {
    // 优先尝试英文站
    let response = await axios.post('https://leetcode.com/graphql', { query, variables }, {
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    })

    let data = response.data

    // 如果英文站失败，尝试中文站
    if (!data.data?.matchedUser) {
      response = await axios.post('https://leetcode.cn/graphql', { query, variables }, {
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://leetcode.cn/'
        },
        timeout: 15000
      })
      data = response.data
    }

    if (!data.data?.matchedUser) {
      // 尝试解析用户页面获取数据
      const stats = await fetchUserStatsFromPage(username)
      if (stats) {
        res.json({
          success: true,
          data: stats
        })
        return
      }
      
      res.status(404).json({
        success: false,
        error: data.errors?.[0]?.message || 'User not found or profile is private'
      })
      return
    }

    const stats = data.data.matchedUser.submitStats.acSubmissionNum
    const result = {
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0
    }

    for (const item of stats) {
      const count = item.count || 0
      
      const difficulty = item.difficulty?.toLowerCase()
      if (difficulty === 'all') result.totalSolved = count
      else if (difficulty === 'easy') {
        result.easySolved = count
        result.totalSolved += count
      } else if (difficulty === 'medium') {
        result.mediumSolved = count
        result.totalSolved += count
      } else if (difficulty === 'hard') {
        result.hardSolved = count
        result.totalSolved += count
      }
    }

    // 如果没有 all 统计，手动计算总数
    if (result.totalSolved === 0) {
      result.totalSolved = result.easySolved + result.mediumSolved + result.hardSolved
    }

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    
    // 尝试解析用户页面获取数据
    try {
      const stats = await fetchUserStatsFromPage(username)
      if (stats) {
        res.json({
          success: true,
          data: stats
        })
        return
      }
    } catch (pageError) {
      console.error('Error fetching from page:', pageError)
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user stats. Please check if the username is correct and the profile is public.'
    })
  }
})

// 从用户页面解析统计数据
async function fetchUserStatsFromPage(username: string): Promise<{ totalSolved: number; easySolved: number; mediumSolved: number; hardSolved: number } | null> {
  const urls = [
    `https://leetcode.cn/u/${username}/`,
    `https://leetcode.com/u/${username}/`
  ]

  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      })

      const $ = cheerio.load(response.data)
      
      // 尝试从页面中提取统计数据
      const stats = {
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0
      }

      // 尝试解析各种可能的 HTML 结构
      const text = $('body').text()
      
      // 尝试匹配数字模式
      const easyMatch = text.match(/简单[\s:]*(\d+)/)
      const mediumMatch = text.match(/中等[\s:]*(\d+)/)
      const hardMatch = text.match(/困难[\s:]*(\d+)/)
      const totalMatch = text.match(/解题[\s:]*(\d+)/)

      if (easyMatch) stats.easySolved = parseInt(easyMatch[1])
      if (mediumMatch) stats.mediumSolved = parseInt(mediumMatch[1])
      if (hardMatch) stats.hardSolved = parseInt(hardMatch[1])
      if (totalMatch) stats.totalSolved = parseInt(totalMatch[1])

      if (stats.totalSolved === 0) {
        stats.totalSolved = stats.easySolved + stats.mediumSolved + stats.hardSolved
      }

      if (stats.totalSolved > 0 || stats.easySolved > 0 || stats.mediumSolved > 0 || stats.hardSolved > 0) {
        return stats
      }
    } catch (error) {
      console.error(`Failed to fetch from ${url}:`, error)
    }
  }

  return null
}

// 代理请求 LeetCode GraphQL API - 获取用户已做题目列表
router.post('/user-solved-problems', async (req: Request, res: Response): Promise<void> => {
  const { username }: { username: string } = req.body

  if (!username) {
    res.status(400).json({
      success: false,
      error: 'Username is required'
    })
    return
  }

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

  try {
    // 优先尝试英文站
    let response = await axios.post('https://leetcode.com/graphql', { query, variables }, {
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    })

    let data = response.data

    if (!data.data?.matchedUser) {
      response = await axios.post('https://leetcode.cn/graphql', { query, variables }, {
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      })
      data = response.data
    }

    if (!data.data?.matchedUser) {
      res.json({
        success: true,
        data: []
      })
      return
    }

    const allQuestions = data.data.matchedUser.allQuestions || []
    const solvedIds: string[] = []

    for (const q of allQuestions) {
      if (q.status === 'ac' || q.status === 'solved') {
        solvedIds.push(String(q.questionId))
      }
    }

    res.json({
      success: true,
      data: solvedIds
    })
  } catch (error) {
    console.error('Error fetching user solved problems:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user solved problems'
    })
  }
})

// 从 LeetCode 题单页面解析题目
router.post('/parse-problem-list', async (req: Request, res: Response): Promise<void> => {
  const { url }: { url: string } = req.body

  if (!url) {
    res.status(400).json({
      success: false,
      error: 'URL is required'
    } as ParseResponse)
    return
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7'
      },
      timeout: 15000
    })

    const $ = cheerio.load(response.data)
    const problems: Problem[] = []

    const scripts = $('script').map((_, el) => $(el).html()).get()
    let problemListData: Array<Record<string, any>> = []

    for (const script of scripts) {
      if (script && script.includes('questionList')) {
        const match = script.match(/questionList\s*[:=]\s*(\[.*?\])/s)
        if (match) {
          try {
            problemListData = JSON.parse(match[1])
            break
          } catch {
            // 继续尝试
          }
        }
      }
    }

    if (problemListData.length === 0) {
      $('script').each((_, el) => {
        const content = $(el).html()
        if (content && (content.includes('questionList') || content.includes('questions'))) {
          const patterns = [
            /"questionList"\s*:\s*(\[[\s\S]*?\])/,
            /"questions"\s*:\s*(\[[\s\S]*?\])/,
            /problems\s*[:=]\s*(\[[\s\S]*?\])/
          ]
          for (const pattern of patterns) {
            const match = content.match(pattern)
            if (match) {
              try {
                const parsed = JSON.parse(match[1])
                if (Array.isArray(parsed) && parsed.length > 0) {
                  problemListData = parsed
                  break
                }
              } catch {
                // 继续尝试
              }
            }
          }
        }
      })
    }

    if (problemListData.length === 0) {
      $('[data-e2e-id], .question-title, .title-cell').each((_, el) => {
        const text = $(el).text().trim()
        const match = text.match(/^(\d+)[\.\、\s]*(.+)$/)
        if (match) {
          problems.push({
            id: match[1],
            title: match[2].trim(),
            difficulty: 'Medium'
          })
        }
      })
    } else {
      for (const p of problemListData) {
        const id = p.frontend_question_id || p.id || ''
        const title = p.title || p.titleSlug || ''
        let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium'

        if (p.difficulty) {
          const d = p.difficulty.toLowerCase()
          if (d === 'easy') difficulty = 'Easy'
          else if (d === 'hard') difficulty = 'Hard'
        }

        if (id && title) {
          problems.push({ id, title, difficulty })
        }
      }
    }

    if (problems.length === 0) {
      $('a[href*="/problems/"]').each((_, el) => {
        const href = $(el).attr('href') || ''
        const match = href.match(/\/problems\/[\w-]+\/(\d+)/)
        if (match) {
          const id = match[1]
          const title = $(el).text().trim().replace(/^\d+[\.\、\s]*/, '')
          if (id && title && !problems.find(p => p.id === id)) {
            problems.push({ id, title, difficulty: 'Medium' })
          }
        }
      })
    }

    let title = $('title').text().trim()
    if (!title) {
      title = '题单'
    }

    res.json({
      success: true,
      title,
      problems: problems.slice(0, 200)
    } as ParseResponse)
  } catch (error) {
    console.error('Error parsing problem list:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to parse problem list. Please check the URL.'
    } as ParseResponse)
  }
})

export default router
