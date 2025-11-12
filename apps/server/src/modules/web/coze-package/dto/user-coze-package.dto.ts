import { IsString, IsNumber, IsDate, IsBoolean, IsOptional, IsEnum } from "class-validator";
import { Type } from "class-transformer";

/**
 * 用户Coze套餐状态枚举
 */
export enum UserCozePackageStatus {
    ACTIVE = "active",
    EXPIRED = "expired",
    NONE = "none",
}

/**
 * 用户Coze套餐响应DTO
 */
export class UserCozePackageResponseDto {
    @IsString()
    packageName: string;

    @IsNumber()
    @Type(() => Number)
    remainingDays: number;

    @IsEnum(UserCozePackageStatus)
    status: UserCozePackageStatus;

    @IsDate()
    @Type(() => Date)
    expireDate: Date;

    @IsOptional()
    @IsBoolean()
    autoRenew?: boolean;

    @IsString()
    packageId: string;

    @IsOptional()
    @IsString()
    orderId?: string;

    @IsDate()
    @Type(() => Date)
    createdAt: Date;

    @IsDate()
    @Type(() => Date)
    updatedAt: Date;
}

export class QueryUserCozePackageDto {
    @IsOptional()
    @IsString()
    userId?: string;
}