import { BaseDataSource, SourceHotspot, SourceConfig } from './base';
import axios from 'axios';
import { logger } from '../logger';

interface ZhihuHotItem {
  type: string;
  id: string;
  cardId: string;
  feedSpecific: {
    answerCount: number;
  };
  target: {
    id: number;
    url: string;
    type: string;
    titleArea: {
      text: string;
    };
    excerptArea: {
      text: string;
    };
    metricsArea: {
      text: string;
    };
  };
}

interface ZhihuHotData {
  initialState?: {
    topstory?: {
      hotList?: ZhihuHotItem[];
    };
  };
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
    const randomIP = this.generateRandomIP();
    const cookie = this.generateCookie();

    const response = await axios.get(this.config.baseUrl, {
      timeout: this.config.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'CLIENT-IP': randomIP,
        'X-FORWARDED-FOR': randomIP,
        'X-Real-IP': randomIP,
        'Referer': 'https://www.zhihu.com/',
        'Cookie': cookie,
      },
    });

    const html = response.data;
    const items = this.parseItems(html);
    const hotspots: SourceHotspot[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      try {
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
          sourceId: `zhihu_${item.id}`,
          heatScore,
          category: 'knowledge',
          publishedAt: new Date(),
          metadata: {
            rank: item.rank,
            heatValue: item.heatValue,
            platform: 'zhihu',
            excerpt: item.excerpt,
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

  private parseItems(html: string): Array<{
    id: string;
    title: string;
    url: string;
    rank: number;
    heatValue?: number;
    excerpt?: string;
  }> {
    const items: Array<{
      id: string;
      title: string;
      url: string;
      rank: number;
      heatValue?: number;
      excerpt?: string;
    }> = [];

    try {
      // 从 script 标签中提取 JSON 数据
      const scriptMatch = html.match(/<script[^>]*id="js-initialData"[^>]*>([^<]*)<\/script>/);
      if (!scriptMatch) {
        logger.warn('未找到知乎热榜数据脚本标签', 'ZhihuDataSource');
        return items;
      }

      const jsonStr = scriptMatch[1].trim();
      const data: ZhihuHotData = JSON.parse(jsonStr);

      const hotList = data?.initialState?.topstory?.hotList;
      if (!Array.isArray(hotList)) {
        logger.warn('知乎热榜数据格式不正确', 'ZhihuDataSource');
        return items;
      }

      for (let i = 0; i < hotList.length; i++) {
        const item = hotList[i];
        if (!item || !item.target) continue;

        const target = item.target;
        const title = target.titleArea?.text || '';
        const excerpt = target.excerptArea?.text || '';
        const metricsText = target.metricsArea?.text || '';

        // 提取热度值
        const heatMatch = metricsText.match(/(\d+(?:\.\d+)?)\s*万?热度/);
        let heatValue: number | undefined;
        if (heatMatch) {
          heatValue = parseFloat(heatMatch[1]);
          if (metricsText.includes('万')) {
            heatValue *= 10000;
          }
        }

        // 构建URL
        const url = target.url || `https://www.zhihu.com/question/${target.id}`;

        items.push({
          id: item.id || String(target.id),
          title,
          url,
          rank: i + 1,
          heatValue,
          excerpt,
        });
      }
    } catch (error) {
      logger.error('解析知乎热榜JSON数据失败', 'ZhihuDataSource', error as Error);
    }

    return items;
  }

  private generateRandomIP(): string {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  private generateCookie(): string {
    const timestamp = Date.now();
    return [
      `d_c0=${Buffer.from(`AFAg${Math.random().toString(36).substring(2)}`).toString('base64')}`,
      `_zap=${Math.random().toString(36).substring(2)}`,
      `_xsrf=${Math.random().toString(36).substring(2, 18)}`,
      `KLBRSID=${Math.random().toString(36).substring(2, 10)}|${timestamp}`,
      'has_recent_activity=1',
    ].join('; ');
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
