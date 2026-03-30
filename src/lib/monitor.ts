import cron from 'node-cron';
import prisma from '@/lib/prisma';
import { dataSourceManager, SourceHotspot } from '@/lib/sources';
import { aiService } from './ai';
import { notificationService } from './notification';

export class MonitorService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private initialized = false;

  async start() {
    console.log('🔍 热点监控服务启动...');
    
    await dataSourceManager.initialize();
    this.initialized = true;
    
    this.scheduleDataFetch();
    this.scheduleCleanup();
  }

  stop() {
    console.log('⏹️ 热点监控服务停止...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`  - 停止任务: ${name}`);
    });
    this.jobs.clear();
  }

  private scheduleDataFetch() {
    const job = cron.schedule('*/5 * * * *', async () => {
      await this.fetchData();
    });

    this.jobs.set('data-fetch', job);
    console.log('  - 启动任务: 数据获取 (每5分钟)');
  }

  private scheduleCleanup() {
    const job = cron.schedule('0 0 * * *', async () => {
      await this.cleanupOldData();
    });

    this.jobs.set('cleanup', job);
    console.log('  - 启动任务: 数据清理 (每天凌晨)');
  }

  private async fetchData() {
    if (!this.initialized) {
      console.warn('监控服务未初始化，跳过数据获取');
      return;
    }

    try {
      console.log('📡 开始获取数据...');
      
      const keywords = await prisma.keyword.findMany({
        where: { isActive: true },
      });

      const keywordStrings = keywords.map(k => k.keyword);
      const hotspots = await dataSourceManager.fetchAll(keywordStrings);

      console.log(`  - 共获取 ${hotspots.length} 条热点`);

      for (const hotspot of hotspots) {
        await this.processHotspot(hotspot, keywords);
      }

      console.log('✅ 数据获取完成');
    } catch (error) {
      console.error('数据获取失败:', error);
    }
  }

  private async processHotspot(hotspot: SourceHotspot, keywords: any[]) {
    try {
      const existing = await prisma.hotspot.findFirst({
        where: {
          OR: [
            { sourceId: hotspot.sourceId, source: hotspot.source },
            { sourceUrl: hotspot.sourceUrl },
          ],
        },
      });

      if (existing) {
        return;
      }

      const matchedKeywords = keywords.filter(k => 
        hotspot.title.toLowerCase().includes(k.keyword.toLowerCase()) ||
        (hotspot.content && hotspot.content.toLowerCase().includes(k.keyword.toLowerCase()))
      );

      const createdHotspot = await prisma.hotspot.create({
        data: {
          title: hotspot.title,
          content: hotspot.content,
          source: hotspot.source,
          sourceUrl: hotspot.sourceUrl,
          sourceId: hotspot.sourceId,
          category: hotspot.category,
          heatScore: hotspot.heatScore,
          keywordsMatched: matchedKeywords.map(k => k.keyword).join(','),
          publishedAt: hotspot.publishedAt,
          dataSourceId: hotspot.metadata?.dataSourceId,
        },
      });

      for (const keyword of matchedKeywords) {
        await prisma.hotspot.update({
          where: { id: createdHotspot.id },
          data: {
            keywords: {
              connect: { id: keyword.id },
            },
          },
        });

        if (hotspot.heatScore >= 60) {
          const settings = await prisma.userSettings.findFirst();
          
          if (settings?.notificationEnabled) {
            await notificationService.sendNotification({
              type: 'both',
              keywordId: keyword.id,
              hotspotId: createdHotspot.id,
              keyword: keyword.keyword,
              title: hotspot.title,
              url: hotspot.sourceUrl,
              source: hotspot.source,
              heatScore: hotspot.heatScore,
              email: settings.email || undefined,
            });
          }
        }
      }
    } catch (error) {
      console.error('处理热点失败:', error);
    }
  }

  private async cleanupOldData() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const deleted = await prisma.hotspot.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          heatScore: { lt: 30 },
        },
      });

      console.log(`🧹 清理完成: 删除 ${deleted.count} 条旧数据`);
    } catch (error) {
      console.error('数据清理失败:', error);
    }
  }

  async analyzeHotspot(hotspotId: string) {
    const hotspot = await prisma.hotspot.findUnique({
      where: { id: hotspotId },
    });

    if (!hotspot) {
      throw new Error('热点不存在');
    }

    const analysis = await aiService.analyzeContent(
      hotspot.title,
      hotspot.content || ''
    );

    const summary = await aiService.generateSummary(
      hotspot.title,
      hotspot.content || ''
    );

    await prisma.hotspot.update({
      where: { id: hotspotId },
      data: {
        isFake: analysis.isFake,
        fakeReason: analysis.reason,
        summary,
      },
    });

    return analysis;
  }
}

export const monitorService = new MonitorService();
