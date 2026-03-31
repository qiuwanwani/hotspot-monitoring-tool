import prisma from '@/lib/prisma';
import { BaseDataSource, SourceHotspot } from './base';
import { RSSDataSource } from './rss';
import { SearchDataSource } from './search';
import { WebScraperDataSource } from './web-scraper';
import { WeiboDataSource } from './weibo';
import { ZhihuDataSource } from './zhihu';
import { HackerNewsDataSource } from './hackernews';
import { RedditDataSource } from './reddit';
import { TwitterDataSource } from './twitter';
import { DuckDuckGoDataSource } from './duckduckgo';
import { BaiduDataSource } from './baidu';
import { logger } from '../logger';

const DATA_SOURCE_CLASSES: Record<string, new (config?: any) => BaseDataSource> = {
  rss: RSSDataSource,
  search: SearchDataSource,
  'web-scraper': WebScraperDataSource,
  weibo: WeiboDataSource,
  zhihu: ZhihuDataSource,
  hackernews: HackerNewsDataSource,
  reddit: RedditDataSource,
  twitter: TwitterDataSource,
  duckduckgo: DuckDuckGoDataSource,
  baidu: BaiduDataSource,
};

// 只保留不需要 API 密钥的数据源
const DEFAULT_DATA_SOURCES = [
  {
    name: 'WebScraper',
    type: 'web-scraper',
    config: '{}',
    isActive: true,
    weight: 2,
    minScore: 25,
  },
  {
    name: 'RSS',
    type: 'rss',
    config: '{}',
    isActive: true,
    weight: 1.5,
    minScore: 25,
  },
  {
    name: '微博热搜',
    type: 'weibo',
    config: '{}',
    isActive: true,
    weight: 1.5,
    minScore: 30,
  },
  {
    name: '知乎热榜',
    type: 'zhihu',
    config: '{}',
    isActive: true,
    weight: 1.5,
    minScore: 30,
  },
  {
    name: 'HackerNews',
    type: 'hackernews',
    config: '{}',
    isActive: true,
    weight: 1.2,
    minScore: 25,
  },
  {
    name: 'DuckDuckGo',
    type: 'duckduckgo',
    config: '{}',
    isActive: true,
    weight: 1.3,
    minScore: 20,
  },
  {
    name: '百度热搜',
    type: 'baidu',
    config: '{}',
    isActive: true,
    weight: 1.5,
    minScore: 25,
  },
  // 以下数据源需要 API 密钥，默认禁用
  // {
  //   name: 'Search',
  //   type: 'search',
  //   config: '{}',
  //   isActive: false,
  //   weight: 1,
  //   minScore: 20,
  // },
  // {
  //   name: 'Reddit',
  //   type: 'reddit',
  //   config: '{}',
  //   isActive: false,
  //   weight: 1,
  //   minScore: 25,
  // },
  // {
  //   name: 'Twitter',
  //   type: 'twitter',
  //   config: '{}',
  //   isActive: false,
  //   weight: 1,
  //   minScore: 25,
  // },
];

// 请求超时配置
const FETCH_TIMEOUT = 30000; // 30秒超时

export class DataSourceManager {
  private sources: Map<string, BaseDataSource> = new Map();
  private fetchAbortController: AbortController | null = null;

  async initialize() {
    logger.info('初始化数据源管理器...', 'DataSourceManager');

    const dbSources = await prisma.dataSource.findMany();

    if (dbSources.length === 0) {
      logger.info('未找到数据源，创建默认数据源...', 'DataSourceManager');
      for (const defaultSource of DEFAULT_DATA_SOURCES) {
        await prisma.dataSource.create({
          data: defaultSource,
        });
      }
    } else {
      // 同步新增的默认数据源
      logger.info('同步默认数据源...', 'DataSourceManager');
      for (const defaultSource of DEFAULT_DATA_SOURCES) {
        const exists = dbSources.some(ds => ds.type === defaultSource.type);
        if (!exists) {
          logger.info(`添加新数据源: ${defaultSource.name}`, 'DataSourceManager');
          await prisma.dataSource.create({
            data: defaultSource,
          });
        }
      }
    }

    await this.loadSources();
    logger.info(`已加载 ${this.sources.size} 个数据源`, 'DataSourceManager');
  }

  private async loadSources() {
    const dbSources = await prisma.dataSource.findMany({
      where: { isActive: true },
    });

    for (const dbSource of dbSources) {
      const SourceClass = DATA_SOURCE_CLASSES[dbSource.type];
      if (SourceClass) {
        let config: any = {};
        try {
          config = JSON.parse(dbSource.config);
        } catch (e) {
          logger.warn(`解析数据源 ${dbSource.name} 配置失败，使用默认配置`, 'DataSourceManager', e as Error);
        }
        const source = new SourceClass(config);
        this.sources.set(dbSource.id, source);
      }
    }
  }

  async fetchAll(keywords?: string[]): Promise<SourceHotspot[]> {
    // 取消之前的请求
    if (this.fetchAbortController) {
      this.fetchAbortController.abort();
    }
    this.fetchAbortController = new AbortController();
    const signal = this.fetchAbortController.signal;

    const allHotspots: SourceHotspot[] = [];
    const dbSources = await prisma.dataSource.findMany({
      where: { isActive: true },
    });

    // 使用 Promise.race 实现超时控制
    const fetchWithTimeout = async (dbSource: typeof dbSources[0]): Promise<SourceHotspot[]> => {
      const source = this.sources.get(dbSource.id);
      if (!source) return [];

      const startTime = Date.now();
      let status: 'healthy' | 'warning' | 'error' = 'healthy';
      let errorMessage: string | undefined;

      try {
        logger.info(`从 ${source.name} 获取数据...`, 'DataSourceManager');
        
        // 创建超时Promise
        const timeoutPromise = new Promise<SourceHotspot[]>((_, reject) => {
          setTimeout(() => reject(new Error('请求超时')), FETCH_TIMEOUT);
        });

        // 创建数据获取Promise
        const fetchPromise = source.fetch(keywords);

        // 竞争执行
        const hotspots = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (signal.aborted) {
          return [];
        }
        
        const filteredHotspots = hotspots.filter(h => h.heatScore >= dbSource.minScore);
        const weightedHotspots = filteredHotspots.map(h => ({
          ...h,
          heatScore: Math.min(100, Math.round(h.heatScore * dbSource.weight)),
          metadata: {
            ...h.metadata,
            dataSourceId: dbSource.id,
          },
        }));

        logger.info(`获取到 ${weightedHotspots.length} 条热点`, 'DataSourceManager');

        // 异步更新最后获取时间，不阻塞主线程
        this.updateLastFetched(dbSource.id).catch(error => {
          logger.error(`更新数据源 ${dbSource.name} 最后获取时间失败`, 'DataSourceManager', error as Error);
        });

        // 记录健康状态
        const responseTime = Date.now() - startTime;
        this.updateHealthStatus(dbSource.id, 'healthy', responseTime).catch(error => {
          logger.error(`更新数据源 ${dbSource.name} 健康状态失败`, 'DataSourceManager', error as Error);
        });

        return weightedHotspots;
      } catch (error) {
        const responseTime = Date.now() - startTime;
        if (error instanceof Error && error.message === '请求超时') {
          logger.warn(`从 ${dbSource.name} 获取数据超时`, 'DataSourceManager');
          status = 'warning';
          errorMessage = '请求超时';
        } else {
          logger.error(`从 ${dbSource.name} 获取数据失败`, 'DataSourceManager', error as Error);
          status = 'error';
          errorMessage = error instanceof Error ? error.message : '未知错误';
        }
        
        // 记录健康状态
        this.updateHealthStatus(dbSource.id, status, responseTime, errorMessage).catch(err => {
          logger.error(`更新数据源 ${dbSource.name} 健康状态失败`, 'DataSourceManager', err as Error);
        });
        
        return [];
      }
    };

    // 并行处理所有数据源，但限制并发数
    const concurrencyLimit = 3;
    const results: SourceHotspot[][] = [];
    
    for (let i = 0; i < dbSources.length; i += concurrencyLimit) {
      const batch = dbSources.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(batch.map(fetchWithTimeout));
      results.push(...batchResults);
      
      if (signal.aborted) {
        return [];
      }
    }

    // 合并所有热点数据
    for (const hotspots of results) {
      allHotspots.push(...hotspots);
    }

    if (allHotspots.length === 0) {
      logger.info('没有获取到热点数据', 'DataSourceManager');
    }

    return allHotspots.sort((a, b) => b.heatScore - a.heatScore);
  }

  private async updateLastFetched(dataSourceId: string): Promise<void> {
    await prisma.dataSource.update({
      where: { id: dataSourceId },
      data: { lastFetched: new Date() },
    });
  }

  private async updateHealthStatus(
    dataSourceId: string, 
    status: 'healthy' | 'warning' | 'error', 
    responseTime: number,
    errorMessage?: string
  ): Promise<void> {
    const existing = await prisma.dataSourceHealth.findUnique({
      where: { dataSourceId },
    });

    const updateData: any = {
      status,
      lastCheckAt: new Date(),
      avgResponseTime: responseTime,
    };

    if (status === 'healthy') {
      updateData.lastSuccessAt = new Date();
      updateData.successCount = existing ? existing.successCount + 1 : 1;
    } else {
      updateData.lastErrorAt = new Date();
      updateData.lastError = errorMessage;
      updateData.errorCount = existing ? existing.errorCount + 1 : 1;
    }

    await prisma.dataSourceHealth.upsert({
      where: { dataSourceId },
      update: updateData,
      create: {
        dataSourceId,
        ...updateData,
        successCount: status === 'healthy' ? 1 : 0,
        errorCount: status !== 'healthy' ? 1 : 0,
      },
    });
  }

  cancelFetch(): void {
    if (this.fetchAbortController) {
      this.fetchAbortController.abort();
      this.fetchAbortController = null;
      logger.info('已取消数据获取请求', 'DataSourceManager');
    }
  }

  getSource(id: string): BaseDataSource | undefined {
    return this.sources.get(id);
  }

  getAllSources(): BaseDataSource[] {
    return Array.from(this.sources.values());
  }
}

export const dataSourceManager = new DataSourceManager();
