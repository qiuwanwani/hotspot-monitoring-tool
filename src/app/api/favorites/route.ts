import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 获取用户的收藏列表
export async function GET(req: NextRequest) {
  try {
    // TODO: 从 JWT token 获取用户ID
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        hotspot: {
          include: {
            keywords: {
              select: { id: true, keyword: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(favorites);
  } catch (error) {
    console.error('获取收藏失败:', error);
    return NextResponse.json(
      { error: '获取收藏失败' },
      { status: 500 }
    );
  }
}

// 添加收藏
export async function POST(req: NextRequest) {
  try {
    const { hotspotId } = await req.json();
    // TODO: 从 JWT token 获取用户ID
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        hotspotId
      }
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: '已经收藏过了' },
        { status: 400 }
      );
    }
    console.error('添加收藏失败:', error);
    return NextResponse.json(
      { error: '添加收藏失败' },
      { status: 500 }
    );
  }
}

// 取消收藏
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hotspotId = searchParams.get('hotspotId');
    // TODO: 从 JWT token 获取用户ID
    const userId = req.headers.get('x-user-id');
    
    if (!userId || !hotspotId) {
      return NextResponse.json(
        { error: '参数错误' },
        { status: 400 }
      );
    }

    await prisma.favorite.delete({
      where: {
        userId_hotspotId: {
          userId,
          hotspotId
        }
      }
    });

    return NextResponse.json({ message: '取消收藏成功' });
  } catch (error) {
    console.error('取消收藏失败:', error);
    return NextResponse.json(
      { error: '取消收藏失败' },
      { status: 500 }
    );
  }
}
