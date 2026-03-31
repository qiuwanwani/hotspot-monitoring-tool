import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 缓存通知列表
let cache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30秒缓存

export async function GET() {
  try {
    // 检查缓存
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      const response = NextResponse.json(cache.data);
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

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

    // 更新缓存
    cache = { data: notificationsWithExtra, timestamp: Date.now() };

    const response = NextResponse.json(notificationsWithExtra);
    response.headers.set('X-Cache', 'MISS');
    return response;
  } catch (error) {
    console.error('获取通知失败:', error);
    return NextResponse.json(
      { error: '获取通知列表失败' },
      { status: 500 }
    );
  }
}

// 清除缓存的辅助函数
export function clearNotificationsCache() {
  cache = null;
}
