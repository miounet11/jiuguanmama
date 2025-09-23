// =====================================
// TavernAI Plus 设计系统 - TypeScript Tokens
// 为 Vue 组件提供设计令牌的类型安全访问
// =====================================

// 颜色系统类型定义
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface SurfaceScale {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
}

// 设计令牌接口
export interface DesignTokens {
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    accent: ColorScale;
    neutral: ColorScale;
    surface: SurfaceScale;
  };
  spacing: Record<string, string>;
  typography: {
    fontFamily: Record<string, string[]>;
    fontSize: Record<string, [string, { lineHeight: string }]>;
  };
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  zIndex: Record<string, number>;
}

// 设计令牌实现
export const designTokens: DesignTokens = {
  colors: {
    primary: {
      50: '#faf7ff',
      100: '#f3ebff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c2d12',
      800: '#581c87',
      900: '#4c1d95',
      950: '#2e1065',
    },
    secondary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    accent: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22',
    },
    neutral: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b',
    },
    surface: {
      0: '#0a0a0f',
      1: '#111118',
      2: '#1a1a24',
      3: '#242430',
      4: '#2e2e3c',
    },
  },
  spacing: {
    0: '0',
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
  },
  typography: {
    fontFamily: {
      primary: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      secondary: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', 'monospace'],
      display: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      body: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
    },
    fontSize: {
      '2xs': ['0.625rem', { lineHeight: '1rem' }],
      'xs': ['0.75rem', { lineHeight: '1rem' }],
      'sm': ['0.875rem', { lineHeight: '1.25rem' }],
      'base': ['1rem', { lineHeight: '1.5rem' }],
      'lg': ['1.125rem', { lineHeight: '1.75rem' }],
      'xl': ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
    },
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    base: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.25rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 25px 25px -12px rgba(0, 0, 0, 0.4)',
    '2xl': '0 50px 100px -20px rgba(0, 0, 0, 0.7), 0 30px 60px -30px rgba(0, 0, 0, 0.5)',
    primary: '0 8px 25px -8px rgba(168, 85, 247, 0.4)',
    secondary: '0 8px 25px -8px rgba(59, 130, 246, 0.4)',
    accent: '0 8px 25px -8px rgba(16, 185, 129, 0.4)',
    glow: '0 0 20px rgba(168, 85, 247, 0.3)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
  },
  zIndex: {
    base: 0,
    below: -1,
    content: 1,
    raised: 10,
    floating: 100,
    header: 1000,
    sidebar: 1010,
    navigation: 1020,
    dropdown: 2000,
    popover: 2010,
    tooltip: 2020,
    sticky: 2030,
    overlay: 3000,
    modal: 3010,
    drawer: 3020,
    fullscreen: 3030,
    toast: 4000,
    notification: 4010,
    loading: 4020,
    maximum: 9999,
  },
};

// 工具函数：获取CSS变量值
export function getCSSVar(name: string): string {
  return `var(--${name})`;
}

// 工具函数：根据主题获取颜色
export function getThemeColor(color: keyof typeof designTokens.colors, shade: keyof ColorScale | keyof SurfaceScale): string {
  if (color === 'surface') {
    return getCSSVar(`surface-${shade}`);
  }
  return getCSSVar(`${color}-${shade}`);
}

// 工具函数：获取间距值
export function getSpacing(size: keyof typeof designTokens.spacing): string {
  return getCSSVar(`space-${size}`);
}

// 工具函数：获取阴影
export function getShadow(type: keyof typeof designTokens.shadows): string {
  return getCSSVar(`shadow-${type}`);
}

// 工具函数：获取圆角
export function getBorderRadius(size: keyof typeof designTokens.borderRadius): string {
  return getCSSVar(`radius-${size}`);
}

// 工具函数：获取Z-index
export function getZIndex(layer: keyof typeof designTokens.zIndex): number {
  return designTokens.zIndex[layer];
}

// 响应式断点常量
export const breakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
} as const;

// 媒体查询工具函数
export function mediaQuery(breakpoint: keyof typeof breakpoints): string {
  return `@media (min-width: ${breakpoints[breakpoint]}px)`;
}

// 容器宽度常量
export const containerSizes = {
  xs: '100%',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1400px',
} as const;

// 导出给Vue组件使用的常量
export const THEME = {
  COLORS: designTokens.colors,
  SPACING: designTokens.spacing,
  TYPOGRAPHY: designTokens.typography,
  BORDER_RADIUS: designTokens.borderRadius,
  SHADOWS: designTokens.shadows,
  Z_INDEX: designTokens.zIndex,
  BREAKPOINTS: breakpoints,
  CONTAINERS: containerSizes,
} as const;

// 类型导出
export type ThemeColor = keyof typeof designTokens.colors;
export type ThemeSpacing = keyof typeof designTokens.spacing;
export type ThemeShadow = keyof typeof designTokens.shadows;
export type ThemeBorderRadius = keyof typeof designTokens.borderRadius;
export type ThemeZIndex = keyof typeof designTokens.zIndex;
export type ThemeBreakpoint = keyof typeof breakpoints;