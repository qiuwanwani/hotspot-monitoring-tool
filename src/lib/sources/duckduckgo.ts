import axios from 'axios';
import { BaseDataSource, SourceHotspot, SourceConfig } from './base';
import { logger } from '../logger';

export interface DuckDuckGoConfig extends SourceConfig {
  limit?: number;
  region?: string;
  safeSearch?: 'off' | 'moderate' | 'strict';
}

interface DuckDuckGoResult {
  title: string;
  link: string;
  snippet: string;
}

export class DuckDuckGoDataSource extends BaseDataSource {
  readonly name = 'DuckDuckGo';
  readonly type = 'duckduckgo';
  readonly defaultConfig: DuckDuckGoConfig = {
    limit: 10,
    region: 'zh-CN',
    safeSearch: 'off',
  };
  readonly defaultWeight = 1.3;
  readonly defaultMinScore = 20;

  private readonly API_BASE = 'https://html.duckduckgo.com/html/';

  constructor(config?: DuckDuckGoConfig) {
    super(config);
    this.initConfig(config);
  }

  async fetch(keywords?: string[]): Promise<SourceHotspot[]> {
    // 没有关键词时不抓取数据
    if (!keywords || keywords.length === 0) {
      return [];
    }

    const config = this.config as DuckDuckGoConfig;
    const hotspots: SourceHotspot[] = [];

    for (const keyword of keywords) {
      try {
        const results = await this.search(keyword, config);
        for (const result of results) {
          const hotspot = this.resultToHotspot(result, keyword);
          if (this.isValidContent(hotspot) && this.matchesKeywords(hotspot, [keyword])) {
            hotspots.push(hotspot);
          }
        }
      } catch (error) {
        logger.error(`DuckDuckGo 搜索失败: ${keyword}`, 'DuckDuckGoDataSource', error as Error);
      }
    }

    return hotspots;
  }

  private async search(keyword: string, config: DuckDuckGoConfig): Promise<DuckDuckGoResult[]> {
    const response = await axios.get(this.API_BASE, {
      params: {
        q: keyword,
        kl: config.region || 'zh-CN',
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      timeout: 15000,
    });

    return this.parseResults(response.data);
  }

  private parseResults(html: string): DuckDuckGoResult[] {
    const results: DuckDuckGoResult[] = [];

    // 使用正则表达式解析 DuckDuckGo HTML 结果
    const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
    const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/gi;

    let match;
    const links: string[] = [];
    const titles: string[] = [];

    // 提取链接和标题
    while ((match = resultRegex.exec(html)) !== null) {
      let link = match[1];
      // DuckDuckGo 使用重定向链接，需要解码
      if (link.startsWith('//duckduckgo.com/l/?')) {
        const urlMatch = link.match(/uddg=([^&]+)/);
        if (urlMatch) {
          link = decodeURIComponent(urlMatch[1]);
        }
      }
      links.push(link);

      // 提取标题（去除 HTML 标签）
      const title = match[2].replace(/<[^>]+>/g, '').trim();
      titles.push(title);
    }

    // 提取摘要
    const snippets: string[] = [];
    while ((match = snippetRegex.exec(html)) !== null) {
      const snippet = match[1].replace(/<[^>]+>/g, '').trim();
      snippets.push(snippet);
    }

    // 组合结果
    for (let i = 0; i < links.length && i < (this.config as DuckDuckGoConfig).limit!; i++) {
      results.push({
        title: titles[i] || '',
        link: links[i] || '',
        snippet: snippets[i] || '',
      });
    }

    return results;
  }

  private resultToHotspot(result: DuckDuckGoResult, keyword: string): SourceHotspot {
    return {
      title: result.title,
      content: result.snippet,
      source: 'DuckDuckGo',
      sourceUrl: result.link,
      sourceId: `ddg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category: '搜索结果',
      heatScore: this.calculateHeatScore(result, keyword),
      publishedAt: new Date(),
      metadata: {
        searchKeyword: keyword,
      },
    };
  }

  private calculateHeatScore(result: DuckDuckGoResult, keyword: string): number {
    let score = 30; // 基础分

    // 标题包含关键词加分
    if (result.title.toLowerCase().includes(keyword.toLowerCase())) {
      score += 20;
    }

    // 摘要包含关键词加分
    if (result.snippet.toLowerCase().includes(keyword.toLowerCase())) {
      score += 10;
    }

    // 标题长度适中加分
    if (result.title.length > 10 && result.title.length < 100) {
      score += 5;
    }

    // 摘要长度适中加分
    if (result.snippet.length > 20 && result.snippet.length < 300) {
      score += 5;
    }

    return Math.min(score, 100);
  }
}
