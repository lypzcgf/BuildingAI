/**
 * Coze套餐配置响应接口
 */
export interface CozePackageConfigData {
    /**
     * Coze套餐功能状态：true-开启；false-关闭
     */
    cozePackageStatus: boolean;
    /**
     * Coze套餐说明文案
     */
    cozePackageExplain: string;
    /**
     * Coze套餐规则列表
     */
    cozePackageRule: CozePackageRule[];
}

/**
 * Coze套餐规则
 */
export interface CozePackageRule {
    /**
     * 套餐ID
     */
    id?: number;
    /**
     * 套餐名称
     */
    name: string;
    /**
     * 套餐时长（天）
     */
    duration: number;
    /**
     * 套餐原价（元）
     */
    originalPrice: number;
    /**
     * 套餐现价（元）
     */
    currentPrice: number;
    /**
     * 套餐说明
     */
    description: string;
}

/**
 * 更新Coze套餐配置请求参数
 */
export interface UpdateCozePackageConfigDto {
    /**
     * Coze套餐功能状态
     */
    cozePackageStatus: boolean;
    /**
     * Coze套餐说明文案
     */
    cozePackageExplain: string;
    /**
     * Coze套餐规则列表
     */
    cozePackageRule: CozePackageRule[];
}