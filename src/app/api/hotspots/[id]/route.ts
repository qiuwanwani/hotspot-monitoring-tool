import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hotspot = await prisma.hotspot.findUnique({
      where: { id: params.id },
      include: {
        keywords: {
          select: { id: true, keyword: true, category: true }
        },
        heatHistory: {
          orderBy: { recordedAt: 'asc' },
          take: 24,
        },
        _count: {
          select: { favorites: true }
        }
      }
    });

    if (!hotspot) {
      return NextResponse.json(
        { error: '热点不存在' },
        { status: 404 }
      );
    }

    // 获取相关热点（同类别或同关键词）
    const relatedHotspots = await prisma.hotspot.findMany({
      where: {
        id: { not: params.id },
        OR: [
          { category: hotspot.category },
          {
            keywords: {
              some: {
                id: { in: hotspot.keywords.map(k => k.id) }
              }
            }
          }
        ]
      },
      orderBy: { heatScore: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        heatScore: true,
        source: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      ...hotspot,
      relatedHotspots,
    });
  } catch (error) {
    console.error('获取热点详情失败:', error);
    return NextResponse.json(
      { error: '获取热点详情失败' },
      { status: 500 }
    );
  }
}
