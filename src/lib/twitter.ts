import axios from 'axios';

export interface TwitterTweet {
  id: string;
  text: string;
  author: string;
  url: string;
  likes: number;
  retweets: number;
  replies: number;
  publishedAt?: Date;
}

export class TwitterAPI {
  private apiKey: string;
  private baseUrl = 'https://api.twitterapi.io';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TWITTER_API_KEY || '';
  }

  async searchTweets(query: string, options?: {
    limit?: number;
    sinceId?: string;
  }): Promise<TwitterTweet[]> {
    if (!this.apiKey) {
      console.warn('Twitter API Key 未配置');
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/v2/search`, {
        params: {
          query,
          limit: options?.limit || 20,
          since_id: options?.sinceId
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data.tweets.map((tweet: any) => ({
        id: tweet.id,
        text: tweet.text,
        author: tweet.author?.username || 'unknown',
        url: `https://twitter.com/${tweet.author?.username}/status/${tweet.id}`,
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
        publishedAt: tweet.created_at ? new Date(tweet.created_at) : undefined
      }));
    } catch (error) {
      console.error('Twitter API 调用失败:', error);
      return [];
    }
  }

  async getUserTweets(username: string, limit: number = 20): Promise<TwitterTweet[]> {
    if (!this.apiKey) {
      console.warn('Twitter API Key 未配置');
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/v2/users/${username}/tweets`, {
        params: { limit },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data.tweets.map((tweet: any) => ({
        id: tweet.id,
        text: tweet.text,
        author: username,
        url: `https://twitter.com/${username}/status/${tweet.id}`,
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
        publishedAt: tweet.created_at ? new Date(tweet.created_at) : undefined
      }));
    } catch (error) {
      console.error('Twitter API 调用失败:', error);
      return [];
    }
  }

  calculateHeatScore(tweet: TwitterTweet): number {
    const likesWeight = 1;
    const retweetsWeight = 2;
    const repliesWeight = 1.5;
    
    const score = 
      tweet.likes * likesWeight +
      tweet.retweets * retweetsWeight +
      tweet.replies * repliesWeight;
    
    return Math.min(100, Math.round(score / 10));
  }
}

export const twitterAPI = new TwitterAPI();
