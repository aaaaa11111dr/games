export interface Problem {
  id: string
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

export interface UserStats {
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
}

export interface ProblemList {
  title: string
  problems: Problem[]
}

export interface ComparisonResult {
  done: Problem[]
  notDone: Problem[]
  progress: number
}

export interface LeetCodeUser {
  username: string
  submitStats: {
    acSubmissionNum: Array<{
      difficulty: string
      count: number
    }>
  }
}
