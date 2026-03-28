'use client';

import MainLayout from '@/components/layout/MainLayout';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Save, Key, Bell, Mail, Globe, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notificationEnabled: true,
    email: '',
    pushEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    aiProvider: 'openrouter',
    openrouterApiKey: '',
    aiModel: '',
    twitterApiKey: '',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <MainLayout 
      title="设置"
      subtitle="配置应用参数"
    >
      <div className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader 
            title="通知设置" 
            subtitle="配置通知推送方式"
            action={<Bell size={20} className="text-foreground-muted" />}
          />
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background-secondary rounded-lg border border-border">
              <div>
                <p className="text-foreground font-medium">启用通知</p>
                <p className="text-foreground-muted text-sm">接收热点推送通知</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.notificationEnabled}
                  onChange={(e) => setSettings({...settings, notificationEnabled: e.target.checked})}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-card rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-background-secondary rounded-lg border border-border">
              <div>
                <p className="text-foreground font-medium">推送通知</p>
                <p className="text-foreground-muted text-sm">启用浏览器推送</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.pushEnabled}
                  onChange={(e) => setSettings({...settings, pushEnabled: e.target.checked})}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-card rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            <div className="p-4 bg-background-secondary rounded-lg border border-border">
              <p className="text-foreground font-medium mb-3">免打扰时段</p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-foreground-muted text-sm mb-1 block">开始时间</label>
                  <input 
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={(e) => setSettings({...settings, quietHoursStart: e.target.value})}
                    className="w-full h-10 bg-background border border-border rounded-lg px-3 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-foreground-muted text-sm mb-1 block">结束时间</label>
                  <input 
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) => setSettings({...settings, quietHoursEnd: e.target.value})}
                    className="w-full h-10 bg-background border border-border rounded-lg px-3 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader 
            title="AI 服务配置" 
            subtitle="配置 AI 分析服务"
            action={<Key size={20} className="text-foreground-muted" />}
          />
          <div className="space-y-4">
            <div>
              <label className="text-foreground-muted text-sm mb-2 block">AI 提供商</label>
              <select 
                value={settings.aiProvider}
                onChange={(e) => setSettings({...settings, aiProvider: e.target.value})}
                className="w-full h-11 bg-background border border-border rounded-lg px-4 text-foreground focus:outline-none focus:border-primary"
              >
                <option value="openrouter">OpenRouter</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>

            <div>
              <label className="text-foreground-muted text-sm mb-2 block">API Key</label>
              <input 
                type="password"
                value={settings.openrouterApiKey}
                onChange={(e) => setSettings({...settings, openrouterApiKey: e.target.value})}
                placeholder="sk-..."
                className="w-full h-11 bg-background border border-border rounded-lg px-4 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-foreground-muted text-sm mb-2 block">模型 (可选)</label>
              <input 
                type="text"
                value={settings.aiModel}
                onChange={(e) => setSettings({...settings, aiModel: e.target.value})}
                placeholder="anthropic/claude-3.5-sonnet"
                className="w-full h-11 bg-background border border-border rounded-lg px-4 text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader 
            title="数据源配置" 
            subtitle="配置数据抓取 API"
            action={<Globe size={20} className="text-foreground-muted" />}
          />
          <div className="space-y-4">
            <div>
              <label className="text-foreground-muted text-sm mb-2 block">Twitter API Key</label>
              <input 
                type="password"
                value={settings.twitterApiKey}
                onChange={(e) => setSettings({...settings, twitterApiKey: e.target.value})}
                placeholder="输入 Twitter API Key"
                className="w-full h-11 bg-background border border-border rounded-lg px-4 text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader 
            title="邮件配置" 
            subtitle="配置邮件通知服务"
            action={<Mail size={20} className="text-foreground-muted" />}
          />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-foreground-muted text-sm mb-2 block">SMTP 服务器</label>
                <input 
                  type="text"
                  value={settings.smtpHost}
                  onChange={(e) => setSettings({...settings, smtpHost: e.target.value})}
                  placeholder="smtp.example.com"
                  className="w-full h-11 bg-background border border-border rounded-lg px-4 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-foreground-muted text-sm mb-2 block">端口</label>
                <input 
                  type="text"
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({...settings, smtpPort: e.target.value})}
                  placeholder="587"
                  className="w-full h-11 bg-background border border-border rounded-lg px-4 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-foreground-muted text-sm mb-2 block">用户名</label>
                <input 
                  type="text"
                  value={settings.smtpUser}
                  onChange={(e) => setSettings({...settings, smtpUser: e.target.value})}
                  placeholder="user@example.com"
                  className="w-full h-11 bg-background border border-border rounded-lg px-4 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-foreground-muted text-sm mb-2 block">密码</label>
                <input 
                  type="password"
                  value={settings.smtpPass}
                  onChange={(e) => setSettings({...settings, smtpPass: e.target.value})}
                  placeholder="••••••••"
                  className="w-full h-11 bg-background border border-border rounded-lg px-4 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button 
            icon={saved ? <Check size={18} /> : <Save size={18} />} 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? '保存中...' : saved ? '已保存' : '保存设置'}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
