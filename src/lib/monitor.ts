import cron from 'node-cron';
import prisma from '@/lib/prisma';
import { dataSourceManager, SourceHotspot } from '@/lib/sources';
import { aiService } from './ai';
import { notificationService } from './notification';
import { logger } from './logger';

interface HotspotWithKeywords {
  hotspot: {
    id: string;
    title: string;
    content: string | null;
    source: string;
    sourceUrl: string | null;
    heatScore: number;
    keywordsMatched: string | null;
  };
  matchedKeywords: Array<{ id: string; keyword: string }>;
}

export class MonitorService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private initialized = false;
  private isFetching = false;

  async start() {
    logger.info('热点监控服务启动...', 'MonitorService');
    
    try {
      await dataSourceManager.initialize();
      this.initialized = true;
      
      this.scheduleDataFetch();
      this.scheduleCleanup();
      this.scheduleHealthCheck();
      logger.info('热点监控服务启动成功', 'MonitorService');
    } catch (error) {
      logger.error('热点监控服务启动失败', 'MonitorService', error as Error);
      throw error;
    }
  }

  stop() {
    logger.info('热点监控服务停止...', 'MonitorService');
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`停止任务: ${name}`, 'MonitorService');
    });
    this.jobs.clear();
    dataSourceManager.cancelFetch();
    logger.info('热点监控服务已停止', 'MonitorService');
  }

  private scheduleDataFetch() {
    const job = cron.schedule('*/5 * * * *', async () => {
      if (this.isFetching) {
        logger.warn('上一次数据获取仍在进行中，跳过本次任务', 'MonitorService');
        return;
      }
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

  private scheduleHealthCheck() {
    const job = cron.schedule('*/10 * * * *', async () => {
      await this.healthCheck();
    });

    this.jobs.set('health-check', job);
    logger.info('启动任务: 健康检查 (每10分钟)', 'MonitorService');
  }

  async fetchNow() {
    if (!this.initialized) {
      await this.start();
    }
    await this.fetchData();
  }

  private async fetchData() {
    if (!this.initialized) {
      logger.warn('监控服务未初始化，跳过数据获取', 'MonitorService');
      return;
    }

    if (this.isFetching) {
      logger.warn('数据获取正在进行中，跳过本次请求', 'MonitorService');
      return;
    }

    this.isFetching = true;
    let keywordStrings: string[] = [];
    
    try {
      logger.info('开始获取数据...', 'MonitorService');
      
      const keywords = await prisma.keyword.findMany({
        where: { isActive: true },
      });

      logger.info(`找到 ${keywords.length} 个活跃关键词`, 'MonitorService');

      keywordStrings = keywords.map(k => k.keyword);

      // 如果没有活跃关键词，直接返回不抓取数据
      if (keywordStrings.length === 0) {
        logger.info(`没有活跃关键词，跳过数据获取`, 'MonitorService');
        return;
      }

      const hotspots = await dataSourceManager.fetchAll(keywordStrings);

      logger.info(`共获取 ${hotspots.length} 条热点`, 'MonitorService');

      let saved = 0;
      let skipped = 0;
      
      if (hotspots.length > 0) {
        // 使用事务批量处理
        const result = await prisma.$transaction(async (tx) => {
          // 批量检查热点是否存在
          const sourceUrls = hotspots.map(h => h.sourceUrl);
          const existingHotspots = await tx.hotspot.findMany({
            where: {
              sourceUrl: { in: sourceUrls },
            },
            select: { sourceUrl: true },
          });
          
          const existingUrls = new Set(existingHotspots.map(h => h.sourceUrl));
          
          // 过滤需要保存的热点
          const hotspotsToSave = hotspots.filter(hotspot => !existingUrls.has(hotspot.sourceUrl));
          
          logger.info(`过滤后需要保存 ${hotspotsToSave.length} 条热点`, 'MonitorService');
          
          // 批量创建热点
          if (hotspotsToSave.length > 0) {
            const createdHotspots: HotspotWithKeywords[] = [];
            
            for (const hotspot of hotspotsToSave) {
              try {
                const matchedKeywords = keywords.filter(k => 
                  hotspot.title.toLowerCase().includes(k.keyword.toLowerCase()) ||
                  (hotspot.content && hotspot.content.toLowerCase().includes(k.keyword.toLowerCase()))
                );

                const createdHotspot = await tx.hotspot.create({
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

                createdHotspots.push({ hotspot: createdHotspot, matchedKeywords });
              } catch (error) {
                logger.error(`保存热点失败: ${hotspot.title}`, 'MonitorService', error as Error);
              }
            }
            
            // 处理关键词关联和通知（在事务外异步处理）
            this.processKeywordAssociations(createdHotspots).catch(error => {
              logger.error('处理关键词关联失败', 'MonitorService', error as Error);
            });
            
            return { saved: createdHotspots.length, skipped: hotspots.length - createdHotspots.length };
          }
          
          return { saved: 0, skipped: hotspots.length };
        }, {
          timeout: 60000, // 60秒超时
        });

        saved = result.saved;
        skipped = result.skipped;
      }

      logger.info(`数据获取完成: 保存 ${saved} 条，跳过 ${skipped} 条`, 'MonitorService');
    } catch (error) {
      logger.error('数据获取失败', 'MonitorService', error as Error);
    } finally {
      this.isFetching = false;
    }
  }

  private async processKeywordAssociations(createdHotspots: HotspotWithKeywords[]) {
    if (createdHotspots.length === 0) return;

    const settings = await prisma.userSettings.findFirst();
    const notificationEnabled = settings?.notificationEnabled;
    const email = settings?.email;
    
    // 批量处理关键词关联
    const updatePromises = [];
    const notificationPromises = [];
    
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

        // 批量发送通知（高分热点）
        if (hotspot.heatScore >= 60 && notificationEnabled) {
          for (const keyword of matchedKeywords) {
            notificationPromises.push(
              notificationService.sendNotification({
                type: 'both',
                keywordId: keyword.id,
                hotspotId: hotspot.id,
                keyword: keyword.keyword,
                title: hotspot.title,
                url: hotspot.sourceUrl || '',
                source: hotspot.source,
                heatScore: hotspot.heatScore,
                email: email || undefined,
              }).catch(error => {
                logger.error(`发送通知失败: ${hotspot.title}`, 'MonitorService', error as Error);
              })
            );
          }
        }
      }
    }
    
    // 并行执行所有更新操作
    await Promise.allSettled([...updatePromises, ...notificationPromises]);
  }

  private async cleanupOldData() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // 删除30天前的低热度数据
      const deletedHotspots = await prisma.hotspot.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          heatScore: { lt: 30 },
        },
      });

      // 删除7天前的监控日志
      const deletedLogs = await prisma.monitorLog.deleteMany({
        where: {
          createdAt: { lt: sevenDaysAgo },
        },
      });

      // 删除30天前的通知
      const deletedNotifications = await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          isRead: true,
        },
      });

      logger.info(`清理完成: 删除 ${deletedHotspots.count} 条热点, ${deletedLogs.count} 条日志, ${deletedNotifications.count} 条通知`, 'MonitorService');
    } catch (error) {
      logger.error('数据清理失败', 'MonitorService', error as Error);
    }
  }

  private async healthCheck() {
    try {
      // 检查数据源健康状态
      const dataSources = await prisma.dataSource.findMany({
        where: { isActive: true },
      });

      for (const source of dataSources) {
        const lastFetched = source.lastFetched;
        const now = new Date();
        
        if (lastFetched) {
          const hoursSinceLastFetch = (now.getTime() - lastFetched.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastFetch > 1) {
            logger.warn(`数据源 ${source.name} 超过1小时未更新`, 'MonitorService');
          }
        }
      }

      // 记录系统状态
      const hotspotCount = await prisma.hotspot.count();
      const keywordCount = await prisma.keyword.count({ where: { isActive: true } });
      
      logger.info(`系统健康检查: ${hotspotCount} 条热点, ${keywordCount} 个活跃关键词`, 'MonitorService');
    } catch (error) {
      logger.error('健康检查失败', 'MonitorService', error as Error);
    }
  }

  async analyzeHotspot(hotspotId: string) {
    const hotspot = await prisma.hotspot.findUnique({
      where: { id: hotspotId },
    });

    if (!hotspot) {
      throw new Error('热点不存在');
    }

    try {
      const [analysis, summary] = await Promise.all([
        aiService.analyzeContent(hotspot.title, hotspot.content || ''),
        aiService.generateSummary(hotspot.title, hotspot.content || ''),
      ]);

      await prisma.hotspot.update({
        where: { id: hotspotId },
        data: {
          isFake: analysis.isFake,
          fakeReason: analysis.reason,
          summary,
        },
      });

      return analysis;
    } catch (error) {
      logger.error(`分析热点失败: ${hotspotId}`, 'MonitorService', error as Error);
      throw error;
    }
  }

  getStatus() {
    return {
      initialized: this.initialized,
      isFetching: this.isFetching,
      scheduledJobs: Array.from(this.jobs.keys()),
    };
  }
}

export const monitorService = new MonitorService();
