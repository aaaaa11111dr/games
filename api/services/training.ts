import axios from 'axios'

export interface NewProblem { id: string; platform: string; title: string; url: string; difficulty: string; rating?: number; tags: string[]; paid: boolean }
export interface RatingPoint { date: string; rating: number; label: string }
const http = axios.create({ timeout: 20000, headers: { 'User-Agent': 'OJ-Tracker/1.0', Accept: 'application/json' } })
const cache = new Map<string, { at: number; data: unknown }>()
const pending = new Map<string, Promise<unknown>>()
export async function cached<T>(key: string, loader: () => Promise<T>): Promise<{ data: T; fetchedAt: string; stale: boolean }> {
  const previous = cache.get(key)
  if (previous && Date.now() - previous.at < 300000) return { data: previous.data as T, fetchedAt: new Date(previous.at).toISOString(), stale: false }
  try {
    let work = pending.get(key)
    if (!work) { work = loader(); pending.set(key, work) }
    const data = await work as T
    const at = Date.now()
    if (cache.size >= 200) cache.delete(cache.keys().next().value!)
    cache.set(key, { data, at })
    return { data, fetchedAt: new Date(at).toISOString(), stale: false }
  } catch (error) {
    if (previous) return { data: previous.data as T, fetchedAt: new Date(previous.at).toISOString(), stale: true }
    throw error
  } finally { pending.delete(key) }
}
async function cf(method: string, params = {}) {
  const { data } = await http.get(`https://codeforces.com/api/${method}`, { params })
  if (data.status !== 'OK') throw new Error(data.comment || 'Codeforces 请求失败')
  return data.result
}
async function graphql(query: string, variables: object, site: string) {
  const endpoint = site === 'leetcode.cn' ? 'graphql/noj-go/' : 'graphql/'
  const { data } = await http.post(`https://${site}/${endpoint}`, { query, variables }, { headers: { Referer: `https://${site}/` } })
  if (data.errors?.length || !data.data) throw new Error('LeetCode 接口暂不可用或用户不存在')
  return data.data
}
export function normalizeCF(problems: any[]): NewProblem[] {
  return problems.filter(p => Number.isInteger(p.contestId) && p.index && p.name)
    .sort((a, b) => b.contestId - a.contestId || a.index.localeCompare(b.index, undefined, { numeric: true }))
    .slice(0, 150).map(p => ({ id: `${p.contestId}${p.index}`, platform: 'codeforces', title: p.name,
      url: `https://codeforces.com/problemset/problem/${p.contestId}/${encodeURIComponent(p.index)}`,
      rating: p.rating, difficulty: p.rating == null ? '未评级' : String(p.rating), tags: p.tags || [], paid: false }))
}
export function normalizeLC(items: any[], site: string): NewProblem[] {
  return items.filter(p => p.stat?.question__title_slug && /^\d+$/.test(String(p.stat.frontend_question_id)))
    .sort((a, b) => Number(b.stat.frontend_question_id) - Number(a.stat.frontend_question_id)).slice(0, 150)
    .map(p => ({ id: String(p.stat.frontend_question_id), platform: 'leetcode', title: p.stat.question__title,
      url: `https://${site}/problems/${encodeURIComponent(p.stat.question__title_slug)}/`,
      difficulty: ({ 1: 'Easy', 2: 'Medium', 3: 'Hard' } as Record<number, string>)[p.difficulty?.level] || '未知',
      tags: [], paid: Boolean(p.paid_only) }))
}
export async function newProblems(platform: string, site: string) {
  if (platform === 'codeforces') return normalizeCF((await cf('problemset.problems')).problems)
  const { data } = await http.get(`https://${site}/api/problems/all/`)
  if (!Array.isArray(data.stat_status_pairs)) throw new Error('LeetCode 题库数据格式发生变化')
  return normalizeLC(data.stat_status_pairs, site)
}
export async function ratingHistory(platform: string, username: string, site: string): Promise<RatingPoint[]> {
  let points: RatingPoint[]
  if (platform === 'codeforces') {
    points = (await cf('user.rating', { handle: username })).map((p: any) => ({ date: new Date(p.ratingUpdateTimeSeconds * 1000).toISOString(), rating: p.newRating, label: p.contestName }))
  } else if (platform === 'atcoder') {
    const { data } = await http.get(`https://atcoder.jp/users/${encodeURIComponent(username)}/history/json`)
    if (!Array.isArray(data)) throw new Error('AtCoder 用户不存在或接口不可用')
    points = data.filter(p => p.IsRated).map(p => ({ date: new Date(p.EndTime).toISOString(), rating: p.NewRating, label: p.ContestName }))
  } else {
    const cn = site === 'leetcode.cn'
    const field = 'userContestRankingHistory'
    const arg = cn ? 'userSlug' : 'username'
    const data = await graphql(`query ($user: String!) { ${field}(${arg}: $user) { attended rating contest { title startTime } } }`, { user: username }, site)
    if (!Array.isArray(data[field])) throw new Error('LeetCode 用户不存在或比赛记录不可用')
    points = data[field].filter((p: any) => p.attended).map((p: any) => ({ date: new Date(p.contest.startTime * 1000).toISOString(), rating: Math.round(p.rating), label: p.contest.title }))
  }
  return points.filter(p => Number.isFinite(p.rating)).sort((a, b) => a.date.localeCompare(b.date))
}
