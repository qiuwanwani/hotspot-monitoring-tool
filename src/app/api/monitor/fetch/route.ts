import { NextResponse } from 'next/server';
import { monitorService } from '@/lib/monitor';

export async function POST() {
  try {
    // 检查是否正在获取中
    if ((monitorService as any).isFetching) {
      return NextResponse.json(
        { error: '数据获取正在进行中，请稍后再试' },
        { status: 429 }
      );
    }

    // 触发数据获取
    monitorService.fetchNow();

    return NextResponse.json({
      success: true,
      message: '数据获取已启动',
    });
  } catch (error) {
    console.error('触发数据获取失败:', error);
    return NextResponse.json(
      { error: '触发数据获取失败' },
      { status: 500 }
    );
  }
}
