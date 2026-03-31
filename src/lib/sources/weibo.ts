import { BaseDataSource, SourceHotspot, SourceConfig } from './base';
import axios from 'axios';
import { parse } from 'node-html-parser';
import { logger } from '../logger';

interface WeiboHotspotItem {
  title: string;
  url: string;
  rank: number;
  heatValue?: number;
}

export class WeiboDataSource extends BaseDataSource {
  readonly name = '微博热搜';
  readonly type = 'weibo';
  readonly defaultConfig: SourceConfig = {
    baseUrl: 'https://s.weibo.com/top/summary',
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
        logger.warn(`微博热搜获取失败 (尝试 ${attempt}/${maxRetries}): ${lastError.message}`, 'WeiboDataSource');
        
        if (attempt < maxRetries) {
          // 指数退避
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    logger.error('微博热搜获取最终失败', 'WeiboDataSource', lastError || undefined);
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

    // 解析微博热搜列表
    const rows = root.querySelectorAll('#pl_top_realtimehot tbody tr');
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        const item = this.parseRow(row, i + 1);
        if (!item) continue;

        // 如果有关键词，检查是否匹配
        if (keywords && keywords.length > 0) {
          const matches = this.matchesKeywords(item.title, keywords);
          if (!matches) continue;
        }

        const heatScore = this.calculateHeatScoreFromRank(item.rank, item.heatValue);

        const hotspot: SourceHotspot = {
          title: item.title,
          source: this.name,
          sourceUrl: item.url,
          sourceId: `weibo_${item.rank}`,
          heatScore,
          category: 'social',
          publishedAt: new Date(),
          metadata: {
            rank: item.rank,
            heatValue: item.heatValue,
            platform: 'weibo',
          },
        };

        if (this.isValidContent(hotspot)) {
          hotspots.push(hotspot);
        }
      } catch (error) {
        logger.debug(`解析微博热搜行 ${i} 失败`, 'WeiboDataSource');
      }
    }

    logger.info(`微博热搜获取成功: ${hotspots.length} 条`, 'WeiboDataSource');
    return hotspots;
  }

  private parseRow(row: any, defaultRank: number): WeiboHotspotItem | null {
    const rankElem = row.querySelector('.ranktop, .ranktop_hot, .ranktop_new');
    const titleElem = row.querySelector('td a');
    const heatElem = row.querySelector('.star_num, .hot');
    
    if (!titleElem) return null;

    const title = titleElem.text.trim();
    const href = titleElem.getAttribute('href');
    const url = href ? (href.startsWith('http') ? href : `https://s.weibo.com${href}`) : '';
    
    const rankText = rankElem?.text.trim() || String(defaultRank);
    const rank = parseInt(rankText) || defaultRank;

    // 提取热度数值
    const heatText = heatElem?.text.trim() || '';
    const heatMatch = heatText.match(/(\d+(?:\.\d+)?)/);
    const heatValue = heatMatch ? parseFloat(heatMatch[1]) : undefined;

    return { title, url, rank, heatValue };
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
