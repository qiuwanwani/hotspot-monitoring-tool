import axios from 'axios';
import { parse } from 'node-html-parser';
import { BaseDataSource, SourceHotspot, SourceConfig } from './base';

export interface WebScraperConfig extends SourceConfig {
  sites?: Array<{
    name: string;
    url: string;
    category: string;
    selectors: {
      list: string;
      title: string;
      link: string;
      summary?: string;
      date?: string;
    };
  }>;
  limit?: number;
}

export class WebScraperDataSource extends BaseDataSource {
  readonly name = 'WebScraper';
  readonly type = 'web-scraper';
  readonly defaultConfig: WebScraperConfig = {
    sites: [
      {
        name: '36氪',
        url: 'https://36kr.com/newsflashes',
        category: '科技新闻',
        selectors: {
          list: '.newsflash-item',
          title: 'h3 a',
          link: 'h3 a',
          summary: '.newsflash-desc',
          date: '.newsflash-time',
        },
      },
      {
        name: '科技日报',
        url: 'http://www.stdaily.com/',
        category: '科技新闻',
        selectors: {
          list: '.news-list li',
          title: 'a',
          link: 'a',
          summary: 'p',
          date: '.time',
        },
      },
      {
        name: '新浪科技',
        url: 'https://tech.sina.com.cn/',
        category: '科技新闻',
        selectors: {
          list: '.news-item',
          title: 'a',
          link: 'a',
          summary: '.desc',
          date: '.time',
        },
      },
      {
        name: '网易科技',
        url: 'https://tech.163.com/',
        category: '科技新闻',
        selectors: {
          list: '.news-item',
          title: 'a',
          link: 'a',
          summary: '.desc',
          date: '.time',
        },
      },
      {
        name: '腾讯科技',
        url: 'https://tech.qq.com/',
        category: '科技新闻',
        selectors: {
          list: '.list li',
          title: 'a',
          link: 'a',
          summary: 'p',
          date: '.time',
        },
      },
    ],
    limit: 20,
  };
  readonly defaultWeight = 1.5;
  readonly defaultMinScore = 25;

  constructor(config?: WebScraperConfig) {
    super(config);
  }

  async fetch(keywords?: string[]): Promise<SourceHotspot[]> {
    const config = this.config as WebScraperConfig;
    const sites = config.sites || this.defaultConfig.sites;
    const hotspots: SourceHotspot[] = [];

    if (!keywords || keywords.length === 0) {
      return [];
    }

    console.log(`🌐 WebScraperDataSource: 开始搜索关键词:`, keywords);

    for (const site of sites) {
      try {
        console.log(`   - 爬取网站: ${site.name}...`);
        const items = await this.scrapeSite(site, config);
        console.log(`     获取到 ${items.length} 条文章`);
        
        let matched = 0;
        for (const item of items) {
          const hotspot = this.itemToHotspot(item, site);
          if (this.matchesKeywords(hotspot, keywords)) {
            hotspots.push(hotspot);
            matched++;
          }
        }
        console.log(`     匹配到 ${matched} 条相关文章`);
      } catch (error) {
        console.error(`爬取网站 ${site.name} 失败:`, error);
      }
    }

    console.log(`✅ WebScraperDataSource: 共获取 ${hotspots.length} 条热点`);
    return hotspots;
  }

  private async scrapeSite(
    site: NonNullable<WebScraperConfig['sites']>[0],
    config: WebScraperConfig
  ): Promise<any[]> {
    try {
      const response = await axios.get(site.url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
      });

      const root = parse(response.data);
      const items: any[] = [];

      const listElements = root.querySelectorAll(site.selectors.list);
      const limit = config.limit || 20;

      for (let i = 0; i < Math.min(listElements.length, limit); i++) {
        const item = listElements[i];
        
        const titleElement = item.querySelector(site.selectors.title);
        const title = titleElement?.text.trim() || '';
        
        const linkElement = item.querySelector(site.selectors.link);
        let link = linkElement?.getAttribute('href') || '';
        
        const summary = site.selectors.summary 
          ? item.querySelector(site.selectors.summary)?.text.trim() 
          : '';
        const dateStr = site.selectors.date 
          ? item.querySelector(site.selectors.date)?.text.trim() 
          : '';

        if (link && !link.startsWith('http')) {
          try {
            link = new URL(link, site.url).href;
          } catch (e) {
            continue;
          }
        }

        if (title && link) {
          items.push({
            title,
            link,
            summary: summary || '',
            dateStr: dateStr || '',
          });
        }
      }

      return items;
    } catch (error) {
      console.error(`爬取失败:`, error);
      return [];
    }
  }

  private itemToHotspot(
    item: { title: string; link: string; summary: string; dateStr: string },
    site: NonNullable<WebScraperConfig['sites']>[0]
  ): SourceHotspot {
    const publishedAt = this.parseDate(item.dateStr);
    const ageHours = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);

    const heatScore = this.calculateHeatScore({
      views: 100,
      ageHours,
    });

    return {
      title: item.title,
      content: item.summary || item.title,
      source: site.name,
      sourceUrl: item.link,
      sourceId: item.link,
      category: site.category,
      heatScore,
      publishedAt,
      metadata: {
        site: site.name,
      },
    };
  }

  private parseDate(dateStr: string): Date {
    if (!dateStr) {
      return new Date();
    }

    const now = new Date();
    
    if (dateStr.includes('分钟前')) {
      const minutes = parseInt(dateStr) || 0;
      return new Date(now.getTime() - minutes * 60 * 1000);
    }
    
    if (dateStr.includes('小时前')) {
      const hours = parseInt(dateStr) || 0;
      return new Date(now.getTime() - hours * 60 * 60 * 1000);
    }
    
    if (dateStr.includes('天前')) {
      const days = parseInt(dateStr) || 0;
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }

    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
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
