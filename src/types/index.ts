export interface Keyword {
  id: string;
  keyword: string;
  category: string | null;
  isActive: boolean;
  checkInterval: number;
  lastCheckedAt: Date | null;
  lastTriggeredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Hotspot {
  id: string;
  title: string;
  content: string | null;
  summary: string | null;
  source: string;
  sourceUrl: string | null;
  sourceId: string | null;
  category: string | null;
  heatScore: number;
  isVerified: boolean;
  isFake: boolean;
  fakeReason: string | null;
  keywordsMatched: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  type: string;
  status: string;
  sentAt: Date | null;
  error: string | null;
  createdAt: Date;
  hotspotId: string;
  keywordId: string | null;
}

export interface UserSettings {
  id: string;
  notificationEnabled: boolean;
  email: string | null;
  pushEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  aiProvider: string;
  aiApiKey: string | null;
  aiBaseUrl: string | null;
  aiModel: string | null;
  twitterApiKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataSource {
  id: string;
  name: string;
  type: string;
  config: string;
  isActive: boolean;
  lastFetched: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIConfig {
  provider: 'openrouter' | 'openai' | 'anthropic' | 'custom';
  apiKey: string;
  baseUrl?: string;
  model: string;
}

export interface AnalysisResult {
  isFake: boolean;
  confidence: number;
  reason: string;
}
