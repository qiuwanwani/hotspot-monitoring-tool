import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get('level');
    const context = searchParams.get('context');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    const where: any = {};
    if (level) where.level = level;
    if (context) where.context = context;

    const total = await prisma.monitorLog.count({ where });

    const logs = await prisma.monitorLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取监控日志失败:', error);
    return NextResponse.json(
      { error: '获取监控日志失败' },
      { status: 500 }
    );
  }
}

// 清理旧日志
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '7');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.monitorLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return NextResponse.json({
      message: `已清理 ${result.count} 条旧日志`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('清理日志失败:', error);
    return NextResponse.json(
      { error: '清理日志失败' },
      { status: 500 }
    );
  }
}
