// import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, IsDate, IsBoolean, IsOptional, IsEnum } from "class-validator";
import { Type } from "class-transformer";

/**
 * 用户Coze套餐状态枚举
 */
export enum UserCozePackageStatus {
    /**
     * 有效
     */
    ACTIVE = "active",

    /**
     * 已过期
     */
    EXPIRED = "expired",

    /**
     * 无套餐
     */
    NONE = "none",
}

/**
 * 用户Coze套餐响应DTO
 */
export class UserCozePackageResponseDto {
    /**
     * 套餐名称
     */
    // @ApiProperty({
    //     description: "套餐名称",
    //     example: "Pro套餐",
    // })
    @IsString()
    packageName: string;

    /**
     * 剩余天数
     */
    // @ApiProperty({
    //     description: "剩余天数",
    //     example: 15,
    //     minimum: 0,
    // })
    @IsNumber()
    @Type(() => Number)
    remainingDays: number;

    /**
     * 套餐状态
     */
    // @ApiProperty({
    //     description: "套餐状态",
    //     enum: UserCozePackageStatus,
    //     example: UserCozePackageStatus.ACTIVE,
    // })
    @IsEnum(UserCozePackageStatus)
    status: UserCozePackageStatus;

    /**
     * 过期日期
     */
    // @ApiProperty({
    //     description: "过期日期",
    //     type: String,
    //     format: "date-time",
    //     example: "2024-12-31T23:59:59.999Z",
    // })
    @IsDate()
    @Type(() => Date)
    expireDate: Date;

    /**
     * 是否自动续费
     */
    // @ApiProperty({
    //     description: "是否自动续费",
    //     example: false,
    //     required: false,
    // })
    @IsOptional()
    @IsBoolean()
    autoRenew?: boolean;

    /**
     * 套餐ID
     */
    // @ApiProperty({
    //     description: "套餐ID",
    //     example: "pkg_1234567890",
    // })
    @IsString()
    packageId: string;

    /**
     * 订单ID
     */
    // @ApiProperty({
    //     description: "订单ID",
    //     example: "order_123456",
    //     required: false,
    // })
    @IsOptional()
    @IsString()
    orderId?: string;

    /**
     * 创建时间
     */
    // @ApiProperty({
    //     description: "创建时间",
    //     type: String,
    //     format: "date-time",
    //     example: "2024-01-01T00:00:00.000Z",
    // })
    @IsDate()
    @Type(() => Date)
    createdAt: Date;

    /**
     * 更新时间
     */
    // @ApiProperty({
    //     description: "更新时间",
    //     type: String,
    //     format: "date-time",
    //     example: "2024-01-01T00:00:00.000Z",
    // })
    @IsDate()
    @Type(() => Date)
    updatedAt: Date;
}

/**
 * 用户Coze套餐查询参数DTO
 */
export class QueryUserCozePackageDto {
    /**
     * 用户ID
     */
    // @ApiProperty({
    //     description: "用户ID",
    //     example: "user_123456",
    //     required: false,
    // })
    @IsOptional()
    @IsString()
    userId?: string;
}