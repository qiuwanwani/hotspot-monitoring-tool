'use client';

import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

const mockNotifications = [
  {
    id: '1',
    type: 'email',
    status: 'sent',
    keyword: 'OpenAI',
    hotspotTitle: 'OpenAI 发布 GPT-5 预览版',
    createdAt: new Date(),
    sentAt: new Date(),
  },
  {
    id: '2',
    type: 'push',
    status: 'sent',
    keyword: '苹果',
    hotspotTitle: '苹果 Vision Pro 2 即将发布',
    createdAt: new Date(),
    sentAt: new Date(),
  },
  {
    id: '3',
    type: 'email',
    status: 'failed',
    keyword: '特斯拉',
    hotspotTitle: '特斯拉新款 Model 3 上市',
    createdAt: new Date(),
    error: 'SMTP 连接超时',
  },
  {
    id: '4',
    type: 'push',
    status: 'pending',
    keyword: 'GPT-5',
    hotspotTitle: 'Meta 宣布开源 Llama 4 模型',
    createdAt: new Date(),
  },
];

export default function NotificationsPage() {
  return (
    <MainLayout 
      title="通知记录"
      subtitle="查看所有发送的通知"
    >
      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">通知历史</h3>
            <div className="flex items-center gap-2">
              <Badge variant="success">已发送 {mockNotifications.filter(n => n.status === 'sent').length}</Badge>
              <Badge variant="warning">待发送 {mockNotifications.filter(n => n.status === 'pending').length}</Badge>
              <Badge variant="danger">失败 {mockNotifications.filter(n => n.status === 'failed').length}</Badge>
            </div>
          </div>

          <div className="space-y-3">
            {mockNotifications.map((notification) => (
              <div 
                key={notification.id}
                className="p-4 bg-background-secondary rounded-lg border border-border flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    notification.status === 'sent' ? 'bg-accent-green/10 text-accent-green' :
                    notification.status === 'failed' ? 'bg-accent-red/10 text-accent-red' :
                    'bg-accent-orange/10 text-accent-orange'
                  }`}>
                    {notification.status === 'sent' ? <CheckCircle size={20} /> :
                     notification.status === 'failed' ? <XCircle size={20} /> :
                     <Clock size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={notification.type === 'email' ? 'primary' : 'info'}>
                        {notification.type === 'email' ? '邮件' : '推送'}
                      </Badge>
                      <span className="text-foreground-muted text-sm">
                        关键词: <span className="text-primary">{notification.keyword}</span>
                      </span>
                    </div>
                    <p className="text-foreground font-medium">{notification.hotspotTitle}</p>
                    <p className="text-foreground-muted text-sm mt-1">
                      {notification.status === 'sent' ? `发送于 ${notification.sentAt?.toLocaleString()}` :
                       notification.status === 'failed' ? `失败原因: ${notification.error}` :
                       '等待发送...'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" icon={<ExternalLink size={16} />}>
                  查看热点
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
