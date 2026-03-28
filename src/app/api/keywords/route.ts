import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
      }
    });
    
    return NextResponse.json(newKeyword, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: '创建关键词失败' },
      { status: 500 }
    );
  }
}
