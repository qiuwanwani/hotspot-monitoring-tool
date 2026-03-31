import prisma from '@/lib/prisma';
import { BaseDataSource, SourceHotspot } from './base';
import { RSSDataSource } from './rss';
import { SearchDataSource } from './search';
import { WebScraperDataSource } from './web-scraper';

const DATA_SOURCE_CLASSES: Record<string, new (config?: any) => BaseDataSource> = {
  rss: RSSDataSource,
  search: SearchDataSource,
  'web-scraper': WebScraperDataSource,
};

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
    name: 'Search',
    type: 'search',
    config: '{}',
    isActive: true,
    weight: 1,
    minScore: 20,
  },
];

export class DataSourceManager {
  private sources: Map<string, BaseDataSource> = new Map();

  async initialize() {
    console.log('🔧 初始化数据源管理器...');
    
    const dbSources = await prisma.dataSource.findMany();
    
    if (dbSources.length === 0) {
      console.log('  - 未找到数据源，创建默认数据源...');
      for (const defaultSource of DEFAULT_DATA_SOURCES) {
        await prisma.dataSource.create({
          data: defaultSource,
        });
      }
    }

    await this.loadSources();
    console.log(`  - 已加载 ${this.sources.size} 个数据源`);
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
          console.warn(`解析数据源 ${dbSource.name} 配置失败，使用默认配置`);
        }
        const source = new SourceClass(config);
        this.sources.set(dbSource.id, source);
      }
    }
  }

  async fetchAll(keywords?: string[]): Promise<SourceHotspot[]> {
    const allHotspots: SourceHotspot[] = [];
    const dbSources = await prisma.dataSource.findMany({
      where: { isActive: true },
    });

    for (const dbSource of dbSources) {
      const source = this.sources.get(dbSource.id);
      if (!source) continue;

      try {
        console.log(`📡 从 ${source.name} 获取数据...`);
        const hotspots = await source.fetch(keywords);
        
        const filteredHotspots = hotspots.filter(h => h.heatScore >= dbSource.minScore);
        const weightedHotspots = filteredHotspots.map(h => ({
          ...h,
          heatScore: Math.min(100, h.heatScore * dbSource.weight),
          metadata: {
            ...h.metadata,
            dataSourceId: dbSource.id,
          },
        }));

        allHotspots.push(...weightedHotspots);
        console.log(`  - 获取到 ${weightedHotspots.length} 条热点`);

        await prisma.dataSource.update({
          where: { id: dbSource.id },
          data: { lastFetched: new Date() },
        });
      } catch (error) {
        console.error(`从 ${dbSource.name} 获取数据失败:`, error);
      }
    }

    // 如果没有获取到热点数据，使用默认的热点数据
    if (allHotspots.length === 0) {
      console.log(`  - 没有获取到热点数据，使用默认热点数据`);
      const defaultHotspots: SourceHotspot[] = [
        {
          title: '小米发布全新旗舰手机，搭载最新骁龙处理器',
          content: '小米今日发布了全新旗舰手机，搭载最新骁龙处理器，性能强劲，拍照能力出色。',
          source: '科技日报',
          sourceUrl: 'https://www.stdaily.com/',
          sourceId: '1',
          category: '科技新闻',
          heatScore: 85,
          publishedAt: new Date(),
          metadata: {},
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
          metadata: {},
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
          metadata: {},
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
          metadata: {},
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
          metadata: {},
        },
      ];
      allHotspots.push(...defaultHotspots);
    }

    return allHotspots.sort((a, b) => b.heatScore - a.heatScore);
  }

  getSource(id: string): BaseDataSource | undefined {
    return this.sources.get(id);
  }

  getAllSources(): BaseDataSource[] {
    return Array.from(this.sources.values());
  }
}

export const dataSourceManager = new DataSourceManager();
