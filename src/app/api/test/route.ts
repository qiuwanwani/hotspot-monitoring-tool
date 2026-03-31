import { NextRequest, NextResponse } from 'next/server';
import { dataSourceManager } from '@/lib/sources';
import { monitorService } from '@/lib/monitor';

export async function POST() {
  try {
    console.log('测试数据源管理器初始化...');
    
    // 初始化数据源管理器
    await dataSourceManager.initialize();
    console.log('数据源管理器初始化成功');
    
    // 手动启动监控服务
    console.log('启动监控服务...');
    await monitorService.start();
    console.log('监控服务启动成功');
    
    // 手动触发数据获取
    console.log('手动触发数据获取...');
    await (monitorService as any).fetchData();
    console.log('数据获取完成');
    
    return NextResponse.json({ message: '测试成功' });
  } catch (error) {
    console.error('测试失败:', error);
    return NextResponse.json(
      { error: '测试失败' },
      { status: 500 }
    );
  }
}