'use client';

import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Badge, { HeatBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/Input';
import { ExternalLink, Clock, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api, Hotspot, PaginatedResponse } from '@/lib/api';

export default function HotspotsPage() {
  const [data, setData] = useState<PaginatedResponse<Hotspot> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchHotspots();
  }, [page]);

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

  const filteredHotspots = data?.data.filter(h =>
    h.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <MainLayout 
      title="热点列表"
      subtitle="查看所有监控到的热点信息"
      actions={
        <Button variant="outline" icon={<Filter size={18} />}>
          筛选
        </Button>
      }
    >
      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <SearchInput 
              placeholder="搜索热点..." 
              value={searchQuery}
              onChange={setSearchQuery}
              className="w-64"
            />
            <div className="flex items-center gap-2">
              <Badge variant="default">共 {data?.pagination.total || 0} 条</Badge>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-foreground-muted">加载中...</div>
          ) : filteredHotspots.length === 0 ? (
            <div className="text-center py-8 text-foreground-muted">
              暂无热点数据
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHotspots.map((hotspot) => (
                <div 
                  key={hotspot.id}
                  className="p-4 bg-background-secondary rounded-lg border border-border hover:border-border-light transition-all"
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
                        {hotspot.isFake && (
                          <Badge variant="danger">虚假信息</Badge>
                        )}
                      </div>
                      <h4 className="text-foreground font-medium mb-2">
                        {hotspot.title}
                      </h4>
                      {hotspot.summary && (
                        <p className="text-foreground-muted text-sm mb-2">
                          {hotspot.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-foreground-muted">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(hotspot.createdAt).toLocaleString('zh-CN')}
                        </span>
                        {hotspot.keywordsMatched && (
                          <span>匹配关键词: {hotspot.keywordsMatched}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
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

          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronLeft size={16} />}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <span className="text-foreground-muted text-sm">
                第 {page} / {data.pagination.totalPages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronRight size={16} />}
                onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
              >
                下一页
              </Button>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
