/**
 * Coze套餐相关类型定义
 * 用于用户信息框中显示Coze套餐名称和剩余天数
 */

/**
 * 套餐状态枚举
 */
export enum CozePackageStatus {
  /** 有效 */
  ACTIVE = 'active',
  /** 即将到期（剩余天数≤7天） */
  EXPIRING = 'expiring',
  /** 已过期 */
  EXPIRED = 'expired',
  /** 无套餐 */
  NONE = 'none'
}

/**
 * 套餐基础信息
 */
export interface CozePackageBase {
  /** 套餐ID */
  id: string
  /** 套餐名称 */
  name: string
  /** 套餐描述 */
  description?: string
  /** 套餐价格（分） */
  price: number
  /** 套餐原价（分） */
  originalPrice?: number
  /** 套餐时长（天） */
  duration: number
  /** 是否启用 */
  enabled: boolean
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/**
 * 用户套餐信息
 */
export interface CozePackageInfo {
  /** 用户套餐ID */
  userPackageId: string
  /** 套餐ID */
  packageId: string
  /** 套餐基础信息 */
  package: CozePackageBase
  /** 用户ID */
  userId: string
  /** 开始时间 */
  startTime: string
  /** 结束时间 */
  endTime: string
  /** 剩余天数 */
  remainingDays: number
  /** 套餐状态 */
  status: CozePackageStatus
  /** 是否自动续费 */
  autoRenew: boolean
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/**
 * 套餐历史记录
 */
export interface CozePackageHistory {
  /** 历史记录ID */
  id: string
  /** 用户套餐ID */
  userPackageId: string
  /** 套餐信息 */
  package: CozePackageBase
  /** 操作类型 */
  action: 'purchase' | 'renew' | 'upgrade' | 'cancel' | 'expire'
  /** 操作描述 */
  description?: string
  /** 操作时间 */
  actionTime: string
  /** 订单号 */
  orderNo?: string
  /** 创建时间 */
  createdAt: string
}

/**
 * API响应类型
 */
export interface CozePackageApiResponse<T = any> {
  /** 状态码 */
  code: number
  /** 响应消息 */
  message: string
  /** 响应数据 */
  data: T
  /** 时间戳 */
  timestamp: number
}

/**
 * 获取用户当前套餐响应
 */
export interface GetUserCozePackageResponse extends CozePackageApiResponse<CozePackageInfo | null> {}

/**
 * 获取套餐历史响应
 */
export interface GetCozePackageHistoryResponse extends CozePackageApiResponse<{
  list: CozePackageHistory[]
  total: number
  page: number
  pageSize: number
}> {}

/**
 * 套餐状态配置
 */
export interface CozePackageStatusConfig {
  /** 状态值 */
  status: CozePackageStatus
  /** 显示文本 */
  label: string
  /** 颜色主题 */
  color: 'success' | 'warning' | 'error' | 'default'
  /** 图标 */
  icon?: string
}

/**
 * 套餐相关常量
 */
export const COZE_PACKAGE_CONSTANTS = {
  /** 即将到期天数阈值 */
  EXPIRING_DAYS_THRESHOLD: 7,
  /** 自动续费提前提醒天数 */
  AUTO_RENEW_REMIND_DAYS: 3,
  /** 套餐缓存时间（毫秒） */
  CACHE_TTL: 5 * 60 * 1000, // 5分钟
} as const

/**
 * 套餐状态配置映射
 */
export const COZE_PACKAGE_STATUS_CONFIG: Record<CozePackageStatus, CozePackageStatusConfig> = {
  [CozePackageStatus.ACTIVE]: {
    status: CozePackageStatus.ACTIVE,
    label: '有效',
    color: 'success',
    icon: 'i-heroicons-check-circle'
  },
  [CozePackageStatus.EXPIRING]: {
    status: CozePackageStatus.EXPIRING,
    label: '即将到期',
    color: 'warning',
    icon: 'i-heroicons-exclamation-triangle'
  },
  [CozePackageStatus.EXPIRED]: {
    status: CozePackageStatus.EXPIRED,
    label: '已过期',
    color: 'error',
    icon: 'i-heroicons-x-circle'
  },
  [CozePackageStatus.NONE]: {
    status: CozePackageStatus.NONE,
    label: '无套餐',
    color: 'default',
    icon: 'i-heroicons-minus-circle'
  }
} as const

/**
 * 工具函数：计算套餐状态
 */
export function calculateCozePackageStatus(remainingDays: number): CozePackageStatus {
  if (remainingDays <= 0) {
    return CozePackageStatus.EXPIRED
  }
  if (remainingDays <= COZE_PACKAGE_CONSTANTS.EXPIRING_DAYS_THRESHOLD) {
    return CozePackageStatus.EXPIRING
  }
  return CozePackageStatus.ACTIVE
}

/**
 * 工具函数：格式化剩余天数显示
 */
export function formatRemainingDays(remainingDays: number): string {
  if (remainingDays <= 0) {
    return '已过期'
  }
  if (remainingDays === 1) {
    return '1天'
  }
  return `${remainingDays}天`
}

/**
 * 工具函数：格式化价格显示
 */
export function formatPrice(price: number): string {
  return `¥${(price / 100).toFixed(2)}`
}

/**
 * 前端用户Coze套餐类型（对齐服务端DTO）
 */
export interface UserCozePackage {
  /** 套餐名称 */
  packageName: string
  /** 剩余天数 */
  remainingDays: number
  /** 服务端状态（active/expired/none） */
  status: 'active' | 'expired' | 'none'
  /** 过期时间（ISO字符串） */
  expireDate: string
  /** 是否自动续费 */
  autoRenew?: boolean
  /** 套餐ID */
  packageId: string
  /** 订单ID */
  orderId?: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

export type {
  CozePackageBase,
  CozePackageInfo,
  CozePackageHistory,
  CozePackageStatusConfig,
  GetUserCozePackageResponse,
  GetCozePackageHistoryResponse
}