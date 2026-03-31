'use client';

import { useState, useRef } from 'react';
import Card from './Card';
import Button from './Button';
import Badge from './Badge';
import { X, Download, Copy, Check } from 'lucide-react';
import { toPng } from 'html-to-image';

interface ShareCardProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  source: string;
  heatScore: number;
  summary?: string;
}

export default function ShareCard({
  isOpen,
  onClose,
  title,
  source,
  heatScore,
  summary,
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const getHeatLabel = (score: number) => {
    if (score >= 80) return '火爆';
    if (score >= 60) return '热门';
    if (score >= 40) return '上升';
    return '新发现';
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;

    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `hotspot-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('生成图片失败:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    const text = `${title}\n\n来源: ${source}\n热度: ${heatScore}° (${getHeatLabel(heatScore)})\n\n${summary || ''}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">分享热点</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-card transition-colors"
          >
            <X size={18} className="text-foreground-muted" />
          </button>
        </div>

        {/* 预览卡片 */}
        <div
          ref={cardRef}
          className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white text-xs font-bold">H</span>
              </div>
              <span className="text-sm font-medium text-foreground">热点监控</span>
            </div>
            <Badge variant="primary">{getHeatLabel(heatScore)}</Badge>
          </div>

          <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-3">
            {title}
          </h3>

          {summary && (
            <p className="text-sm text-foreground-muted mb-4 line-clamp-3">
              {summary}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-foreground-muted">
            <span>来源: {source}</span>
            <span className="text-accent-orange font-medium">{heatScore}°</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            icon={copied ? <Check size={16} /> : <Copy size={16} />}
            onClick={handleCopy}
          >
            {copied ? '已复制' : '复制文本'}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            icon={<Download size={16} />}
            onClick={handleDownload}
            loading={downloading}
          >
            下载图片
          </Button>
        </div>
      </Card>
    </div>
  );
}
