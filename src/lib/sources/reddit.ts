import axios from 'axios';
import { BaseDataSource, SourceHotspot, SourceConfig } from './base';

export interface RedditConfig extends SourceConfig {
  subreddits?: string[];
  limit?: number;
  minUpvotes?: number;
  minComments?: number;
  minTextLength?: number;
}

export class RedditDataSource extends BaseDataSource {
  readonly name = 'Reddit';
  readonly type = 'reddit';
  readonly defaultConfig: RedditConfig = {
    subreddits: ['technology', 'programming', 'news', 'worldnews'],
    limit: 20,
    minUpvotes: 100,
    minComments: 20,
    minTextLength: 30,
  };
  readonly defaultWeight = 2;
  readonly defaultMinScore = 35;

  private baseUrl = 'https://www.reddit.com';

  constructor(config?: RedditConfig) {
    super(config);
  }

  async fetch(keywords?: string[]): Promise<SourceHotspot[]> {
    const config = this.config as RedditConfig;
    const subreddits = config.subreddits || ['technology', 'programming'];
    const hotspots: SourceHotspot[] = [];

    for (const subreddit of subreddits) {
      try {
        const posts = await this.getHotPosts(subreddit, config);
        for (const post of posts) {
          if (!this.isValidPost(post, config)) {
            continue;
          }

          const hotspot = this.postToHotspot(post, subreddit);
          if (this.isValidContent(hotspot) && this.matchesKeywords(hotspot, keywords)) {
            hotspots.push(hotspot);
          }
        }
      } catch (error) {
        console.error(`获取 r/${subreddit} 失败:`, error);
      }
    }

    return hotspots;
  }

  private async getHotPosts(subreddit: string, config: RedditConfig): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/r/${subreddit}/hot.json`, {
        params: {
          limit: config.limit || 20,
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      return response.data.data.children.map((child: any) => child.data) || [];
    } catch (error) {
      console.error('Reddit API 调用失败:', error);
      return [];
    }
  }

  private isValidPost(post: any, config: RedditConfig): boolean {
    if (post.stickied || post.is_self === false) {
      return false;
    }

    if (post.score < (config.minUpvotes || 100)) {
      return false;
    }

    if (post.num_comments < (config.minComments || 20)) {
      return false;
    }

    if ((post.selftext || '').length < (config.minTextLength || 30)) {
      return false;
    }

    return true;
  }

  private postToHotspot(post: any, subreddit: string): SourceHotspot {
    const publishedAt = post.created_utc ? new Date(post.created_utc * 1000) : new Date();
    const ageHours = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);

    const heatScore = this.calculateHeatScore({
      likes: post.score,
      comments: post.num_comments,
      ageHours,
    });

    return {
      title: post.title,
      content: post.selftext,
      source: `Reddit r/${subreddit}`,
      sourceUrl: `https://reddit.com${post.permalink}`,
      sourceId: post.id,
      category: '社区讨论',
      heatScore,
      publishedAt,
      author: post.author,
      metadata: {
        subreddit,
        score: post.score,
        numComments: post.num_comments,
        upvoteRatio: post.upvote_ratio,
      },
    };
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
