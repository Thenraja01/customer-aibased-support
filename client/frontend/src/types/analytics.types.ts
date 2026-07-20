export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalChats: number;
  totalTickets: number;
  totalDocuments: number;
  resolutionRate: number;
  avgResponseTime: number;
  satisfactionRate: number;
}

export interface UsageStats {
  date: string;
  chats: number;
  messages: number;
  aiMessages: number;
  tokensUsed: number;
}

export interface ResponseTimeStats {
  date: string;
  avgResponseTime: number;
  avgResolutionTime: number;
  maxResponseTime: number;
}

export interface TokenUsage {
  date: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
}

export interface SessionAnalytics {
  totalSessions: number;
  avgSessionDuration: number;
  avgMessagesPerSession: number;
  escalationRate: number;
  satisfactionDistribution: {
    rating: number;
    count: number;
  }[];
}

export interface AIAnalytics {
  totalAIResponses: number;
  avgAIConfidence: number;
  topQueries: { query: string; count: number }[];
  feedbackRate: number;
  helpfulnessRate: number;
}

export interface DateRange {
  start: string;
  end: string;
}
