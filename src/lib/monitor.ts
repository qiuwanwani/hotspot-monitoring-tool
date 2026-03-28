import cron from 'node-cron';
import prisma from '@/lib/prisma';
import { webCrawler } from './crawler';
import { rssFetcher, DEFAULT_RSS_FEEDS } from './rss';
import { twitterAPI } from './twitter';
import { aiService } from './ai';
import { notificationService } from './notification';

export class MonitorService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  start() {
    console.log('🔍 热点监控服务启动...');
    
    this.scheduleKeywordChecks();
    
    this.scheduleRSSFetch();
    
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

  private scheduleKeywordChecks() {
    const job = cron.schedule('*/5 * * * *', async () => {
      await this.checkKeywords();
    });

    this.jobs.set('keyword-check', job);
    console.log('  - 启动任务: 关键词检查 (每5分钟)');
  }

  private scheduleRSSFetch() {
    const job = cron.schedule('*/10 * * * *', async () => {
      await this.fetchRSSFeeds();
    });

    this.jobs.set('rss-fetch', job);
    console.log('  - 启动任务: RSS 抓取 (每10分钟)');
  }

  private scheduleCleanup() {
    const job = cron.schedule('0 0 * * *', async () => {
      await this.cleanupOldData();
    });

    this.jobs.set('cleanup', job);
    console.log('  - 启动任务: 数据清理 (每天凌晨)');
  }

  private async checkKeywords() {
    try {
      const keywords = await prisma.keyword.findMany({
        where: { isActive: true }
      });

      for (const kw of keywords) {
        const lastChecked = kw.lastCheckedAt;
        const shouldCheck = !lastChecked || 
          (Date.now() - lastChecked.getTime()) > kw.checkInterval * 60 * 1000;

        if (!shouldCheck) continue;

        console.log(`🔍 检查关键词: ${kw.keyword}`);

        const tweets = await twitterAPI.searchTweets(kw.keyword, { limit: 10 });
        
        for (const tweet of tweets) {
          await this.processTweet(tweet, kw.keyword);
        }

        await prisma.keyword.update({
          where: { id: kw.id },
          data: { lastCheckedAt: new Date() }
        });
      }
    } catch (error) {
      console.error('关键词检查失败:', error);
    }
  }

  private async fetchRSSFeeds() {
    try {
      const dataSources = await prisma.dataSource.findMany({
        where: { isActive: true, type: 'rss' }
      });

      const feeds = dataSources.length > 0 
        ? dataSources.map(ds => JSON.parse(ds.config).url)
        : DEFAULT_RSS_FEEDS;

      const items = await rssFetcher.fetchMultiple(feeds);

      for (const item of items) {
        await this.processRSSItem(item);
      }

      console.log(`📰 RSS 抓取完成: ${items.length} 条`);
    } catch (error) {
      console.error('RSS 抓取失败:', error);
    }
  }

  private async processTweet(tweet: any, keyword: string) {
    try {
      const existing = await prisma.hotspot.findFirst({
        where: { sourceId: tweet.id, source: 'Twitter' }
      });

      if (existing) return;

      const heatScore = twitterAPI.calculateHeatScore(tweet);

      const hotspot = await prisma.hotspot.create({
        data: {
          title: tweet.text.slice(0, 100),
          content: tweet.text,
          source: 'Twitter',
          sourceUrl: tweet.url,
          sourceId: tweet.id,
          category: '社交媒体',
          heatScore,
          keywordsMatched: keyword,
          publishedAt: tweet.publishedAt
        }
      });

      const kw = await prisma.keyword.findFirst({
        where: { keyword }
      });

      if (kw && heatScore >= 60) {
        const settings = await prisma.userSettings.findFirst();
        
        if (settings?.notificationEnabled) {
          await notificationService.sendNotification({
            type: 'both',
            keywordId: kw.id,
            hotspotId: hotspot.id,
            keyword,
            title: tweet.text.slice(0, 100),
            url: tweet.url,
            source: 'Twitter',
            heatScore,
            email: settings.email || undefined
          });
        }
      }
    } catch (error) {
      console.error('处理推文失败:', error);
    }
  }

  private async processRSSItem(item: any) {
    try {
      const existing = await prisma.hotspot.findFirst({
        where: { sourceUrl: item.url }
      });

      if (existing) return;

      await prisma.hotspot.create({
        data: {
          title: item.title,
          content: item.content,
          source: item.source,
          sourceUrl: item.url,
          category: '新闻',
          heatScore: 50,
          publishedAt: item.publishedAt
        }
      });
    } catch (error) {
      console.error('处理 RSS 条目失败:', error);
    }
  }

  private async cleanupOldData() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const deleted = await prisma.hotspot.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          heatScore: { lt: 30 }
        }
      });

      console.log(`🧹 清理完成: 删除 ${deleted.count} 条旧数据`);
    } catch (error) {
      console.error('数据清理失败:', error);
    }
  }

  async analyzeHotspot(hotspotId: string) {
    const hotspot = await prisma.hotspot.findUnique({
      where: { id: hotspotId }
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
        summary
      }
    });

    return analysis;
  }
}

export const monitorService = new MonitorService();
