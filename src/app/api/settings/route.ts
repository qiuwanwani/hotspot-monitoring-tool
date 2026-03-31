import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.userSettings.findFirst();
    return NextResponse.json(settings || {});
  } catch (error) {
    return NextResponse.json(
      { error: '获取设置失败' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 查找现有设置
    const existingSettings = await prisma.userSettings.findFirst();
    
    let settings;
    if (existingSettings) {
      // 更新现有设置
      settings = await prisma.userSettings.update({
        where: { id: existingSettings.id },
        data: body,
      });
    } else {
      // 创建新设置
      settings = await prisma.userSettings.create({
        data: body,
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('保存设置失败:', error);
    return NextResponse.json(
      { error: '保存设置失败' },
      { status: 500 }
    );
  }
}