'use client';

import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Card, { StatCard, HotspotCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { PulsingDot, AnimatedGradientText } from '@/components/ui/Motion';
import { api, Keyword, Hotspot } from '@/lib/api';
import { HotspotTrendChart, SourceDistributionChart, HeatLevelChart } from '@/components/charts';
import { 
  TrendingUp, 
  Search, 
  Bell, 
  Flame,
  ArrowRight,
  Clock,
  Sparkles,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Database,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

// 骨架屏组件
const SkeletonCard = () => (
  <div className="p-6 rounded-2xl bg-card animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-background-tertiary" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-24 bg-background-tertiary rounded" />
        <div className="h-6 w-16 bg-background-tertiary rounded" />
      </div>
    </div>
  </div>
);

const SkeletonHotspot = () => (
  <div className="p-4 rounded-xl bg-card-hover animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-background-tertiary flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-background-tertiary rounded" />
        <div className="h-3 w-1/2 bg-background-tertiary rounded" />
      </div>
    </div>
  </div>
);

const SkeletonKeyword = () => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary/50 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-background-tertiary" />
      <div className="h-4 w-20 bg-background-tertiary rounded" />
    </div>
    <div className="h-5 w-12 bg-background-tertiary rounded" />
  </div>
);

// 优化的时间格式化函数
const formatTime = (dateString: string | null) => {
  if (!dateString) return '从未';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
};

// 关键词项组件
const KeywordItem = React.memo(({ keyword }: { keyword: Keyword }) => (
  <div 
    className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary/50 hover:bg-background-tertiary transition-colors"
  >
    <div className="flex items-center gap-3">
      <PulsingDot className={keyword.isActive ? '' : 'opacity-0'} />
      <span className="text-foreground font-medium">{keyword.keyword}</span>
    </div>
    <Badge variant={keyword.isActive ? 'success' : 'default'}>
      {keyword.isActive ? '活跃' : '暂停'}
    </Badge>
  </div>
));

// 热点项组件
const HotspotItem = React.memo(({ hotspot }: { hotspot: Hotspot }) => (
  <HotspotCard
    key={hotspot.id}
    title={hotspot.title}
    source={hotspot.source}
    heatScore={hotspot.heatScore}
    time={formatTime(hotspot.publishedAt)}
    category={hotspot.category || undefined}
  />
));

interface MonitorStatus {
  dataSources: Array<{
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    lastFetchedAt: string | null;
    status: string;
  }>;
  recentLogs: Array<{
    id: string;
    level: string;
    message: string;
    createdAt: string;
  }>;
  stats: {
    todayHotspots: number;
    totalHotspots: number;
    activeDataSources: number;
    totalDataSources: number;
  };
  isFetching: boolean;
}

export default function DashboardPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [hotspotStats, setHotspotStats] = useState<{ total: number; today: number }>({ total: 0, today: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState({ keywords: false, hotspots: false });

  // 监控状态
  const [monitorStatus, setMonitorStatus] = useState<MonitorStatus | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState<string | null>(null);

  useEffect(() => {
    // 首次加载显示 loading
    fetchData(true);
    fetchMonitorStatus();

    // 每30秒自动刷新数据（不显示 loading）
    const interval = setInterval(() => {
      fetchData(false);
      fetchMonitorStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async (showLoading = false) => {
    try {
      // 只在手动刷新时显示 loading，自动刷新不显示避免页面闪烁
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      // 使用 Promise.all 并行获取数据，减少等待时间
      const [keywordsData, hotspotsData, statsData] = await Promise.all([
        api.getKeywords(),
        api.getHotspots({ limit: 5 }),
        api.getHotspotStats()
      ]);

      setKeywords(keywordsData);
      setDataLoaded(prev => ({ ...prev, keywords: true }));

      setHotspots(hotspotsData.data);
      setDataLoaded(prev => ({ ...prev, hotspots: true }));

      setHotspotStats(statsData);
    } catch (error) {
      console.error('获取数据失败:', error);
      setError('获取数据失败，请稍后重试');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // 获取监控状态
  const fetchMonitorStatus = async () => {
    try {
      const response = await fetch('/api/monitor/status');
      if (response.ok) {
        const data = await response.json();
        setMonitorStatus(data);
      }
    } catch (error) {
      console.error('获取监控状态失败:', error);
    }
  };

  // 手动触发数据获取
  const handleManualFetch = async () => {
    try {
      setIsFetching(true);
      setFetchMessage('正在获取数据...');
      
      const response = await fetch('/api/monitor/fetch', {
        method: 'POST',
      });
      
      if (response.ok) {
        setFetchMessage('数据获取已启动，请稍后刷新查看结果');
        // 5秒后刷新状态
        setTimeout(() => {
          fetchMonitorStatus();
          fetchData(false);
        }, 5000);
      } else {
        const error = await response.json();
        setFetchMessage(error.error || '获取失败');
      }
    } catch (error) {
      console.error('触发数据获取失败:', error);
      setFetchMessage('触发失败，请重试');
    } finally {
      setTimeout(() => setIsFetching(false), 2000);
      setTimeout(() => setFetchMessage(null), 5000);
    }
  };

  // 使用useMemo缓存计算结果
  const activeKeywords = useMemo(() => {
    return keywords.filter(k => k.isActive).length;
  }, [keywords]);

  // 使用实际的热点统计数据
  const totalHotspots = hotspotStats.total;

  const totalNotifications = useMemo(() => {
    return keywords.reduce((sum, k) => sum + (k._count?.notifications || 0), 0);
  }, [keywords]);

  const averageHeatScore = useMemo(() => {
    return hotspots.length > 0 
      ? Math.round(hotspots.reduce((sum, h) => sum + h.heatScore, 0) / hotspots.length)
      : 0;
  }, [hotspots]);

  const currentTime = useMemo(() => {
    return formatTime(new Date().toISOString());
  }, []);

  // 从热点数据计算实际的数据源数量
  const dataSourceCount = useMemo(() => {
    const sources = new Set(hotspots.map(h => h.source));
    return sources.size;
  }, [hotspots]);

  if (loading) {
    return (
      <MainLayout 
        title="仪表盘"
        subtitle="实时监控热点动态"
      >
        <div className="space-y-8 animate-fade-in">
          {/* 统计卡片骨架屏 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 热点列表骨架屏 */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent-orange/10">
                      <Flame size={20} className="text-accent-orange" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">最新热点</h3>
                      <p className="text-sm text-foreground-muted">实时热门内容</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <SkeletonHotspot />
                  <SkeletonHotspot />
                  <SkeletonHotspot />
                  <SkeletonHotspot />
                  <SkeletonHotspot />
                </div>
              </Card>
            </div>

            {/* 关键词和状态骨架屏 */}
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Search size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">关键词</h3>
                    <p className="text-sm text-foreground-muted">监控列表</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <SkeletonKeyword />
                  <SkeletonKeyword />
                  <SkeletonKeyword />
                  <SkeletonKeyword />
                  <SkeletonKeyword />
                </div>
              </Card>

              <Card className="p-6 glow-border">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-green/10 text-accent-green text-sm font-medium mb-4">
                    <PulsingDot />
                    系统启动中
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    正在 <AnimatedGradientText>加载数据</AnimatedGradientText>
                  </h3>
                  <div className="space-y-3 text-sm text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted">系统状态</span>
                      <span className="text-accent-green font-medium">运行中</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted">数据加载</span>
                      <span className="text-foreground">请稍候...</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout 
        title="仪表盘"
        subtitle="实时监控热点动态"
        actions={
          <Button 
            variant="primary"
            icon={<Sparkles size={16} />}
            onClick={fetchData}
          >
            重新加载
          </Button>
        }
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent-red/10 flex items-center justify-center">
              <span className="text-accent-red text-2xl">!</span>
            </div>
            <p className="text-foreground-muted">{error}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="仪表盘"
      subtitle="实时监控热点动态"
      actions={
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost"
            icon={<Bell size={16} />}
            className="relative"
            onClick={() => window.location.href = '/notifications'}
          >
            {totalNotifications > 0 && (
              <Badge 
                variant="danger" 
                className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center p-0"
              >
                {totalNotifications}
              </Badge>
            )}
          </Button>
          <Button 
            variant="primary"
            icon={<Sparkles size={16} />}
            onClick={() => window.location.href = '/keywords'}
          >
            添加关键词
          </Button>
        </div>
      }
    >
      <div className="space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="活跃关键词"
            value={activeKeywords}
            icon={<Search size={20} />}
            color="primary"
            change={0}
            trend="up"
          />
          <StatCard
            title="热点总数"
            value={totalHotspots}
            icon={<Flame size={20} />}
            color="orange"
            change={0}
            trend="up"
          />
          <StatCard
            title="通知数"
            value={totalNotifications}
            icon={<Bell size={20} />}
            color="secondary"
            change={totalNotifications > 0 ? 0 : 0}
            trend="up"
          />
          <StatCard
            title="平均热度"
            value={averageHeatScore}
            icon={<TrendingUp size={20} />}
            color="green"
            change={averageHeatScore > 0 ? 0 : 0}
            trend="up"
          />
        </div>

        {/* 数据可视化图表 - 仅在有数据时显示 */}
        {hotspots.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">热点趋势</h3>
                  <p className="text-sm text-foreground-muted">近7天热点数量和平均热度</p>
                </div>
              </div>
              <HotspotTrendChart hotspots={hotspots} days={7} />
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-accent-orange/10">
                  <PieChart size={20} className="text-accent-orange" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">来源分布</h3>
                  <p className="text-sm text-foreground-muted">各数据源占比</p>
                </div>
              </div>
              <SourceDistributionChart hotspots={hotspots} />
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-accent-green/10">
                  <BarChart3 size={20} className="text-accent-green" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">热度分布</h3>
                  <p className="text-sm text-foreground-muted">热点热度等级统计</p>
                </div>
              </div>
              <HeatLevelChart hotspots={hotspots} />
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent-orange/10">
                    <Flame size={20} className="text-accent-orange" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">最新热点</h3>
                    <p className="text-sm text-foreground-muted">实时热门内容</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.location.href = '/hotspots'}
                >
                  查看全部
                  <ArrowRight size={14} />
                </Button>
              </div>

              <div className="space-y-3">
                {hotspots.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-card-hover mx-auto mb-4 flex items-center justify-center">
                      <Flame size={24} className="text-foreground-subtle" />
                    </div>
                    <p className="text-foreground-muted">暂无热点</p>
                    <p className="text-sm text-foreground-subtle mt-1">
                      添加关键词开始监控
                    </p>
                  </div>
                ) : (
                  hotspots.map((hotspot) => (
                    <HotspotItem key={hotspot.id} hotspot={hotspot} />
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Search size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">关键词</h3>
                  <p className="text-sm text-foreground-muted">监控列表</p>
                </div>
              </div>

              <div className="space-y-2">
                {keywords.slice(0, 5).map((keyword) => (
                  <KeywordItem key={keyword.id} keyword={keyword} />
                ))}
              </div>

              {keywords.length > 5 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-4"
                  onClick={() => window.location.href = '/keywords'}
                >
                  查看全部关键词
                </Button>
              )}
            </Card>

            {/* 系统状态卡片 */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent-green/10">
                    <Database size={20} className="text-accent-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">系统状态</h3>
                    <p className="text-sm text-foreground-muted">监控与数据获取</p>
                  </div>
                </div>
                {monitorStatus?.isFetching && (
                  <div className="flex items-center gap-2 text-accent-orange text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    <span>获取中...</span>
                  </div>
                )}
              </div>

              {/* 数据源状态 */}
              <div className="space-y-2 mb-4">
                <div className="text-sm font-medium text-foreground-muted mb-2">数据源状态</div>
                {monitorStatus?.dataSources.slice(0, 5).map((ds) => (
                  <div key={ds.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{ds.name}</span>
                    <div className="flex items-center gap-2">
                      {ds.isActive ? (
                        <CheckCircle size={14} className="text-accent-green" />
                      ) : (
                        <XCircle size={14} className="text-foreground-subtle" />
                      )}
                      <span className={ds.isActive ? 'text-accent-green' : 'text-foreground-subtle'}>
                        {ds.isActive ? '活跃' : '禁用'}
                      </span>
                    </div>
                  </div>
                ))}
                {(monitorStatus?.dataSources.length || 0) > 5 && (
                  <div className="text-xs text-foreground-subtle text-center">
                    还有 {(monitorStatus?.dataSources.length || 0) - 5} 个数据源...
                  </div>
                )}
              </div>

              {/* 统计数据 */}
              <div className="space-y-2 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">今日获取</span>
                  <span className="text-foreground font-medium">
                    {monitorStatus?.stats.todayHotspots || 0} 条
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">累计热点</span>
                  <span className="text-foreground font-medium">
                    {monitorStatus?.stats.totalHotspots || 0} 条
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">活跃数据源</span>
                  <span className="text-foreground font-medium">
                    {monitorStatus?.stats.activeDataSources || 0} / {monitorStatus?.stats.totalDataSources || 0}
                  </span>
                </div>
              </div>

              {/* 手动获取按钮 */}
              <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  icon={isFetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  onClick={handleManualFetch}
                  disabled={isFetching || monitorStatus?.isFetching}
                >
                  {isFetching || monitorStatus?.isFetching ? '获取中...' : '立即获取热点'}
                </Button>
                {fetchMessage && (
                  <div className="text-xs text-center text-foreground-muted">
                    {fetchMessage}
                  </div>
                )}
              </div>

              {/* 最近日志 */}
              {monitorStatus?.recentLogs && monitorStatus.recentLogs.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="text-sm font-medium text-foreground-muted mb-2">最近活动</div>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {monitorStatus.recentLogs.slice(0, 3).map((log) => (
                      <div key={log.id} className="text-xs text-foreground-subtle truncate">
                        <span className={
                          log.level === 'error' ? 'text-accent-red' :
                          log.level === 'warn' ? 'text-accent-orange' :
                          'text-foreground-subtle'
                        }>
                          [{log.level.toUpperCase()}]
                        </span>{' '}
                        {log.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
