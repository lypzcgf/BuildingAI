/**
 * Coze套餐数据获取组合式函数
 * 用于用户信息框中显示Coze套餐信息
 */

import type { Ref } from 'vue'
import {
  CozePackageStatus,
  COZE_PACKAGE_CONSTANTS,
  calculateCozePackageStatus,
  formatRemainingDays
} from '~/types/coze-package'
import type { UserCozePackage } from '~/types/coze-package'

/**
 * Coze套餐状态
 */
export interface CozePackageState {
  /** 当前套餐信息 */
  packageInfo: Readonly<Ref<UserCozePackage | null>>
  /** 加载状态 */
  loading: Readonly<Ref<boolean>>
  /** 错误信息 */
  error: Readonly<Ref<string | null>>
  /** 套餐状态 */
  status: Readonly<Ref<CozePackageStatus>>
  /** 剩余天数 */
  remainingDays: Readonly<Ref<number>>
  /** 是否即将到期 */
  isExpiring: Readonly<Ref<boolean>>
  /** 是否已过期 */
  isExpired: Readonly<Ref<boolean>>
  /** 是否有有效套餐 */
  hasValidPackage: Readonly<Ref<boolean>>
}

/**
 * Coze套餐方法
 */
export interface CozePackageMethods {
  /** 获取用户套餐信息 */
  fetchPackageInfo: () => Promise<void>
  /** 刷新套餐信息 */
  refreshPackage: () => Promise<void>
  /** 清除错误 */
  clearError: () => void
  /** 获取格式化剩余天数 */
  getFormattedRemainingDays: () => string
  /** 获取套餐状态颜色 */
  getStatusColor: () => string
}

/**
 * Coze套餐组合式函数返回值
 */
export type UseCozePackageReturn = CozePackageState & CozePackageMethods

/**
 * 获取用户Coze套餐信息
 */
import { useWebGet } from '@/common/composables/useRequest'
import { useUserStore } from '@/common/stores/user'

export async function getUserCozePackage(): Promise<UserCozePackage | null> {
  try {
    // 统一使用 Web 请求封装（自动附带认证，与“算力值”一致）
    const data = await useWebGet<UserCozePackage | null>(
      '/coze-package/user/current-package',
      {},
      { requireAuth: true }
    )
    return data ?? null
  } catch (error) {
    console.error('获取Coze套餐信息失败:', error)
    throw new Error('获取套餐信息失败，请稍后重试')
  }
}

/**
 * Coze套餐组合式函数
 */
export function useCozePackage(): UseCozePackageReturn {
  // 状态管理
  const packageInfo = ref<UserCozePackage | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const userStore = useUserStore()
  const retryCount = ref(0)
  const MAX_RETRIES = 3

  // 计算属性
  const status = computed<CozePackageStatus>(() => {
    if (!packageInfo.value) {
      return CozePackageStatus.NONE
    }
    return calculateCozePackageStatus(packageInfo.value.remainingDays)
  })
  
  const remainingDays = computed(() => {
    return packageInfo.value?.remainingDays || 0
  })
  
  const isExpiring = computed(() => {
    return status.value === CozePackageStatus.EXPIRING
  })
  
  const isExpired = computed(() => {
    return status.value === CozePackageStatus.EXPIRED
  })
  
  const hasValidPackage = computed(() => {
    return status.value === CozePackageStatus.ACTIVE || status.value === CozePackageStatus.EXPIRING
  })
  
  /**
   * 获取用户套餐信息
   */
  const fetchPackageInfo = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const data = await getUserCozePackage()
      packageInfo.value = data
      retryCount.value = 0
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取套餐信息失败'
      console.error('获取Coze套餐信息失败:', err)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 刷新套餐信息
   */
  const refreshPackage = async (): Promise<void> => {
    await fetchPackageInfo()
  }
  
  /**
   * 清除错误
   */
  const clearError = (): void => {
    error.value = null
  }
  
  /**
   * 获取格式化剩余天数
   */
  const getFormattedRemainingDays = (): string => {
    return formatRemainingDays(remainingDays.value)
  }
  
  /**
   * 获取套餐状态颜色
   */
  const getStatusColor = (): string => {
    switch (status.value) {
      case CozePackageStatus.ACTIVE:
        return 'text-green-600 dark:text-green-400'
      case CozePackageStatus.EXPIRING:
        return 'text-orange-600 dark:text-orange-400'
      case CozePackageStatus.EXPIRED:
        return 'text-red-600 dark:text-red-400'
      case CozePackageStatus.NONE:
      default:
        return 'text-gray-500 dark:text-gray-400'
    }
  }
  
  // 自动获取数据（可选）
  const { pause, resume } = useIntervalFn(() => {
    // 每5分钟自动刷新一次
    if (!loading.value) {
      refreshPackage()
    }
  }, 5 * 60 * 1000) // 5分钟
  
  // 生命周期管理
  onMounted(() => {
    // 已登录才请求，避免无效请求
    if (userStore.isLogin) {
      fetchPackageInfo()
    }
  })

  onUnmounted(() => {
    // 组件卸载时暂停定时器
    pause()
  })

  // 错误重试机制（只对可恢复错误重试，且最多3次）
  const isAuthError = (msg?: string | null) => {
    if (!msg) return false
    const s = String(msg).toLowerCase()
    return s.includes('未登录') || s.includes('unauthorized')
  }

  whenever(error, () => {
    setTimeout(() => {
      if (
        error.value &&
        userStore.isLogin &&
        !isAuthError(error.value) &&
        retryCount.value < MAX_RETRIES
      ) {
        retryCount.value++
        fetchPackageInfo()
      }
    }, 3000)
  })
  
  return {
    // 状态
    packageInfo: readonly(packageInfo),
    loading: readonly(loading),
    error: readonly(error),
    status: readonly(status),
    remainingDays: readonly(remainingDays),
    isExpiring: readonly(isExpiring),
    isExpired: readonly(isExpired),
    hasValidPackage: readonly(hasValidPackage),
    
    // 方法
    fetchPackageInfo,
    refreshPackage,
    clearError,
    getFormattedRemainingDays,
    getStatusColor
  }
}

/**
 * 创建Coze套餐存储
 */
export const useCozePackageStore = defineStore('coze-package', () => {
  const packageInfo = ref<UserCozePackage | null>(null)
  const lastFetchTime = ref<number>(0)
  
  /**
   * 是否需要刷新数据
   */
  const shouldRefresh = computed(() => {
    const now = Date.now()
    const timeDiff = now - lastFetchTime.value
    return timeDiff > COZE_PACKAGE_CONSTANTS.CACHE_TTL
  })
  
  /**
   * 获取套餐信息（带缓存）
   */
  const getCachedPackageInfo = async (): Promise<UserCozePackage | null> => {
    if (!packageInfo.value || shouldRefresh.value) {
      try {
        const data = await getUserCozePackage()
        packageInfo.value = data
        lastFetchTime.value = Date.now()
      } catch (error) {
        console.error('获取Coze套餐信息失败:', error)
        throw error
      }
    }
    return packageInfo.value
  }
  
  /**
   * 更新套餐信息
   */
  const updatePackageInfo = (info: UserCozePackage | null): void => {
    packageInfo.value = info
    lastFetchTime.value = Date.now()
  }
  
  /**
   * 清除缓存
   */
  const clearCache = (): void => {
    packageInfo.value = null
    lastFetchTime.value = 0
  }
  
  return {
    packageInfo: readonly(packageInfo),
    lastFetchTime: readonly(lastFetchTime),
    shouldRefresh: readonly(shouldRefresh),
    getCachedPackageInfo,
    updatePackageInfo,
    clearCache
  }
})