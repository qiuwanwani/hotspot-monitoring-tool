'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { api, Notification } from '@/lib/api';
import { 
  Bell, 
  BellOff,
  Check,
  Clock,
  ExternalLink,
  Filter
} from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('获取通知失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      fetchNotifications();
    } catch (error) {
      console.error('标记失败:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      fetchNotifications();
    } catch (error) {
      console.error('标记失败:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <MainLayout 
      title="通知中心"
      subtitle={`${unreadCount} 条未读通知`}
      actions={
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllRead}>
              全部标为已读
            </Button>
          )}
          <Button variant="outline" icon={<Filter size={16} />}>
            筛选
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-foreground-muted">加载通知中...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-2">
            {(['all', 'unread', 'read'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-primary text-white'
                    : 'bg-card text-foreground-muted hover:bg-card-hover'
                }`}
              >
                {f === 'all' ? '全部' : f === 'unread' ? '未读' : '已读'}
                {f === 'unread' && unreadCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-background/20 text-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {filteredNotifications.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-card-hover mx-auto mb-4 flex items-center justify-center">
                <Bell size={24} className="text-foreground-subtle" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {filter === 'all' ? '暂无通知' : `暂无${filter === 'unread' ? '未读' : '已读'}通知`}
              </h3>
              <p className="text-foreground-muted">
                {filter === 'all' 
                  ? '发现热点时您将收到通知' 
                  : `您没有${filter === 'unread' ? '未读' : '已读'}通知`
                }
              </p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filteredNotifications.map((notification, index) => (
                <Card 
                  key={notification.id}
                  hover
                  className={`p-4 animate-slide-up ${!notification.isRead ? 'border-primary/30' : ''}`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${notification.isRead ? 'bg-background-tertiary' : 'bg-primary/10'}`}>
                      {notification.isRead ? (
                        <BellOff size={18} className="text-foreground-muted" />
                      ) : (
                        <Bell size={18} className="text-primary" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h4 className={`font-medium ${notification.isRead ? 'text-foreground-muted' : 'text-foreground'}`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                      
                      {notification.message && (
                        <p className="text-sm text-foreground-muted mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                      )}

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-xs text-foreground-subtle">
                          <Clock size={12} />
                          <span>{formatTime(notification.createdAt)}</span>
                        </div>
                        
                        {notification.hotspot && (
                          <a
                            href={notification.hotspot.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            查看热点
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>

                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        icon={<Check size={14} />}
                      />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </MainLayout>
  );
}
