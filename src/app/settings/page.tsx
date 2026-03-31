'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Mail,
  Sparkles,
  Check
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // AI 配置
    aiBaseUrl: '',
    aiModel: '',
    aiApiKey: '',
    // Twitter 配置
    twitterApiKey: '',
    // Web Push 配置
    vapidPublicKey: '',
    // 邮件配置
    email: '',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data) {
        setSettings({
          aiBaseUrl: data.aiBaseUrl || '',
          aiModel: data.aiModel || '',
          aiApiKey: data.aiApiKey || '',
          twitterApiKey: data.twitterApiKey || '',
          vapidPublicKey: data.vapidPublicKey || '',
          email: data.email || '',
          smtpHost: data.smtpHost || '',
          smtpPort: data.smtpPort || '587',
          smtpUser: data.smtpUser || '',
          smtpPass: data.smtpPass || '',
        });
      }
    } catch (error) {
      console.error('获取设置失败:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const error = await response.json();
        throw new Error(error.error || '保存失败');
      }
    } catch (error) {
      console.error('保存设置失败:', error);
      alert('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout
      title="系统设置"
      subtitle="配置系统级别的服务参数（保存到 .env 文件）"
    >
      <div className="max-w-4xl space-y-6 animate-fade-in">
        {/* AI 配置 */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Sparkles size={20} className="text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI 集成</h3>
              <p className="text-sm text-foreground-muted">配置 AI 内容分析和摘要功能</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground-muted mb-2 block">API 基础 URL</label>
              <input
                type="url"
                value={settings.aiBaseUrl}
                onChange={(e) => setSettings({ ...settings, aiBaseUrl: e.target.value })}
                placeholder="例如：https://api.openrouter.ai/v1/chat/completions"
                className="w-full px-4 py-3 rounded-xl bg-background-tertiary border border-border text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground-muted mb-2 block">AI 模型</label>
              <input
                type="text"
                value={settings.aiModel}
                onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                placeholder="例如：anthropic/claude-3-sonnet"
                className="w-full px-4 py-3 rounded-xl bg-background-tertiary border border-border text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground-muted mb-2 block">API 密钥</label>
              <input
                type="password"
                value={settings.aiApiKey}
                onChange={(e) => setSettings({ ...settings, aiApiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full px-4 py-3 rounded-xl bg-background-tertiary border border-border text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
        </Card>

        {/* Twitter 配置 - 已禁用，需要 API 密钥 */}
        {/*
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Twitter size={20} className="text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Twitter API</h3>
              <p className="text-sm text-foreground-muted">配置 Twitter 数据源访问</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground-muted mb-2 block">API 密钥</label>
              <input
                type="password"
                value={settings.twitterApiKey}
                onChange={(e) => setSettings({ ...settings, twitterApiKey: e.target.value })}
                placeholder="Twitter API Key"
                className="w-full px-4 py-3 rounded-xl bg-background-tertiary border border-border text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
        </Card>
        */}

        {/* Web Push 配置 - 已禁用，需要 VAPID 密钥 */}
        {/*
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-accent-green/10">
              <Bell size={20} className="text-accent-green" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Web Push 通知</h3>
              <p className="text-sm text-foreground-muted">配置浏览器推送通知（VAPID 密钥）</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground-muted mb-2 block">VAPID 公钥</label>
              <input
                type="text"
                value={settings.vapidPublicKey}
                onChange={(e) => setSettings({ ...settings, vapidPublicKey: e.target.value })}
                placeholder="BCv..."
                className="w-full px-4 py-3 rounded-xl bg-background-tertiary border border-border text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
        </Card>
        */}

        {/* 邮件配置 */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-accent-orange/10">
              <Mail size={20} className="text-accent-orange" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">邮件服务</h3>
              <p className="text-sm text-foreground-muted">配置 SMTP 邮件发送服务</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground-muted mb-2 block">发件人邮箱</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl bg-background-tertiary border border-border text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground-muted mb-2 block">SMTP 服务器</label>
                <input
                  type="text"
                  value={settings.smtpHost}
                  onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                  placeholder="smtp.gmail.com"
                  className="w-full px-4 py-3 rounded-xl bg-background-tertiary border border-border text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground-muted mb-2 block">端口</label>
                <input
                  type="text"
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                  placeholder="587"
                  className="w-full px-4 py-3 rounded-xl bg-background-tertiary border border-border text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground-muted mb-2 block">SMTP 用户名</label>
                <input
                  type="text"
                  value={settings.smtpUser}
                  onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-background-tertiary border border-border text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground-muted mb-2 block">SMTP 密码</label>
                <input
                  type="password"
                  value={settings.smtpPass}
                  onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-background-tertiary border border-border text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* 保存按钮 */}
        <div className="flex items-center justify-end gap-4">
          {saved && (
            <div className="flex items-center gap-2 text-accent-green animate-fade-in">
              <Check size={16} />
              <span className="text-sm font-medium">设置已保存到 .env 文件！</span>
            </div>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            loading={loading}
          >
            保存设置
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
