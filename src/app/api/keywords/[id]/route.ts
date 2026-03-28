import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
    await prisma.keyword.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: '删除关键词失败' },
      { status: 500 }
    );
  }
}
