export interface UserStats {
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
}

export interface Problem {
  id: string
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  solved?: boolean
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

export interface OJConfig {
  id: string
  name: string
  fullName: string
  baseUrl: string
  color: string
  icon: string
  description: string
}

export interface OJData {
  userId: string
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
  lastUpdated: string
}

export interface DailyRecord {
  date: string
  problems: DailyProblem[]
  totalCount: number
}

export interface DailyProblem {
  oj: string
  problemId: string
  title: string
  time: string
}

export interface AllOJSummary {
  total: number
  byOJ: { [key: string]: OJData }
  lastUpdated: string
}
