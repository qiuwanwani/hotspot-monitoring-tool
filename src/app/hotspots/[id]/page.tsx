'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { HeatTrendMiniChart } from '@/components/charts';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  ExternalLink,
  Heart,
  Share2,
  TrendingUp,
  Clock,
  Globe,
  Tag,
  Flame,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface HotspotDetail {
  id: string;
  title: string;
  content?: string | null;
  summary?: string | null;
  source: string;
  sourceUrl?: string | null;
  category?: string | null;
  heatScore: number;
  isVerified: boolean;
  isFake: boolean;
  fakeReason?: string | null;
  keywordsMatched?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  keywords: { id: string; keyword: string; category?: string | null }[];
  heatHistory: { heatScore: number; recordedAt: string }[];
  _count: { favorites: number };
  relatedHotspots: {
    id: string;
    title: string;
    heatScore: number;
    source: string;
    createdAt: string;
  }[];
}

export default function HotspotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [hotspot, setHotspot] = useState<HotspotDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [displayedSummary, setDisplayedSummary] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    fetchHotspotDetail();
  }, [params.id]);

  const fetchHotspotDetail = async () => {
    try {
      setLoading(true);
      const data = await api.getHotspot(params.id as string);
      // 确保数据包含所有必需字段
      const detailData: HotspotDetail = {
        ...data,
        keywords: data.keywords || [],
        heatHistory: data.heatHistory || [],
        _count: data._count || { favorites: 0 },
        relatedHotspots: [], // TODO: 从API获取相关热点
      };
      setHotspot(detailData);
      setFavoriteCount(detailData._count.favorites);
      // TODO: 检查当前用户是否已收藏
    } catch (error) {
      console.error('获取热点详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    try {
      if (isFavorited) {
        await api.deleteFavorite(params.id as string);
        setIsFavorited(false);
        setFavoriteCount((prev) => prev - 1);
      } else {
        await api.addFavorite(params.id as string);
        setIsFavorited(true);
        setFavoriteCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: hotspot?.title || '',
          text: hotspot?.summary || undefined,
          url: window.location.href,
        });
      } catch (error) {
        console.log('分享取消');
      }
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
    }
  };

  // 打字机效果
  const typeWriter = (text: string, speed: number = 30) => {
    setIsTyping(true);
    setDisplayedSummary('');
    let index = 0;
    
    const type = () => {
      if (index < text.length) {
        setDisplayedSummary(text.substring(0, index + 1));
        index++;
        setTimeout(type, speed);
      } else {
        setIsTyping(false);
      }
    };
    
    type();
  };

  const handleGenerateSummary = async () => {
    if (hotspot?.summary || generatingSummary) return;

    try {
      setGeneratingSummary(true);
      const response = await fetch(`/api/hotspots/${params.id}/summary`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setHotspot((prev) => prev ? { ...prev, summary: data.summary } : null);
        // 使用打字机效果展示生成的摘要
        typeWriter(data.summary, 30);
      } else {
        const error = await response.json();
        alert(error.error || '生成摘要失败');
      }
    } catch (error) {
      console.error('生成摘要失败:', error);
      alert('生成摘要失败，请稍后重试');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getHeatConfig = (score: number) => {
    if (score >= 80)
      return { label: '火爆', color: 'text-accent-red', bg: 'bg-accent-red/10' };
    if (score >= 60)
      return {
        label: '热门',
        color: 'text-accent-orange',
        bg: 'bg-accent-orange/10',
      };
    if (score >= 40)
      return {
        label: '上升',
        color: 'text-accent-yellow',
        bg: 'bg-accent-yellow/10',
      };
    return {
      label: '新发现',
      color: 'text-accent-green',
      bg: 'bg-accent-green/10',
    };
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!hotspot) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-foreground-muted">热点不存在或已被删除</p>
          <Button variant="primary" className="mt-4" onClick={() => router.push('/hotspots')}>
            返回热点列表
          </Button>
        </div>
      </MainLayout>
    );
  }

  const heatConfig = getHeatConfig(hotspot.heatScore);

  return (
    <MainLayout
      title="热点详情"
      subtitle="查看热点详细信息和相关推荐"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Share2 size={16} />} onClick={handleShare}>
            分享
          </Button>
          <Button
            variant={isFavorited ? 'primary' : 'outline'}
            size="sm"
            icon={<Heart size={16} className={isFavorited ? 'fill-current' : ''} />}
            onClick={handleFavorite}
          >
            {isFavorited ? '已收藏' : '收藏'} ({favoriteCount})
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 返回按钮 */}
        <button
          onClick={() => router.push('/hotspots')}
          className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
          <span>返回列表</span>
        </button>

        {/* 主要内容 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：热点详情 */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              {/* 标题和热度 */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-2xl font-bold text-foreground">{hotspot.title}</h1>
                <div className={`flex-shrink-0 px-4 py-2 rounded-xl ${heatConfig.bg} text-center`}>
                  <div className={`text-2xl font-bold ${heatConfig.color}`}>{hotspot.heatScore}</div>
                  <div className={`text-xs ${heatConfig.color}`}>{heatConfig.label}</div>
                </div>
              </div>

              {/* 元信息 */}
              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-foreground-muted">
                <div className="flex items-center gap-1">
                  <Globe size={14} />
                  <span>{hotspot.source}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>发布于 {formatTime(hotspot.publishedAt || hotspot.createdAt)}</span>
                </div>
                {hotspot.category && (
                  <div className="flex items-center gap-1">
                    <Tag size={14} />
                    <span>{hotspot.category}</span>
                  </div>
                )}
              </div>

              {/* 验证状态 */}
              {hotspot.isVerified && (
                <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-accent-green/10 text-accent-green">
                  <CheckCircle size={18} />
                  <span>此内容已通过验证</span>
                </div>
              )}
              {hotspot.isFake && (
                <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-accent-red/10 text-accent-red">
                  <AlertTriangle size={18} />
                  <span>此内容被标记为疑似虚假：{hotspot.fakeReason}</span>
                </div>
              )}

              {/* 摘要 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground-muted mb-2 flex items-center gap-2">
                  <Sparkles size={14} />
                  AI摘要
                </h3>
                {hotspot.summary ? (
                  <p className="text-foreground leading-relaxed bg-card-hover p-4 rounded-xl min-h-[60px]">
                    {isTyping ? displayedSummary : hotspot.summary}
                    {isTyping && (
                      <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
                    )}
                  </p>
                ) : (
                  <button
                    onClick={handleGenerateSummary}
                    disabled={generatingSummary}
                    className="w-full text-left bg-card-hover hover:bg-card p-4 rounded-xl border border-dashed border-border hover:border-primary/50 transition-all group"
                  >
                    <div className="flex items-center justify-center gap-2 text-foreground-muted group-hover:text-primary transition-colors">
                      {generatingSummary ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>AI正在生成摘要...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          <span>点击生成AI摘要</span>
                        </>
                      )}
                    </div>
                  </button>
                )}
              </div>

              {/* 正文内容 */}
              {hotspot.content && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-foreground-muted mb-2">详细内容</h3>
                  <div 
                    className="text-foreground leading-relaxed prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: hotspot.content }}
                  />
                </div>
              )}

              {/* 外部链接 */}
              {hotspot.sourceUrl && (
                <a
                  href={hotspot.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                >
                  <ExternalLink size={16} />
                  <span>查看原文</span>
                </a>
              )}
            </Card>

            {/* 热度趋势 */}
            {hotspot.heatHistory.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary" />
                  热度趋势（24小时）
                </h3>
                <HeatTrendMiniChart data={hotspot.heatHistory} />
              </Card>
            )}
          </div>

          {/* 右侧：侧边栏 */}
          <div className="space-y-6">
            {/* 关键词匹配 */}
            {hotspot.keywords.length > 0 && (
              <Card className="p-6">
                <h3 className="text-sm font-medium text-foreground-muted mb-4 flex items-center gap-2">
                  <Tag size={14} />
                  匹配的关键词
                </h3>
                <div className="flex flex-wrap gap-2">
                  {hotspot.keywords.map((keyword) => (
                    <Badge key={keyword.id} variant="secondary">
                      {keyword.keyword}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* 相关热点推荐 */}
            {hotspot.relatedHotspots.length > 0 && (
              <Card className="p-6">
                <h3 className="text-sm font-medium text-foreground-muted mb-4 flex items-center gap-2">
                  <Flame size={14} />
                  相关热点
                </h3>
                <div className="space-y-3">
                  {hotspot.relatedHotspots.map((related) => (
                    <button
                      key={related.id}
                      onClick={() => router.push(`/hotspots/${related.id}`)}
                      className="w-full text-left p-3 rounded-lg bg-card-hover hover:bg-card transition-colors group"
                    >
                      <p className="text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {related.title}
                      </p>
                      <div className="flex items-center justify-between text-xs text-foreground-muted">
                        <span>{related.source}</span>
                        <span className="text-accent-orange">{related.heatScore}°</span>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
