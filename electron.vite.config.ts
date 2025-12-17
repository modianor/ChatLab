import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin, loadEnv } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'

export default defineConfig(({ mode }) => {
  // 加载环境变量（带 MAIN_VITE_ 前缀）
  const env = loadEnv(mode)

  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      define: {
        'process.env.APTABASE_APP_KEY': JSON.stringify(env.MAIN_VITE_APTABASE_APP_KEY || ''),
      },
      build: {
        rollupOptions: {
          input: {
            index: resolve(__dirname, 'electron/main/index.ts'),
            'worker/dbWorker': resolve(__dirname, 'electron/main/worker/dbWorker.ts'),
          },
        },
      },
    },
    preload: {
      plugins: [externalizeDepsPlugin()],
      build: {
        rollupOptions: {
          input: {
            index: resolve(__dirname, 'electron/preload/index.ts'),
          },
        },
      },
    },
    renderer: {
      resolve: {
        alias: {
          '@': resolve('src/'),
          '~': resolve('src/'),
        },
      },
      plugins: [
        vue(),
        ui({
          ui: {
            colors: {
              primary: 'pink', // 使用自定义 pink 作为主色
              neutral: 'slate',
            },
          },
        }),
      ],
      root: 'src/',
      build: {
        sourcemap: false,
        rollupOptions: {
          input: {
            index: resolve(__dirname, 'src/index.html'),
          },
        },
      },
      server: {
        host: '0.0.0.0',
        port: 3400,
      },
    },
  }
})
