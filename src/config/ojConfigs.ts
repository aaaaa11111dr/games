import type { OJConfig } from '../types'

export const ojConfigs: OJConfig[] = [
  {
    id: 'leetcode',
    name: 'LeetCode',
    fullName: 'LeetCode',
    baseUrl: 'https://leetcode.cn',
    color: '#f89f1b',
    icon: '⚡',
    description: '全球最大的算法训练平台'
  },
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
    id: 'lanqiao',
    name: '蓝桥',
    fullName: '蓝桥杯 OJ',
    baseUrl: 'https://www.lanqiao.cn',
    color: '#e74c3c',
    icon: '🏆',
    description: '中国大学生程序设计竞赛'
  },
  {
    id: 'hdu',
    name: '杭电',
    fullName: '杭州电子科技大学 OJ',
    baseUrl: 'https://acm.hdu.edu.cn',
    color: '#27ae60',
    icon: '📚',
    description: '经典中文OJ题库'
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
    id: 'pta',
    name: 'PTA',
    fullName: '拼题A (PTA)',
    baseUrl: 'https://pintia.cn',
    color: '#9b59b6',
    icon: '📝',
    description: '高校教学平台'
  },
  {
    id: 'atcoder',
    name: 'AtCoder',
    fullName: 'AtCoder',
    baseUrl: 'https://atcoder.jp',
    color: '#2c3e50',
    icon: '🎌',
    description: '日本顶级算法平台'
  },
  {
    id: 'nowcoder',
    name: '牛客',
    fullName: '牛客网',
    baseUrl: 'https://www.nowcoder.com',
    color: '#e67e22',
    icon: '🐂',
    description: '求职与刷题综合平台'
  }
]

export function getOJConfig(id: string): OJConfig | undefined {
  return ojConfigs.find(c => c.id === id)
}
