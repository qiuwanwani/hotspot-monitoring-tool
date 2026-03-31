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
  keywords?: { keyword: string; category: string | null }[];
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
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      console.log('API请求开始:', `${API_BASE}${endpoint}`);
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      console.log('API请求响应:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: '请求失败' }));
        console.error('API请求错误:', error);
        throw new Error(error.error || '请求失败');
      }

      const data = await response.json();
      console.log('API请求成功:', data);
      return data;
    } catch (error) {
      console.error('API请求异常:', error);
      throw error;
    }
  }

  async getKeywords(): Promise<Keyword[]> {
    return this.request<Keyword[]>('/keywords');
  }

  async createKeyword(data: {
    keyword: string;
    category?: string;
    checkInterval?: number;
  }): Promise<Keyword> {
    return this.request<Keyword>('/keywords', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
    return this.request<Keyword>(`/keywords/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteKeyword(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/keywords/${id}`, {
      method: 'DELETE',
    });
  }

  async getHotspots(params?: {
    page?: number;
    limit?: number;
    source?: string;
    category?: string;
    minHeat?: number;
  }): Promise<PaginatedResponse<Hotspot>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.source) searchParams.set('source', params.source);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.minHeat) searchParams.set('minHeat', params.minHeat.toString());

    const query = searchParams.toString();
    return this.request<PaginatedResponse<Hotspot>>(
      `/hotspots${query ? `?${query}` : ''}`
    );
  }

  async getHotspot(id: string): Promise<Hotspot> {
    return this.request<Hotspot>(`/hotspots/${id}`);
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
}

export const api = new ApiClient();
