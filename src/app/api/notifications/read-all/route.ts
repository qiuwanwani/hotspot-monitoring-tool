import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT() {
  try {
    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('标记所有通知已读失败:', error);
    return NextResponse.json(
      { error: '标记所有通知已读失败' },
      { status: 500 }
    );
  }
}
