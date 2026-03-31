'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Bell,
  Mail,
  Clock,
  Sparkles,
  Check
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notificationEnabled: true,
    email: '',
    pushEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    aiBaseUrl: '',
    aiModel: '',
    aiApiKey: '',
    twitterApiKey: '',
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
          notificationEnabled: data.notificationEnabled !== undefined ? data.notificationEnabled : true,
          email: data.email || '',
          pushEnabled: data.pushEnabled !== undefined ? data.pushEnabled : false,
          quietHoursStart: data.quietHoursStart || '22:00',
          quietHoursEnd: data.quietHoursEnd || '08:00',
          aiBaseUrl: data.aiBaseUrl || '',
          aiModel: data.aiModel || '',
          aiApiKey: data.aiApiKey || '',
          twitterApiKey: data.twitterApiKey || '',
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
      console.log('开始保存设置...');
      setLoading(true);
      console.log('发送请求到 /api/settings');
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      console.log('响应状态:', response.status);
      if (response.ok) {
        console.log('保存成功');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const error = await response.json();
        console.log('保存失败:', error);
        throw new Error(error.error || '保存失败');
      }
    } catch (error) {
      console.error('保存设置失败:', error);
    } finally {
      setLoading(false);
      console.log('保存操作完成');
    }
  };

  return (
    <MainLayout 
      title="系统设置"
      subtitle="配置您的监控偏好"
    >
      <div className="max-w-4xl space-y-6 animate-fade-in">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">通知设置</h3>
              <p className="text-sm text-foreground-muted">配置接收提醒的方式</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-background-tertiary/50">
              <div>
                <p className="font-medium text-foreground">启用通知</p>
                <p className="text-sm text-foreground-muted">接收新热点提醒</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, notificationEnabled: !settings.notificationEnabled })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.notificationEnabled ? 'bg-primary' : 'bg-border'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.notificationEnabled ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-background-tertiary/50">
              <div>
                <p className="font-medium text-foreground">推送通知</p>
                <p className="text-sm text-foreground-muted">浏览器推送通知</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, pushEnabled: !settings.pushEnabled })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.pushEnabled ? 'bg-primary' : 'bg-border'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.pushEnabled ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-background-tertiary/50">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-foreground-muted" />
                <p className="font-medium text-foreground">免打扰时段</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs text-foreground-muted mb-1 block">开始时间</label>
                  <input
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={(e) => setSettings({ ...settings, quietHoursStart: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-foreground-muted mb-1 block">结束时间</label>
                  <input
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) => setSettings({ ...settings, quietHoursEnd: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Sparkles size={20} className="text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI 集成</h3>
              <p className="text-sm text-foreground-muted">配置 AI 功能</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground-muted mb-2 block">API 基础 URL</label>
              <input
                type="url"
                value={settings.aiBaseUrl}
                onChange={(e) => setSettings({ ...settings, aiBaseUrl: e.target.value })}
                placeholder="例如：https://api.openrouter.ai/v1"
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

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-accent-orange/10">
              <Mail size={20} className="text-accent-orange" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">邮件设置</h3>
              <p className="text-sm text-foreground-muted">配置邮件通知</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground-muted mb-2 block">邮箱地址</label>
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
                <label className="text-sm font-medium text-foreground-muted mb-2 block">用户名</label>
                <input
                  type="text"
                  value={settings.smtpUser}
                  onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-background-tertiary border border-border text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground-muted mb-2 block">密码</label>
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

        <div className="flex items-center justify-end gap-4">
          {saved && (
            <div className="flex items-center gap-2 text-accent-green animate-fade-in">
              <Check size={16} />
              <span className="text-sm font-medium">设置已保存！</span>
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
