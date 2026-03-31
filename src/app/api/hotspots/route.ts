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
    const maxHeat = searchParams.get('maxHeat') ? parseInt(searchParams.get('maxHeat')!) : undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const timeRange = searchParams.get('timeRange');
    const isVerified = searchParams.get('isVerified');
    const isFake = searchParams.get('isFake');
    const hasSummary = searchParams.get('hasSummary');
    const keywordId = searchParams.get('keywordId');
    
    // 构建 where 条件
    const where: any = {
      ...(source && { source }),
      ...(category && { category }),
      heatScore: {
        gte: minHeat,
        ...(maxHeat !== undefined && { lte: maxHeat }),
      },
    };

    // 时间范围筛选
    if (timeRange) {
      const now = new Date();
      const ranges: Record<string, Date> = {
        '1h': new Date(now.getTime() - 60 * 60 * 1000),
        '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      };
      if (ranges[timeRange]) {
        where.publishedAt = { gte: ranges[timeRange] };
      }
    }

    // 真实性筛选
    if (isVerified !== null && isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }
    if (isFake !== null && isFake !== undefined) {
      where.isFake = isFake === 'true';
    }

    // 内容属性筛选
    if (hasSummary === 'true') {
      where.summary = { not: null };
    } else if (hasSummary === 'false') {
      where.summary = null;
    }

    // 关键词关联筛选
    if (keywordId) {
      where.keywords = {
        some: { id: keywordId }
      };
    }
    
    // 构建排序条件
    const orderBy: any = {};
    if (sortBy === 'heatScore') {
      orderBy.heatScore = sortOrder;
    } else if (sortBy === 'publishedAt') {
      orderBy.publishedAt = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }
    
    const total = await prisma.hotspot.count({ where });
    
    const paginatedHotspots = await prisma.hotspot.findMany({
      where,
      include: {
        keywords: {
          select: { id: true, keyword: true, category: true }
        }
      },
      orderBy,
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
