/**
 * JSON-file backed user storage, keyed by IP hash.
 * One file per user: data/users/<userKey>.json
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.resolve(__dirname, '../../data/users')

// Ensure dir exists
try { fs.mkdirSync(DATA_DIR, { recursive: true }) } catch {}

export interface OJEntry {
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

export interface UserData {
  ip: string
  createdAt: string
  updatedAt: string
  userData: Record<string, OJEntry>
  dailyRecords: Array<{
    date: string
    totalCount: number
    problems: Array<{ oj: string; problemId: string; title: string; time: string }>
  }>
}

const EMPTY_USER = (ip: string): UserData => ({
  ip,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userData: {},
  dailyRecords: [],
})

function userFile(key: string): string {
  // only allow [a-f0-9] to avoid path traversal
  const safe = key.replace(/[^a-f0-9]/g, '').substring(0, 32)
  return path.join(DATA_DIR, `${safe}.json`)
}

export function loadUser(ip: string, key: string): UserData {
  const file = userFile(key)
  try {
    const raw = fs.readFileSync(file, 'utf-8')
    const data = JSON.parse(raw) as UserData
    // ensure ip field is current
    data.ip = ip
    return data
  } catch {
    return EMPTY_USER(ip)
  }
}

export function saveUser(key: string, data: UserData): void {
  data.updatedAt = new Date().toISOString()
  const file = userFile(key)
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
}

export function listUsers(): Array<{ key: string; ip: string; updatedAt: string }> {
  try {
    return fs.readdirSync(DATA_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          const raw = fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')
          const data = JSON.parse(raw) as UserData
          return { key: f.replace('.json', ''), ip: data.ip, updatedAt: data.updatedAt }
        } catch {
          return null
        }
      })
      .filter(Boolean) as Array<{ key: string; ip: string; updatedAt: string }>
  } catch {
    return []
  }
}
