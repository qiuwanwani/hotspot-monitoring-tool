import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { clearKeywordsCache } from '../route';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const keyword = await prisma.keyword.findUnique({
      where: { id: params.id },
      include: {
        hotspots: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        notifications: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!keyword) {
      return NextResponse.json(
        { error: '关键词不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(keyword);
  } catch (error) {
    return NextResponse.json(
      { error: '获取关键词失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { keyword, category, isActive, checkInterval } = body;
    
    const updated = await prisma.keyword.update({
      where: { id: params.id },
      data: {
        keyword,
        category,
        isActive,
        checkInterval
      }
    });

    // 清除缓存
    clearKeywordsCache();

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: '更新关键词失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 首先获取该关键词关联的所有热点
    const keyword = await prisma.keyword.findUnique({
      where: { id: params.id },
      include: {
        hotspots: {
          include: {
            keywords: true
          }
        }
      }
    });

    if (!keyword) {
      return NextResponse.json(
        { error: '关键词不存在' },
        { status: 404 }
      );
    }

    // 找出只关联当前关键词的热点（孤立热点）
    const orphanedHotspots = keyword.hotspots.filter(
      hotspot => hotspot.keywords.length === 1
    );

    // 删除孤立热点
    for (const hotspot of orphanedHotspots) {
      await prisma.hotspot.delete({
        where: { id: hotspot.id }
      });
    }

    // 删除关键词（会自动解除多对多关系）
    await prisma.keyword.delete({
      where: { id: params.id }
    });

    // 清除缓存
    clearKeywordsCache();

    return NextResponse.json({
      success: true,
      deletedHotspots: orphanedHotspots.length
    });
  } catch (error) {
    console.error('删除关键词失败:', error);
    return NextResponse.json(
      { error: '删除关键词失败' },
      { status: 500 }
    );
  }
}
