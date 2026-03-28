import Parser from 'rss-parser';

export interface RSSItem {
  title: string;
  content: string;
  url: string;
  source: string;
  publishedAt?: Date;
  author?: string;
}

export class RSSFetcher {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HotspotMonitor/1.0)'
      }
    });
  }

  async fetch(feedUrl: string): Promise<RSSItem[]> {
    try {
      const feed = await this.parser.parseURL(feedUrl);
      
      return feed.items.map(item => ({
        title: item.title || '',
        content: item.contentSnippet || item.content || '',
        url: item.link || '',
        source: feed.title || this.extractSource(feedUrl),
        publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
        author: item.creator || item.author
      }));
    } catch (error) {
      console.error(`RSS 获取失败: ${feedUrl}`, error);
      return [];
    }
  }

  async fetchMultiple(feedUrls: string[]): Promise<RSSItem[]> {
    const results = await Promise.allSettled(
      feedUrls.map(url => this.fetch(url))
    );

    return results
      .filter((r): r is PromiseFulfilledResult<RSSItem[]> => 
        r.status === 'fulfilled'
      )
      .flatMap(r => r.value);
  }

  private extractSource(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch {
      return 'RSS Feed';
    }
  }
}

export const rssFetcher = new RSSFetcher();

export const DEFAULT_RSS_FEEDS = [
  'https://hnrss.org/frontpage',
  'https://feeds.bbci.co.uk/news/rss.xml',
  'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml'
];
