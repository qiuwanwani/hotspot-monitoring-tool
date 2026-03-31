import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { aiService } from '@/lib/ai';
import { logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hotspot = await prisma.hotspot.findUnique({
      where: { id: params.id },
    });

    if (!hotspot) {
      return NextResponse.json(
        { error: '热点不存在' },
        { status: 404 }
      );
    }

    // 如果已有摘要，直接返回
    if (hotspot.summary) {
      return NextResponse.json({
        summary: hotspot.summary,
        cached: true,
      });
    }

    // 生成AI摘要
    try {
      logger.info(`正在为热点 ${params.id} 生成AI摘要...`, 'GenerateSummaryAPI');
      
      const content = hotspot.content || hotspot.title;
      const generatedSummary = await aiService.generateSummary(
        hotspot.title,
        content
      );

      logger.info(`AI返回的摘要: "${generatedSummary?.substring(0, 100)}..."`, 'GenerateSummaryAPI');

      // 验证生成的摘要
      if (!generatedSummary) {
        throw new Error('生成的摘要为空');
      }

      const trimmedSummary = generatedSummary.trim();
      const trimmedTitle = hotspot.title.trim();
      
      // 检查摘要是否与标题相同（忽略大小写和标点符号）
      if (trimmedSummary.toLowerCase() === trimmedTitle.toLowerCase()) {
        throw new Error('生成的摘要与标题相同');
      }

      // 检查摘要是否只是标题的重复
      if (trimmedSummary.length < 15) {
        throw new Error('生成的摘要太短');
      }

      // 更新数据库中的摘要
      await prisma.hotspot.update({
        where: { id: params.id },
        data: { summary: generatedSummary }
      });

      logger.info(`热点 ${params.id} 的AI摘要生成成功`, 'GenerateSummaryAPI');
      return NextResponse.json({
        summary: generatedSummary,
        cached: false,
      });
    } catch (aiError) {
      const errorMessage = (aiError as Error).message;
      logger.warn(`热点 ${params.id} 的AI摘要生成失败: ${errorMessage}`, 'GenerateSummaryAPI');
      return NextResponse.json(
        { error: `AI摘要生成失败: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('生成摘要失败:', error);
    return NextResponse.json(
      { error: '生成摘要失败' },
      { status: 500 }
    );
  }
}
