import { NextResponse } from 'next/server';
import { monitorService } from '@/lib/monitor';

export async function POST() {
  try {
    await monitorService.fetchNow();
    return NextResponse.json({ message: '手动触发数据获取成功' });
  } catch (error) {
    console.error('手动触发数据获取失败:', error);
    return NextResponse.json(
      { error: '手动触发数据获取失败' },
      { status: 500 }
    );
  }
}
