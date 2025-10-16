import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import { VitePWA } from 'vite-plugin-pwa' // 临时禁用
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
    // VitePWA 临时禁用 - 修复配置问题后重新启用
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   manifest: {
    //     name: 'TavernAI Plus - AI角色扮演平台',
    //     short_name: 'TavernAI Plus',
    //     description: '下一代AI角色扮演对话平台',
    //     theme_color: '#a855f7',
    //     background_color: '#0a0a0f',
    //     display: 'standalone',
    //     start_url: '/',
    //     icons: [
    //       {
    //         src: 'logo.svg',
    //         sizes: 'any',
    //         type: 'image/svg+xml'
    //       }
    //     ]
    //   }
    // })
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

  // 开发服务器配置 - 固定端口配置
  server: {
    port: 8080,
    host: '0.0.0.0', // 允许外部访问
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true
      },
      '/health': {
        target: 'http://localhost:8081',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:8081',
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
