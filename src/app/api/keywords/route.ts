import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { monitorService } from '@/lib/monitor';

export async function GET() {
  try {
    const keywords = await prisma.keyword.findMany({
      include: {
        _count: {
          select: { hotspots: true, notifications: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(keywords);
  } catch (error) {
    return NextResponse.json(
      { error: '获取关键词列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keyword, category, checkInterval = 30 } = body;
    
    if (!keyword) {
      return NextResponse.json(
        { error: '关键词不能为空' },
        { status: 400 }
      );
    }
    
    const existing = await prisma.keyword.findFirst({
      where: { keyword }
    });
    
    if (existing) {
      return NextResponse.json(
        { error: '关键词已存在' },
        { status: 400 }
      );
    }
    
    const newKeyword = await prisma.keyword.create({
      data: {
        keyword,
        category,
        checkInterval
      },
      include: {
        _count: {
          select: { hotspots: true, notifications: true }
        }
      }
    });
    
    // 立即触发数据获取，确保新关键词能立即获取热点
    console.log('触发数据获取以处理新添加的关键词:', keyword);
    // 异步执行数据获取，不阻塞API响应
    monitorService.fetchNow().then(() => {
      console.log('数据获取触发成功');
    }).catch((error) => {
      console.error('触发数据获取失败:', error);
    });
    
    return NextResponse.json(newKeyword, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: '创建关键词失败' },
      { status: 500 }
    );
  }
}
