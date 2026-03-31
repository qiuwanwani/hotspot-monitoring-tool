'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Button, { IconButton } from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ShareCard from '@/components/ui/ShareCard';
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
  Check,
  X,
  ArrowUpDown,
  Calendar,
  Shield,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Share2,
  Loader2
} from 'lucide-react';

type SortOption = 'createdAt' | 'publishedAt' | 'heatScore';
type SortOrder = 'asc' | 'desc';
type TimeRange = '1h' | '24h' | '7d' | '30d' | 'all';
type VerificationStatus = 'all' | 'verified' | 'fake' | 'pending';

interface FilterState {
  source: string;
  timeRange: TimeRange;
  heatLevel: string;
  verificationStatus: VerificationStatus;
  hasKeyword: boolean;
  hasSummary: boolean;
}

const sortOptions = [
  { value: 'createdAt', label: '最新发现', icon: Clock },
  { value: 'publishedAt', label: '最新发布', icon: Calendar },
  { value: 'heatScore', label: '热度分数', icon: Flame },
];

const timeRangeOptions = [
  { value: 'all', label: '全部时间' },
  { value: '1h', label: '最近1小时' },
  { value: '24h', label: '最近24小时' },
  { value: '7d', label: '最近7天' },
  { value: '30d', label: '最近30天' },
];

const heatLevelOptions = [
  { value: 'all', label: '全部热度' },
  { value: '80-100', label: '🔥 火爆 (80-100)' },
  { value: '60-79', label: '🌡️ 热门 (60-79)' },
  { value: '40-59', label: '📈 上升 (40-59)' },
  { value: '0-39', label: '🆕 新发现 (0-39)' },
];

const verificationOptions = [
  { value: 'all', label: '全部', icon: null },
  { value: 'verified', label: '已验证', icon: Shield },
  { value: 'fake', label: '疑似虚假', icon: AlertTriangle },
  { value: 'pending', label: '待验证', icon: Sparkles },
];

export default function HotspotsPage() {
  const [data, setData] = useState<PaginatedResponse<Hotspot> | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // 排序状态
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // 筛选状态
  const [filters, setFilters] = useState<FilterState>({
    source: 'all',
    timeRange: 'all',
    heatLevel: 'all',
    verificationStatus: 'all',
    hasKeyword: false,
    hasSummary: false,
  });
  
  // 下拉菜单状态
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const sourceDropdownRef = useRef<HTMLDivElement>(null);
  
  // 无限滚动
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // 分享功能
  const [shareHotspot, setShareHotspot] = useState<Hotspot | null>(null);

  // 使用 AbortController 来取消过时的请求
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // 重置页码和hasMore状态
    setPage(1);
    setHasMore(true);
    
    fetchHotspots(1, false);
    fetchNotifications();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [sortBy, sortOrder, filters]);

  // 每30秒自动刷新数据
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(e.target as Node)) {
        setSourceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const fetchHotspots = async (pageNum = page, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      // 解析热度等级
      let minHeat = 0;
      let maxHeat: number | undefined;
      if (filters.heatLevel !== 'all') {
        const [min, max] = filters.heatLevel.split('-').map(Number);
        minHeat = min;
        maxHeat = max;
      }
      
      // 解析验证状态
      let isVerified: boolean | undefined;
      let isFake: boolean | undefined;
      if (filters.verificationStatus === 'verified') {
        isVerified = true;
      } else if (filters.verificationStatus === 'fake') {
        isFake = true;
      } else if (filters.verificationStatus === 'pending') {
        isVerified = false;
        isFake = false;
      }
      
      const result = await api.getHotspots({
        page: pageNum,
        limit: 10,
        source: filters.source !== 'all' ? filters.source : undefined,
        minHeat,
        maxHeat,
        sortBy,
        sortOrder,
        timeRange: filters.timeRange !== 'all' ? filters.timeRange as any : undefined,
        isVerified,
        isFake,
        hasSummary: filters.hasSummary ? true : undefined,
      });
      
      if (append && data) {
        setData({
          ...result,
          data: [...data.data, ...result.data],
        });
      } else {
        setData(result);
      }
      
      setHasMore(pageNum < result.pagination.totalPages);
    } catch (error) {
      console.error('获取热点失败:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  // 加载更多
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHotspots(nextPage, true);
    }
  };
  
  // 无限滚动观察器
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // 只有在有数据且可能有更多数据时才设置观察器
    if (!data || !hasMore) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, data?.data.length]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({
      source: 'all',
      timeRange: 'all',
      heatLevel: 'all',
      verificationStatus: 'all',
      hasKeyword: false,
      hasSummary: false,
    });
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return filters.source !== 'all' ||
      filters.timeRange !== 'all' ||
       filters.heatLevel !== 'all' ||
       filters.verificationStatus !== 'all' ||
       filters.hasKeyword ||
       filters.hasSummary;
  }, [filters]);

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
  const sourceSet = new Set([...defaultSources, ...(data?.data.map(h => h.source) || [])]);
  const sources = ['all', ...Array.from(sourceSet)];

  const getVerificationBadge = (hotspot: Hotspot) => {
    if (hotspot.isVerified) {
      return <Badge variant="success" className="text-xs">已验证</Badge>;
    }
    if (hotspot.isFake) {
      return <Badge variant="danger" className="text-xs">疑似虚假</Badge>;
    }
    return null;
  };

  return (
    <MainLayout 
      title="热点列表"
      subtitle="发现各平台热门内容"
      actions={
        <div className="flex items-center gap-3">
          {/* 排序下拉菜单 */}
          <div ref={sortDropdownRef} className="relative">
            <div className="inline-flex items-center gap-1 font-medium rounded-lg transition-all duration-200 border border-border text-foreground hover:bg-card hover:border-border-light px-4 py-2 text-sm">
              <button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="inline-flex items-center gap-2 focus:outline-none"
              >
                <ArrowUpDown size={14} className="text-foreground-muted" />
                <span className="text-sm font-medium">
                  {sortOptions.find(o => o.value === sortBy)?.label}
                </span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); toggleSortOrder(); }}
                className="p-0.5 hover:bg-card-hover rounded transition-colors focus:outline-none"
              >
                <ChevronDown size={14} className={`text-foreground-muted transition-transform duration-200 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {sortDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 py-1.5 rounded-lg border border-border bg-card shadow-lg shadow-black/10 backdrop-blur-xl z-50 animate-fade-in">
                {sortOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => { setSortBy(option.value as SortOption); setSortDropdownOpen(false); setPage(1); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex items-center gap-2 ${
                        sortBy === option.value
                          ? 'text-primary bg-primary/10 font-medium'
                          : 'text-foreground hover:bg-card-hover'
                      }`}
                    >
                      <Icon size={14} />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 来源筛选 */}
          <div ref={sourceDropdownRef} className="relative">
            <button
              onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
              className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background border text-foreground hover:bg-card hover:border-border-light active:scale-[0.98] px-4 py-2 text-sm ${
                filters.source !== 'all' ? 'border-primary bg-primary/10' : 'border-border'
              }`}
            >
              <Globe size={14} className="text-foreground-muted" />
              <span className="text-sm font-medium">
                {filters.source === 'all' ? '所有来源' : filters.source}
              </span>
              <ChevronDown size={14} className={`text-foreground-muted transition-transform duration-200 ${sourceDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {sourceDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-36 py-1.5 rounded-lg border border-border bg-card shadow-lg shadow-black/10 backdrop-blur-xl z-50 animate-fade-in">
                <button
                  onClick={() => { setFilters({...filters, source: 'all'}); setSourceDropdownOpen(false); setPage(1); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                    filters.source === 'all'
                      ? 'text-primary bg-primary/10 font-medium'
                      : 'text-foreground hover:bg-card-hover'
                  }`}
                >
                  所有来源
                </button>
                {sources.filter(s => s !== 'all').map(source => (
                  <button
                    key={source}
                    onClick={() => { setFilters({...filters, source}); setSourceDropdownOpen(false); setPage(1); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                      filters.source === source
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

          {/* 筛选按钮 */}
          <Button 
            variant={hasActiveFilters ? "primary" : "outline"} 
            icon={<Filter size={16} />}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            筛选
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded">
                {[
                  filters.timeRange !== 'all',
                  filters.heatLevel !== 'all',
                  filters.verificationStatus !== 'all',
                  filters.hasSummary,
                ].filter(Boolean).length}
              </span>
            )}
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
          {/* 搜索框 */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-subtle" />
            <input
              type="text"
              placeholder="搜索热点标题或内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* 筛选面板 */}
          {showFilterPanel && (
            <Card className="p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">筛选条件</h3>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    <RotateCcw size={14} />
                    重置筛选
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 时间范围 */}
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2">时间范围</label>
                  <select
                    value={filters.timeRange}
                    onChange={(e) => { setFilters({...filters, timeRange: e.target.value as TimeRange}); setPage(1); }}
                    className="w-full px-3 py-2 rounded-lg bg-background-tertiary border border-border text-foreground focus:outline-none focus:border-primary/50 transition-all"
                  >
                    {timeRangeOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* 热度等级 */}
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2">热度等级</label>
                  <select
                    value={filters.heatLevel}
                    onChange={(e) => { setFilters({...filters, heatLevel: e.target.value}); setPage(1); }}
                    className="w-full px-3 py-2 rounded-lg bg-background-tertiary border border-border text-foreground focus:outline-none focus:border-primary/50 transition-all"
                  >
                    {heatLevelOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* 真实性状态 */}
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2">内容状态</label>
                  <select
                    value={filters.verificationStatus}
                    onChange={(e) => { setFilters({...filters, verificationStatus: e.target.value as VerificationStatus}); setPage(1); }}
                    className="w-full px-3 py-2 rounded-lg bg-background-tertiary border border-border text-foreground focus:outline-none focus:border-primary/50 transition-all"
                  >
                    {verificationOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* 内容属性 */}
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2">内容属性</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.hasSummary}
                        onChange={(e) => { setFilters({...filters, hasSummary: e.target.checked}); setPage(1); }}
                        className="w-4 h-4 rounded border-border bg-background-tertiary text-primary focus:ring-primary/50"
                      />
                      <span className="text-sm text-foreground">有AI摘要</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.hasKeyword}
                        onChange={(e) => { setFilters({...filters, hasKeyword: e.target.checked}); setPage(1); }}
                        className="w-4 h-4 rounded border-border bg-background-tertiary text-primary focus:ring-primary/50"
                      />
                      <span className="text-sm text-foreground">匹配关键词</span>
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* 当前筛选状态 */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-foreground-muted">当前筛选：</span>
              {filters.timeRange !== 'all' && (
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-card-hover"
                  onClick={() => setFilters({...filters, timeRange: 'all'})}
                >
                  {timeRangeOptions.find(o => o.value === filters.timeRange)?.label}
                  <X size={12} className="ml-1" />
                </Badge>
              )}
              {filters.heatLevel !== 'all' && (
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-card-hover"
                  onClick={() => setFilters({...filters, heatLevel: 'all'})}
                >
                  {heatLevelOptions.find(o => o.value === filters.heatLevel)?.label}
                  <X size={12} className="ml-1" />
                </Badge>
              )}
              {filters.verificationStatus !== 'all' && (
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-card-hover"
                  onClick={() => setFilters({...filters, verificationStatus: 'all'})}
                >
                  {verificationOptions.find(o => o.value === filters.verificationStatus)?.label}
                  <X size={12} className="ml-1" />
                </Badge>
              )}
              {filters.hasSummary && (
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-card-hover"
                  onClick={() => setFilters({...filters, hasSummary: false})}
                >
                  有AI摘要
                  <X size={12} className="ml-1" />
                </Badge>
              )}
              {filters.hasKeyword && (
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-card-hover"
                  onClick={() => setFilters({...filters, hasKeyword: false})}
                >
                  匹配关键词
                  <X size={12} className="ml-1" />
                </Badge>
              )}
            </div>
          )}

          {/* 热点列表 */}
          {data?.data.filter(hotspot => {
            if (!searchQuery) return true;
            return hotspot.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (hotspot.summary && hotspot.summary.toLowerCase().includes(searchQuery.toLowerCase()));
          }).length === 0 ? (
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
              {data?.data.filter(hotspot => {
                if (!searchQuery) return true;
                return hotspot.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (hotspot.summary && hotspot.summary.toLowerCase().includes(searchQuery.toLowerCase()));
              }).map((hotspot, index) => {
                const heatConfig = getHeatConfig(hotspot.heatScore);
                const hotspotNotifications = notifications.filter(n => n.hotspotId === hotspot.id);
                const unreadNotifications = hotspotNotifications.filter(n => !n.isRead);
                
                return (
                  <Card 
                    key={hotspot.id} 
                    hover
                    className={`p-5 animate-slide-up hotspot-item ${unreadNotifications.length > 0 ? 'border-primary/30' : ''}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => window.location.href = `/hotspots/${hotspot.id}`}
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
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {getVerificationBadge(hotspot)}
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
                              <IconButton
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
                          
                          {/* 分享按钮 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShareHotspot(hotspot);
                            }}
                            className="flex items-center gap-1 text-xs text-foreground-muted hover:text-primary transition-colors"
                          >
                            <Share2 size={12} />
                            <span>分享</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* 无限滚动加载触发器 */}
          <div ref={loadMoreRef} className="py-4 text-center">
            {loadingMore && (
              <div className="flex items-center justify-center gap-2 text-foreground-muted">
                <Loader2 size={18} className="animate-spin" />
                <span>加载更多...</span>
              </div>
            )}
            {!hasMore && data && data.data.length > 0 && (
              <span className="text-sm text-foreground-muted">没有更多数据了</span>
            )}
          </div>

          {/* 结果统计 */}
          {data && (
            <div className="text-center text-sm text-foreground-muted pt-4">
              共 {data.pagination.total} 条结果
              {hasMore && ' · 向下滚动加载更多'}
            </div>
          )}
        </div>
      )}
      
      {/* 分享弹窗 */}
      {shareHotspot && (
        <ShareCard
          isOpen={!!shareHotspot}
          onClose={() => setShareHotspot(null)}
          title={shareHotspot.title}
          source={shareHotspot.source}
          heatScore={shareHotspot.heatScore}
          summary={shareHotspot.summary ?? undefined}
        />
      )}
    </MainLayout>
  );
}
