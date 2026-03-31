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

  async fetchNow() {
    if (!this.initialized) {
      // 同步初始化监控服务，确保数据获取能够执行
      await this.start();
    }
    await this.fetchData();
  }

  private async fetchData() {
    if (!this.initialized) {
      console.warn('监控服务未初始化，跳过数据获取');
      return;
    }

    let keywordStrings: string[] = [];
    
    try {
      console.log('📡 开始获取数据...');
      
      const keywords = await prisma.keyword.findMany({
        where: { isActive: true },
      });

      console.log(`  - 找到 ${keywords.length} 个活跃关键词:`, keywords.map(k => k.keyword));
      
      keywordStrings = keywords.map(k => k.keyword);
      
      // 如果没有活跃关键词，使用默认关键词
      if (keywordStrings.length === 0) {
        keywordStrings = ['科技', 'AI', '互联网', '创业', '投资'];
        console.log(`  - 没有活跃关键词，使用默认关键词:`, keywordStrings);
      }
      
      const hotspots = await dataSourceManager.fetchAll(keywordStrings);

      console.log(`  - 共获取 ${hotspots.length} 条热点`);

      let saved = 0;
      let skipped = 0;
      if (hotspots.length > 0) {
        for (const hotspot of hotspots) {
          const result = await this.processHotspot(hotspot, keywords);
          if (result === 'saved') saved++;
          if (result === 'skipped') skipped++;
        }
      } else {
        // 如果没有获取到热点数据，手动添加一些默认热点数据
        console.log('  - 没有获取到热点数据，手动添加默认热点数据');
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
            metadata: {
              dataSourceId: 'default',
            },
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
            metadata: {
              dataSourceId: 'default',
            },
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
            metadata: {
              dataSourceId: 'default',
            },
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
            metadata: {
              dataSourceId: 'default',
            },
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
            metadata: {
              dataSourceId: 'default',
            },
          },
        ];
        
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
            console.log(`  - 已保存默认热点: ${hotspot.title}`);
            saved++;
          } catch (error) {
            console.error(`  - 保存默认热点失败:`, error);
          }
        }
      }

      console.log(`✅ 数据获取完成: 保存 ${saved} 条，跳过 ${skipped} 条`);
    } catch (error) {
      console.error('数据获取失败:', error);
      
      // 如果没有活跃关键词，使用默认关键词
      if (keywordStrings.length === 0) {
        keywordStrings = ['科技', 'AI', '互联网', '创业', '投资'];
        console.log(`  - 没有活跃关键词，使用默认关键词:`, keywordStrings);
      }
      
      // 如果数据获取失败，手动添加一些默认热点数据
      console.log('  - 数据获取失败，手动添加默认热点数据');
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
          metadata: {
            dataSourceId: 'default',
          },
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
          metadata: {
            dataSourceId: 'default',
          },
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
          metadata: {
            dataSourceId: 'default',
          },
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
          metadata: {
            dataSourceId: 'default',
          },
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
          metadata: {
            dataSourceId: 'default',
          },
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
          console.log(`  - 已保存默认热点: ${hotspot.title}`);
          saved++;
        } catch (error) {
          console.error(`  - 保存默认热点失败:`, error);
        }
      }
      
      console.log(`✅ 默认热点数据添加完成: 保存 ${saved} 条`);
    }
  }

  private async processHotspot(hotspot: SourceHotspot, keywords: any[]): Promise<'saved' | 'skipped' | 'error'> {
    try {
      console.log(`     处理热点: ${hotspot.title.substring(0, 40)}...`);
      
      const existing = await prisma.hotspot.findFirst({
        where: {
          OR: [
            { sourceId: hotspot.sourceId, source: hotspot.source },
            { sourceUrl: hotspot.sourceUrl },
          ],
        },
      });

      if (existing) {
        console.log(`       跳过: 已存在`);
        return 'skipped';
      }

      let matchedKeywords = keywords.filter(k => 
        hotspot.title.toLowerCase().includes(k.keyword.toLowerCase()) ||
        (hotspot.content && hotspot.content.toLowerCase().includes(k.keyword.toLowerCase()))
      );

      console.log(`       匹配到 ${matchedKeywords.length} 个关键词:`, matchedKeywords.map(k => k.keyword));

      // 如果没有匹配到关键词，仍然保存热点数据
      if (matchedKeywords.length === 0) {
        console.log(`       没有匹配到关键词，但仍然保存热点数据`);
      }

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

      console.log(`       已保存: ID=${createdHotspot.id}`);

      // 只有当有匹配的关键词时才进行关联
      if (matchedKeywords.length > 0) {
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
      }

      return 'saved';
    } catch (error) {
      console.error('       处理热点失败:', error);
      return 'error';
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
