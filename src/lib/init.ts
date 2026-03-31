import { monitorService } from '@/lib/monitor';

// 启动监控服务
monitorService.start().catch((error) => {
  console.error('启动监控服务失败:', error);
});

export {};