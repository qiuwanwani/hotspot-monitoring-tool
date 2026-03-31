export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { monitorService } = await import('@/lib/monitor');
    monitorService.start().catch((error: any) => {
      console.error('启动监控服务失败:', error);
    });
  }
}
