<script setup lang="ts">
import AgreementModal from './components/AgreementModal.vue'
import MigrationModal from './components/MigrationModal.vue'
import ImportArea from './components/ImportArea.vue'

const features = [
  {
    icon: '🔒',
    title: '隐私至上',
    desc: '聊天记录本地存储本地分析，保护你的隐私。',
    color: 'text-green-500',
    bg: 'bg-green-50',
    delay: '200ms',
  },
  {
    icon: '📊',
    title: '多维度分析',
    desc: '从群榜单到群语录，全方位解读群聊数据，发现隐藏的趣味。',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    delay: '100ms',
  },
  {
    icon: '🤖',
    title: 'AI 洞察',
    desc: '内置 AI Agent，智能回答关于群聊的一切疑问，挖掘数据背后的趣事。',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    delay: '300ms',
  },
]
</script>

<template>
  <div class="relative flex h-full w-full overflow-hidden bg-gray-50 dark:bg-gray-950">
    <!-- Animated Background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute -top-[20%] -left-[10%] h-[70%] w-[70%] rounded-full bg-purple-200/30 blur-[120px] mix-blend-multiply animate-blob dark:bg-purple-900/20 dark:mix-blend-screen"
      ></div>
      <div
        class="absolute -top-[20%] -right-[10%] h-[70%] w-[70%] rounded-full bg-pink-200/30 blur-[120px] mix-blend-multiply animate-blob animation-delay-2000 dark:bg-pink-900/20 dark:mix-blend-screen"
      ></div>
      <div
        class="absolute -bottom-[20%] left-[20%] h-[70%] w-[70%] rounded-full bg-blue-200/30 blur-[120px] mix-blend-multiply animate-blob animation-delay-4000 dark:bg-blue-900/20 dark:mix-blend-screen"
      ></div>
    </div>

    <!-- Content Container -->
    <div class="relative h-full w-full overflow-y-auto">
      <div class="flex min-h-full w-full flex-col items-center justify-center px-4 py-12">
        <!-- Hero Section -->
        <div class="xl:mb-16 mb-8 text-center">
          <!-- Title -->
          <h1 class="mb-4 text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight text-pink-500">ChatLab</h1>
          <!-- Description -->
          <div class="relative inline-block mb-8">
            <p class="text-lg sm:text-2xl text-gray-600 dark:text-gray-400 font-medium">
              你的本地聊天分析实验室ヾ(*ゝω・*)ノ
            </p>
            <UIcon name="i-heroicons-sparkles" class="absolute -right-6 -top-3 h-5 w-5 animate-bounce text-pink-400" />
          </div>
        </div>

        <!-- Feature Cards -->
        <div class="xl:mb-16 mb-8 grid max-w-4xl grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 px-4">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="group relative overflow-hidden rounded-3xl border border-transparent p-4 transition-all duration-500"
          >
            <div class="relative">
              <div class="mb-3 flex items-center">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                >
                  <span class="text-xl filter drop-shadow-sm">{{ feature.icon }}</span>
                </div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                  {{ feature.title }}
                </h3>
              </div>
              <p class="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {{ feature.desc }}
              </p>
            </div>
          </div>
        </div>

        <!-- Import Area -->
        <ImportArea />
      </div>
    </div>

    <!-- 用户协议弹窗 -->
    <AgreementModal />

    <!-- 数据库迁移弹窗 -->
    <MigrationModal />
  </div>
</template>
