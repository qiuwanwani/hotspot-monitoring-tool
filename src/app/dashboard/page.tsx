'use client';

import MainLayout from '@/components/layout/MainLayout';
import Card, { StatCard } from '@/components/ui/Card';
import Badge, { HeatBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/Input';
import { Flame, TrendingUp, Bell, Eye, ExternalLink, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api, Keyword, Hotspot } from '@/lib/api';

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
  const todayHotspots = hotspots.filter(h => {
    const today = new Date();
    const created = new Date(h.createdAt);
    return created.toDateString() === today.toDateString();
  }).length;

  return (
    <MainLayout 
      title="仪表盘"
      subtitle="实时监控热点动态"
      actions={
        <Button icon={<Eye size={18} />} onClick={fetchData}>
          刷新数据
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="监控关键词"
            value={keywords.length}
            icon={<Flame size={24} />}
          />
          <StatCard
            title="今日热点"
            value={todayHotspots}
            icon={<TrendingUp size={24} />}
          />
          <StatCard
            title="活跃关键词"
            value={activeKeywords}
            icon={<Bell size={24} />}
          />
          <StatCard
            title="总热点数"
            value={hotspots.length}
            icon={<Eye size={24} />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">最新热点</h3>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/hotspots'}>
                  查看全部
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-8 text-foreground-muted">加载中...</div>
              ) : hotspots.length === 0 ? (
                <div className="text-center py-8 text-foreground-muted">
                  暂无热点数据，请先添加关键词
                </div>
              ) : (
                <div className="space-y-3">
                  {hotspots.map((hotspot) => (
                    <div 
                      key={hotspot.id}
                      className="p-4 bg-background-secondary rounded-lg border border-border hover:border-border-light transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {hotspot.category && (
                              <Badge variant="info">{hotspot.category}</Badge>
                            )}
                            <Badge variant="default">{hotspot.source}</Badge>
                            {hotspot.isVerified && (
                              <Badge variant="success">已验证</Badge>
                            )}
                          </div>
                          <h4 className="text-foreground font-medium mb-1">
                            {hotspot.title}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-foreground-muted">
                            <Clock size={14} />
                            <span>{new Date(hotspot.createdAt).toLocaleString('zh-CN')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <HeatBadge score={hotspot.heatScore} />
                          {hotspot.sourceUrl && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              icon={<ExternalLink size={16} />}
                              onClick={() => window.open(hotspot.sourceUrl!, '_blank')}
                            >
                              查看
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">监控关键词</h3>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/keywords'}>
                  管理
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-4 text-foreground-muted">加载中...</div>
              ) : keywords.length === 0 ? (
                <div className="text-center py-4 text-foreground-muted">
                  暂无关键词
                </div>
              ) : (
                <div className="space-y-2">
                  {keywords.slice(0, 5).map((kw) => (
                    <div 
                      key={kw.id}
                      className="flex items-center justify-between p-3 bg-background-secondary rounded-lg border border-border"
                    >
                      <div>
                        <p className="text-foreground font-medium">{kw.keyword}</p>
                        {kw.category && (
                          <p className="text-sm text-foreground-muted">{kw.category}</p>
                        )}
                      </div>
                      <div className={`w-2 h-2 rounded-full ${kw.isActive ? 'bg-accent-green' : 'bg-foreground-subtle'}`} />
                    </div>
                  ))}
                </div>
              )}
              
              <Button variant="outline" className="w-full mt-4" onClick={() => window.location.href = '/keywords'}>
                管理关键词
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
