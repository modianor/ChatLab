<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { MemberActivity, MemberNameHistory, RepeatAnalysis } from '@/types/chat'
import { MemberRankList, BarChart } from '@/components/charts'
import type { MemberRankItem, BarChartData } from '@/components/charts'

interface TimeFilter {
  startTs?: number
  endTs?: number
}

const props = defineProps<{
  sessionId: string
  memberActivity: MemberActivity[]
  timeFilter?: TimeFilter
}>()

// ==================== 复读分析 ====================
const repeatAnalysis = ref<RepeatAnalysis | null>(null)
const isLoadingRepeat = ref(false)

// 复读排行榜显示模式：count（绝对次数）或 rate（复读率）
const repeatRankMode = ref<'count' | 'rate'>('rate')

// 转换复读数据为排行榜格式（绝对次数）
const originatorRankData = computed<MemberRankItem[]>(() => {
  if (!repeatAnalysis.value) return []
  const data = repeatRankMode.value === 'count' ? repeatAnalysis.value.originators : repeatAnalysis.value.originatorRates
  return data.slice(0, 10).map((m) => ({
    id: m.memberId.toString(),
    name: m.name,
    value: repeatRankMode.value === 'count' ? (m as any).count : (m as any).count,
    percentage: repeatRankMode.value === 'count' ? (m as any).percentage : (m as any).rate,
  }))
})

const initiatorRankData = computed<MemberRankItem[]>(() => {
  if (!repeatAnalysis.value) return []
  const data = repeatRankMode.value === 'count' ? repeatAnalysis.value.initiators : repeatAnalysis.value.initiatorRates
  return data.slice(0, 10).map((m) => ({
    id: m.memberId.toString(),
    name: m.name,
    value: repeatRankMode.value === 'count' ? (m as any).count : (m as any).count,
    percentage: repeatRankMode.value === 'count' ? (m as any).percentage : (m as any).rate,
  }))
})

const breakerRankData = computed<MemberRankItem[]>(() => {
  if (!repeatAnalysis.value) return []
  const data = repeatRankMode.value === 'count' ? repeatAnalysis.value.breakers : repeatAnalysis.value.breakerRates
  return data.slice(0, 10).map((m) => ({
    id: m.memberId.toString(),
    name: m.name,
    value: repeatRankMode.value === 'count' ? (m as any).count : (m as any).count,
    percentage: repeatRankMode.value === 'count' ? (m as any).percentage : (m as any).rate,
  }))
})

// 复读链长度分布图表数据
const chainLengthChartData = computed<BarChartData>(() => {
  if (!repeatAnalysis.value) return { labels: [], values: [] }
  const distribution = repeatAnalysis.value.chainLengthDistribution
  return {
    labels: distribution.map((d) => `${d.length}人`),
    values: distribution.map((d) => d.count),
  }
})

// 加载复读分析数据
async function loadRepeatAnalysis() {
  if (!props.sessionId) return

  isLoadingRepeat.value = true
  try {
    repeatAnalysis.value = await window.chatApi.getRepeatAnalysis(props.sessionId, props.timeFilter)
  } catch (error) {
    console.error('加载复读分析失败:', error)
  } finally {
    isLoadingRepeat.value = false
  }
}

// 截断过长的复读内容
function truncateContent(content: string, maxLength = 30): string {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength) + '...'
}

// Top 10 排行榜数据
const top10RankData = computed<MemberRankItem[]>(() => {
  return props.memberActivity.slice(0, 10).map((m) => ({
    id: m.memberId.toString(),
    name: m.name,
    value: m.messageCount,
    percentage: m.percentage,
  }))
})

// 完整排行榜数据
const fullRankData = computed<MemberRankItem[]>(() => {
  return props.memberActivity.map((m) => ({
    id: m.memberId.toString(),
    name: m.name,
    value: m.messageCount,
    percentage: m.percentage,
  }))
})

const isOpen = ref(false)

// 昵称变更记录
interface MemberWithHistory {
  memberId: number
  name: string
  history: MemberNameHistory[]
}

const membersWithNicknameChanges = ref<MemberWithHistory[]>([])
const isLoadingHistory = ref(false)

// 加载有昵称变更的成员
async function loadMembersWithNicknameChanges() {
  if (!props.sessionId || props.memberActivity.length === 0) return

  isLoadingHistory.value = true
  const membersWithChanges: MemberWithHistory[] = []

  try {
    // 并发查询所有成员的历史昵称
    const historyPromises = props.memberActivity.map((member) =>
      window.chatApi.getMemberNameHistory(props.sessionId, member.memberId)
    )

    const allHistories = await Promise.all(historyPromises)

    // 筛选出有昵称变更的成员（历史记录 > 1）
    props.memberActivity.forEach((member, index) => {
      const history = allHistories[index]
      if (history.length > 1) {
        membersWithChanges.push({
          memberId: member.memberId,
          name: member.name,
          history,
        })
      }
    })

    membersWithNicknameChanges.value = membersWithChanges
  } catch (error) {
    console.error('加载昵称变更记录失败:', error)
  } finally {
    isLoadingHistory.value = false
  }
}

// 监听 sessionId 和 memberActivity 变化，重新加载昵称历史
watch(
  () => [props.sessionId, props.memberActivity.length],
  () => {
    loadMembersWithNicknameChanges()
  },
  { immediate: true }
)

// 监听 sessionId 和 timeFilter 变化，重新加载复读分析
watch(
  () => [props.sessionId, props.timeFilter],
  () => {
    loadRepeatAnalysis()
  },
  { immediate: true, deep: true }
)

// 格式化时间段（用于横向展示）
function formatPeriod(startTs: number, endTs: number | null): string {
  const formatDate = (ts: number) => {
    const date = new Date(ts * 1000)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const start = formatDate(startTs)
  if (endTs === null) {
    return `${start} ~ 至今`
  }
  const end = formatDate(endTs)
  if (start === end) {
    return start
  }
  return `${start} ~ ${end}`
}
</script>

<template>
  <div class="space-y-6">
    <!-- 成员活跃度排行 -->
    <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <h3 class="font-semibold text-gray-900 dark:text-white">成员活跃度排行</h3>
        <!-- 完整排行榜 Dialog -->
        <UModal v-model:open="isOpen" :ui="{ width: 'max-w-3xl' }">
          <UButton v-if="memberActivity.length > 10" icon="i-heroicons-list-bullet" color="gray" variant="ghost">
            查看完整排行
          </UButton>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">完整成员排行榜</h3>
              <span>（共 {{ memberActivity.length }} 位成员）</span>
            </div>
          </template>
          <template #body>
            <div class="max-h-[60vh] overflow-y-auto">
              <MemberRankList :members="fullRankData" :session-id="sessionId" :clickable="true" />
            </div>
          </template>
        </UModal>
      </div>

      <MemberRankList :members="top10RankData" :session-id="sessionId" :clickable="true" />
    </div>

    <!-- 昵称变更记录区域 -->
    <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <h3 class="font-semibold text-gray-900 dark:text-white">昵称变更记录</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{
            isLoadingHistory
              ? '加载中...'
              : membersWithNicknameChanges.length > 0
                ? `${membersWithNicknameChanges.length} 位成员曾修改过昵称`
                : '暂无成员修改昵称'
          }}
        </p>
      </div>

      <div
        v-if="!isLoadingHistory && membersWithNicknameChanges.length > 0"
        class="divide-y divide-gray-100 dark:divide-gray-800"
      >
        <div
          v-for="member in membersWithNicknameChanges"
          :key="member.memberId"
          class="flex items-start gap-4 px-5 py-4"
        >
          <!-- 成员名称 -->
          <div class="w-32 shrink-0 pt-0.5 font-medium text-gray-900 dark:text-white">
            {{ member.name }}
          </div>

          <!-- 昵称历史（横向展示） -->
          <div class="flex flex-1 flex-wrap items-center gap-2">
            <template v-for="(item, index) in member.history" :key="index">
              <!-- 昵称标签 -->
              <div class="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 dark:bg-gray-800">
                <span
                  class="text-sm"
                  :class="item.endTs === null ? 'font-semibold text-[#de335e]' : 'text-gray-700 dark:text-gray-300'"
                >
                  {{ item.name }}
                </span>
                <UBadge v-if="item.endTs === null" color="primary" variant="soft" size="xs">当前</UBadge>
                <span class="text-xs text-gray-400">({{ formatPeriod(item.startTs, item.endTs) }})</span>
              </div>

              <!-- 箭头分隔符 -->
              <span v-if="index < member.history.length - 1" class="text-gray-300 dark:text-gray-600">→</span>
            </template>
          </div>
        </div>
      </div>

      <div v-else-if="!isLoadingHistory" class="px-5 py-8 text-center text-sm text-gray-400">
        该群组所有成员均未修改过昵称
      </div>

      <div v-else class="px-5 py-8 text-center text-sm text-gray-400">正在加载昵称变更记录...</div>
    </div>

    <!-- 复读分析模块 -->
    <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-white">复读分析</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{
              isLoadingRepeat
                ? '加载中...'
                : repeatAnalysis
                  ? `共检测到 ${repeatAnalysis.totalRepeatChains} 次复读，平均复读链长度 ${repeatAnalysis.avgChainLength} 人`
                  : '暂无复读数据'
            }}
          </p>
        </div>
        <!-- 排序切换按钮 -->
        <div v-if="repeatAnalysis && repeatAnalysis.totalRepeatChains > 0" class="flex gap-1">
          <UButton
            size="xs"
            :variant="repeatRankMode === 'rate' ? 'solid' : 'ghost'"
            :color="repeatRankMode === 'rate' ? 'primary' : 'gray'"
            @click="repeatRankMode = 'rate'"
          >
            按复读率
          </UButton>
          <UButton
            size="xs"
            :variant="repeatRankMode === 'count' ? 'solid' : 'ghost'"
            :color="repeatRankMode === 'count' ? 'primary' : 'gray'"
            @click="repeatRankMode = 'count'"
          >
            按次数
          </UButton>
        </div>
      </div>

      <div v-if="isLoadingRepeat" class="px-5 py-8 text-center text-sm text-gray-400">正在分析复读数据...</div>

      <div v-else-if="repeatAnalysis && repeatAnalysis.totalRepeatChains > 0" class="space-y-6 p-5">
        <!-- 复读链长度分布 & 最火复读内容 -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- 复读链长度分布 -->
          <div class="rounded-lg border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/50">
            <div class="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">📊 复读链长度分布</h4>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">每次复读有多少人参与</p>
            </div>
            <div class="p-4">
              <BarChart
                v-if="chainLengthChartData.labels.length > 0"
                :data="chainLengthChartData"
                :height="200"
              />
              <div v-else class="py-6 text-center text-sm text-gray-400">暂无数据</div>
            </div>
          </div>

          <!-- 最长复读链 TOP 10 -->
          <div class="rounded-lg border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/50">
            <div class="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">🏆 最长复读链 TOP 10</h4>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">单次复读参与人数最多的内容</p>
            </div>
            <div v-if="repeatAnalysis.hotContents.length > 0" class="divide-y divide-gray-100 dark:divide-gray-800">
              <div
                v-for="(item, index) in repeatAnalysis.hotContents"
                :key="index"
                class="flex items-center gap-3 px-4 py-3"
              >
                <span
                  class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  :class="
                    index === 0
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                      : index === 1
                        ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        : index === 2
                          ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                  "
                >
                  {{ index + 1 }}
                </span>
                <span class="shrink-0 text-lg font-bold text-[#de335e]">{{ item.maxChainLength }}人</span>
                <div class="flex flex-1 items-center gap-1 overflow-hidden text-sm">
                  <span class="shrink-0 font-medium text-gray-900 dark:text-white">{{ item.originatorName }}：</span>
                  <span class="truncate text-gray-600 dark:text-gray-400" :title="item.content">
                    {{ truncateContent(item.content) }}
                  </span>
                </div>
                <span class="shrink-0 text-xs text-gray-500">{{ item.count }} 次</span>
              </div>
            </div>
            <div v-else class="px-4 py-6 text-center text-sm text-gray-400">暂无数据</div>
          </div>
        </div>

        <!-- 最容易产生复读（原创者） -->
        <div class="rounded-lg border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/50">
          <div class="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">🎯 谁的聊天最容易产生复读</h4>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {{ repeatRankMode === 'rate' ? '被复读次数 / 总发言数' : '发出的消息被别人复读的次数' }}
            </p>
          </div>
          <MemberRankList
            v-if="originatorRankData.length > 0"
            :members="originatorRankData"
            :session-id="sessionId"
            :clickable="true"
          />
          <div v-else class="px-4 py-6 text-center text-sm text-gray-400">暂无数据</div>
        </div>

        <!-- 最喜欢挑起复读（挑起者） -->
        <div class="rounded-lg border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/50">
          <div class="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">🔥 谁最喜欢挑起复读</h4>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {{ repeatRankMode === 'rate' ? '挑起复读次数 / 总发言数' : '第二个发送相同消息、带起节奏的人' }}
            </p>
          </div>
          <MemberRankList
            v-if="initiatorRankData.length > 0"
            :members="initiatorRankData"
            :session-id="sessionId"
            :clickable="true"
          />
          <div v-else class="px-4 py-6 text-center text-sm text-gray-400">暂无数据</div>
        </div>

        <!-- 最喜欢打断复读（终结者） -->
        <div class="rounded-lg border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/50">
          <div class="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">✂️ 谁喜欢打断复读</h4>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {{ repeatRankMode === 'rate' ? '打断复读次数 / 总发言数' : '终结复读链的人' }}
            </p>
          </div>
          <MemberRankList
            v-if="breakerRankData.length > 0"
            :members="breakerRankData"
            :session-id="sessionId"
            :clickable="true"
          />
          <div v-else class="px-4 py-6 text-center text-sm text-gray-400">暂无数据</div>
        </div>
      </div>

      <div v-else class="px-5 py-8 text-center text-sm text-gray-400">该群组暂无复读记录</div>
    </div>
  </div>
</template>
