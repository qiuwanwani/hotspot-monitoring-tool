'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Card, { StatCard, HotspotCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { PulsingDot, AnimatedGradientText } from '@/components/ui/Motion';
import { api, Keyword, Hotspot } from '@/lib/api';
import { 
  TrendingUp, 
  Search, 
  Bell, 
  Flame,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';

export default function DashboardPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [keywordsData, hotspotsData] = await Promise.all([
        api.getKeywords(),
        api.getHotspots({ limit: 5 })
      ]);
      setKeywords(keywordsData);
      setHotspots(hotspotsData.data);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeKeywords = keywords.filter(k => k.isActive).length;
  const totalHotspots = hotspots.length;
  const totalNotifications = keywords.reduce((sum, k) => sum + (k._count?.notifications || 0), 0);
  const averageHeatScore = hotspots.length > 0 
    ? Math.round(hotspots.reduce((sum, h) => sum + h.heatScore, 0) / hotspots.length)
    : 0;

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

  return (
    <MainLayout 
      title="仪表盘"
      subtitle="实时监控热点动态"
      actions={
        <Button 
          variant="primary"
          icon={<Sparkles size={16} />}
          onClick={() => window.location.href = '/keywords'}
        >
          添加关键词
        </Button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-foreground-muted">加载中...</p>
          </div>
        </div>
      ) : (
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
                    hotspots.map((hotspot, index) => (
                      <HotspotCard
                        key={hotspot.id}
                        title={hotspot.title}
                        source={hotspot.source}
                        heatScore={hotspot.heatScore}
                        time={formatTime(hotspot.publishedAt)}
                        category={hotspot.keyword?.keyword}
                      />
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
                    <div 
                      key={keyword.id}
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

              <Card className="p-6 glow-border">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-green/10 text-accent-green text-sm font-medium mb-4">
                    <PulsingDot />
                    实时监控中
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    系统 <AnimatedGradientText>运行中</AnimatedGradientText>
                  </h3>
                  <div className="space-y-3 text-sm text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted">系统状态</span>
                      <span className="text-accent-green font-medium">运行中</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted">监控服务</span>
                      <span className="text-accent-green font-medium">活跃</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted">最近更新</span>
                      <span className="text-foreground">{formatTime(new Date().toISOString())}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted">监控关键词</span>
                      <span className="text-foreground">{activeKeywords} 个</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted">数据源</span>
                      <span className="text-foreground">3 个</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted">热点总数</span>
                      <span className="text-foreground">{totalHotspots} 条</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = '/hotspots'}
                    >
                      查看热点
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
