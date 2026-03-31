import { BaseDataSource, SourceHotspot, SourceConfig } from './base';
import axios from 'axios';
import { parse } from 'node-html-parser';
import { logger } from '../logger';

interface ZhihuHotspotItem {
  title: string;
  url: string;
  rank: number;
  heatValue?: number;
}

export class ZhihuDataSource extends BaseDataSource {
  readonly name = '知乎热榜';
  readonly type = 'zhihu';
  readonly defaultConfig: SourceConfig = {
    baseUrl: 'https://www.zhihu.com/hot',
    timeout: 30000,
    maxRetries: 3,
  };
  readonly defaultWeight = 1.5;
  readonly defaultMinScore = 30;

  constructor(config?: SourceConfig) {
    super();
    this.initConfig(config);
  }

  async fetch(keywords?: string[]): Promise<SourceHotspot[]> {
    const maxRetries = this.config.maxRetries || 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.fetchWithRetry(keywords);
      } catch (error) {
        lastError = error as Error;
        logger.warn(`知乎热榜获取失败 (尝试 ${attempt}/${maxRetries}): ${lastError.message}`, 'ZhihuDataSource');
        
        if (attempt < maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    logger.error('知乎热榜获取最终失败', 'ZhihuDataSource', lastError || undefined);
    return [];
  }

  private async fetchWithRetry(keywords?: string[]): Promise<SourceHotspot[]> {
    const response = await axios.get(this.config.baseUrl, {
      timeout: this.config.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
    });

    const root = parse(response.data);
    const hotspots: SourceHotspot[] = [];

    // 解析知乎热榜列表
    const items = root.querySelectorAll('.HotList-item');
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      try {
        const parsedItem = this.parseItem(item, i + 1);
        if (!parsedItem) continue;

        // 如果有关键词，检查是否匹配
        if (keywords && keywords.length > 0) {
          const matches = this.matchesKeywords(parsedItem.title, keywords);
          if (!matches) continue;
        }

        const heatScore = this.calculateHeatScoreFromRank(parsedItem.rank, parsedItem.heatValue);

        const hotspot: SourceHotspot = {
          title: parsedItem.title,
          source: this.name,
          sourceUrl: parsedItem.url,
          sourceId: `zhihu_${parsedItem.rank}`,
          heatScore,
          category: 'knowledge',
          publishedAt: new Date(),
          metadata: {
            rank: parsedItem.rank,
            heatValue: parsedItem.heatValue,
            platform: 'zhihu',
          },
        };

        if (this.isValidContent(hotspot)) {
          hotspots.push(hotspot);
        }
      } catch (error) {
        logger.debug(`解析知乎热榜项 ${i} 失败`, 'ZhihuDataSource');
      }
    }

    logger.info(`知乎热榜获取成功: ${hotspots.length} 条`, 'ZhihuDataSource');
    return hotspots;
  }

  private parseItem(item: any, defaultRank: number): ZhihuHotspotItem | null {
    const titleElem = item.querySelector('.HotList-itemTitle');
    const linkElem = item.querySelector('.HotList-itemLink');
    const heatElem = item.querySelector('.HotList-itemMetrics');
    
    if (!titleElem) return null;

    const title = titleElem.text.trim();
    const href = linkElem?.getAttribute('href') || '';
    const url = href.startsWith('http') ? href : `https://www.zhihu.com${href}`;
    
    const heatText = heatElem?.text.trim() || '';
    const heatMatch = heatText.match(/(\d+)/);
    const heatValue = heatMatch ? parseInt(heatMatch[1]) : undefined;

    return {
      title,
      url,
      rank: defaultRank,
      heatValue,
    };
  }

  private calculateHeatScoreFromRank(rank: number, heatValue?: number): number {
    let score = 0;
    
    // 基于排名计算基础分数
    if (rank === 1) score = 100;
    else if (rank <= 3) score = 90;
    else if (rank <= 10) score = 80;
    else if (rank <= 20) score = 70;
    else if (rank <= 30) score = 60;
    else if (rank <= 50) score = 50;
    else score = 40;

    // 根据热度值微调
    if (heatValue) {
      if (heatValue > 1000) score += 5;
      if (heatValue > 5000) score += 5;
    }

    return Math.min(100, score);
  }

  private matchesKeywords(title: string, keywords: string[]): boolean {
    const titleLower = title.toLowerCase();
    return keywords.some(kw => titleLower.includes(kw.toLowerCase()));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
