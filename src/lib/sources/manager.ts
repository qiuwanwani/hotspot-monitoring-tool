import prisma from '@/lib/prisma';
import { BaseDataSource, SourceHotspot } from './base';
import { RSSDataSource } from './rss';
import { SearchDataSource } from './search';

const DATA_SOURCE_CLASSES: Record<string, new (config?: any) => BaseDataSource> = {
  rss: RSSDataSource,
  search: SearchDataSource,
};

const DEFAULT_DATA_SOURCES = [
  {
    name: 'RSS',
    type: 'rss',
    config: '{}',
    isActive: true,
    weight: 2,
    minScore: 25,
  },
  {
    name: 'Search',
    type: 'search',
    config: '{}',
    isActive: true,
    weight: 1.5,
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
