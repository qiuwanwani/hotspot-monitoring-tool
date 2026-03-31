import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      include: {
        hotspot: true,
        keyword: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const notificationsWithExtra = notifications.map(n => ({
      ...n,
      title: n.hotspot?.title || '热点通知',
      message: n.keyword ? `发现关于"${n.keyword.keyword}"的热点` : '发现新热点'
    }));
    
    return NextResponse.json(notificationsWithExtra);
  } catch (error) {
    console.error('获取通知失败:', error);
    return NextResponse.json(
      { error: '获取通知列表失败' },
      { status: 500 }
    );
  }
}
