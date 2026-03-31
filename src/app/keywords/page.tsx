'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import { PulsingDot } from '@/components/ui/Motion';
import { api, Keyword } from '@/lib/api';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Clock,
  Filter,
  X,
  Sparkles
} from 'lucide-react';

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [formData, setFormData] = useState({
    keyword: '',
    category: '',
    checkInterval: 30,
  });

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    try {
      setLoading(true);
      const data = await api.getKeywords();
      setKeywords(data);
    } catch (error) {
      console.error('获取关键词失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await api.createKeyword({
        keyword: formData.keyword,
        category: formData.category || undefined,
        checkInterval: formData.checkInterval,
      });
      setShowModal(false);
      setFormData({ keyword: '', category: '', checkInterval: 30 });
      await fetchKeywords();
      // 立即触发数据获取（通过API）
      try {
        await fetch('/api/monitor/fetch', {
          method: 'POST',
        });
      } catch (error) {
        console.log('数据获取可能需要等待监控服务初始化:', error);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUpdate = async () => {
    if (!editingKeyword) return;
    try {
      await api.updateKeyword(editingKeyword.id, {
        keyword: formData.keyword,
        category: formData.category || undefined,
        checkInterval: formData.checkInterval,
      });
      setShowModal(false);
      setEditingKeyword(null);
      setFormData({ keyword: '', category: '', checkInterval: 30 });
      await fetchKeywords();
      // 立即触发数据获取（通过API）
      try {
        await fetch('/api/monitor/fetch', {
          method: 'POST',
        });
      } catch (error) {
        console.log('数据获取可能需要等待监控服务初始化:', error);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleToggle = async (keyword: Keyword) => {
    try {
      await api.updateKeyword(keyword.id, { isActive: !keyword.isActive });
      await fetchKeywords();
      // 立即触发数据获取（通过API）
      try {
        await fetch('/api/monitor/fetch', {
          method: 'POST',
        });
      } catch (error) {
        console.log('数据获取可能需要等待监控服务初始化:', error);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteKeyword(id);
      await fetchKeywords();
      // 立即触发数据获取（通过API）
      try {
        await fetch('/api/monitor/fetch', {
          method: 'POST',
        });
      } catch (error) {
        console.log('数据获取可能需要等待监控服务初始化:', error);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const openEditModal = (keyword: Keyword) => {
    setEditingKeyword(keyword);
    setFormData({
      keyword: keyword.keyword,
      category: keyword.category || '',
      checkInterval: keyword.checkInterval,
    });
    setShowModal(true);
  };

  const filteredKeywords = keywords.filter(k => 
    k.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (k.category && k.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <MainLayout 
      title="关键词管理"
      subtitle="管理您的监控关键词"
      actions={
        <Button 
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            setEditingKeyword(null);
            setFormData({ keyword: '', category: '', checkInterval: 30 });
            setShowModal(true);
          }}
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
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-subtle" />
              <input
                type="text"
                placeholder="搜索关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
            <Button variant="outline" icon={<Filter size={16} />}>
              筛选
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredKeywords.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-card-hover mx-auto mb-4 flex items-center justify-center">
                  <Search size={24} className="text-foreground-subtle" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">暂无关键词</h3>
                <p className="text-foreground-muted mb-6">
                  {searchQuery ? '尝试其他搜索词' : '添加第一个关键词开始监控'}
                </p>
                {!searchQuery && (
                  <Button 
                    variant="primary"
                    icon={<Sparkles size={16} />}
                    onClick={() => setShowModal(true)}
                  >
                    添加第一个关键词
                  </Button>
                )}
              </Card>
            ) : (
              filteredKeywords.map((keyword, index) => (
                <Card 
                  key={keyword.id} 
                  hover 
                  className="p-5 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`p-3 rounded-xl ${keyword.isActive ? 'bg-primary/10' : 'bg-background-tertiary'}`}>
                        <PulsingDot className={keyword.isActive ? '' : 'opacity-0'} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-foreground truncate">{keyword.keyword}</h3>
                          <StatusBadge status={keyword.isActive ? 'active' : 'inactive'} />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-foreground-muted">
                          {keyword.category && (
                            <Badge variant="secondary">{keyword.category}</Badge>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>每 {keyword.checkInterval} 分钟</span>
                          </div>
                          <span>热点数: {keyword._count?.hotspots || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(keyword)}
                      >
                        {keyword.isActive ? '暂停' : '启用'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(keyword)}
                        icon={<Edit2 size={14} />}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(keyword.id)}
                        className="text-accent-red hover:text-accent-red"
                        icon={<Trash2 size={14} />}
                      />
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => {
              setShowModal(false);
              setEditingKeyword(null);
            }}
          />
          <Card className="relative w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">
                {editingKeyword ? '编辑关键词' : '添加关键词'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingKeyword(null);
                }}
                className="p-2 rounded-lg hover:bg-card transition-colors"
              >
                <X size={18} className="text-foreground-muted" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  关键词
                </label>
                <input
                  type="text"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                  placeholder="例如：AI、比特币、科技新闻"
                  className="w-full px-4 py-3 rounded-xl bg-background-tertiary border border-border text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  分类（可选）
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="例如：科技、金融"
                  className="w-full px-4 py-3 rounded-xl bg-background-tertiary border border-border text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  检查间隔（分钟）
                </label>
                <input
                  type="number"
                  value={formData.checkInterval}
                  onChange={(e) => setFormData({ ...formData, checkInterval: parseInt(e.target.value) || 30 })}
                  min={5}
                  max={1440}
                  className="w-full px-4 py-3 rounded-xl bg-background-tertiary border border-border text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowModal(false);
                  setEditingKeyword(null);
                }}
              >
                取消
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={editingKeyword ? handleUpdate : handleCreate}
                disabled={!formData.keyword.trim()}
              >
                {editingKeyword ? '保存' : '添加'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </MainLayout>
  );
}
