import { Type } from "class-transformer";
import {
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    ValidateNested,
} from "class-validator";

/**
 * Coze套餐规则DTO
 */
export class CozePackageRuleDto {
    /**
     * 套餐ID（可选，用于更新）
     */
    @IsOptional()
    @IsUUID()
    id?: string;

    /**
     * 套餐名称
     */
    @IsNotEmpty()
    @IsString()
    name: string;

    /**
     * 套餐时长（天）
     */
    @IsNumber()
    @Min(1)
    duration: number;

    /**
     * 原价
     */
    @IsNumber()
    @Min(0)
    originalPrice: number;

    /**
     * 现价
     */
    @IsNumber()
    @Min(0)
    currentPrice: number;

    /**
     * 套餐说明
     */
    @IsOptional()
    @IsString()
    description?: string;
}

/**
 * 更新Coze套餐配置DTO
 */
export class UpdateCozePackageConfigDto {
    /**
     * Coze套餐功能状态
     */
    @IsBoolean()
    cozePackageStatus: boolean;

    /**
     * Coze套餐说明
     */
    @IsOptional()
    @IsString()
    cozePackageExplain?: string;

    /**
     * Coze套餐规则列表
     */
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CozePackageRuleDto)
    cozePackageRule: CozePackageRuleDto[];
}

/**
 * Coze套餐配置响应DTO
 */
export class CozePackageConfigResponseDto {
    /**
     * Coze套餐功能状态
     */
    cozePackageStatus: boolean;

    /**
     * Coze套餐说明
     */
    cozePackageExplain: string;

    /**
     * Coze套餐规则列表
     */
    cozePackageRule: CozePackageRuleDto[];
}