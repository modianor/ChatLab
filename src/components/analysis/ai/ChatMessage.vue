<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import MarkdownIt from 'markdown-it'
import userAvatar from '@/assets/images/momo.png'
import type { ContentBlock, ToolBlockContent } from '@/composables/useAIChat'
import CaptureButton from '@/components/common/CaptureButton.vue'

// Props
const props = defineProps<{
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isStreaming?: boolean
  /** AI 消息的混合内容块（按时序排列的文本和工具调用） */
  contentBlocks?: ContentBlock[]
  /** 是否显示截屏按钮（仅 AI 回复） */
  showCaptureButton?: boolean
}>()

// 格式化时间
const formattedTime = computed(() => {
  return dayjs(props.timestamp).format('HH:mm')
})

// 是否是用户消息
const isUser = computed(() => props.role === 'user')

// 创建 markdown-it 实例
const md = new MarkdownIt({
  html: false, // 禁用 HTML 标签
  breaks: true, // 将换行转为 <br>
  linkify: true, // 自动将 URL 转为链接
  typographer: true, // 启用排版优化
})

// 渲染 Markdown 文本
function renderMarkdown(text: string): string {
  if (!text) return ''
  return md.render(text)
}

// 渲染后的 HTML（用于用户消息或纯文本 AI 消息）
const renderedContent = computed(() => {
  if (!props.content) return ''
  return md.render(props.content)
})

// 是否使用 contentBlocks 渲染（AI 消息且有 contentBlocks）
const useBlocksRendering = computed(() => {
  return props.role === 'assistant' && props.contentBlocks && props.contentBlocks.length > 0
})

// 格式化时间参数显示
function formatTimeParams(params: Record<string, unknown>): string {
  // 优先使用 start_time/end_time
  if (params.start_time || params.end_time) {
    const start = params.start_time ? String(params.start_time) : ''
    const end = params.end_time ? String(params.end_time) : ''
    if (start && end) {
      return `${start} ~ ${end}`
    }
    return start || end
  }

  // 使用 year/month/day/hour 组合
  if (params.year) {
    let result = `${params.year}年`
    if (params.month) {
      result += `${params.month}月`
      if (params.day) {
        result += `${params.day}日`
        if (params.hour !== undefined) {
          result += ` ${params.hour}点`
        }
      }
    }
    return result
  }

  return ''
}

// 格式化工具参数显示
function formatToolParams(tool: ToolBlockContent): string {
  if (!tool.params) return ''

  const name = tool.name
  const params = tool.params

  if (name === 'search_messages') {
    const keywords = params.keywords as string[] | undefined
    const parts: string[] = []

    if (keywords && keywords.length > 0) {
      parts.push(`关键词: ${keywords.join(', ')}`)
    }

    const timeStr = formatTimeParams(params)
    if (timeStr) {
      parts.push(`时间: ${timeStr}`)
    }

    return parts.join(' | ')
  }

  if (name === 'get_recent_messages') {
    const parts: string[] = []
    parts.push(`获取 ${params.limit || 100} 条消息`)

    const timeStr = formatTimeParams(params)
    if (timeStr) {
      parts.push(timeStr)
    }

    return parts.join(' | ')
  }

  if (name === 'get_conversation_between') {
    const parts: string[] = []

    const timeStr = formatTimeParams(params)
    if (timeStr) {
      parts.push(`时间: ${timeStr}`)
    }

    if (params.limit) {
      parts.push(`限制 ${params.limit} 条`)
    }

    return parts.join(' | ')
  }

  if (name === 'get_message_context') {
    const ids = params.message_ids as number[] | undefined
    const size = params.context_size || 20
    if (ids && ids.length > 0) {
      return `${ids.length} 条消息的前后各 ${size} 条上下文`
    }
    return `前后各 ${size} 条上下文`
  }

  if (name === 'get_member_stats') {
    return `前 ${params.top_n || 10} 名成员`
  }

  if (name === 'get_time_stats') {
    const typeMap: Record<string, string> = {
      hourly: '按小时',
      weekday: '按星期',
      daily: '按日期',
    }
    return typeMap[params.type as string] || String(params.type)
  }

  if (name === 'get_group_members') {
    if (params.search) {
      return `搜索: ${params.search}`
    }
    return '获取成员列表'
  }

  if (name === 'get_member_name_history') {
    return `成员ID: ${params.member_id}`
  }

  return ''
}
</script>

<template>
  <div class="flex items-start gap-3" :class="[isUser ? 'flex-row-reverse' : '']">
    <!-- 头像 -->
    <div v-if="isUser" class="h-8 w-8 shrink-0 overflow-hidden rounded-full">
      <img :src="userAvatar" alt="用户头像" class="h-full w-full object-cover" />
    </div>
    <div
      v-else
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-pink-500 to-pink-600"
    >
      <UIcon name="i-heroicons-sparkles" class="h-4 w-4 text-white" />
    </div>

    <!-- 消息内容 -->
    <div class="max-w-[80%] min-w-0">
      <!-- 用户消息：简单气泡 -->
      <template v-if="isUser">
        <div class="rounded-2xl rounded-tr-sm bg-blue-500 px-4 py-3 text-white">
          <div class="prose prose-sm prose-invert max-w-none leading-relaxed" v-html="renderedContent" />
        </div>
      </template>

      <!-- AI 消息：混合内容块布局 -->
      <template v-else-if="useBlocksRendering">
        <div class="space-y-3">
          <template v-for="(block, idx) in contentBlocks" :key="idx">
            <!-- 文本块 -->
            <div
              v-if="block.type === 'text'"
              class="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
            >
              <div
                class="prose prose-sm dark:prose-invert max-w-none leading-relaxed"
                v-html="renderMarkdown(block.text)"
              />
              <!-- 流式输出光标（只在最后一个文本块显示） -->
              <span
                v-if="isStreaming && idx === contentBlocks!.length - 1"
                class="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-pink-500"
              />
            </div>

            <!-- 工具块 -->
            <div
              v-else-if="block.type === 'tool'"
              class="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
              :class="[
                block.tool.status === 'running'
                  ? 'border-pink-200 bg-pink-50 dark:border-pink-800/50 dark:bg-pink-900/20'
                  : block.tool.status === 'done'
                    ? 'border-green-200 bg-green-50 dark:border-green-800/50 dark:bg-green-900/20'
                    : 'border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20',
              ]"
            >
              <!-- 状态图标 -->
              <UIcon
                :name="
                  block.tool.status === 'running'
                    ? 'i-heroicons-arrow-path'
                    : block.tool.status === 'done'
                      ? 'i-heroicons-check-circle'
                      : 'i-heroicons-x-circle'
                "
                class="h-4 w-4 shrink-0"
                :class="[
                  block.tool.status === 'running'
                    ? 'animate-spin text-pink-500'
                    : block.tool.status === 'done'
                      ? 'text-green-500'
                      : 'text-red-500',
                ]"
              />
              <!-- 工具信息 -->
              <div class="min-w-0 flex-1">
                <!-- 调用前缀 -->
                <span class="text-xs text-gray-400 dark:text-gray-500 mr-1">调用</span>
                <span class="font-medium text-gray-700 dark:text-gray-300">
                  {{ block.tool.displayName }}
                </span>
                <span v-if="formatToolParams(block.tool)" class="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  {{ formatToolParams(block.tool) }}
                </span>
              </div>
            </div>
          </template>
        </div>
      </template>

      <!-- AI 消息：传统纯文本渲染（向后兼容） -->
      <template v-else>
        <div class="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 text-gray-900 dark:bg-gray-800 dark:text-gray-100">
          <div class="prose prose-sm dark:prose-invert max-w-none leading-relaxed" v-html="renderedContent" />
          <span v-if="isStreaming" class="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-pink-500" />
        </div>
      </template>

      <!-- 时间戳 + 操作按钮 -->
      <div class="mt-1 flex items-center gap-2 px-1" :class="[isUser ? 'flex-row-reverse' : '']">
        <span class="text-xs text-gray-400">{{ formattedTime }}</span>
        <!-- 截屏按钮（仅 AI 回复显示） -->
        <CaptureButton
          v-if="showCaptureButton && !isUser && !isStreaming"
          tooltip="截屏此问答"
          size="xs"
          type="element"
          target-selector=".qa-pair"
        />
      </div>
    </div>
  </div>
</template>

<!-- Markdown 样式已提取到全局 src/assets/styles/markdown.css -->
