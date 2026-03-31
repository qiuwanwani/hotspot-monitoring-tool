import axios from 'axios';
import { parse } from 'node-html-parser';
import { BaseDataSource, SourceHotspot, SourceConfig } from './base';

export interface SearchConfig extends SourceConfig {
  engines?: Array<{
    name: string;
    type: string;
  }>;
  limit?: number;
  timeout?: number;
}

export class SearchDataSource extends BaseDataSource {
  readonly name = 'Search';
  readonly type = 'search';
  readonly defaultConfig: SearchConfig = {
    engines: [
      { name: 'Hacker News', type: 'hackernews' },
      { name: 'Bing News', type: 'bing-news' },
    ],
    limit: 15,
    timeout: 30000,
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

    console.log(`🔍 SearchDataSource: 开始搜索关键词:`, keywords);

    for (const keyword of keywords) {
      for (const engine of engines) {
        try {
          console.log(`   - 搜索 ${keyword} 使用 ${engine.name}...`);
          let results: SourceHotspot[] = [];
          
          switch (engine.type) {
            case 'google':
              results = await this.fetchGoogle(keyword, config);
              break;
            case 'bing':
              results = await this.fetchBing(keyword, config);
              break;
            case 'duckduckgo':
              results = await this.fetchDuckDuckGo(keyword, config);
              break;
            case 'hackernews':
              results = await this.fetchHackerNews(keyword, config);
              break;
            case 'reddit':
              results = await this.fetchReddit(keyword, config);
              break;
            case 'bing-news':
              results = await this.fetchBingNews(keyword, config);
              break;
            default:
              results = await this.fetchGoogle(keyword, config);
          }

          console.log(`     获取到 ${results.length} 条结果`);
          hotspots.push(...results);
        } catch (error) {
          console.error(`搜索 ${keyword} (${engine.name}) 失败:`, error);
        }
      }
    }

    console.log(`✅ SearchDataSource: 共获取 ${hotspots.length} 条热点`);
    return hotspots;
  }

  private async fetchHackerNews(keyword: string, config: SearchConfig): Promise<SourceHotspot[]> {
    try {
      const searchUrl = `http://hn.algolia.com/api/v1/search?query=${encodeURIComponent(keyword)}&tags=story&hitsPerPage=${config.limit || 15}`;
      console.log(`     访问: ${searchUrl}`);
      const response = await axios.get(searchUrl, {
        timeout: config.timeout || 15000,
      });

      const hotspots: SourceHotspot[] = [];
      
      for (const hit of response.data.hits || []) {
        const title = hit.title || '';
        const url = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
        const ageHours = (Date.now() - new Date(hit.created_at).getTime()) / (1000 * 60 * 60);

        const hotspot: SourceHotspot = {
          title,
          content: hit.story_text ? hit.story_text.substring(0, 500) : '',
          source: 'Hacker News',
          sourceUrl: url,
          sourceId: `hn_${hit.objectID}`,
          category: '科技资讯',
          heatScore: this.calculateHeatScore({
            points: hit.points || 0,
            comments: hit.num_comments || 0,
            ageHours,
          }),
          publishedAt: hit.created_at ? new Date(hit.created_at) : new Date(),
          author: hit.author,
          metadata: {
            keyword,
            engine: 'hackernews',
            points: hit.points,
            comments: hit.num_comments,
          },
        };

        if (this.isValidContent(hotspot)) {
          hotspots.push(hotspot);
        }
      }

      return hotspots;
    } catch (error) {
      console.error('Hacker News 搜索失败:', error);
      return [];
    }
  }

  private async fetchBingNews(keyword: string, config: SearchConfig): Promise<SourceHotspot[]> {
    try {
      const searchUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(keyword)}&count=${config.limit || 15}&form=PTFTNR&cc=cn&setlang=zh-CN`;
      console.log(`     访问: ${searchUrl}`);
      const response = await axios.get(searchUrl, {
        timeout: config.timeout || 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
      });

      const hotspots: SourceHotspot[] = [];
      const root = parse(response.data);
      
      const allLinks = root.querySelectorAll('a');
      
      for (let i = 0; i < Math.min(allLinks.length, config.limit || 30); i++) {
        const linkEl = allLinks[i];
        const title = linkEl?.text.trim() || '';
        const link = linkEl?.getAttribute('href') || '';
        
        if (!title || title.length < 10 || !link || !link.includes('http')) continue;
        if (link.includes('bing.com') || link.includes('microsoft.com')) continue;
        
        const isDuplicate = hotspots.some(h => h.sourceUrl === link);
        if (isDuplicate) continue;

        const hotspot: SourceHotspot = {
          title,
          content: '',
          source: 'Bing News',
          sourceUrl: link,
          sourceId: `bing_${encodeURIComponent(link)}`,
          category: '新闻资讯',
          heatScore: this.calculateHeatScore({
            views: 100,
            ageHours: 2,
          }),
          publishedAt: new Date(),
          metadata: {
            keyword,
            engine: 'bing-news',
          },
        };

        if (this.isValidContent(hotspot)) {
          hotspots.push(hotspot);
          if (hotspots.length >= (config.limit || 15)) break;
        }
      }

      console.log(`     Bing News获取到 ${hotspots.length} 条结果`);
      return hotspots;
    } catch (error) {
      console.error('Bing News 搜索失败:', error);
      return [];
    }
  }

  private async fetchGoogle(keyword: string, config: SearchConfig): Promise<SourceHotspot[]> {
    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=${config.limit || 15}&hl=zh-CN`;
      console.log(`     访问: ${searchUrl}`);
      const response = await axios.get(searchUrl, {
        timeout: config.timeout || 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
      });

      const hotspots: SourceHotspot[] = [];
      const root = parse(response.data);
      
      const resultElements = root.querySelectorAll('.g');
      
      for (let i = 0; i < Math.min(resultElements.length, config.limit || 15); i++) {
        const result = resultElements[i];
        
        const titleEl = result.querySelector('h3');
        const title = titleEl?.text.trim() || '';
        
        const linkEl = result.querySelector('a');
        const link = linkEl?.getAttribute('href') || '';
        
        const snippetEl = result.querySelector('.VwiC3b');
        const content = snippetEl?.text.trim() || '';
        
        if (!title || title.length < 10 || !link || !link.includes('http')) continue;
        if (link.includes('google.com')) continue;
        
        const isDuplicate = hotspots.some(h => h.sourceUrl === link);
        if (isDuplicate) continue;

        const hotspot: SourceHotspot = {
          title,
          content: content.substring(0, 500),
          source: 'Google Search',
          sourceUrl: link,
          sourceId: `google_${encodeURIComponent(link)}`,
          category: '网络搜索',
          heatScore: this.calculateHeatScore({
            views: 100,
            ageHours: 2,
          }),
          publishedAt: new Date(),
          metadata: {
            keyword,
            engine: 'google',
          },
        };

        if (this.isValidContent(hotspot)) {
          hotspots.push(hotspot);
        }
      }

      console.log(`     Google Search获取到 ${hotspots.length} 条结果`);
      return hotspots;
    } catch (error) {
      console.error('Google Search 搜索失败:', error);
      return [];
    }
  }

  private async fetchBing(keyword: string, config: SearchConfig): Promise<SourceHotspot[]> {
    try {
      const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(keyword)}&count=${config.limit || 15}&form=QBLH&cc=cn&setlang=zh-CN`;
      console.log(`     访问: ${searchUrl}`);
      const response = await axios.get(searchUrl, {
        timeout: config.timeout || 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
      });

      const hotspots: SourceHotspot[] = [];
      const root = parse(response.data);
      
      const resultElements = root.querySelectorAll('.b_algo');
      
      for (let i = 0; i < Math.min(resultElements.length, config.limit || 15); i++) {
        const result = resultElements[i];
        
        const titleEl = result.querySelector('h2 a');
        const title = titleEl?.text.trim() || '';
        
        const link = titleEl?.getAttribute('href') || '';
        
        const snippetEl = result.querySelector('.b_caption p');
        const content = snippetEl?.text.trim() || '';
        
        if (!title || title.length < 10 || !link || !link.includes('http')) continue;
        if (link.includes('bing.com')) continue;
        
        const isDuplicate = hotspots.some(h => h.sourceUrl === link);
        if (isDuplicate) continue;

        const hotspot: SourceHotspot = {
          title,
          content: content.substring(0, 500),
          source: 'Bing Search',
          sourceUrl: link,
          sourceId: `bing_${encodeURIComponent(link)}`,
          category: '网络搜索',
          heatScore: this.calculateHeatScore({
            views: 100,
            ageHours: 2,
          }),
          publishedAt: new Date(),
          metadata: {
            keyword,
            engine: 'bing',
          },
        };

        if (this.isValidContent(hotspot)) {
          hotspots.push(hotspot);
        }
      }

      console.log(`     Bing Search获取到 ${hotspots.length} 条结果`);
      return hotspots;
    } catch (error) {
      console.error('Bing Search 搜索失败:', error);
      return [];
    }
  }

  private async fetchDuckDuckGo(keyword: string, config: SearchConfig): Promise<SourceHotspot[]> {
    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(keyword)}`;
      console.log(`     访问: ${searchUrl}`);
      const response = await axios.get(searchUrl, {
        timeout: config.timeout || 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const hotspots: SourceHotspot[] = [];
      const root = parse(response.data);
      
      const resultElements = root.querySelectorAll('.result');
      
      for (let i = 0; i < Math.min(resultElements.length, config.limit || 15); i++) {
        const result = resultElements[i];
        
        const titleEl = result.querySelector('.result__title a');
        const title = titleEl?.text.trim() || '';
        
        const link = titleEl?.getAttribute('href') || '';
        
        const snippetEl = result.querySelector('.result__snippet');
        const content = snippetEl?.text.trim() || '';
        
        if (!title || title.length < 10 || !link || !link.includes('http')) continue;
        if (link.includes('duckduckgo.com')) continue;
        
        const isDuplicate = hotspots.some(h => h.sourceUrl === link);
        if (isDuplicate) continue;

        const hotspot: SourceHotspot = {
          title,
          content: content.substring(0, 500),
          source: 'DuckDuckGo',
          sourceUrl: link,
          sourceId: `duckduckgo_${encodeURIComponent(link)}`,
          category: '网络搜索',
          heatScore: this.calculateHeatScore({
            views: 100,
            ageHours: 2,
          }),
          publishedAt: new Date(),
          metadata: {
            keyword,
            engine: 'duckduckgo',
          },
        };

        if (this.isValidContent(hotspot)) {
          hotspots.push(hotspot);
        }
      }

      console.log(`     DuckDuckGo获取到 ${hotspots.length} 条结果`);
      return hotspots;
    } catch (error) {
      console.error('DuckDuckGo 搜索失败:', error);
      return [];
    }
  }

  private async fetchReddit(keyword: string, config: SearchConfig): Promise<SourceHotspot[]> {
    try {
      const searchUrl = `https://www.reddit.com/search/?q=${encodeURIComponent(keyword)}&limit=${config.limit || 15}`;
      console.log(`     访问: ${searchUrl}`);
      const response = await axios.get(searchUrl, {
        timeout: config.timeout || 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const hotspots: SourceHotspot[] = [];
      const root = parse(response.data);
      
      const resultElements = root.querySelectorAll('.Post');
      
      for (let i = 0; i < Math.min(resultElements.length, config.limit || 15); i++) {
        const result = resultElements[i];
        
        const titleEl = result.querySelector('h3');
        const title = titleEl?.text.trim() || '';
        
        const linkEl = result.querySelector('a[data-click-id="body"]');
        const link = linkEl?.getAttribute('href') || '';
        
        const snippetEl = result.querySelector('.md');
        const content = snippetEl?.text.trim() || '';
        
        if (!title || title.length < 10 || !link) continue;
        
        const fullLink = link.startsWith('http') ? link : `https://www.reddit.com${link}`;
        
        const isDuplicate = hotspots.some(h => h.sourceUrl === fullLink);
        if (isDuplicate) continue;

        const hotspot: SourceHotspot = {
          title,
          content: content.substring(0, 500),
          source: 'Reddit',
          sourceUrl: fullLink,
          sourceId: `reddit_${encodeURIComponent(fullLink)}`,
          category: '社区讨论',
          heatScore: this.calculateHeatScore({
            views: 100,
            ageHours: 2,
          }),
          publishedAt: new Date(),
          metadata: {
            keyword,
            engine: 'reddit',
          },
        };

        if (this.isValidContent(hotspot)) {
          hotspots.push(hotspot);
        }
      }

      console.log(`     Reddit获取到 ${hotspots.length} 条结果`);
      return hotspots;
    } catch (error) {
      console.error('Reddit 搜索失败:', error);
      return [];
    }
  }
}
