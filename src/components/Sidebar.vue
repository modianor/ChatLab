<script setup lang="ts">
import { useChatStore } from '@/stores/chat'
import { storeToRefs } from 'pinia'
import { ref, onMounted } from 'vue'
import { ChatPlatform } from '@/types/chat'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const chatStore = useChatStore()
const { sessions, currentSessionId, isImporting } = storeToRefs(chatStore)

const isCollapsed = ref(false)
const deleteConfirmId = ref<string | null>(null)

// 加载会话列表
onMounted(() => {
  chatStore.loadSessions()
})

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
}

function handleImport() {
  // 清空当前会话选择，回到欢迎页（不触发导入弹窗）
  chatStore.clearSelection()
}

function getPlatformIcon(platform: ChatPlatform): string {
  switch (platform) {
    case ChatPlatform.QQ:
      return 'i-simple-icons-tencentqq'
    case ChatPlatform.WECHAT:
      return 'i-simple-icons-wechat'
    case ChatPlatform.TELEGRAM:
      return 'i-simple-icons-telegram'
    case ChatPlatform.DISCORD:
      return 'i-simple-icons-discord'
    default:
      return 'i-heroicons-chat-bubble-left-right'
  }
}

function formatTime(timestamp: number): string {
  return dayjs.unix(timestamp).fromNow()
}

function confirmDelete(id: string, event: Event) {
  event.stopPropagation()
  deleteConfirmId.value = id
}

async function handleDelete(id: string) {
  await chatStore.deleteSession(id)
  deleteConfirmId.value = null
}

function cancelDelete() {
  deleteConfirmId.value = null
}
</script>

<template>
  <div
    class="flex h-full flex-col border-r border-gray-200 bg-gray-50 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900"
    :class="[isCollapsed ? 'w-20' : 'w-72']"
  >
    <!-- Top Section -->
    <div class="flex flex-col p-4">
      <!-- Header / Toggle -->
      <div class="mb-6 flex items-center" :class="[isCollapsed ? 'justify-center' : 'justify-between']">
        <div v-if="!isCollapsed" class="text-lg font-semibold text-gray-900 dark:text-white">ChatLab</div>
        <UButton icon="i-heroicons-bars-3" color="gray" variant="ghost" size="sm" @click="toggleSidebar" />
      </div>

      <!-- New Analysis Button -->
      <UTooltip :text="isCollapsed ? '分析新的聊天' : ''" :popper="{ placement: 'right' }">
        <UButton
          block
          class="transition-all"
          :class="[isCollapsed ? 'px-0' : '']"
          color="gray"
          variant="solid"
          :icon="isImporting ? '' : 'i-heroicons-plus'"
          :label="isCollapsed ? '' : '分析新的聊天'"
          :loading="isImporting"
          :disabled="isImporting"
          @click="handleImport"
        />
      </UTooltip>
    </div>

    <!-- Session List -->
    <div class="flex-1 overflow-y-auto px-3">
      <div v-if="sessions.length === 0 && !isCollapsed" class="py-8 text-center text-sm text-gray-500">暂无记录</div>

      <div class="space-y-1">
        <div v-if="!isCollapsed && sessions.length > 0" class="mb-2 px-2 text-xs font-medium text-gray-500">
          分析记录
        </div>

        <div
          v-for="session in sessions"
          :key="session.id"
          class="group relative flex w-full items-center rounded-lg p-2 text-left transition-colors hover:bg-gray-200 dark:hover:bg-gray-800"
          :class="[
            currentSessionId === session.id
              ? 'bg-primary-100 text-primary-900 dark:bg-primary-900/30 dark:text-primary-100'
              : 'text-gray-700 dark:text-gray-200',
            isCollapsed ? 'justify-center cursor-pointer' : 'cursor-pointer',
          ]"
          @click="chatStore.selectSession(session.id)"
        >
          <!-- Platform Icon -->
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            :class="[
              currentSessionId === session.id ? 'bg-primary-200 dark:bg-primary-800' : 'bg-gray-200 dark:bg-gray-700',
              isCollapsed ? '' : 'mr-3',
            ]"
          >
            <UIcon :name="getPlatformIcon(session.platform)" class="h-5 w-5" />
          </div>

          <!-- Session Info -->
          <div v-if="!isCollapsed" class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">
              {{ session.name }}
            </p>
            <p class="truncate text-xs text-gray-500 dark:text-gray-400">
              {{ session.messageCount }} 条消息 · {{ formatTime(session.importedAt) }}
            </p>
          </div>

          <!-- Delete Button -->
          <div v-if="!isCollapsed" class="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
            <UPopover v-if="deleteConfirmId === session.id" :open="true" @update:open="cancelDelete">
              <template #default>
                <UButton
                  icon="i-heroicons-trash"
                  color="red"
                  variant="ghost"
                  size="xs"
                  @click="(e: Event) => confirmDelete(session.id, e)"
                />
              </template>
              <template #content>
                <div class="p-3">
                  <p class="mb-3 text-sm">确定删除此分析记录？</p>
                  <div class="flex justify-end gap-2">
                    <UButton size="xs" color="gray" variant="ghost" @click="cancelDelete">取消</UButton>
                    <UButton size="xs" color="red" @click="handleDelete(session.id)">删除</UButton>
                  </div>
                </div>
              </template>
            </UPopover>
            <UButton
              v-else
              icon="i-heroicons-trash"
              color="gray"
              variant="ghost"
              size="xs"
              @click="(e: Event) => confirmDelete(session.id, e)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="border-t border-gray-200 p-4 dark:border-gray-800">
      <UTooltip :text="isCollapsed ? '设置' : ''" :popper="{ placement: 'right' }">
        <UButton
          block
          color="gray"
          variant="ghost"
          icon="i-heroicons-cog-6-tooth"
          :label="isCollapsed ? '' : '设置'"
          :class="[isCollapsed ? 'px-0' : 'justify-start']"
        />
      </UTooltip>
    </div>
  </div>
</template>
