import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // 获取总热点数
    const total = await prisma.hotspot.count();

    // 获取今日热点数
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = await prisma.hotspot.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    return NextResponse.json({
      total,
      today: todayCount,
    });
  } catch (error) {
    console.error('获取热点统计失败:', error);
    return NextResponse.json(
      { error: '获取热点统计失败' },
      { status: 500 }
    );
  }
}
