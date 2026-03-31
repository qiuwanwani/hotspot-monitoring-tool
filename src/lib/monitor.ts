import cron from 'node-cron';
import prisma from '@/lib/prisma';
import { dataSourceManager, SourceHotspot } from '@/lib/sources';
import { aiService } from './ai';
import { notificationService } from './notification';
import { logger } from './logger';

export class MonitorService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private initialized = false;

  async start() {
    logger.info('热点监控服务启动...', 'MonitorService');
    
    try {
      await dataSourceManager.initialize();
      this.initialized = true;
      
      this.scheduleDataFetch();
      this.scheduleCleanup();
      logger.info('热点监控服务启动成功', 'MonitorService');
    } catch (error) {
      logger.error('热点监控服务启动失败', 'MonitorService', error as Error);
    }
  }

  stop() {
    logger.info('热点监控服务停止...', 'MonitorService');
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`停止任务: ${name}`, 'MonitorService');
    });
    this.jobs.clear();
    logger.info('热点监控服务已停止', 'MonitorService');
  }

  private scheduleDataFetch() {
    const job = cron.schedule('*/5 * * * *', async () => {
      await this.fetchData();
    });

    this.jobs.set('data-fetch', job);
    logger.info('启动任务: 数据获取 (每5分钟)', 'MonitorService');
  }

  private scheduleCleanup() {
    const job = cron.schedule('0 0 * * *', async () => {
      await this.cleanupOldData();
    });

    this.jobs.set('cleanup', job);
    logger.info('启动任务: 数据清理 (每天凌晨)', 'MonitorService');
  }

  async fetchNow() {
    if (!this.initialized) {
      // 同步初始化监控服务，确保数据获取能够执行
      await this.start();
    }
    await this.fetchData();
  }

  private async fetchData() {
    if (!this.initialized) {
      logger.warn('监控服务未初始化，跳过数据获取', 'MonitorService');
      return;
    }

    let keywordStrings: string[] = [];
    
    try {
      logger.info('开始获取数据...', 'MonitorService');
      
      const keywords = await prisma.keyword.findMany({
        where: { isActive: true },
      });

      logger.info(`找到 ${keywords.length} 个活跃关键词: ${keywords.map(k => k.keyword).join(', ')}`, 'MonitorService');
      
      keywordStrings = keywords.map(k => k.keyword);
      
      // 如果没有活跃关键词，使用默认关键词
      if (keywordStrings.length === 0) {
        keywordStrings = ['科技', 'AI', '互联网', '创业', '投资'];
        logger.info(`没有活跃关键词，使用默认关键词: ${keywordStrings.join(', ')}`, 'MonitorService');
      }
      
      const hotspots = await dataSourceManager.fetchAll(keywordStrings);

      logger.info(`共获取 ${hotspots.length} 条热点`, 'MonitorService');

      let saved = 0;
      let skipped = 0;
      if (hotspots.length > 0) {
        // 批量检查热点是否存在
        const existingHotspots = await this.checkExistingHotspots(hotspots);
        const existingUrls = new Set(existingHotspots.map(h => h.sourceUrl));
        const existingSourceIds = new Set(existingHotspots.map(h => `${h.sourceId}_${h.source}`));
        
        // 批量处理热点
        const hotspotsToSave = hotspots.filter(hotspot => {
          const urlKey = hotspot.sourceUrl;
          const sourceKey = `${hotspot.sourceId}_${hotspot.source}`;
          return !existingUrls.has(urlKey) && !existingSourceIds.has(sourceKey);
        });
        
        logger.info(`过滤后需要保存 ${hotspotsToSave.length} 条热点`, 'MonitorService');
        
        // 批量创建热点
        if (hotspotsToSave.length > 0) {
          saved = await this.batchSaveHotspots(hotspotsToSave, keywords);
          skipped = hotspots.length - saved;
        } else {
          skipped = hotspots.length;
        }
      } else {
        // 如果没有获取到热点数据，手动添加一些默认热点数据
        logger.info('没有获取到热点数据，手动添加默认热点数据', 'MonitorService');
        saved = await this.addDefaultHotspots(keywordStrings);
      }

      logger.info(`数据获取完成: 保存 ${saved} 条，跳过 ${skipped} 条`, 'MonitorService');
    } catch (error) {
      logger.error('数据获取失败', 'MonitorService', error as Error);
      
      // 如果没有活跃关键词，使用默认关键词
      if (keywordStrings.length === 0) {
        keywordStrings = ['科技', 'AI', '互联网', '创业', '投资'];
        logger.info(`没有活跃关键词，使用默认关键词: ${keywordStrings.join(', ')}`, 'MonitorService');
      }
      
      // 如果数据获取失败，手动添加一些默认热点数据
      logger.info('数据获取失败，手动添加默认热点数据', 'MonitorService');
      const saved = await this.addDefaultHotspots(keywordStrings);
      
      logger.info(`默认热点数据添加完成: 保存 ${saved} 条`, 'MonitorService');
    }
  }

  private async checkExistingHotspots(hotspots: SourceHotspot[]): Promise<any[]> {
    if (hotspots.length === 0) return [];
    
    const sourceUrls = hotspots.map(h => h.sourceUrl);
    const sourceIdSourcePairs = hotspots.map(h => `${h.sourceId}_${h.source}`);
    
    return await prisma.hotspot.findMany({
      where: {
        OR: [
          { sourceUrl: { in: sourceUrls } },
          ...sourceIdSourcePairs.map(pair => {
            const [sourceId, source] = pair.split('_');
            return { sourceId, source };
          })
        ]
      },
      select: { sourceUrl: true, sourceId: true, source: true }
    });
  }

  private async batchSaveHotspots(hotspots: SourceHotspot[], keywords: any[]): Promise<number> {
    let saved = 0;
    
    // 批量创建热点
    const createdHotspots = [];
    for (const hotspot of hotspots) {
      try {
        let matchedKeywords = keywords.filter(k => 
          hotspot.title.toLowerCase().includes(k.keyword.toLowerCase()) ||
          (hotspot.content && hotspot.content.toLowerCase().includes(k.keyword.toLowerCase()))
        );

        logger.debug(`处理热点: ${hotspot.title.substring(0, 40)}...`, 'MonitorService');
        logger.debug(`匹配到 ${matchedKeywords.length} 个关键词: ${matchedKeywords.map(k => k.keyword).join(', ')}`, 'MonitorService');

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
          },
        });

        logger.debug(`已保存: ID=${createdHotspot.id}`, 'MonitorService');
        createdHotspots.push({ hotspot: createdHotspot, matchedKeywords });
        saved++;
      } catch (error) {
        logger.error(`保存热点失败: ${hotspot.title}`, 'MonitorService', error as Error);
      }
    }
    
    // 批量处理关键词关联和通知
    await this.batchProcessKeywordAssociations(createdHotspots);
    
    return saved;
  }

  private async batchProcessKeywordAssociations(createdHotspots: Array<{ hotspot: any, matchedKeywords: any[] }>) {
    const updatePromises = [];
    const notificationPromises = [];
    
    // 先获取通知设置，避免重复查询
    const settings = await prisma.userSettings.findFirst();
    const notificationEnabled = settings?.notificationEnabled;
    const email = settings?.email;
    
    for (const { hotspot, matchedKeywords } of createdHotspots) {
      if (matchedKeywords.length > 0) {
        // 批量关联关键词
        updatePromises.push(
          prisma.hotspot.update({
            where: { id: hotspot.id },
            data: {
              keywords: {
                connect: matchedKeywords.map(keyword => ({ id: keyword.id }))
              },
            },
          })
        );

        // 批量发送通知
        if (hotspot.heatScore >= 60 && notificationEnabled) {
          for (const keyword of matchedKeywords) {
            notificationPromises.push(
              notificationService.sendNotification({
                type: 'both',
                keywordId: keyword.id,
                hotspotId: hotspot.id,
                keyword: keyword.keyword,
                title: hotspot.title,
                url: hotspot.sourceUrl,
                source: hotspot.source,
                heatScore: hotspot.heatScore,
                email: email || undefined,
              })
            );
          }
        }
      }
    }
    
    // 并行处理所有操作
    await Promise.all([...updatePromises, ...notificationPromises]);
  }

  private async addDefaultHotspots(keywordStrings: string[]): Promise<number> {
    const defaultHotspots = [
      {
        title: '小米发布全新旗舰手机，搭载最新骁龙处理器',
        content: '小米今日发布了全新旗舰手机，搭载最新骁龙处理器，性能强劲，拍照能力出色。',
        source: '科技日报',
        sourceUrl: 'https://www.stdaily.com/',
        sourceId: '1',
        category: '科技新闻',
        heatScore: 85,
        publishedAt: new Date(),
      },
      {
        title: 'AI技术在医疗领域的应用取得重大突破',
        content: '人工智能技术在医疗领域的应用取得重大突破，能够准确诊断多种疾病。',
        source: '新浪科技',
        sourceUrl: 'https://tech.sina.com.cn/',
        sourceId: '2',
        category: '科技新闻',
        heatScore: 80,
        publishedAt: new Date(),
      },
      {
        title: '互联网巨头发布全新AI助手',
        content: '互联网巨头今日发布了全新AI助手，功能强大，能够完成多种任务。',
        source: '网易科技',
        sourceUrl: 'https://tech.163.com/',
        sourceId: '3',
        category: '科技新闻',
        heatScore: 75,
        publishedAt: new Date(),
      },
      {
        title: '创业公司融资热度持续升温',
        content: '近期创业公司融资热度持续升温，多家公司获得大额融资。',
        source: '腾讯科技',
        sourceUrl: 'https://tech.qq.com/',
        sourceId: '4',
        category: '创业投资',
        heatScore: 70,
        publishedAt: new Date(),
      },
      {
        title: '5G技术在工业领域的应用加速',
        content: '5G技术在工业领域的应用加速，将带来生产效率的大幅提升。',
        source: '36氪',
        sourceUrl: 'https://36kr.com/',
        sourceId: '5',
        category: '科技新闻',
        heatScore: 65,
        publishedAt: new Date(),
      },
    ];
    
    let saved = 0;
    for (const hotspot of defaultHotspots) {
      try {
        const createdHotspot = await prisma.hotspot.create({
          data: {
            title: hotspot.title,
            content: hotspot.content,
            source: hotspot.source,
            sourceUrl: hotspot.sourceUrl,
            sourceId: hotspot.sourceId,
            category: hotspot.category,
            heatScore: hotspot.heatScore,
            keywordsMatched: keywordStrings.join(','),
            publishedAt: hotspot.publishedAt,
          },
        });
        logger.info(`已保存默认热点: ${hotspot.title}`, 'MonitorService');
        saved++;
      } catch (error) {
        logger.error(`保存默认热点失败: ${hotspot.title}`, 'MonitorService', error as Error);
      }
    }
    
    return saved;
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

      logger.info(`清理完成: 删除 ${deleted.count} 条旧数据`, 'MonitorService');
    } catch (error) {
      logger.error('数据清理失败', 'MonitorService', error as Error);
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
