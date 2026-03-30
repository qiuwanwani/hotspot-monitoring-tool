import axios from 'axios';
import { BaseDataSource, SourceHotspot, SourceConfig } from './base';

export interface TwitterConfig extends SourceConfig {
  apiKey?: string;
  minLikes?: number;
  minRetweets?: number;
  minReplies?: number;
  minTextLength?: number;
  limit?: number;
}

export class TwitterDataSource extends BaseDataSource {
  readonly name = 'Twitter';
  readonly type = 'twitter';
  readonly defaultConfig: TwitterConfig = {
    apiKey: '',
    minLikes: 50,
    minRetweets: 10,
    minReplies: 0,
    minTextLength: 20,
    limit: 20,
  };
  readonly defaultWeight = 3;
  readonly defaultMinScore = 40;

  private baseUrl = 'https://api.twitterapi.io';

  constructor(config?: TwitterConfig) {
    super(config);
  }

  async fetch(keywords?: string[]): Promise<SourceHotspot[]> {
    const config = this.config as TwitterConfig;
    
    if (!config.apiKey) {
      console.warn('Twitter API Key 未配置');
      return [];
    }

    const hotspots: SourceHotspot[] = [];

    if (keywords && keywords.length > 0) {
      for (const keyword of keywords) {
        try {
          const tweets = await this.searchTweets(keyword, config);
          hotspots.push(...tweets);
        } catch (error) {
          console.error(`搜索关键词 "${keyword}" 失败:`, error);
        }
      }
    }

    return hotspots;
  }

  private async searchTweets(keyword: string, config: TwitterConfig): Promise<SourceHotspot[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/v2/search`, {
        params: {
          query: keyword,
          limit: config.limit || 20,
        },
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
      });

      const tweets = response.data.tweets || [];
      const hotspots: SourceHotspot[] = [];

      for (const tweet of tweets) {
        if (!this.isValidTweet(tweet, config)) {
          continue;
        }

        const hotspot = this.tweetToHotspot(tweet, keyword);
        if (this.isValidContent(hotspot)) {
          hotspots.push(hotspot);
        }
      }

      return hotspots;
    } catch (error) {
      console.error('Twitter API 调用失败:', error);
      return [];
    }
  }

  private isValidTweet(tweet: any, config: TwitterConfig): boolean {
    const likes = tweet.public_metrics?.like_count || 0;
    const retweets = tweet.public_metrics?.retweet_count || 0;
    const replies = tweet.public_metrics?.reply_count || 0;
    const text = tweet.text || '';

    if (likes < (config.minLikes || 50)) {
      return false;
    }

    if (retweets < (config.minRetweets || 10)) {
      return false;
    }

    if (replies < (config.minReplies || 0)) {
      return false;
    }

    if (text.length < (config.minTextLength || 20)) {
      return false;
    }

    return true;
  }

  private tweetToHotspot(tweet: any, keyword: string): SourceHotspot {
    const likes = tweet.public_metrics?.like_count || 0;
    const retweets = tweet.public_metrics?.retweet_count || 0;
    const replies = tweet.public_metrics?.reply_count || 0;
    const publishedAt = tweet.created_at ? new Date(tweet.created_at) : new Date();
    const ageHours = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);

    const heatScore = this.calculateHeatScore({
      likes,
      comments: replies,
      shares: retweets,
      ageHours,
    });

    return {
      title: tweet.text.slice(0, 100),
      content: tweet.text,
      source: 'Twitter',
      sourceUrl: `https://twitter.com/${tweet.author?.username || 'unknown'}/status/${tweet.id}`,
      sourceId: tweet.id,
      category: '社交媒体',
      heatScore,
      publishedAt,
      author: tweet.author?.username,
      metadata: {
        keyword,
        likes,
        retweets,
        replies,
      },
    };
  }
}
