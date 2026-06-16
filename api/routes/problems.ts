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
    // 支持 leetcode.cn 和 leetcode.com
    const isLeetCodeCN = url.includes('leetcode.cn')
    const baseUrl = isLeetCodeCN ? 'https://leetcode.cn' : 'https://leetcode.com'

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7'
      },
      timeout: 15000
    })

    const $ = cheerio.load(response.data)
    const problems: Problem[] = []

    // 尝试从页面 script 标签中提取数据（JSON 格式的题目列表）
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

    // 尝试从 __NEXT_DATA__ 或其他全局变量中获取
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

    // 如果仍然没有找到，尝试从 DOM 中解析
    if (problemListData.length === 0) {
      // 尝试从题目标题元素中提取
      $('[data-e2e-id], .question-title, .title-cell').each((_, el) => {
        const text = $(el).text().trim()
        const match = text.match(/^(\d+)[\.\、\s]*(.+)$/)
        if (match) {
          problems.push({
            id: match[1],
            title: match[2].trim(),
            difficulty: 'Medium' // 默认中等难度
          })
        }
      })
    } else {
      // 转换数据格式
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

    // 如果问题列表仍然为空，尝试更通用的解析方式
    if (problems.length === 0) {
      // 尝试从链接中提取题号
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

    // 尝试从页面标题提取题单名称
    let title = $('title').text().trim()
    if (!title) {
      title = '题单'
    }

    res.json({
      success: true,
      title,
      problems: problems.slice(0, 200) // 限制最多 200 题
    } as ParseResponse)
  } catch (error) {
    console.error('Error parsing problem list:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to parse problem list. Please check the URL.'
    } as ParseResponse)
  }
})

// 获取题目详情
router.get('/problem/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params

  try {
    const graphqlQuery = {
      query: `
        query problemDetails($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            questionId
            title
            difficulty
          }
        }
      `,
      variables: { titleSlug: `problem-${id}` }
    }

    const response = await axios.post('https://leetcode.cn/graphql', graphqlQuery, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    res.json({
      success: true,
      data: response.data.data?.question
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problem details'
    })
  }
})

export default router
