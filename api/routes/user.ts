/**
 * User data routes (IP-auth'd).
 * All routes under /api/user/ use the caller's IP as identity.
 */
import { Router, type Request, type Response } from 'express'
import { ipAuth, getAuth } from '../middleware/ipAuth.js'
import { loadUser, saveUser } from '../store/userStore.js'

const router = Router()

// Apply IP auth to all user routes
router.use(ipAuth)

// GET /api/user/me — who am I
router.get('/me', (req: Request, res: Response): void => {
  const { ip, key } = getAuth(req)
  const user = loadUser(ip, key)
  res.json({
    success: true,
    user: {
      ip,
      key,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ojCount: Object.keys(user.userData).length,
      dailyCount: user.dailyRecords.length,
    },
  })
})

// GET /api/user/oj-data — all OJ data for this user
router.get('/oj-data', (req: Request, res: Response): void => {
  const { ip, key } = getAuth(req)
  const user = loadUser(ip, key)
  res.json({ success: true, data: user.userData })
})

// POST /api/user/oj-data — upsert one OJ entry
router.post('/oj-data', (req: Request, res: Response): void => {
  const { ip, key } = getAuth(req)
  const { ojId, userId, data } = req.body as {
    ojId: string
    userId: string
    data: {
      userId: string
      totalSolved: number
      easySolved: number
      mediumSolved: number
      hardSolved: number
      lastUpdated: string
    } | null
  }

  if (!ojId) { res.status(400).json({ success: false, error: 'ojId required' }); return }

  const user = loadUser(ip, key)
  user.userData[ojId] = { userId: userId || '', data }
  saveUser(key, user)
  res.json({ success: true })
})

// POST /api/user/oj-data/batch — upsert multiple OJ entries at once
router.post('/oj-data/batch', (req: Request, res: Response): void => {
  const { ip, key } = getAuth(req)
  const { entries } = req.body as {
    entries: Record<string, { userId: string; data: any }>
  }
  if (!entries || typeof entries !== 'object') {
    res.status(400).json({ success: false, error: 'entries object required' }); return
  }
  const user = loadUser(ip, key)
  for (const [ojId, entry] of Object.entries(entries)) {
    user.userData[ojId] = entry
  }
  saveUser(key, user)
  res.json({ success: true })
})

// DELETE /api/user/oj-data/:ojId
router.delete('/oj-data/:ojId', (req: Request, res: Response): void => {
  const { ip, key } = getAuth(req)
  const ojId = req.params.ojId
  const user = loadUser(ip, key)
  delete user.userData[ojId]
  saveUser(key, user)
  res.json({ success: true })
})

// GET /api/user/daily
router.get('/daily', (req: Request, res: Response): void => {
  const { ip, key } = getAuth(req)
  const user = loadUser(ip, key)
  const days = Math.min(parseInt((req.query.days as string) || '30', 10), 365)
  res.json({ success: true, records: user.dailyRecords.slice(-days) })
})

// POST /api/user/daily — add one problem to today's record
router.post('/daily', (req: Request, res: Response): void => {
  const { ip, key } = getAuth(req)
  const { oj, problemId, title } = req.body as { oj: string; problemId: string; title: string }
  if (!oj || !problemId) { res.status(400).json({ success: false, error: 'oj + problemId required' }); return }

  const user = loadUser(ip, key)
  const today = new Date().toISOString().split('T')[0]
  const time = new Date().toTimeString().split(' ')[0]

  let record = user.dailyRecords.find(r => r.date === today)
  if (!record) {
    record = { date: today, totalCount: 0, problems: [] }
    user.dailyRecords.push(record)
  }
  record.problems.push({ oj, problemId, title: title || '', time })
  record.totalCount++
  saveUser(key, user)
  res.json({ success: true, record })
})

// POST /api/user/daily/clear
router.post('/daily/clear', (req: Request, res: Response): void => {
  const { ip, key } = getAuth(req)
  const { date } = req.body as { date?: string }
  const user = loadUser(ip, key)
  if (date) {
    user.dailyRecords = user.dailyRecords.filter(r => r.date !== date)
  } else {
    user.dailyRecords = []
  }
  saveUser(key, user)
  res.json({ success: true })
})

// DELETE /api/user/all — wipe everything for this IP
router.delete('/all', (req: Request, res: Response): void => {
  const { ip, key } = getAuth(req)
  const user = loadUser(ip, key)
  user.userData = {}
  user.dailyRecords = []
  saveUser(key, user)
  res.json({ success: true })
})

export default router
