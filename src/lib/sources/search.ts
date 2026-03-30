import axios from 'axios';
import { BaseDataSource, SourceHotspot, SourceConfig } from './base';

export interface SearchConfig extends SourceConfig {
  engines?: Array<{
    name: string;
    url: string;
    selector: string;
  }>;
  limit?: number;
  timeout?: number;
}

export class SearchDataSource extends BaseDataSource {
  readonly name = 'Search';
  readonly type = 'search';
  readonly defaultConfig: SearchConfig = {
    engines: [
      {
        name: 'Bing',
        url: 'https://www.bing.com/search?q={query}',
        selector: '.b_algo',
      },
      {
        name: '百度',
        url: 'https://www.baidu.com/s?wd={query}',
        selector: '.result',
      },
    ],
    limit: 10,
    timeout: 10000,
  };
  readonly defaultWeight = 1.2;
  readonly defaultMinScore = 20;

  constructor(config?: SearchConfig) {
    super(config);
  }

  async fetch(keywords?: string[]): Promise<SourceHotspot[]> {
    const config = this.config as SearchConfig;
    const engines = config.engines || this.defaultConfig.engines;
    const hotspots: SourceHotspot[] = [];

    if (!keywords || keywords.length === 0) {
      return [];
    }

    for (const keyword of keywords) {
      for (const engine of engines) {
        try {
          // 检查是否是账号/博主/官方
          const accountInfo = await this.checkAccount(keyword, engine);
          if (accountInfo) {
            hotspots.push(accountInfo);
            continue;
          }

          // 普通搜索
          const results = await this.search(keyword, engine, config);
          hotspots.push(...results);
        } catch (error) {
          console.error(`搜索 ${keyword} 失败:`, error);
        }
      }
    }

    return hotspots;
  }

  private async checkAccount(keyword: string, engine: { name: string; url: string }): Promise<SourceHotspot | null> {
    const accountPatterns = [
      /^(.*?)\s*(@[\w\u4e00-\u9fa5]+)$/,
      /^(.*?)\s*(官方|账号|博主|频道)$/,
      /^@[\w\u4e00-\u9fa5]+$/,
    ];

    for (const pattern of accountPatterns) {
      if (pattern.test(keyword)) {
        const accountName = keyword.match(pattern)?.[1] || keyword;
        return {
          title: `${accountName} 官方账号`,
          content: `正在获取 ${accountName} 的最新信息...`,
          source: engine.name,
          sourceUrl: engine.url.replace('{query}', encodeURIComponent(keyword)),
          sourceId: `account_${keyword}`,
          category: '账号信息',
          heatScore: 60,
          publishedAt: new Date(),
          metadata: {
            accountType: 'official',
            keyword,
          },
        };
      }
    }

    return null;
  }

  private async search(keyword: string, engine: { name: string; url: string; selector: string }, config: SearchConfig): Promise<SourceHotspot[]> {
    try {
      const response = await axios.get(engine.url.replace('{query}', encodeURIComponent(keyword)), {
        timeout: config.timeout || 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const hotspots: SourceHotspot[] = [];
      
      // 简单的HTML解析
      const html = response.data;
      const links = this.extractLinks(html, engine.name);

      for (const link of links.slice(0, config.limit || 10)) {
        if (!link.title || !link.url) continue;

        const hotspot: SourceHotspot = {
          title: link.title,
          content: link.description || '',
          source: engine.name,
          sourceUrl: link.url,
          sourceId: `search_${encodeURIComponent(link.url)}`,
          category: '搜索结果',
          heatScore: this.calculateSearchScore(link),
          publishedAt: new Date(),
          metadata: {
            keyword,
            engine: engine.name,
          },
        };

        if (this.isValidContent(hotspot)) {
          hotspots.push(hotspot);
        }
      }

      return hotspots;
    } catch (error) {
      console.error('搜索失败:', error);
      return [];
    }
  }

  private extractLinks(html: string, engine: string): Array<{ title: string; url: string; description?: string }> {
    const links: Array<{ title: string; url: string; description?: string }> = [];

    if (engine === 'Bing') {
      const regex = /<li class="b_algo">(.*?)<\/li>/gs;
      let match;
      while ((match = regex.exec(html)) !== null) {
        const item = match[1];
        const titleMatch = item.match(/<h2><a href="([^"]+)"[^>]*>(.*?)<\/a><\/h2>/s);
        const descMatch = item.match(/<p class="b_lineclamp2">(.*?)<\/p>/s);
        if (titleMatch) {
          links.push({
            title: titleMatch[2].replace(/<[^>]*>/g, ''),
            url: titleMatch[1],
            description: descMatch ? descMatch[1].replace(/<[^>]*>/g, '') : undefined,
          });
        }
      }
    } else if (engine === '百度') {
      const regex = /<div class="result c-container"[^>]*>(.*?)<\/div>/gs;
      let match;
      while ((match = regex.exec(html)) !== null) {
        const item = match[1];
        const titleMatch = item.match(/<h3 class="t"><a href="([^"]+)"[^>]*>(.*?)<\/a><\/h3>/s);
        const descMatch = item.match(/<div class="c-abstract">(.*?)<\/div>/s);
        if (titleMatch) {
          links.push({
            title: titleMatch[2].replace(/<[^>]*>/g, ''),
            url: titleMatch[1],
            description: descMatch ? descMatch[1].replace(/<[^>]*>/g, '') : undefined,
          });
        }
      }
    }

    return links;
  }

  private calculateSearchScore(link: { title: string; description?: string }): number {
    let score = 20;
    
    if (link.title.length > 30) score += 5;
    if (link.description && link.description.length > 100) score += 5;
    
    return score;
  }
}
