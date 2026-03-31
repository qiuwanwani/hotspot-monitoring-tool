export interface SourceHotspot {
  title: string;
  content?: string;
  source: string;
  sourceUrl: string;
  sourceId?: string;
  category?: string;
  heatScore: number;
  publishedAt?: Date;
  author?: string;
  metadata?: Record<string, any>;
}

export interface SourceConfig {
  [key: string]: any;
}

export abstract class BaseDataSource {
  abstract readonly name: string;
  abstract readonly type: string;
  abstract readonly defaultConfig: SourceConfig;
  abstract readonly defaultWeight: number;
  abstract readonly defaultMinScore: number;

  protected config: SourceConfig;

  constructor(config?: SourceConfig) {
    this.config = { ...this.defaultConfig, ...config };
  }

  abstract fetch(keywords?: string[]): Promise<SourceHotspot[]>;

  protected calculateHeatScore(metrics: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
    ageHours?: number;
  }): number {
    const { likes = 0, comments = 0, shares = 0, views = 0, ageHours = 0 } = metrics;

    const likesWeight = 1;
    const commentsWeight = 2;
    const sharesWeight = 3;
    const viewsWeight = 0.1;

    let score = 
      likes * likesWeight +
      comments * commentsWeight +
      shares * sharesWeight +
      views * viewsWeight;

    if (ageHours < 1) {
      score *= 2;
    } else if (ageHours < 6) {
      score *= 1.5;
    } else if (ageHours < 24) {
      score *= 1.2;
    }

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  protected isValidContent(hotspot: SourceHotspot): boolean {
    if (!hotspot.title || hotspot.title.length < 10) {
      return false;
    }

    if (hotspot.content && hotspot.content.length < 20) {
      return false;
    }

    const spamKeywords = ['哈哈', '好的', '谢谢', '收到', '嗯嗯', '哦哦', '？', '！', '...'];
    for (const keyword of spamKeywords) {
      if (hotspot.title.includes(keyword) && hotspot.title.length < 20) {
        return false;
      }
    }

    return true;
  }
}