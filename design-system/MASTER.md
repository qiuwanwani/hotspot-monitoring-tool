# 热点监控工具 - 设计系统

## 设计原则

### 产品定位
- **类型**: 监控工具 (Monitoring Tool)
- **目标用户**: 内容创作者、媒体从业者、市场分析师
- **核心价值**: 实时监控、智能分析、及时通知

### 设计风格
- **主风格**: Dark Mode + Glassmorphism
- **辅助风格**: Minimalism
- **视觉特点**: 专业、现代、数据驱动

---

## 色彩系统

### 主色调 (Primary)
```css
--primary: #00d9ff;           /* 青色 - 主要交互 */
--primary-hover: #00b8d9;     /* 悬停状态 */
--primary-light: #e6f9ff;     /* 浅色背景 */
```

### 辅助色 (Accent)
```css
--accent-orange: #ff6b35;     /* 橙色 - 热点/警告 */
--accent-green: #00ff88;      /* 绿色 - 成功/正常 */
--accent-purple: #a855f7;     /* 紫色 - AI/智能 */
--accent-red: #ef4444;        /* 红色 - 错误/危险 */
```

### 背景色 (Background)
```css
--background: #0a0a0f;              /* 主背景 */
--background-secondary: #12121a;    /* 次级背景 */
--card: #16161f;                    /* 卡片背景 */
--card-hover: #1e1e2a;              /* 卡片悬停 */
```

### 文字色 (Foreground)
```css
--foreground: #ffffff;              /* 主文字 */
--foreground-muted: #a1a1aa;        /* 次要文字 */
--foreground-subtle: #71717a;       /* 辅助文字 */
```

### 边框色 (Border)
```css
--border: #27272a;                  /* 默认边框 */
--border-light: #3f3f46;            /* 浅色边框 */
```

---

## 字体系统

### 字体家族
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### 字体大小
```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
```

### 字重
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 行高
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

---

## 间距系统

### 基础间距 (8px 网格)
```css
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
```

---

## 圆角系统

```css
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-2xl: 1.5rem;   /* 24px */
--radius-full: 9999px;  /* 圆形 */
```

---

## 阴影系统

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-glow: 0 0 20px rgba(0, 217, 255, 0.3);
```

---

## 玻璃效果 (Glassmorphism)

```css
.glass {
  background: rgba(22, 22, 31, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(39, 39, 42, 0.5);
}

.glass-light {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

---

## 动画系统

### 过渡时长
```css
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
```

### 缓动函数
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### 常用动画
```css
/* 淡入淡出 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 滑入 */
@keyframes slideIn {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* 脉冲 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## 组件规范

### 按钮 (Button)
- 最小高度: 44px
- 内边距: 12px 24px
- 圆角: 8px
- 状态: default, hover, active, disabled, loading

### 输入框 (Input)
- 最小高度: 44px
- 内边距: 12px 16px
- 圆角: 8px
- 边框: 1px solid var(--border)

### 卡片 (Card)
- 背景: var(--card)
- 圆角: 12px
- 边框: 1px solid var(--border)
- 内边距: 20px

### 标签 (Tag/Badge)
- 高度: 24px
- 内边距: 4px 12px
- 圆角: 12px
- 字体大小: 12px

---

## 响应式断点

```css
--breakpoint-sm: 640px;   /* 手机横屏 */
--breakpoint-md: 768px;   /* 平板竖屏 */
--breakpoint-lg: 1024px;  /* 平板横屏 */
--breakpoint-xl: 1280px;  /* 桌面 */
--breakpoint-2xl: 1536px; /* 大屏桌面 */
```

---

## 图标规范

- 使用 Lucide React 图标库
- 默认大小: 20px
- 小图标: 16px
- 大图标: 24px
- 描边宽度: 2px

---

## 可访问性 (Accessibility)

### 对比度
- 主文字: 4.5:1 最小对比度
- 大文字: 3:1 最小对比度
- 交互元素: 清晰的焦点状态

### 焦点状态
```css
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

### 触摸目标
- 最小触摸区域: 44x44px

---

## 状态颜色

### 热度等级
```css
--heat-low: #22c55e;      /* 低热度 - 绿色 */
--heat-medium: #eab308;   /* 中热度 - 黄色 */
--heat-high: #f97316;     /* 高热度 - 橙色 */
--heat-critical: #ef4444; /* 极高热度 - 红色 */
```

### 状态指示
```css
--status-active: #00ff88;   /* 活跃 */
--status-pending: #eab308;  /* 待处理 */
--status-error: #ef4444;    /* 错误 */
--status-disabled: #71717a; /* 禁用 */
```

---

## 反模式 (避免)

❌ 不要使用 emoji 作为图标
❌ 不要使用纯色背景，要有层次感
❌ 不要忽略加载状态和空状态
❌ 不要使用过小的触摸目标
❌ 不要忽略暗色模式的对比度
❌ 不要使用过多的动画效果
❌ 不要在卡片内使用过多的阴影层级
