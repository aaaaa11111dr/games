import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dateKey, monthDays, remainingSeconds } from '../src/lib/calendar.js'
import { dueReminders } from '../src/lib/reminders.js'

test('万年历遵循世纪闰年规则并按周一开列', () => {
  assert.equal(monthDays(2000, 1).filter(d => d.current).length, 29)
  assert.equal(monthDays(1900, 1).filter(d => d.current).length, 28)
  assert.equal(monthDays(2100, 1).filter(d => d.current).length, 28)
  assert.equal(monthDays(2026, 8)[0].date.getDay(), 1)
  assert.equal(monthDays(2026, 8).length, 42)
})
test('跨年月份补全日期且使用本地日期键', () => {
  const december = monthDays(2026, 11)
  assert.equal(december.at(-1)!.key, '2027-01-10')
  assert.equal(dateKey(new Date(2026, 8, 29, 0, 5)), '2026-09-29')
})
test('倒计时以截止时间计算，休眠后不漂移且剩余时间不为负', () => {
  assert.equal(remainingSeconds(10000, 1001), 9)
  assert.equal(remainingSeconds(10000, 10000), 0)
  assert.equal(remainingSeconds(10000, 20000), 0)
})
test('日程和训练题单一起检查，到期后仅提醒一次', () => {
  const due = '2026-09-29T10:00:00+08:00'
  const alarms = [{ id: 'calendar', due, enabled: true, firedFor: '' }, { id: 'training', due, enabled: true, firedFor: '' }]
  const fired = dueReminders(alarms, Date.parse(due))
  assert.equal(fired.length, 2)
  fired.forEach(a => { a.firedFor = a.due })
  assert.equal(dueReminders(alarms, Date.parse(due) + 1000).length, 0)
})
