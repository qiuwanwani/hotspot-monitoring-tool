import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // 获取所有数据源的健康状态
    const healthStatus = await prisma.dataSourceHealth.findMany({
      include: {
        dataSource: {
          select: {
            id: true,
            name: true,
            type: true,
            isActive: true,
            lastFetched: true,
          },
        },
      },
      orderBy: { lastCheckAt: 'desc' },
    });

    // 统计数据
    const stats = {
      total: healthStatus.length,
      healthy: healthStatus.filter((h) => h.status === 'healthy').length,
      warning: healthStatus.filter((h) => h.status === 'warning').length,
      error: healthStatus.filter((h) => h.status === 'error').length,
    };

    return NextResponse.json({
      data: healthStatus,
      stats,
    });
  } catch (error) {
    console.error('获取健康状态失败:', error);
    return NextResponse.json(
      { error: '获取健康状态失败' },
      { status: 500 }
    );
  }
}

// 更新数据源健康状态
export async function POST(req: NextRequest) {
  try {
    const {
      dataSourceId,
      status,
      responseTime,
      error,
    } = await req.json();

    const existing = await prisma.dataSourceHealth.findUnique({
      where: { dataSourceId },
    });

    const updateData: any = {
      status,
      lastCheckAt: new Date(),
      avgResponseTime: responseTime,
    };

    if (status === 'healthy') {
      updateData.lastSuccessAt = new Date();
      updateData.successCount = existing
        ? existing.successCount + 1
        : 1;
    } else if (status === 'error') {
      updateData.lastErrorAt = new Date();
      updateData.lastError = error;
      updateData.errorCount = existing
        ? existing.errorCount + 1
        : 1;
    }

    const health = await prisma.dataSourceHealth.upsert({
      where: { dataSourceId },
      update: updateData,
      create: {
        dataSourceId,
        ...updateData,
        successCount: status === 'healthy' ? 1 : 0,
        errorCount: status === 'error' ? 1 : 0,
      },
    });

    return NextResponse.json(health);
  } catch (error) {
    console.error('更新健康状态失败:', error);
    return NextResponse.json(
      { error: '更新健康状态失败' },
      { status: 500 }
    );
  }
}
