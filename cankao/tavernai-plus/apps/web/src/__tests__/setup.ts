/**
 * Vitest Test Setup
 * Global configuration for frontend tests
 */

import { config } from '@vue/test-utils';
import { vi } from 'vitest';

// Mock Element Plus globally
config.global.stubs = {
  ElButton: true,
  ElCard: true,
  ElDialog: true,
  ElForm: true,
  ElFormItem: true,
  ElInput: true,
  ElSelect: true,
  ElOption: true,
  ElCheckbox: true,
  ElRadio: true,
  ElRadioGroup: true,
  ElProgress: true,
  ElBadge: true,
  ElDropdown: true,
  ElDropdownMenu: true,
  ElDropdownItem: true,
  ElNotification: true,
  ElMessage: true,
  ElTooltip: true,
  ElDrawer: true,
  ElTabs: true,
  ElTabPane: true,
};

// Mock Vue Router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
  }),
  useRoute: () => ({
    path: '/',
    params: {},
    query: {},
    meta: {},
  }),
}));

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_URL: 'http://localhost:3001',
    VITE_WS_URL: 'http://localhost:3001',
    MODE: 'test',
    DEV: false,
    PROD: false,
    SSR: false,
  },
  writable: true,
});

// Global test utilities
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Suppress console warnings in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = vi.fn();
});

afterAll(() => {
  console.warn = originalWarn;
});
