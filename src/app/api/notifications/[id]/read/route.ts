import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: {
        hotspot: true,
        keyword: true
      }
    });

    return NextResponse.json({
      ...notification,
      title: notification.hotspot?.title || '热点通知',
      message: notification.keyword ? `发现关于"${notification.keyword.keyword}"的热点` : '发现新热点'
    });
  } catch (error) {
    console.error('标记通知已读失败:', error);
    return NextResponse.json(
      { error: '标记通知已读失败' },
      { status: 500 }
    );
  }
}
