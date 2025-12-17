/**
 * 应用分析模块
 * 使用 Aptabase 进行匿名使用统计
 */

import { app } from 'electron'
import { initialize, trackEvent } from '@aptabase/electron/main'
import * as fs from 'fs'
import * as path from 'path'

// 分析数据存储路径
function getAnalyticsPath(): string {
  return path.join(app.getPath('userData'), 'analytics.json')
}

// 分析数据结构
interface AnalyticsData {
  lastReportDate: string | null
}

// 读取分析数据
function loadAnalyticsData(): AnalyticsData {
  try {
    const filePath = getAnalyticsPath()
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('[Analytics] 读取分析数据失败:', error)
  }
  return { lastReportDate: null }
}

// 保存分析数据
function saveAnalyticsData(data: AnalyticsData): void {
  try {
    const filePath = getAnalyticsPath()
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error('[Analytics] 保存分析数据失败:', error)
  }
}

// 获取今天的日期字符串 (YYYY-MM-DD)
function getTodayString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/**
 * 初始化分析模块
 * 必须在 app.whenReady() 之前调用
 */
export function initAnalytics(): void {
  const appKey = process.env.APTABASE_APP_KEY

  if (!appKey) {
    return
  }

  try {
    initialize(appKey)
    console.log('[Analytics] Aptabase 初始化成功')
  } catch (error) {
    console.error('[Analytics] Aptabase 初始化失败:', error)
  }
}

/**
 * 上报每日活跃事件
 */
export function trackDailyActive(): void {
  const appKey = process.env.APTABASE_APP_KEY
  if (!appKey) {
    return
  }

  try {
    const data = loadAnalyticsData()
    const today = getTodayString()

    // 检查今天是否已经上报过
    if (data.lastReportDate === today) {
      return
    }

    // 上报每日活跃事件
    trackEvent('app_daily_active')

    data.lastReportDate = today
    saveAnalyticsData(data)
  } catch (error) {
    console.error('[Analytics] 上报每日活跃失败:', error)
  }
}

/**
 * 事件上报
 */
export function trackAppEvent(eventName: string, properties?: Record<string, string | number>): void {
  const appKey = process.env.APTABASE_APP_KEY
  if (!appKey) {
    return
  }

  try {
    trackEvent(eventName, properties)
  } catch (error) {
    console.error(`[Analytics] 上报事件 ${eventName} 失败:`, error)
  }
}
