/**
 * Coze 套餐中心前端数据模型
 * 与后端契约对齐：/api/coze-package/center, /api/coze-package/order
 */

// 支持的语言类型（与前端 i18n 对齐）
export type LangType = "zh" | "en" | "jp";

// 复用 CozePackageRule 结构（与控制台保持一致）
export interface CozePackageRule {
  id?: string;               // 控制台DTO允许可选，这里保持兼容
  name: string;
  duration: number;          // 套餐时长（天）
  originalPrice: number;     // 原价（元）
  currentPrice: number;      // 现价（元）
  description?: string;      // 套餐说明
}

// 创建订单返回体
export interface CozePackageOrderVo {
  orderId: string;
  orderNo: string;
}

// 列表接口参数
export interface CozePackageCenterParams {
  lang?: LangType;
}

// 创建订单接口参数
export interface CreateCozePackageOrderDto {
  packageId: number;
  lang?: LangType;
}

// 列表接口返回（直接返回数组）
export type CozePackageCenterResponse = CozePackageRule[];