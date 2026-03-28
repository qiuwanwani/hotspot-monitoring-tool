'use client';

import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/Input';
import { Plus, Edit, Trash2, Power, PowerOff, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api, Keyword } from '@/lib/api';

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
      fetchKeywords();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleToggleActive = async (keyword: Keyword) => {
    try {
      await api.updateKeyword(keyword.id, { isActive: !keyword.isActive });
      fetchKeywords();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个关键词吗？')) return;
    try {
      await api.deleteKeyword(id);
      fetchKeywords();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const filteredKeywords = keywords.filter(kw =>
    kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout 
      title="关键词管理"
      subtitle="管理监控关键词"
      actions={
        <Button icon={<Plus size={18} />} onClick={() => setShowModal(true)}>
          添加关键词
        </Button>
      }
    >
      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <SearchInput 
              placeholder="搜索关键词..." 
              value={searchQuery}
              onChange={setSearchQuery}
              className="w-64"
            />
            <div className="flex items-center gap-2">
              <Badge variant="default">共 {keywords.length} 个</Badge>
              <Badge variant="success">{keywords.filter(k => k.isActive).length} 启用</Badge>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-foreground-muted">加载中...</div>
          ) : keywords.length === 0 ? (
            <div className="text-center py-8 text-foreground-muted">
              暂无关键词，点击右上角添加
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-foreground-muted font-medium">关键词</th>
                    <th className="text-left py-3 px-4 text-foreground-muted font-medium">分类</th>
                    <th className="text-left py-3 px-4 text-foreground-muted font-medium">状态</th>
                    <th className="text-left py-3 px-4 text-foreground-muted font-medium">检查间隔</th>
                    <th className="text-left py-3 px-4 text-foreground-muted font-medium">最后检查</th>
                    <th className="text-right py-3 px-4 text-foreground-muted font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKeywords.map((kw) => (
                    <tr key={kw.id} className="border-b border-border hover:bg-card transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium text-foreground">{kw.keyword}</span>
                      </td>
                      <td className="py-3 px-4">
                        {kw.category ? (
                          <Badge variant="info">{kw.category}</Badge>
                        ) : (
                          <span className="text-foreground-subtle">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {kw.isActive ? (
                          <Badge variant="success">启用</Badge>
                        ) : (
                          <Badge variant="default">禁用</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-foreground-muted text-sm">
                        {kw.checkInterval} 分钟
                      </td>
                      <td className="py-3 px-4 text-foreground-muted text-sm">
                        {kw.lastCheckedAt 
                          ? new Date(kw.lastCheckedAt).toLocaleString('zh-CN')
                          : '未检查'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon={kw.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                            onClick={() => handleToggleActive(kw)}
                          >
                            {kw.isActive ? '禁用' : '启用'}
                          </Button>
                          <Button variant="ghost" size="sm" icon={<Edit size={16} />}>
                            编辑
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon={<Trash2 size={16} />}
                            onClick={() => handleDelete(kw.id)}
                          >
                            删除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">添加关键词</h3>
              <button onClick={() => setShowModal(false)} className="text-foreground-muted hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-foreground-muted text-sm mb-2">关键词 *</label>
                <input
                  type="text"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                  className="w-full h-11 bg-background border border-border rounded-lg px-4 text-foreground focus:outline-none focus:border-primary"
                  placeholder="输入关键词"
                />
              </div>
              <div>
                <label className="block text-foreground-muted text-sm mb-2">分类</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-11 bg-background border border-border rounded-lg px-4 text-foreground focus:outline-none focus:border-primary"
                  placeholder="例如: AI、科技、汽车"
                />
              </div>
              <div>
                <label className="block text-foreground-muted text-sm mb-2">检查间隔 (分钟)</label>
                <input
                  type="number"
                  value={formData.checkInterval}
                  onChange={(e) => setFormData({ ...formData, checkInterval: parseInt(e.target.value) || 30 })}
                  className="w-full h-11 bg-background border border-border rounded-lg px-4 text-foreground focus:outline-none focus:border-primary"
                  min="1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)}>取消</Button>
              <Button onClick={handleCreate} disabled={!formData.keyword}>添加</Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
