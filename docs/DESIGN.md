# 热点监控工具 - 技术方案文档

## 技术架构概览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           前端 Web 应用                                  │
│                  Next.js 14 + React + Tailwind CSS                      │
│                         shadcn/ui 组件库                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         后端 API 服务                                    │
│                    Next.js App Router Route Handlers                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ 关键词管理API │  │ 热点数据API  │  │ 通知推送API  │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ 定时任务服务  │  │ 数据抓取服务  │  │ AI分析服务   │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
    ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
    │   AI 服务    │        │   数据存储    │        │   数据源     │
    │  (多服务商)  │        │   (Prisma)   │        │  (多源聚合)  │
    └──────────────┘        └──────────────┘        └──────────────┘
```

## 技术选型详情

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 14.x | React全栈框架，App Router模式 |
| React | 18.x | UI组件库 |
| TypeScript | 5.x | 类型安全 |
| Tailwind CSS | 3.x | 原子化CSS |
| shadcn/ui | latest | UI组件库 |
| React Query | 5.x | 服务端状态管理 |
| Zustand | 4.x | 客户端状态管理 |
| Recharts | 2.x | 数据可视化图表 |
| date-fns | 3.x | 日期处理 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js API Routes | 14.x | API服务（App Router Route Handlers） |
| Prisma | 5.x | ORM数据库操作 |
| SQLite | 3.x | 轻量级数据库 |
| node-cron | 3.x | 定时任务调度 |
| Cheerio | 1.x | HTML解析（网页爬虫） |
| Axios | 1.x | HTTP请求 |
| web-push | 3.x | Web Push通知 |
| Nodemailer | 6.x | 邮件发送 |

### AI服务集成

支持多AI服务商，用户可自定义配置：

```typescript
interface AIConfig {
  provider: 'openrouter' | 'openai' | 'anthropic' | 'custom';
  apiKey: string;
  baseUrl?: string;
  model: string;
}

const defaultModels = {
  openrouter: 'anthropic/claude-3.5-sonnet',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-20241022',
};
```

### 数据源配置

| 数据源 | 技术方案 | 更新频率 | 备注 |
|--------|----------|----------|------|
| 网页搜索 | Cheerio + Axios | 30分钟 | 搜索引擎爬虫，需频率控制 |
| Twitter (X) | twitterapi.io API | 实时 | $0.15/1K tweets |
| RSS订阅 | rss-parser | 30分钟 | 可配置源 |
| Hacker News | 官方REST API | 30分钟 | 免费，无需API Key |

## 项目目录结构

```
hotspot-monitoring-tool/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx               # 根布局
│   │   ├── page.tsx                 # 首页仪表盘
│   │   ├── globals.css              # 全局样式
│   │   ├── keywords/
│   │   │   └── page.tsx             # 关键词管理页
│   │   ├── hotspots/
│   │   │   └── page.tsx             # 热点列表页
│   │   ├── settings/
│   │   │   └── page.tsx             # 设置页
│   │   └── api/                     # API路由
│   │       ├── keywords/
│   │       │   └── route.ts         # 关键词CRUD
│   │       ├── hotspots/
│   │       │   └── route.ts         # 热点数据
│   │       ├── monitor/
│   │       │   └── route.ts         # 监控任务
│   │       ├── notify/
│   │       │   └── route.ts         # 通知推送
│   │       ├── sources/
│   │       │   └── route.ts         # 数据源管理
│   │       └── ai/
│   │           └── route.ts         # AI分析
│   ├── components/                  # React组件
│   │   ├── ui/                     # shadcn/ui组件
│   │   ├── dashboard/              # 仪表盘组件
│   │   │   ├── StatsCard.tsx
│   │   │   ├── HotspotChart.tsx
│   │   │   └── RecentHotspots.tsx
│   │   ├── keywords/               # 关键词相关组件
│   │   │   ├── KeywordList.tsx
│   │   │   ├── KeywordForm.tsx
│   │   │   └── KeywordCard.tsx
│   │   ├── hotspots/               # 热点相关组件
│   │   │   ├── HotspotList.tsx
│   │   │   ├── HotspotCard.tsx
│   │   │   └── HotspotDetail.tsx
│   │   └── layout/                 # 布局组件
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Footer.tsx
│   ├── lib/                        # 工具库
│   │   ├── prisma.ts              # Prisma客户端
│   │   ├── ai.ts                  # AI服务封装
│   │   ├── scraper/               # 数据抓取
│   │   │   ├── index.ts
│   │   │   ├── web-scraper.ts
│   │   │   ├── twitter.ts
│   │   │   ├── rss.ts
│   │   │   └── hackernews.ts
│   │   ├── notifier/              # 通知推送
│   │   │   ├── index.ts
│   │   │   ├── web-push.ts
│   │   │   └── email.ts
│   │   ├── scheduler.ts           # 定时任务
│   │   └── utils.ts               # 工具函数
│   ├── types/                      # TypeScript类型
│   │   ├── index.ts
│   │   ├── keyword.ts
│   │   ├── hotspot.ts
│   │   └── notification.ts
│   └── hooks/                      # 自定义Hooks
│       ├── useKeywords.ts
│       ├── useHotspots.ts
│       └── useNotifications.ts
├── prisma/                         # 数据库
│   ├── schema.prisma              # 数据模型
│   └── seed.ts                    # 种子数据
├── public/                         # 静态资源
│   ├── sw.js                      # Service Worker
│   └── icons/
├── .env.example                    # 环境变量示例
├── .env                            # 环境变量
├── tailwind.config.ts              # Tailwind配置
├── next.config.js                  # Next.js配置
├── package.json
├── tsconfig.json
├── REQUIREMENTS.md                 # 需求文档
└── DESIGN.md                       # 本文档
```

## 数据库设计 (Prisma Schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Keyword {
  id              String   @id @default(cuid())
  keyword         String
  category        String?
  isActive        Boolean  @default(true)
  checkInterval   Int      @default(30)  // 分钟
  lastCheckedAt   DateTime?
  lastTriggeredAt DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  hotspots        Hotspot[]
  notifications   Notification[]

  @@index([keyword])
  @@index([isActive])
}

model Hotspot {
  id              String   @id @default(cuid())
  title           String
  content         String?
  summary         String?
  source          String
  sourceUrl       String?
  sourceId        String?   // 原始平台的ID
  category        String?
  heatScore       Int      @default(0)
  isVerified      Boolean  @default(false)
  isFake          Boolean  @default(false)
  fakeReason      String?
  keywordsMatched String?  // JSON数组
  publishedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  keywords        Keyword[]
  notifications   Notification[]

  @@index([source])
  @@index([category])
  @@index([heatScore])
  @@index([createdAt])
}

model Notification {
  id          String   @id @default(cuid())
  type        String   // 'web_push' | 'email'
  status      String   @default('pending') // 'pending' | 'sent' | 'failed'
  sentAt      DateTime?
  error       String?
  createdAt   DateTime @default(now())
  hotspot     Hotspot  @relation(fields: [hotspotId], references: [id])
  hotspotId   String
  keyword     Keyword? @relation(fields: [keywordId], references: [id])
  keywordId   String?

  @@index([status])
  @@index([createdAt])
}

model UserSettings {
  id                String   @id @default(cuid())
  notificationEnabled Boolean @default(true)
  email             String?
  pushEnabled       Boolean  @default(true)
  quietHoursStart   String?  // "22:00"
  quietHoursEnd     String?  // "08:00"
  aiProvider        String   @default('openrouter')
  aiApiKey          String?
  aiBaseUrl         String?
  aiModel           String?
  twitterApiKey     String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model DataSource {
  id          String   @id @default(cuid())
  name        String
  type        String   // 'web' | 'twitter' | 'rss' | 'hackernews'
  config      String   // JSON配置
  isActive    Boolean  @default(true)
  lastFetched DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([type])
  @@index([isActive])
}
```

## API接口设计

### 关键词管理 API

```
GET    /api/keywords          # 获取关键词列表
POST   /api/keywords          # 创建关键词
GET    /api/keywords/[id]     # 获取单个关键词
PUT    /api/keywords/[id]     # 更新关键词
DELETE /api/keywords/[id]     # 删除关键词
```

### 热点数据 API

```
GET    /api/hotspots          # 获取热点列表（支持分页、筛选）
GET    /api/hotspots/[id]     # 获取热点详情
GET    /api/hotspots/trending # 获取热门热点
```

### 监控任务 API

```
POST   /api/monitor/start     # 启动监控任务
POST   /api/monitor/stop      # 停止监控任务
GET    /api/monitor/status    # 获取监控状态
POST   /api/monitor/check     # 手动触发检查
```

### 通知推送 API

```
POST   /api/notify/subscribe  # 订阅Web Push
POST   /api/notify/unsubscribe # 取消订阅
POST   /api/notify/test       # 发送测试通知
```

### AI分析 API

```
POST   /api/ai/analyze        # 分析内容真伪
POST   /api/ai/score          # 评估热度分数
POST   /api/ai/summarize      # 生成摘要
```

## 数据抓取实现

### 网页搜索爬虫

```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeSearchResults(keyword: string) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;
  
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  
  const $ = cheerio.load(response.data);
  const results: SearchResult[] = [];
  
  $('div.g').each((_, element) => {
    const title = $(element).find('h3').text();
    const link = $(element).find('a').attr('href');
    const snippet = $(element).find('.VwiC3b').text();
    
    if (title && link) {
      results.push({ title, link, snippet });
    }
  });
  
  return results;
}
```

### Twitter API (twitterapi.io)

```typescript
import { TwitterAPIIOClient } from 'twitterapi-io-client';

export async function fetchTweets(keyword: string, apiKey: string) {
  const client = new TwitterAPIIOClient({ apiKey });
  
  const tweets = await client.searchTweets({
    query: keyword,
    sort_order: 'relevancy',
    limit: 50,
  });
  
  return tweets.map(tweet => ({
    id: tweet.id,
    text: tweet.text,
    author: tweet.author?.userName,
    createdAt: tweet.createdAt,
    url: `https://x.com/${tweet.author?.userName}/status/${tweet.id}`,
  }));
}
```

### RSS订阅源

```typescript
import Parser from 'rss-parser';

export async function fetchRSSFeed(feedUrl: string) {
  const parser = new Parser();
  const feed = await parser.parseURL(feedUrl);
  
  return feed.items.map(item => ({
    title: item.title,
    content: item.contentSnippet,
    link: item.link,
    pubDate: item.pubDate,
    source: feed.title,
  }));
}
```

### Hacker News API

```typescript
import axios from 'axios';

export async function fetchHackerNews(limit = 30) {
  const { data: storyIds } = await axios.get(
    'https://hacker-news.firebaseio.com/v0/topstories.json'
  );
  
  const topStories = storyIds.slice(0, limit);
  
  const stories = await Promise.all(
    topStories.map((id: number) =>
      axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
    )
  );
  
  return stories.map(({ data }) => ({
    id: data.id,
    title: data.title,
    url: data.url,
    score: data.score,
    by: data.by,
    time: data.time,
  }));
}
```

## AI服务集成

### 多服务商支持

```typescript
interface AIProvider {
  analyze: (content: string) => Promise<AnalysisResult>;
  score: (content: string) => Promise<number>;
  summarize: (content: string) => Promise<string>;
}

export function createAIProvider(config: AIConfig): AIProvider {
  switch (config.provider) {
    case 'openrouter':
      return new OpenRouterProvider(config);
    case 'openai':
      return new OpenAIProvider(config);
    case 'anthropic':
      return new AnthropicProvider(config);
    default:
      return new CustomProvider(config);
  }
}
```

### OpenRouter集成

```typescript
import axios from 'axios';

export class OpenRouterProvider implements AIProvider {
  private apiKey: string;
  private model: string;
  
  constructor(config: AIConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'anthropic/claude-3.5-sonnet';
  }
  
  async analyze(content: string): Promise<AnalysisResult> {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一个内容分析专家，负责判断新闻或信息的真实性。',
          },
          {
            role: 'user',
            content: `请分析以下内容的真实性，判断是否为虚假信息：\n\n${content}`,
          },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return {
      isFake: response.data.choices[0].message.content.includes('虚假'),
      confidence: 0.8,
      reason: response.data.choices[0].message.content,
    };
  }
  
  async score(content: string): Promise<number> {
    // 实现热度评分逻辑
  }
  
  async summarize(content: string): Promise<string> {
    // 实现摘要生成逻辑
  }
}
```

## 通知推送实现

### Web Push通知

```typescript
import webpush from 'web-push';

export class WebPushService {
  private vapidKeys: { publicKey: string; privateKey: string };
  
  constructor() {
    this.vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY!,
      privateKey: process.env.VAPID_PRIVATE_KEY!,
    };
    
    webpush.setVapidDetails(
      'mailto:your-email@example.com',
      this.vapidKeys.publicKey,
      this.vapidKeys.privateKey
    );
  }
  
  async sendNotification(subscription: PushSubscription, payload: any) {
    await webpush.sendNotification(
      subscription as any,
      JSON.stringify(payload)
    );
  }
}
```

### 邮件通知

```typescript
import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;
  
  constructor(config: EmailConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });
  }
  
  async sendHotspotNotification(to: string, hotspot: Hotspot) {
    await this.transporter.sendMail({
      from: '"热点监控" <noreply@hotspot-monitor.com>',
      to,
      subject: `🔥 发现新热点: ${hotspot.title}`,
      html: `
        <h2>${hotspot.title}</h2>
        <p>${hotspot.summary}</p>
        <a href="${hotspot.sourceUrl}">查看详情</a>
      `,
    });
  }
}
```

## 定时任务实现

```typescript
import cron from 'node-cron';
import { scrapeAllSources } from './scraper';
import { analyzeHotspots } from './ai';
import { sendNotifications } from './notifier';

export class SchedulerService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  
  startMonitoring(keywordId: string, intervalMinutes: number) {
    const task = cron.schedule(`*/${intervalMinutes} * * * *`, async () => {
      try {
        // 1. 抓取数据
        const hotspots = await scrapeAllSources(keywordId);
        
        // 2. AI分析
        const analyzed = await analyzeHotspots(hotspots);
        
        // 3. 发送通知
        await sendNotifications(analyzed);
      } catch (error) {
        console.error(`监控任务 ${keywordId} 执行失败:`, error);
      }
    });
    
    this.tasks.set(keywordId, task);
  }
  
  stopMonitoring(keywordId: string) {
    const task = this.tasks.get(keywordId);
    if (task) {
      task.stop();
      this.tasks.delete(keywordId);
    }
  }
}
```

## UI设计规范

### 配色方案

```css
:root {
  --background: #0a0a0f;
  --background-secondary: #12121a;
  --foreground: #ffffff;
  --foreground-muted: #a1a1aa;
  
  --primary: #00d9ff;
  --primary-hover: #00b8d9;
  
  --accent-orange: #ff6b35;
  --accent-green: #00ff88;
  --accent-purple: #a855f7;
  
  --card: #16161f;
  --card-hover: #1e1e2a;
  --border: #27272a;
}
```

### 组件设计

- **仪表盘卡片**: 玻璃态效果，渐变边框
- **热点列表**: 卡片式布局，热度指示器
- **关键词标签**: 可交互标签，状态指示
- **图表**: 渐变填充，动画效果

## 环境变量配置

```env
# 数据库
DATABASE_URL="file:./dev.db"

# AI服务 (可选其一或多个)
OPENROUTER_API_KEY="your-openrouter-api-key"
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Twitter API
TWITTER_API_KEY="your-twitterapi-io-key"

# Web Push
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"

# 邮件服务
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-smtp-password"
```

## 部署方案

### 开发环境

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### 生产环境

推荐部署到 Vercel：
1. 连接 GitHub 仓库
2. 配置环境变量
3. 自动部署

## 后续扩展

### Agent Skills封装

完成Web版后，将核心功能封装为Trae IDE技能：

```
.trae/skills/hotspot-monitor/
├── SKILL.md
├── templates/
│   └── config.template.json
└── examples/
    └── usage-examples.md
```

技能功能：
- 自动监控指定关键词
- 定期推送热点摘要
- 支持自定义数据源
- 支持自定义AI服务商
