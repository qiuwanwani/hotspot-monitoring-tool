# 热点监控工具

自动发现和监控热点信息，第一时间推送通知的智能工具。

## 界面预览

### 仪表盘首页
![仪表盘首页](./docs/screenshots/首页.png)

### 暗黑模式
![暗黑模式](./docs/screenshots/首页暗黑模式.png)

## 功能特性

### 核心功能
- 🔍 **关键词监控** - 自定义关键词，实时监控多个数据源
- 📊 **热点发现** - 自动抓取 Twitter、RSS、网页等数据源
- 🤖 **AI 分析** - 使用 AI 判断信息真实性和可信度
- 📬 **智能通知** - 邮件和 Web Push 多渠道推送
- 📈 **热度评分** - 基于多维度数据计算热度分数
- 🌐 **多语言支持** - 支持中文关键词和内容
- 📱 **响应式设计** - 适配不同设备屏幕
- 🎨 **现代 UI** - Dark Mode + Glassmorphism 设计风格

### 技术栈
- **前端**: Next.js 14 + React + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes + Prisma ORM
- **数据库**: SQLite (可切换 PostgreSQL/MySQL)
- **AI**: OpenRouter / OpenAI / Anthropic API
- **通知**: Nodemailer + Web Push
- **数据抓取**: axios + node-html-parser

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
复制 `.env.example` 到 `.env` 并填写必要的配置：

```env
# 数据库
DATABASE_URL="file:./dev.db"

# AI服务 (至少配置一个)
OPENROUTER_API_KEY="your-key"
# 或
OPENAI_API_KEY="your-key"
# 或
ANTHROPIC_API_KEY="your-key"

# Twitter API (可选)
TWITTER_API_KEY="your-key"

# 邮件服务 (可选)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email"
SMTP_PASSWORD="your-password"

# Web Push (可选)
VAPID_PUBLIC_KEY="your-key"
VAPID_PRIVATE_KEY="your-key"
```

### 3. 初始化数据库
```bash
npx prisma db push
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 项目结构

```
hotspot-monitoring-tool/
├── docs/                   # 文档和截图
│   ├── screenshots/        # 界面截图
│   ├── DESIGN.md          # 设计文档
│   └── REQUIREMENTS.md    # 需求文档
├── prisma/                 # 数据库模型
│   └── schema.prisma
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API 路由
│   │   │   ├── keywords/  # 关键词管理
│   │   │   ├── hotspots/  # 热点管理
│   │   │   ├── notifications/ # 通知管理
│   │   │   ├── settings/  # 系统设置
│   │   │   └── monitor/   # 监控服务
│   │   ├── dashboard/     # 仪表盘页面
│   │   ├── hotspots/      # 热点列表页面
│   │   ├── keywords/      # 关键词管理页面
│   │   ├── notifications/ # 通知页面
│   │   ├── settings/      # 设置页面
│   │   └── layout.tsx     # 主布局
│   ├── components/        # React 组件
│   │   ├── layout/        # 布局组件
│   │   └── ui/            # UI 组件
│   ├── lib/               # 核心库
│   │   ├── ai.ts          # AI 服务
│   │   ├── monitor.ts     # 监控服务
│   │   ├── notification.ts # 通知服务
│   │   ├── prisma.ts      # 数据库连接
│   │   ├── sources/       # 数据源管理
│   │   │   ├── base.ts    # 基础数据源
│   │   │   ├── search.ts  # 搜索引擎
│   │   │   ├── rss.ts     # RSS 抓取
│   │   │   └── web-scraper.ts # 网页抓取
│   │   └── api.ts         # API 客户端
│   └── types/             # TypeScript 类型
├── .env.example           # 环境变量示例
└── package.json
```

## API 接口

### 关键词管理
- `GET /api/keywords` - 获取关键词列表
- `POST /api/keywords` - 创建关键词
- `GET /api/keywords/:id` - 获取单个关键词
- `PUT /api/keywords/:id` - 更新关键词
- `DELETE /api/keywords/:id` - 删除关键词

### 热点管理
- `GET /api/hotspots` - 获取热点列表 (支持分页、筛选)
- `POST /api/hotspots` - 创建热点
- `GET /api/hotspots/:id` - 获取热点详情
- `PUT /api/hotspots/:id` - 更新热点

### 监控服务
- `POST /api/monitor/fetch` - 立即执行数据获取

### 通知管理
- `GET /api/notifications` - 获取通知列表
- `PUT /api/notifications/:id/read` - 标记通知为已读
- `PUT /api/notifications/read-all` - 标记所有通知为已读

### 系统设置
- `GET /api/settings` - 获取系统设置
- `POST /api/settings` - 更新系统设置

## 设计系统

项目采用 **Dark Mode + Glassmorphism** 设计风格，详见 [design-system/MASTER.md](./design-system/MASTER.md)。

### 主要颜色
- 主色: `#00d9ff` (青色)
- 强调色: `#ff6b35` (橙色)
- 成功色: `#00ff88` (绿色)
- 背景色: `#0a0a0f` (深色)

## 数据源支持

- **搜索引擎**: Hacker News, Bing News
- **中文网站**: 36氪, 科技日报, 新浪科技, 网易科技, 腾讯科技
- **RSS 源**: 可自定义添加

## 开发计划

### 已完成 ✅

- [x] 仪表盘首页 - 实时状态监控和数据统计
- [x] 通知系统 - 邮件和推送通知
- [x] 系统设置 - 通知、AI、邮件配置
- [x] 暗黑模式 - 深色主题支持
- [x] 骨架屏 - 加载状态优化
- [x] 高级筛选和搜索 - 多维度排序和筛选功能
- [x] 数据可视化图表 - 热度趋势、来源分布、热度等级统计
- [x] 移动端适配 - 响应式优化和PWA支持
- [x] 更多数据源支持 - 微博热搜、知乎热榜等中文平台
- [x] 国际化支持 - 中文/英文多语言界面
- [x] 用户认证系统 - 多用户支持、JWT认证、权限管理

### 待开发 📋

- [ ] 暂无

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 许可证

MIT