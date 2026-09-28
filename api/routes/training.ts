import { Router } from 'express'
import { cached, newProblems, ratingHistory } from '../services/training.js'
const router = Router()
router.get('/problems', async (req, res) => {
  const platform = String(req.query.platform || 'codeforces')
  const site = req.query.site === 'cn' ? 'leetcode.cn' : 'leetcode.com'
  if (!['codeforces', 'leetcode'].includes(platform)) { res.status(400).json({ error: '不支持的平台' }); return }
  try { res.json(await cached(`problems:${platform}:${site}`, () => newProblems(platform, site))) }
  catch { res.status(502).json({ error: '无法连接题库，请稍后重试；LeetCode 可切换国际站 / 中国站。' }) }
})
router.get('/ratings', async (req, res) => {
  const platform = String(req.query.platform || '')
  const username = String(req.query.username || '').trim()
  const site = req.query.site === 'cn' ? 'leetcode.cn' : 'leetcode.com'
  if (!['codeforces', 'leetcode', 'atcoder'].includes(platform) || !/^[\w.-]{1,80}$/.test(username)) {
    res.status(400).json({ error: '请选择支持的平台并填写有效用户名' }); return
  }
  try { res.json(await cached(`rating:${platform}:${site}:${username}`, () => ratingHistory(platform, username, site))) }
  catch { res.status(502).json({ error: '比赛分数获取失败，请检查用户名、站点或稍后重试。原有记录已保留。' }) }
})
export default router
