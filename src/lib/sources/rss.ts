import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { BaseDataSource, SourceHotspot, SourceConfig } from './base';

export interface RSSConfig extends SourceConfig {
  feeds?: Array<{
    name: string;
    url: string;
    category: string;
  }>;
  limit?: number;
  minContentLength?: number;
}

export class RSSDataSource extends BaseDataSource {
  readonly name = 'RSS';
  readonly type = 'rss';
  readonly defaultConfig: RSSConfig = {
    feeds: [
      {
        name: '36氪',
        url: 'https://36kr.com/feed',
        category: '科技新闻',
      },
      {
        name: '钛媒体',
        url: 'https://www.tmtpost.com/rss',
        category: '科技新闻',
      },
      {
        name: '虎嗅',
        url: 'https://www.huxiu.com/rss/0.xml',
        category: '科技评论',
      },
      {
        name: '极客公园',
        url: 'https://www.geekpark.net/rss',
        category: '科技资讯',
      },
      {
        name: '爱范儿',
        url: 'https://www.ifanr.com/feed',
        category: '科技生活',
      },
      {
        name: '雷锋网',
        url: 'https://www.leiphone.com/feed',
        category: '人工智能',
      },
      {
        name: '机器之心',
        url: 'https://www.jiqizhixin.com/feed',
        category: '人工智能',
      },
      {
        name: 'InfoQ',
        url: 'https://www.infoq.cn/feed',
        category: '技术社区',
      },
      {
        name: '掘金',
        url: 'https://juejin.cn/rss',
        category: '技术社区',
      },
      {
        name: 'CSDN',
        url: 'https://blog.csdn.net/rss/list',
        category: '技术社区',
      },
    ],
    limit: 15,
    minContentLength: 100,
  };
  readonly defaultWeight = 1.5;
  readonly defaultMinScore = 25;

  constructor(config?: RSSConfig) {
    super(config);
  }

  async fetch(keywords?: string[]): Promise<SourceHotspot[]> {
    const config = this.config as RSSConfig;
    const feeds = config.feeds || this.defaultConfig.feeds;
    const hotspots: SourceHotspot[] = [];

    for (const feed of feeds) {
      try {
        const items = await this.fetchFeed(feed.url, config);
        for (const item of items) {
          if (!this.isValidItem(item, config)) {
            continue;
          }

          const hotspot = this.itemToHotspot(item, feed);
          if (this.isValidContent(hotspot) && this.matchesKeywords(hotspot, keywords)) {
            hotspots.push(hotspot);
          }
        }
      } catch (error) {
        console.error(`获取 RSS 源 ${feed.name} 失败:`, error);
      }
    }

    return hotspots;
  }

  private async fetchFeed(url: string, config: RSSConfig): Promise<any[]> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const parsed = await parseStringPromise(response.data);
      const items = parsed.rss?.channel[0]?.item || parsed.feed?.entry || [];
      return items.slice(0, config.limit || 15);
    } catch (error) {
      console.error('RSS 解析失败:', error);
      return [];
    }
  }

  private isValidItem(item: any, config: RSSConfig): boolean {
    const content = this.extractContent(item);
    if (content.length < (config.minContentLength || 100)) {
      return false;
    }

    return true;
  }

  private itemToHotspot(item: any, feed: { name: string; category: string }): SourceHotspot {
    const title = this.extractTitle(item);
    const content = this.extractContent(item);
    const link = this.extractLink(item);
    const publishedAt = this.extractDate(item);
    const ageHours = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);

    const heatScore = this.calculateHeatScore({
      views: 100, // RSS 没有直接的互动数据，使用默认值
      ageHours,
    });

    return {
      title,
      content,
      source: feed.name,
      sourceUrl: link,
      sourceId: link,
      category: feed.category,
      heatScore,
      publishedAt,
      metadata: {
        feed: feed.name,
      },
    };
  }

  private extractTitle(item: any): string {
    if (item.title && typeof item.title === 'string') {
      return item.title;
    }
    if (item.title && item.title[0]) {
      return item.title[0];
    }
    return '未命名';
  }

  private extractContent(item: any): string {
    if (item.description && typeof item.description === 'string') {
      return item.description;
    }
    if (item.description && item.description[0]) {
      return item.description[0];
    }
    if (item.content && item.content[0] && item.content[0]._) {
      return item.content[0]._;
    }
    return '';
  }

  private extractLink(item: any): string {
    if (item.link && typeof item.link === 'string') {
      return item.link;
    }
    if (item.link && item.link[0]) {
      return item.link[0];
    }
    if (item.link && item.link[0] && item.link[0]._) {
      return item.link[0]._;
    }
    return '';
  }

  private extractDate(item: any): Date {
    if (item.pubDate && item.pubDate[0]) {
      return new Date(item.pubDate[0]);
    }
    if (item.published && item.published[0]) {
      return new Date(item.published[0]);
    }
    return new Date();
  }

  private matchesKeywords(hotspot: SourceHotspot, keywords?: string[]): boolean {
    if (!keywords || keywords.length === 0) {
      return true;
    }

    const searchText = `${hotspot.title} ${hotspot.content || ''}`.toLowerCase();
    return keywords.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
  }
}
