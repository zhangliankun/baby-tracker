# UI 设计规范 — 婴儿喂养记录与统计分析 App

## 色系

### 主色调

| Token | Hex | 用途 |
|-------|-----|------|
| `brand-primary` | `#FF9A8B` | 主按钮、激活态 Tab、关键图标 |
| `brand-primary-light` | `#FFB5A7` | 浅色背景块、Tag 标签底 |
| `brand-secondary` | `#FFD6A5` | 辅助色、高亮卡片边框 |
| `brand-secondary-light` | `#FFF0E0` | 暖色背景块 |

### 中性色

| Token | Hex | 用途 |
|-------|-----|------|
| `bg-page` | `#FFF5F0` | 页面背景 |
| `bg-card` | `#FFFFFF` | 卡片背景 |
| `text-primary` | `#2D2D2D` | 主文字 |
| `text-secondary` | `#8E8E93` | 次要文字、时间标签 |
| `text-muted` | `#C7C7CC` | 占位符、禁用态文字 |
| `border-light` | `#F0F0F0` | 卡片边框、分割线 |

### 语义色

| Token | Hex | 用途 |
|-------|-----|------|
| `success` | `#34C759` | 成功 Toast、睡眠超 6h 高亮 |
| `warning` | `#FF9500` | 警告提示 |
| `danger` | `#FF3B30` | 删除按钮、错误 Toast、红屁屁标记 |
| `info` | `#5AC8FA` | 信息提示 |

### 类型色

| 记录类型 | 颜色 | 图标背景色 |
|----------|------|-----------|
| 喂养 (feeding) | `#FF9A8B` | 浅粉底 |
| 睡眠 (sleep) | `#7B8CDE` | 浅紫底 |
| 尿布 (diaper) | `#FFB347` | 浅橙底 |
| 补剂 (supplement) | `#4ECDC4` | 浅青底 |

## 字体

| 层级 | 大小 | 字重 | 用途 |
|------|------|------|------|
| H1 | 22px | 700 | 页面标题、宝宝昵称 |
| H2 | 18px | 600 | 区域标题、统计卡片数字 |
| H3 | 16px | 500 | 记录内容摘要 |
| Body | 14px | 400 | 正文、标签、辅助信息 |
| Caption | 12px | 400 | 时间、角色标签、图例 |
| Tab | 10px | 500 | 底部导航文字 |

字体栈：`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

## 间距

| Token | 值 | 用途 |
|-------|-----|------|
| xs | 4px | 图标与文字间距 |
| sm | 8px | 标签间距、卡片内边距 |
| md | 12px | 列表项间距 |
| lg | 16px | 卡片间距、页面内边距 |
| xl | 20px | 区域间距 |
| 2xl | 24px | 页面上下边距 |

## 圆角

| Token | 值 | 用途 |
|-------|-----|------|
| sm | 8px | 标签、按钮、小卡片 |
| md | 12px | 卡片、模态框 |
| lg | 16px | 大面板 |
| full | 9999px | 头像、圆形按钮 |

## 阴影

| Token | 值 | 用途 |
|-------|-----|------|
| card | `0 1px 3px rgba(0,0,0,0.08)` | 卡片默认阴影 |
| card-hover | `0 2px 8px rgba(0,0,0,0.12)` | 卡片悬浮阴影 |
| modal | `0 8px 32px rgba(0,0,0,0.16)` | 模态框阴影 |
| fab | `0 4px 12px rgba(255,154,139,0.4)` | 浮动按钮阴影 |

## 组件规范

### 按钮

| 类型 | 样式 |
|------|------|
| 主按钮 | `bg-[#FF9A8B] text-white rounded-full px-6 py-3 font-semibold shadow` |
| 次按钮 | `bg-white text-[#FF9A8B] border border-[#FF9A8B] rounded-full px-6 py-3` |
| 预设按钮 | `bg-[#FFF0E0] text-[#FF9A8B] rounded-lg px-4 py-2 text-sm` |
| 危险按钮 | `bg-[#FF3B30] text-white rounded-full px-6 py-3` |
| 图标按钮 | `text-[#8E8E93] hover:text-[#FF9A8B] p-2` |

### 卡片

```css
.card {
  @apply bg-white rounded-xl shadow-card p-4 mb-3;
}
```

### 输入框

```css
input, select, textarea {
  @apply w-full rounded-lg border border-[#F0F0F0] px-4 py-3 text-sm
         focus:outline-none focus:border-[#FF9A8B] focus:ring-1 focus:ring-[#FF9A8B];
}
```

### TabBar

- 高度：56px（含 safe area）
- 背景：白色 + 顶部 1px `#F0F0F0` 分割线
- 激活态：图标和文字用 `brand-primary`
- 非激活态：图标和文字用 `text-muted`

### Toast

- 位置：页面顶部居中
- 动画：从上滑入，3 秒后淡出
- 宽度：自适应内容，最大 320px
- 样式：圆角 8px，阴影，图标 + 文字

## 页面布局

### 移动端（375-428px）— 主要目标

```
┌─────────────────────┐
│    Header / TopBar   │  ← 固定顶部
├─────────────────────┤
│                      │
│    Scrollable        │  ← flex-1 overflow-y-auto
│    Content           │  ← px-4 py-4
│                      │
│                      │
├─────────────────────┤
│    Bottom TabBar     │  ← 固定底部 56px
└─────────────────────┘
```

- 整体居中：`max-w-md mx-auto min-h-screen`
- 内容区域：`pb-24`（为 TabBar + FAB 留空间）

### 时间轴记录卡片

```
┌─────────────────────────────────┐
│ 10:04    🍼  配方奶 160ml        │
│ AM        👤 妈妈                │
│                         ✏️ 🗑️  │
└─────────────────────────────────┘
│  ← 1px border-light 分割线 →  │
```

### 模态框（底部弹出）

```
┌─────────────────────┐
│  (半透明黑色遮罩)     │
│                      │
├─────────────────────┤  ← 圆角顶部
│  表单标题        ✕  │
│  ─────────────────  │
│                      │
│  表单内容            │
│                      │
│  [取消]  [保存]     │
│                      │
└─────────────────────┘  ← 底部对齐
```

## 图标使用

全部使用 lucide-react 图标：

| 场景 | 图标 |
|------|------|
| 喂养 | `Baby` 或 `Milk` |
| 睡眠 | `Moon` |
| 尿布 | `StickyNote` |
| 补剂 | `Pill` |
| 时间轴 Tab | `Clock` |
| 统计 Tab | `BarChart3` |
| 我的 Tab | `User` |
| 添加按钮 | `Plus` |
| 编辑 | `Pencil` |
| 删除 | `Trash2` |
| 日历 | `Calendar` |
| 左箭头 | `ChevronLeft` |
| 右箭头 | `ChevronRight` |
| 复制 | `Copy` |
| 导出 | `Download` |
| 退出 | `LogOut` |

## Tailwind 配置

```js
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#FF9A8B',
          'primary-light': '#FFB5A7',
          secondary: '#FFD6A5',
          'secondary-light': '#FFF0E0',
        },
        bg: {
          page: '#FFF5F0',
          card: '#FFFFFF',
        },
        text: {
          primary: '#2D2D2D',
          secondary: '#8E8E93',
          muted: '#C7C7CC',
        },
        border: { light: '#F0F0F0' },
        success: '#34C759',
        warning: '#FF9500',
        danger: '#FF3B30',
        info: '#5AC8FA',
        type: {
          feeding: '#FF9A8B',
          sleep: '#7B8CDE',
          diaper: '#FFB347',
          supplement: '#4ECDC4',
        },
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08)',
        modal: '0 8px 32px rgba(0,0,0,0.16)',
        fab: '0 4px 12px rgba(255,154,139,0.4)',
      },
      fontSize: {
        h1: ['22px', { fontWeight: '700' }],
        h2: ['18px', { fontWeight: '600' }],
        h3: ['16px', { fontWeight: '500' }],
        body: ['14px', { fontWeight: '400' }],
        caption: ['12px', { fontWeight: '400' }],
      },
    },
  },
  plugins: [],
};
```
