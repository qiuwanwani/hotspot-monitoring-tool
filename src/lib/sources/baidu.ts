import axios from 'axios';
import { BaseDataSource, SourceHotspot, SourceConfig } from './base';
import { logger } from '../logger';

export interface BaiduConfig extends SourceConfig {
  limit?: number;
}

interface BaiduHotItem {
  index: number;
  title: string;
  desc: string;
  pic: string;
  url: string;
  hot: string;
  hotScore: number;
}

export class BaiduDataSource extends BaseDataSource {
  readonly name = '百度热点';
  readonly type = 'baidu';
  readonly defaultConfig: BaiduConfig = {
    limit: 20,
  };
  readonly defaultWeight = 1.4;
  readonly defaultMinScore = 30;

  private readonly API_URL = 'https://top.baidu.com/board?tab=realtime';

  constructor(config?: BaiduConfig) {
    super(config);
    this.initConfig(config);
  }

  async fetch(keywords?: string[]): Promise<SourceHotspot[]> {
    // 没有关键词时不抓取数据
    if (!keywords || keywords.length === 0) {
      return [];
    }

    try {
      const html = await this.fetchPage();
      const items = this.parseItems(html);
      const hotspots: SourceHotspot[] = [];

      for (const item of items) {
        const hotspot = this.itemToHotspot(item);
        if (this.isValidContent(hotspot) && this.matchesKeywords(hotspot, keywords)) {
          hotspots.push(hotspot);
        }
      }

      logger.info(`百度热点获取完成: ${hotspots.length} 条`, 'BaiduDataSource');
      return hotspots;
    } catch (error) {
      logger.error('百度热点获取失败', 'BaiduDataSource', error as Error);
      return [];
    }
  }

  private async fetchPage(): Promise<string> {
    const randomIP = this.generateRandomIP();
    
    const response = await axios.get(this.API_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'CLIENT-IP': randomIP,
        'X-FORWARDED-FOR': randomIP,
        'Referer': 'https://www.baidu.com',
      },
      timeout: 10000,
      responseType: 'text',
    });

    return response.data;
  }

  private parseItems(html: string): BaiduHotItem[] {
    const items: BaiduHotItem[] = [];
    
    // 清理 HTML
    const cleanedHtml = html.replace(/[\n\r]/g, '').replace(/\s+/g, ' ');
    
    // 提取 JSON 数据
    const jsonMatch = cleanedHtml.match(/<script[^>]*id="sanRoot"[^>]*>(.*?)<\/script>/);
    if (!jsonMatch) {
      logger.warn('未找到百度热点数据', 'BaiduDataSource');
      return items;
    }

    try {
      const jsonStr = jsonMatch[1].replace('window._SSR_HYDRATED_DATA=', '').replace(/;\s*$/, '');
      const data = JSON.parse(jsonStr);
      
      const cards = data?.data?.cards || [];
      for (const card of cards) {
        const content = card?.content || [];
        for (let i = 0; i < content.length && items.length < (this.config as BaiduConfig).limit!; i++) {
          const item = content[i];
          items.push({
            index: i + 1,
            title: item.word || '',
            desc: item.desc || '',
            pic: item.img || '',
            url: item.url || '',
            hot: item.hotScore ? `${item.hotScore}万` : '',
            hotScore: parseInt(item.hotScore) || 0,
          });
        }
      }
    } catch (error) {
      logger.error('解析百度热点数据失败', 'BaiduDataSource', error as Error);
    }

    return items;
  }

  private itemToHotspot(item: BaiduHotItem): SourceHotspot {
    return {
      title: item.title,
      content: item.desc,
      source: '百度热点',
      sourceUrl: item.url,
      sourceId: `baidu_${Date.now()}_${item.index}`,
      category: '热搜',
      heatScore: this.calculateHeatScore(item),
      publishedAt: new Date(),
      metadata: {
        index: item.index,
        hot: item.hot,
        pic: item.pic,
      },
    };
  }

  private calculateHeatScore(item: BaiduHotItem): number {
    // 基础分 + 排名权重 + 热度分
    let score = 30;
    
    // 排名越靠前分数越高
    if (item.index <= 3) score += 30;
    else if (item.index <= 10) score += 20;
    else if (item.index <= 20) score += 10;
    
    // 热度分数
    if (item.hotScore > 500) score += 20;
    else if (item.hotScore > 300) score += 15;
    else if (item.hotScore > 100) score += 10;
    else if (item.hotScore > 50) score += 5;
    
    return Math.min(score, 100);
  }

  private generateRandomIP(): string {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }
}
