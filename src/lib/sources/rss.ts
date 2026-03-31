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
        name: 'BBC Technology',
        url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
        category: '科技新闻',
      },
      {
        name: 'TechCrunch',
        url: 'https://techcrunch.com/feed/',
        category: '科技新闻',
      },
      {
        name: 'The Verge',
        url: 'https://www.theverge.com/rss/index.xml',
        category: '科技新闻',
      },
      {
        name: 'Wired',
        url: 'https://www.wired.com/feed/rss',
        category: '科技新闻',
      },
      {
        name: 'Ars Technica',
        url: 'https://feeds.arstechnica.com/arstechnica/index',
        category: '科技新闻',
      },
      {
        name: 'Engadget',
        url: 'https://www.engadget.com/rss.xml',
        category: '科技新闻',
      },
      {
        name: 'Hacker News',
        url: 'https://hnrss.org/frontpage',
        category: '技术社区',
      },
      {
        name: 'GitHub Trending',
        url: 'https://mshibanami.github.io/GitHubTrendingRSS/daily.xml',
        category: '开源项目',
      },
    ],
    limit: 20,
    minContentLength: 50,
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

    if (!keywords || keywords.length === 0) {
      return [];
    }

    console.log(`📡 RSSDataSource: 开始搜索关键词:`, keywords);

    for (const feed of feeds) {
      try {
        console.log(`   - 获取 RSS 源: ${feed.name}...`);
        const items = await this.fetchFeed(feed.url, config);
        console.log(`     获取到 ${items.length} 条文章`);
        
        let matched = 0;
        for (const item of items) {
          if (!this.isValidItem(item, config)) {
            continue;
          }

          const hotspot = this.itemToHotspot(item, feed);
          if (this.isValidContent(hotspot) && this.matchesKeywords(hotspot, keywords)) {
            hotspots.push(hotspot);
            matched++;
          }
        }
        console.log(`     匹配到 ${matched} 条相关文章`);
      } catch (error) {
        console.error(`获取 RSS 源 ${feed.name} 失败:`, error);
      }
    }

    console.log(`✅ RSSDataSource: 共获取 ${hotspots.length} 条热点`);
    return hotspots;
  }

  private async fetchFeed(url: string, config: RSSConfig): Promise<any[]> {
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const parsed = await parseStringPromise(response.data);
      const items = parsed.rss?.channel[0]?.item || parsed.feed?.entry || [];
      return items.slice(0, config.limit || 20);
    } catch (error) {
      console.error('RSS 解析失败:', error);
      return [];
    }
  }

  private isValidItem(item: any, config: RSSConfig): boolean {
    const content = this.extractContent(item);
    if (content.length < (config.minContentLength || 50)) {
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
      views: 100,
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
    if (item.summary && item.summary[0]) {
      return item.summary[0];
    }
    return '';
  }

  private extractLink(item: any): string {
    if (item.link && typeof item.link === 'string') {
      return item.link;
    }
    if (item.link && item.link[0]) {
      if (typeof item.link[0] === 'string') {
        return item.link[0];
      }
      if (item.link[0].$.href) {
        return item.link[0].$.href;
      }
    }
    if (item.guid && item.guid[0]) {
      return item.guid[0];
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
    if (item.updated && item.updated[0]) {
      return new Date(item.updated[0]);
    }
    return new Date();
  }

  private isValidContent(hotspot: SourceHotspot): boolean {
    return hotspot.title.length > 0 && hotspot.content.length > 0;
  }

  private matchesKeywords(hotspot: SourceHotspot, keywords: string[]): boolean {
    const titleLower = hotspot.title.toLowerCase();
    const contentLower = hotspot.content.toLowerCase();
    
    return keywords.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      return titleLower.includes(keywordLower) || contentLower.includes(keywordLower);
    });
  }

  private calculateHeatScore(data: { views: number; ageHours: number }): number {
    let score = 30;
    score += Math.min(data.views / 10, 50);
    if (data.ageHours < 24) {
      score += 20;
    } else if (data.ageHours < 72) {
      score += 10;
    }
    return Math.min(Math.round(score), 100);
  }
}
