'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  RefreshCw,
  Server,
  AlertTriangle,
  XCircle,
  Terminal,
} from 'lucide-react';

interface MonitorLog {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: string;
  metadata?: string;
  createdAt: string;
}

interface DataSourceHealth {
  id: string;
  dataSourceId: string;
  status: 'healthy' | 'warning' | 'error';
  lastCheckAt: string;
  lastSuccessAt?: string;
  lastErrorAt?: string;
  lastError?: string;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  dataSource: {
    name: string;
    type: string;
    isActive: boolean;
    lastFetched?: string;
  };
}

export default function MonitorPage() {
  const [logs, setLogs] = useState<MonitorLog[]>([]);
  const [healthStatus, setHealthStatus] = useState<DataSourceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'logs' | 'health'>('logs');
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');

  useEffect(() => {
    fetchData();
    // 每30秒自动刷新
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsRes, healthRes] = await Promise.all([
        fetch('/api/monitor/logs'),
        fetch('/api/monitor/health'),
      ]);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.data);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealthStatus(healthData.data);
      }
    } catch (error) {
      console.error('获取监控数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearOldLogs = async () => {
    if (!confirm('确定要清理7天前的日志吗？')) return;

    try {
      const res = await fetch('/api/monitor/logs?days=7', {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        alert(`已清理 ${data.deletedCount} 条日志`);
        fetchData();
      }
    } catch (error) {
      console.error('清理日志失败:', error);
    }
  };

  const filteredLogs = logs.filter((log) =>
    logFilter === 'all' ? true : log.level === logFilter
  );

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <CheckCircle size={16} className="text-accent-green" />;
      case 'warn':
        return <AlertTriangle size={16} className="text-accent-yellow" />;
      case 'error':
        return <XCircle size={16} className="text-accent-red" />;
      default:
        return <Activity size={16} className="text-foreground-muted" />;
    }
  };

  const getLevelClass = (level: string) => {
    switch (level) {
      case 'info':
        return 'bg-accent-green/10 text-accent-green border-accent-green/20';
      case 'warn':
        return 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20';
      case 'error':
        return 'bg-accent-red/10 text-accent-red border-accent-red/20';
      default:
        return 'bg-card text-foreground-muted border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle size={18} className="text-accent-green" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-accent-yellow" />;
      case 'error':
        return <XCircle size={18} className="text-accent-red" />;
      default:
        return <Activity size={18} className="text-foreground-muted" />;
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '从未';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <MainLayout
      title="监控中心"
      subtitle="系统运行状态和数据源健康监控"
      actions={
        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw size={16} />}
          onClick={fetchData}
          loading={loading}
        >
          刷新
        </Button>
      }
    >
      <div className="space-y-6">
        {/* 标签切换 */}
        <div className="flex items-center gap-4 border-b border-border">
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
              activeTab === 'logs'
                ? 'text-primary'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Terminal size={16} />
              监控日志
            </span>
            {activeTab === 'logs' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
              activeTab === 'health'
                ? 'text-primary'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Server size={16} />
              数据源健康
              <Badge variant="default" size="sm">
                {healthStatus.length}
              </Badge>
            </span>
            {activeTab === 'health' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {/* 监控日志 */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {/* 日志筛选 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(['all', 'info', 'warn', 'error'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setLogFilter(level)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      logFilter === level
                        ? 'bg-primary text-white'
                        : 'bg-card text-foreground-muted hover:bg-card-hover'
                    }`}
                  >
                    {level === 'all' && '全部'}
                    {level === 'info' && '信息'}
                    {level === 'warn' && '警告'}
                    {level === 'error' && '错误'}
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 size={16} />}
                onClick={clearOldLogs}
              >
                清理旧日志
              </Button>
            </div>

            {/* 日志列表 */}
            <Card className="overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                {filteredLogs.length === 0 ? (
                  <div className="p-12 text-center">
                    <Terminal size={48} className="mx-auto text-foreground-subtle mb-4" />
                    <p className="text-foreground-muted">暂无日志</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-4 border-l-4 ${getLevelClass(log.level)}`}
                      >
                        <div className="flex items-start gap-3">
                          {getLevelIcon(log.level)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {log.message}
                              </span>
                              {log.context && (
                                <Badge variant="secondary" size="sm">
                                  {log.context}
                                </Badge>
                              )}
                            </div>
                            {log.metadata && (
                              <pre className="text-xs text-foreground-muted bg-black/20 p-2 rounded mt-2 overflow-x-auto">
                                {log.metadata}
                              </pre>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-foreground-muted">
                              <Clock size={12} />
                              <span>{formatTime(log.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* 数据源健康 */}
        {activeTab === 'health' && (
          <div className="space-y-4">
            {healthStatus.length === 0 ? (
              <Card className="p-12 text-center">
                <Server size={48} className="mx-auto text-foreground-subtle mb-4" />
                <p className="text-foreground-muted">暂无数据源健康数据</p>
                <p className="text-sm text-foreground-subtle mt-1">
                  数据源首次运行后将显示健康状态
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {healthStatus.map((health) => (
                  <Card key={health.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-xl ${
                            health.status === 'healthy'
                              ? 'bg-accent-green/10'
                              : health.status === 'warning'
                              ? 'bg-accent-yellow/10'
                              : 'bg-accent-red/10'
                          }`}
                        >
                          {getStatusIcon(health.status)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {health.dataSource.name}
                          </h3>
                          <p className="text-sm text-foreground-muted">
                            类型: {health.dataSource.type}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-foreground-muted">
                            <span className="flex items-center gap-1">
                              <CheckCircle size={12} />
                              成功: {health.successCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <XCircle size={12} />
                              失败: {health.errorCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              平均响应: {health.avgResponseTime}ms
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-foreground-muted">
                        <p>最后检查: {formatTime(health.lastCheckAt)}</p>
                        <p>最后成功: {formatTime(health.lastSuccessAt)}</p>
                        {health.lastError && (
                          <p className="text-accent-red mt-1">
                            最后错误: {formatTime(health.lastErrorAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    {health.lastError && (
                      <div className="mt-4 p-3 rounded-lg bg-accent-red/10 text-accent-red text-sm">
                        <AlertCircle size={14} className="inline mr-2" />
                        {health.lastError}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
