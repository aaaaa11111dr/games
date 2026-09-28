import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeCF, normalizeLC, cached } from '../api/services/training.js'
import { dueReminders } from '../src/lib/reminders.js'

test('Codeforces 新题按比赛编号排序，保留真实难度与未评级状态', () => {
  const result = normalizeCF([{ contestId: 1900, index: 'A', name: 'Old', rating: 800 }, { contestId: 2000, index: 'B', name: 'New B' }, { contestId: 2000, index: 'A', name: 'New A', rating: 1600 }])
  assert.deepEqual(result.map(p => p.id), ['2000A', '2000B', '1900A'])
  assert.equal(result[1].difficulty, '未评级')
  assert.equal(result[0].rating, 1600)
  assert.equal(result[0].url, 'https://codeforces.com/problemset/problem/2000/A')
})
test('LeetCode 数字题号倒序、难度映射和付费标识', () => {
  const item = (id: number, level: number) => ({ stat: { frontend_question_id: id, question__title_slug: `q-${id}`, question__title: `Q${id}` }, difficulty: { level }, paid_only: true })
  const result = normalizeLC([item(99, 1), item(100, 3), item(101, 2)], 'leetcode.cn')
  assert.deepEqual(result.map(p => p.id), ['101', '100', '99'])
  assert.deepEqual(result.map(p => p.difficulty), ['Medium', 'Hard', 'Easy'])
  assert.equal(result[0].paid, true)
  assert.equal(result[0].url, 'https://leetcode.cn/problems/q-101/')
})
test('提醒涵盖到期与逾期、排除取消/已触发/非法时间；改期后可再次触发', () => {
  const now = Date.parse('2026-09-22T12:00:00Z')
  const base = { id: 'p', due: '2026-09-22T11:00:00Z', enabled: true, firedFor: '' }
  const due = dueReminders([base, { ...base, id: 'off', enabled: false }, { ...base, id: 'fired', firedFor: base.due }, { ...base, id: 'future', due: '2026-09-23T11:00:00Z' }, { ...base, id: 'invalid', due: 'invalid' }], now)
  assert.deepEqual(due.map(p => p.id), ['p'])
  base.firedFor = base.due
  assert.equal(dueReminders([base], now).length, 0)
  base.due = '2026-09-22T12:00:00Z'
  assert.equal(dueReminders([base], now).length, 1)
})
test('缓存合并并发请求，重复刷新不重复抓取', async () => {
  let count = 0
  const loader = async () => { count++; return [{ id: 1 }] }
  const [a, b] = await Promise.all([cached('test-dedupe', loader), cached('test-dedupe', loader)])
  assert.equal(count, 1); assert.deepEqual(a.data, b.data)
  await cached('test-dedupe', loader); assert.equal(count, 1)
})
test('缓存过期上游失败时返回旧数据并标明过期', async () => {
  const realNow = Date.now
  try {
    await cached('test-stale', async () => [123])
    Date.now = () => realNow() + 360000
    const result = await cached('test-stale', async () => { throw new Error('offline') })
    assert.deepEqual(result.data, [123]); assert.equal(result.stale, true)
  } finally { Date.now = realNow }
})
