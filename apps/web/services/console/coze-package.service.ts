import { useConsoleGet, useConsolePost } from "@/common/composables/useRequest";
import type {
    CozePackageConfigData,
    UpdateCozePackageConfigDto
} from "@/models/coze-package";

// ==================== Coze套餐配置相关 API ====================

/**
 * 获取Coze套餐配置
 * @description 获取Coze套餐的全局配置信息，包括套餐状态、说明和规则列表
 * @returns {Promise<CozePackageConfigData>} Coze套餐配置数据
 */
export function apiGetCozePackageConfig(): Promise<CozePackageConfigData> {
    return useConsoleGet<CozePackageConfigData>("/coze-package-config");
}

/**
 * 保存Coze套餐配置
 * @description 保存Coze套餐的全局配置信息，使用事务确保数据一致性
 * @param {UpdateCozePackageConfigDto} data - 套餐配置数据
 * @returns {Promise<void>} 保存结果
 */
export function apiSaveCozePackageConfig(data: UpdateCozePackageConfigDto): Promise<void> {
    return useConsolePost<void>("/coze-package-config", data);
}