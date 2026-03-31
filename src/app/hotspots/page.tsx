'use client';

import { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { api, Hotspot, PaginatedResponse, Notification } from '@/lib/api';
import { 
  Search, 
  TrendingUp,
  Flame,
  ExternalLink,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  ChevronDown,
  Bell,
  BellOff,
  Check
} from 'lucide-react';

export default function HotspotsPage() {
  const [data, setData] = useState<PaginatedResponse<Hotspot> | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHotspots();
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    try {
      const notificationData = await api.getNotifications();
      setNotifications(notificationData);
    } catch (error) {
      console.error('获取通知失败:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      fetchNotifications();
    } catch (error) {
      console.error('标记失败:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSourceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchHotspots = async () => {
    try {
      setLoading(true);
      const result = await api.getHotspots({ page, limit: 10 });
      setData(result);
    } catch (error) {
      console.error('获取热点失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const getHeatConfig = (score: number) => {
    if (score >= 80) return { 
      label: '火爆', 
      color: 'text-accent-red',
      bg: 'bg-accent-red/10',
      border: 'border-accent-red/20'
    };
    if (score >= 60) return { 
      label: '热门', 
      color: 'text-accent-orange',
      bg: 'bg-accent-orange/10',
      border: 'border-accent-orange/20'
    };
    if (score >= 40) return { 
      label: '上升', 
      color: 'text-accent-yellow',
      bg: 'bg-accent-yellow/10',
      border: 'border-accent-yellow/20'
    };
    return { 
      label: '新发现', 
      color: 'text-accent-green',
      bg: 'bg-accent-green/10',
      border: 'border-accent-green/20'
    };
  };

  const defaultSources = ['Twitter', 'Hacker News', 'Reddit', 'RSS', '百度搜索', 'Bing搜索'];
  const sources = ['all', ...new Set([...defaultSources, ...(data?.data.map(h => h.source) || [])])];
  
  const filteredHotspots = data?.data.filter(hotspot => {
    const matchesSearch = hotspot.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (hotspot.summary && hotspot.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSource = selectedSource === 'all' || hotspot.source === selectedSource;
    return matchesSearch && matchesSource;
  }) || [];

  return (
    <MainLayout 
      title="热点列表"
      subtitle="发现各平台热门内容"
      actions={
        <div className="flex items-center gap-3">
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
              className="inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed border border-border text-foreground hover:bg-card hover:border-border-light active:scale-[0.98] px-4 py-2 text-sm"
            >
              <Globe size={14} className="text-foreground-muted" />
              <span className="text-sm font-medium">
                {selectedSource === 'all' ? '所有来源' : selectedSource}
              </span>
              <ChevronDown size={14} className={`text-foreground-muted transition-transform duration-200 ${sourceDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {sourceDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-36 py-1.5 rounded-lg border border-border bg-card shadow-lg shadow-black/10 backdrop-blur-xl z-50 animate-fade-in">
                <button
                  onClick={() => { setSelectedSource('all'); setSourceDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                    selectedSource === 'all'
                      ? 'text-primary bg-primary/10 font-medium'
                      : 'text-foreground hover:bg-card-hover'
                  }`}
                >
                  所有来源
                </button>
                {sources.filter(s => s !== 'all').map(source => (
                  <button
                    key={source}
                    onClick={() => { setSelectedSource(source); setSourceDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                      selectedSource === source
                        ? 'text-primary bg-primary/10 font-medium'
                        : 'text-foreground hover:bg-card-hover'
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button variant="outline" icon={<Filter size={16} />}>
            筛选
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-foreground-muted">加载热点中...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-subtle" />
            <input
              type="text"
              placeholder="搜索热点..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          {filteredHotspots.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-card-hover mx-auto mb-4 flex items-center justify-center">
                <TrendingUp size={24} className="text-foreground-subtle" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">暂无热点</h3>
              <p className="text-foreground-muted">
                {searchQuery ? '尝试其他搜索词' : '发现热点后将在此显示'}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredHotspots.map((hotspot, index) => {
                const heatConfig = getHeatConfig(hotspot.heatScore);
                const hotspotNotifications = notifications.filter(n => n.hotspotId === hotspot.id);
                const unreadNotifications = hotspotNotifications.filter(n => !n.isRead);
                
                return (
                  <Card 
                    key={hotspot.id} 
                    hover
                    className={`p-5 animate-slide-up hotspot-item ${unreadNotifications.length > 0 ? 'border-primary/30' : ''}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex gap-5">
                      <div className={`flex-shrink-0 w-16 h-16 rounded-xl ${heatConfig.bg} ${heatConfig.border} border flex flex-col items-center justify-center`}>
                        <span className={`text-2xl font-bold ${heatConfig.color}`}>
                          {hotspot.heatScore}
                        </span>
                        <span className={`text-xs ${heatConfig.color} opacity-80`}>
                          {heatConfig.label}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {hotspot.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            {hotspot.sourceUrl && (
                              <a
                                href={hotspot.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 p-2 rounded-lg hover:bg-card transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink size={16} className="text-foreground-muted hover:text-primary" />
                              </a>
                            )}
                            {unreadNotifications.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => unreadNotifications.forEach(n => handleMarkAsRead(n.id))}
                                icon={<Check size={14} />}
                                className="text-primary"
                              />
                            )}
                            {unreadNotifications.length > 0 && (
                              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                            )}
                          </div>
                        </div>

                        {hotspot.summary && (
                          <p className="text-sm text-foreground-muted mb-3 line-clamp-2">
                            {hotspot.summary}
                          </p>
                        )}

                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Globe size={14} className="text-foreground-subtle" />
                            <Badge variant="default">{hotspot.source}</Badge>
                          </div>
                          
                          {hotspot.keywords && hotspot.keywords.map((kw, i) => (
                            <Badge key={i} variant="secondary">{kw.keyword}</Badge>
                          ))}
                          
                          <div className="flex items-center gap-1 text-xs text-foreground-subtle">
                            <Clock size={12} />
                            <span>{formatTime(hotspot.publishedAt)}</span>
                          </div>
                          
                          {unreadNotifications.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-primary">
                              <Bell size={12} />
                              <span>{unreadNotifications.length} 条未读通知</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                icon={<ChevronLeft size={16} />}
              >
                上一页
              </Button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                        page === pageNum
                          ? 'bg-primary text-white'
                          : 'bg-card text-foreground-muted hover:bg-card-hover'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={page === data.pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                下一页
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </div>
      )}
    </MainLayout>
  );
}
