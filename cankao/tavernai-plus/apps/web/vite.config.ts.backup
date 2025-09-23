import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// 性能优化配置 - TavernAI Plus
export default defineConfig({
  plugins: [
    vue({
      // Vue 编译优化
      template: {
        compilerOptions: {
          // 跳过某些检查以提升编译速度
          hoistStatic: true,
          cacheHandlers: true,
        }
      }
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.tavernai\.plus\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheKeyWillBeUsed: async ({ request }) => {
                // 为API请求生成缓存键
                return `${request.url}?v=${Date.now()}`
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'TavernAI Plus - AI角色扮演平台',
        short_name: 'TavernAI Plus',
        description: '下一代AI角色扮演对话平台，提供丰富的AI角色创建、对话交互和社区分享功能',
        theme_color: '#a855f7',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: '快速聊天',
            short_name: '聊天',
            description: '快速开始与AI角色对话',
            url: '/quick-chat',
            icons: [
              {
                src: 'icons/shortcut-chat.png',
                sizes: '96x96'
              }
            ]
          },
          {
            name: '创建角色',
            short_name: '创建',
            description: '创建新的AI角色',
            url: '/studio/character/create',
            icons: [
              {
                src: 'icons/shortcut-create.png',
                sizes: '96x96'
              }
            ]
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],

  // 路径别名
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, '../../packages/shared'),
      '@ui': resolve(__dirname, '../../packages/ui')
    }
  },

  // CSS 优化
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "@/styles/variables.scss";
          @import "@/styles/mixins.scss";
        `
      }
    }
  },

  // 构建优化
  build: {
    // 目标环境
    target: 'es2020',
    
    // 代码分割优化
    rollupOptions: {
      output: {
        // 手动代码分割
        manualChunks: {
          // Vue 生态系统
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          
          // UI 组件库
          'ui-vendor': ['element-plus', '@element-plus/icons-vue'],
          
          // 工具库
          'utils-vendor': ['axios', 'date-fns'],
          
          // WebSocket 相关
          'socket-vendor': ['socket.io-client'],
          
          // 社区相关组件
          'community': [
            'src/views/community/CommunityView.vue',
            'src/views/community/PostDetailView.vue',
            'src/views/community/UserProfileView.vue',
            'src/components/community/PostCard.vue',
            'src/components/community/CreatePostDialog.vue',
            'src/components/community/CommentSection.vue'
          ],
          
          // 语音和图像处理组件
          'media': [
            'src/components/voice/VoiceInput.vue',
            'src/components/voice/VoicePlayer.vue',
            'src/components/voice/TextToSpeech.vue',
            'src/components/image/ImageGenerator.vue',
            'src/components/image/ImageAnalyzer.vue',
            'src/components/image/ImageEditor.vue'
          ],
          
          // 市场相关组件
          'marketplace': [
            'src/views/marketplace/MarketplaceView.vue',
            'src/views/marketplace/MarketplacePage.vue',
            'src/components/marketplace/MarketplaceFilters.vue',
            'src/components/character/CharacterMarketCard.vue',
            'src/components/character/CharacterMarketDetail.vue'
          ]
        },
        
        // 资源命名
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    // 压缩优化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    
    // 文件大小报告
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
    
    // 其他优化
    sourcemap: false, // 生产环境关闭 sourcemap
    cssCodeSplit: true, // CSS 代码分割
  },

  // 开发服务器配置
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true
      }
    }
  },

  // 优化依赖
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'element-plus',
      '@element-plus/icons-vue',
      'axios',
      'socket.io-client'
    ]
  }
})
