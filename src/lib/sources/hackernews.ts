import axios from 'axios';
import { BaseDataSource, SourceHotspot, SourceConfig } from './base';

export interface HackerNewsConfig extends SourceConfig {
  limit?: number;
  storyTypes?: ('top' | 'new' | 'best' | 'ask' | 'show' | 'job')[];
}

export class HackerNewsDataSource extends BaseDataSource {
  readonly name = 'Hacker News';
  readonly type = 'hackernews';
  readonly defaultConfig: HackerNewsConfig = {
    limit: 30,
    storyTypes: ['top', 'new'],
  };
  readonly defaultWeight = 2;
  readonly defaultMinScore = 30;

  private baseUrl = 'https://hacker-news.firebaseio.com/v0';

  constructor(config?: HackerNewsConfig) {
    super(config);
  }

  async fetch(keywords?: string[]): Promise<SourceHotspot[]> {
    // 没有关键词时不抓取数据
    if (!keywords || keywords.length === 0) {
      return [];
    }

    const config = this.config as HackerNewsConfig;
    const storyTypes = config.storyTypes || ['top', 'new'];
    const hotspots: SourceHotspot[] = [];

    for (const storyType of storyTypes) {
      try {
        const storyIds = await this.getStoryIds(storyType);
        const stories = await this.getStories(storyIds.slice(0, config.limit || 30));

        for (const story of stories) {
          if (!story || !story.title) continue;

          const hotspot = this.storyToHotspot(story);
          if (this.isValidContent(hotspot) && this.matchesKeywords(hotspot, keywords)) {
            hotspots.push(hotspot);
          }
        }
      } catch (error) {
        console.error(`获取 ${storyType} stories 失败:`, error);
      }
    }

    return hotspots;
  }

  private async getStoryIds(type: string): Promise<number[]> {
    const endpoint = {
      top: 'topstories',
      new: 'newstories',
      best: 'beststories',
      ask: 'askstories',
      show: 'showstories',
      job: 'jobstories',
    }[type] || 'topstories';

    const response = await axios.get(`${this.baseUrl}/${endpoint}.json`);
    return response.data || [];
  }

  private async getStories(ids: number[]): Promise<any[]> {
    const promises = ids.map(id => 
      axios.get(`${this.baseUrl}/item/${id}.json`).then(r => r.data)
    );
    return Promise.all(promises);
  }

  private storyToHotspot(story: any): SourceHotspot {
    const publishedAt = story.time ? new Date(story.time * 1000) : new Date();
    const ageHours = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);

    const heatScore = this.calculateHeatScore({
      likes: story.score || 0,
      comments: story.descendants || 0,
      ageHours,
    });

    return {
      title: story.title,
      content: story.text,
      source: 'Hacker News',
      sourceUrl: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
      sourceId: story.id.toString(),
      category: '科技新闻',
      heatScore,
      publishedAt,
      author: story.by,
      metadata: {
        score: story.score,
        descendants: story.descendants,
        type: story.type,
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
