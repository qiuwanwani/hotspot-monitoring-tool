import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // 获取数据源状态
    const dataSources = await prisma.dataSource.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        lastFetched: true,
      },
      orderBy: { name: 'asc' },
    });

    // 获取最近的监控日志
    const recentLogs = await prisma.monitorLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        level: true,
        message: true,
        createdAt: true,
      },
    });

    // 获取今日获取的热点数量
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayHotspots = await prisma.hotspot.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // 获取总热点数
    const totalHotspots = await prisma.hotspot.count();

    return NextResponse.json({
      dataSources: dataSources.map(ds => ({
        ...ds,
        lastFetchedAt: ds.lastFetched?.toISOString() || null,
      })),
      recentLogs: recentLogs.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
      stats: {
        todayHotspots,
        totalHotspots,
        activeDataSources: dataSources.filter(ds => ds.isActive).length,
        totalDataSources: dataSources.length,
      },
      isFetching: false,
    });
  } catch (error) {
    console.error('获取监控状态失败:', error);
    return NextResponse.json(
      { error: '获取监控状态失败' },
      { status: 500 }
    );
  }
}
