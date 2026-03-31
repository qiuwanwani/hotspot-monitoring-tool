import { BaseDataSource, SourceHotspot, SourceConfig } from './base';
import axios from 'axios';
import { logger } from '../logger';

interface WeiboHotspotItem {
  title: string;
  url: string;
  rank: number;
  heatValue?: number;
  wordScheme?: string;
}

export class WeiboDataSource extends BaseDataSource {
  readonly name = '微博热搜';
  readonly type = 'weibo';
  readonly defaultConfig: SourceConfig = {
    baseUrl: 'https://weibo.com/ajax/side/hotSearch',
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
    // 没有关键词时不抓取数据
    if (!keywords || keywords.length === 0) {
      return [];
    }

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
    const randomIP = this.generateRandomIP();
    const cookie = `SUB=_${Date.now()}; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9WWY5OqL1KqS9kL2UqS5PWn75JpX5KzhUgL.FoqNSoB0eK2ESh.2dJLoIp7LxKML1KBLBKnLxKqL1hnLBoM41K2ESh-RS0qLxK-L1K-L12zt; FG=1;`;

    const response = await axios.get(this.config.baseUrl, {
      timeout: this.config.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'CLIENT-IP': randomIP,
        'X-FORWARDED-FOR': randomIP,
        'Referer': 'https://s.weibo.com',
        'Cookie': cookie,
      },
    });

    const data = response.data;
    const realtimeList = data?.data?.realtime || [];
    const hotspots: SourceHotspot[] = [];

    for (let i = 0; i < realtimeList.length; i++) {
      const item = realtimeList[i];

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
          sourceId: `weibo_${parsedItem.rank}`,
          heatScore,
          category: 'social',
          publishedAt: new Date(),
          metadata: {
            rank: parsedItem.rank,
            heatValue: parsedItem.heatValue,
            wordScheme: parsedItem.wordScheme,
            platform: 'weibo',
          },
        };

        if (this.isValidContent(hotspot)) {
          hotspots.push(hotspot);
        }
      } catch (error) {
        logger.debug(`解析微博热搜项 ${i} 失败`, 'WeiboDataSource');
      }
    }

    logger.info(`微博热搜获取成功: ${hotspots.length} 条`, 'WeiboDataSource');
    return hotspots;
  }

  private parseItem(item: any, defaultRank: number): WeiboHotspotItem | null {
    const title = item.note || item.word;
    if (!title) return null;

    const wordScheme = item.word_scheme || item.word;
    const url = wordScheme ? `https://s.weibo.com/weibo?q=${encodeURIComponent(wordScheme)}` : '';
    const rank = item.rank || defaultRank;
    const heatValue = item.num ? parseFloat(item.num) : undefined;

    return { title, url, rank, heatValue, wordScheme };
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
      if (heatValue > 1000000) score += 5;
      if (heatValue > 5000000) score += 5;
    }

    return Math.min(100, score);
  }

  private matchesKeywords(title: string, keywords: string[]): boolean {
    const titleLower = title.toLowerCase();
    return keywords.some(kw => titleLower.includes(kw.toLowerCase()));
  }

  private generateRandomIP(): string {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
