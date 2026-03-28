import axios from 'axios';
import * as cheerio from 'cheerio';

export interface CrawledContent {
  title: string;
  content: string;
  url: string;
  source: string;
  publishedAt?: Date;
  author?: string;
}

export class WebCrawler {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  async crawl(url: string): Promise<CrawledContent | null> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      const title = this.extractTitle($);
      const content = this.extractContent($);
      const publishedAt = this.extractPublishDate($);
      const author = this.extractAuthor($);

      if (!title) {
        return null;
      }

      return {
        title,
        content,
        url,
        source: this.extractSource(url),
        publishedAt,
        author
      };
    } catch (error) {
      console.error(`爬取失败: ${url}`, error);
      return null;
    }
  }

  async crawlMultiple(urls: string[]): Promise<CrawledContent[]> {
    const results = await Promise.allSettled(
      urls.map(url => this.crawl(url))
    );

    return results
      .filter((r): r is PromiseFulfilledResult<CrawledContent | null> => 
        r.status === 'fulfilled' && r.value !== null
      )
      .map(r => r.value!);
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    const selectors = [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'h1',
      'title'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const content = element.attr('content') || element.text();
        if (content) {
          return content.trim();
        }
      }
    }

    return '';
  }

  private extractContent($: cheerio.CheerioAPI): string {
    const selectors = [
      'article',
      '[role="main"]',
      'main',
      '.content',
      '.article-content',
      '.post-content'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        return element.text().trim().slice(0, 5000);
      }
    }

    const paragraphs = $('p').map((_, el) => $(el).text()).get();
    return paragraphs.join('\n').trim().slice(0, 5000);
  }

  private extractPublishDate($: cheerio.CheerioAPI): Date | undefined {
    const selectors = [
      'meta[property="article:published_time"]',
      'meta[name="publishdate"]',
      'meta[name="date"]',
      'time[datetime]'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const dateStr = element.attr('content') || element.attr('datetime');
        if (dateStr) {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
    }

    return undefined;
  }

  private extractAuthor($: cheerio.CheerioAPI): string | undefined {
    const selectors = [
      'meta[name="author"]',
      'meta[property="article:author"]',
      '.author',
      '.byline'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        return (element.attr('content') || element.text()).trim();
      }
    }

    return undefined;
  }

  private extractSource(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }
}

export const webCrawler = new WebCrawler();
