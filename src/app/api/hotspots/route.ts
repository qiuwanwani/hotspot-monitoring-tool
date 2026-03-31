import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const source = searchParams.get('source');
    const category = searchParams.get('category');
    const minHeat = parseInt(searchParams.get('minHeat') || '0');
    
    const where = {
      ...(source && { source }),
      ...(category && { category }),
      heatScore: { gte: minHeat }
    };
    
    const total = await prisma.hotspot.count({ where });
    
    const paginatedHotspots = await prisma.hotspot.findMany({
      where,
      include: {
        keywords: {
          select: { id: true, keyword: true, category: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });
    
    return NextResponse.json({
      data: paginatedHotspots,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取热点列表失败:', error);
    return NextResponse.json(
      { error: '获取热点列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      content,
      summary,
      source,
      sourceUrl,
      sourceId,
      category,
      heatScore,
      keywordsMatched,
      publishedAt
    } = body;
    
    if (!title || !source) {
      return NextResponse.json(
        { error: '标题和来源不能为空' },
        { status: 400 }
      );
    }
    
    const hotspot = await prisma.hotspot.create({
      data: {
        title,
        content,
        summary,
        source,
        sourceUrl,
        sourceId,
        category,
        heatScore: heatScore || 0,
        keywordsMatched,
        publishedAt: publishedAt ? new Date(publishedAt) : null
      }
    });
    
    return NextResponse.json(hotspot, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: '创建热点失败' },
      { status: 500 }
    );
  }
}
