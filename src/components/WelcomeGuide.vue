<script setup lang="ts">
import { useChatStore } from '@/stores/chat'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

const chatStore = useChatStore()
const { isImporting, importProgress } = storeToRefs(chatStore)

const importError = ref<string | null>(null)
const isDragOver = ref(false)

const features = [
  {
    icon: '🏆',
    title: '活跃度分析',
    desc: '谁是群里的潜水王？',
    color: 'text-yellow-500',
    bg: 'bg-yellow-50',
    delay: '0ms',
  },
  {
    icon: '☁️',
    title: '词云生成',
    desc: '大家最爱说什么？',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    delay: '100ms',
  },
  {
    icon: '❤️',
    title: '情感分析',
    desc: '群聊氛围怎么样？',
    color: 'text-pink-500',
    bg: 'bg-pink-50',
    delay: '200ms',
  },
]

async function handleImport() {
  importError.value = null
  const result = await chatStore.importFile()
  if (!result.success && result.error && result.error !== '未选择文件') {
    importError.value = result.error
  }
}

// 拖拽事件处理
function handleDragOver(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = true
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = false
}

async function handleDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = false

  if (isImporting.value) return

  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return

  const file = files[0]

  // 使用 Electron 的 webUtils 获取文件真实路径
  let filePath: string
  try {
    filePath = window.electron.webUtils.getPathForFile(file)
  } catch (error) {
    console.error('获取文件路径失败:', error)
    importError.value = '无法读取文件路径'
    return
  }

  if (!filePath) {
    importError.value = '无法读取文件路径'
    return
  }

  importError.value = null
  const result = await chatStore.importFileFromPath(filePath)
  if (!result.success && result.error) {
    importError.value = result.error
  }
}

function openTutorial(type: 'wechat' | 'qq') {
  // TODO: 打开教程页面
  console.log('Tutorial:', type)
}

function getProgressText(): string {
  if (!importProgress.value) return ''
  switch (importProgress.value.stage) {
    case 'reading':
      return '读取文件中...'
    case 'parsing':
      return '解析聊天记录...'
    case 'saving':
      return '保存数据...'
    case 'done':
      return '导入完成！'
    case 'error':
      return '导入失败'
    default:
      return ''
  }
}
</script>

<template>
  <div class="relative flex h-full w-full overflow-hidden bg-white dark:bg-gray-950">
    <!-- Content Container -->
    <div class="relative z-10 flex h-full w-full flex-col items-center justify-center px-4">
      <!-- Hero Section -->
      <div class="mb-12 text-center">
        <div
          class="mb-6 inline-flex items-center justify-center rounded-3xl bg-white p-4 shadow-lg shadow-purple-100 ring-1 ring-gray-100 dark:bg-gray-900 dark:shadow-purple-900/20 dark:ring-gray-800"
          :class="[isImporting ? '' : 'animate-bounce']"
        >
          <UIcon v-if="!isImporting" name="i-heroicons-sparkles" class="h-8 w-8 text-purple-500" />
          <UIcon v-else name="i-heroicons-arrow-path" class="h-8 w-8 animate-spin text-purple-500" />
        </div>
        <h1
          class="mb-4 bg-linear-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl"
        >
          ChatLab
        </h1>
        <p class="text-lg font-medium text-gray-500 dark:text-gray-400">获取你的聊天记录分析报告</p>
      </div>

      <!-- Feature Cards -->
      <div class="mb-12 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="group relative transform cursor-default rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-500/10 dark:border-gray-800 dark:bg-gray-900"
          :style="{ animationDelay: feature.delay }"
        >
          <div class="mb-4 text-4xl transition-transform duration-300 group-hover:scale-110">
            {{ feature.icon }}
          </div>
          <h3 class="mb-2 text-lg font-bold text-gray-900 dark:text-white">{{ feature.title }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ feature.desc }}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col items-center space-y-6">
        <!-- Import Drop Zone -->
        <div
          class="group relative flex w-full max-w-2xl cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-purple-300 bg-white px-12 py-12 transition-all duration-300 hover:border-purple-400 hover:bg-purple-50/50 focus:outline-none focus:ring-4 focus:ring-purple-500/20 dark:border-purple-700 dark:bg-gray-900 dark:hover:border-purple-500 dark:hover:bg-purple-900/10"
          :class="{
            'border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-900/20': isDragOver && !isImporting,
            'cursor-not-allowed opacity-70': isImporting,
            'hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10': !isImporting,
          }"
          @click="!isImporting && handleImport()"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
        >
          <!-- Icon -->
          <div
            class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-purple-100 to-pink-100 transition-transform duration-300 dark:from-purple-900/30 dark:to-pink-900/30"
            :class="{ 'scale-110': isDragOver && !isImporting, 'animate-pulse': isImporting }"
          >
            <UIcon
              v-if="!isImporting"
              name="i-heroicons-arrow-up-tray"
              class="h-8 w-8 text-purple-600 transition-transform group-hover:-translate-y-1 dark:text-purple-400"
            />
            <UIcon
              v-else
              name="i-heroicons-arrow-path"
              class="h-8 w-8 animate-spin text-purple-600 dark:text-purple-400"
            />
          </div>

          <!-- Text -->
          <div class="w-full text-center">
            <template v-if="isImporting && importProgress">
              <!-- 导入中显示进度 -->
              <p class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{{ getProgressText() }}</p>
              <div class="mx-auto w-full max-w-md">
                <UProgress :value="importProgress.progress" size="md" color="purple" />
              </div>
              <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
                {{ importProgress.message }}
              </p>
            </template>
            <template v-else>
              <!-- 默认状态 -->
              <p class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ isDragOver ? '松开鼠标导入文件' : '点击选择或拖拽文件到这里' }}
              </p>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">支持 QQ、微信聊天记录（JSON/TXT 格式）</p>
            </template>
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="importError"
          class="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
        >
          <UIcon name="i-heroicons-exclamation-circle" class="h-5 w-5 shrink-0" />
          <span>{{ importError }}</span>
        </div>

        <!-- Tutorial Links -->
        <div class="flex items-center space-x-6 text-sm font-medium text-gray-400">
          <button
            class="flex items-center transition-colors hover:text-gray-600 dark:hover:text-gray-300"
            @click="openTutorial('wechat')"
          >
            <UIcon name="i-simple-icons-wechat" class="mr-1.5 h-4 w-4" />
            微信导入教程
          </button>
          <span class="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
          <button
            class="flex items-center transition-colors hover:text-gray-600 dark:hover:text-gray-300"
            @click="openTutorial('qq')"
          >
            <UIcon name="i-simple-icons-tencentqq" class="mr-1.5 h-4 w-4" />
            QQ导入教程
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
