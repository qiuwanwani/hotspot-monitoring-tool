const API_BASE = '/api';

export interface Keyword {
  id: string;
  keyword: string;
  category: string | null;
  isActive: boolean;
  checkInterval: number;
  lastCheckedAt: string | null;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    hotspots: number;
    notifications: number;
  };
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
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  keywords?: { id: string; keyword: string; category: string | null }[];
  heatHistory?: { heatScore: number; recordedAt: string }[];
  _count?: { favorites: number };
}

export interface Notification {
  id: string;
  type: string;
  status: string;
  sentAt: string | null;
  error: string | null;
  createdAt: string;
  hotspotId: string;
  keywordId: string | null;
  hotspot?: Hotspot;
  keyword?: Keyword;
  isRead?: boolean;
  title?: string;
  message?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiClient {
  // 简单的内存缓存
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30秒缓存

  private async request<T>(
    endpoint: string,
    options?: RequestInit,
    timeout: number = 30000, // 增加到30秒
    useCache: boolean = true
  ): Promise<T> {
    const cacheKey = `${endpoint}${options?.body || ''}`;
    
    // 检查缓存
    if (useCache && options?.method !== 'POST' && options?.method !== 'PUT' && options?.method !== 'DELETE') {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data as T;
      }
    }

    try {
      // 创建 AbortController 用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        signal: controller.signal,
        ...options,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: '请求失败' }));
        throw new Error(error.error || '请求失败');
      }

      const data = await response.json();
      
      // 缓存数据
      if (useCache && options?.method !== 'POST' && options?.method !== 'PUT' && options?.method !== 'DELETE') {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }
      
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求超时，请稍后重试');
      }
      throw error;
    }
  }

  // 清除缓存
  clearCache() {
    this.cache.clear();
  }

  async getKeywords(skipCache: boolean = false): Promise<Keyword[]> {
    return this.request<Keyword[]>('/keywords', skipCache ? {
      headers: { 'x-skip-cache': 'true' }
    } : undefined);
  }

  async createKeyword(data: {
    keyword: string;
    category?: string;
    checkInterval?: number;
  }): Promise<Keyword> {
    const result = await this.request<Keyword>('/keywords', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // 创建后清除缓存
    this.clearCache();
    return result;
  }

  async getKeyword(id: string): Promise<Keyword> {
    return this.request<Keyword>(`/keywords/${id}`);
  }

  async updateKeyword(
    id: string,
    data: {
      keyword?: string;
      category?: string;
      isActive?: boolean;
      checkInterval?: number;
    }
  ): Promise<Keyword> {
    const result = await this.request<Keyword>(`/keywords/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    // 更新后清除缓存
    this.clearCache();
    return result;
  }

  async deleteKeyword(id: string): Promise<{ success: boolean }> {
    const result = await this.request<{ success: boolean }>(`/keywords/${id}`, {
      method: 'DELETE',
    });
    // 删除后清除缓存，确保下次获取最新数据
    this.clearCache();
    return result;
  }

  async getHotspots(params?: {
    page?: number;
    limit?: number;
    source?: string;
    category?: string;
    minHeat?: number;
    maxHeat?: number;
    sortBy?: 'heatScore' | 'publishedAt' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    timeRange?: '1h' | '24h' | '7d' | '30d';
    isVerified?: boolean;
    isFake?: boolean;
    hasSummary?: boolean;
    keywordId?: string;
  }): Promise<PaginatedResponse<Hotspot>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.source) searchParams.set('source', params.source);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.minHeat !== undefined) searchParams.set('minHeat', params.minHeat.toString());
    if (params?.maxHeat !== undefined) searchParams.set('maxHeat', params.maxHeat.toString());
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params?.timeRange) searchParams.set('timeRange', params.timeRange);
    if (params?.isVerified !== undefined) searchParams.set('isVerified', params.isVerified.toString());
    if (params?.isFake !== undefined) searchParams.set('isFake', params.isFake.toString());
    if (params?.hasSummary !== undefined) searchParams.set('hasSummary', params.hasSummary.toString());
    if (params?.keywordId) searchParams.set('keywordId', params.keywordId);

    const query = searchParams.toString();
    return this.request<PaginatedResponse<Hotspot>>(
      `/hotspots${query ? `?${query}` : ''}`
    );
  }

  async getHotspot(id: string): Promise<Hotspot> {
    return this.request<Hotspot>(`/hotspots/${id}`);
  }

  async getHotspotStats(): Promise<{ total: number; today: number }> {
    return this.request<{ total: number; today: number }>('/hotspots/stats');
  }

  async updateHotspot(
    id: string,
    data: {
      isVerified?: boolean;
      isFake?: boolean;
      fakeReason?: string;
      heatScore?: number;
      summary?: string;
    }
  ): Promise<Hotspot> {
    return this.request<Hotspot>(`/hotspots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getNotifications(): Promise<Notification[]> {
    return this.request<Notification[]>('/notifications');
  }

  async markNotificationRead(id: string): Promise<Notification> {
    return this.request<Notification>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/notifications/read-all', {
      method: 'PUT',
    });
  }

  // 收藏相关
  async getFavorites(): Promise<any[]> {
    return this.request<any[]>('/favorites');
  }

  async addFavorite(hotspotId: string): Promise<any> {
    return this.request<any>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ hotspotId }),
    });
  }

  async deleteFavorite(hotspotId: string): Promise<any> {
    return this.request<any>(`/favorites?hotspotId=${hotspotId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
