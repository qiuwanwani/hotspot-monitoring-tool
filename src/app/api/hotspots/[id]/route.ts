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
        keywords: true,
        notifications: true
      }
    });
    
    if (!hotspot) {
      return NextResponse.json(
        { error: '热点不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(hotspot);
  } catch (error) {
    return NextResponse.json(
      { error: '获取热点失败' },
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
    const { isVerified, isFake, fakeReason, heatScore, summary } = body;
    
    const updated = await prisma.hotspot.update({
      where: { id: params.id },
      data: {
        isVerified,
        isFake,
        fakeReason,
        heatScore,
        summary
      }
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: '更新热点失败' },
      { status: 500 }
    );
  }
}
