import type { OJConfig } from '../types'

export const ojConfigs: OJConfig[] = [
  {
    id: 'codeforces',
    name: 'Codeforces',
    fullName: 'Codeforces',
    baseUrl: 'https://codeforces.com',
    color: '#1f4fa8',
    icon: '🎯',
    description: '世界顶级竞赛平台'
  },
  {
    id: 'luogu',
    name: '洛谷',
    fullName: '洛谷',
    baseUrl: 'https://www.luogu.com.cn',
    color: '#3498db',
    icon: '🌊',
    description: '中学生编程学习社区'
  },
  {
    id: 'atcoder',
    name: 'AtCoder',
    fullName: 'AtCoder',
    baseUrl: 'https://atcoder.jp',
    color: '#2c3e50',
    icon: '🎌',
    description: '日本顶级算法平台'
  }
]

export function getOJConfig(id: string): OJConfig | undefined {
  return ojConfigs.find(c => c.id === id)
}
