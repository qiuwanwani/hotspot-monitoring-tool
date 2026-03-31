import { NextRequest, NextResponse } from 'next/server';
import { monitorService } from '@/lib/monitor';

export async function GET() {
  try {
    await monitorService.start();
    return NextResponse.json({ message: '监控服务已启动' });
  } catch (error) {
    return NextResponse.json(
      { error: '启动监控服务失败' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await monitorService.start();
    return NextResponse.json({ message: '监控服务已启动' });
  } catch (error) {
    return NextResponse.json(
      { error: '启动监控服务失败' },
      { status: 500 }
    );
  }
}