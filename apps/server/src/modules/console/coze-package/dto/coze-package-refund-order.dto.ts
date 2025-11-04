import { Type } from "class-transformer";
import {
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    ValidateIf,
} from "class-validator";

/**
 * 退款原因枚举
 */
export enum RefundReason {
    DUPLICATE = "duplicate",        // 重复购买
    NOT_NEEDED = "notNeeded",      // 不再需要
    TECHNICAL = "technical",       // 技术问题
    SERVICE = "service",           // 服务问题
    PRICE = "price",              // 价格问题
    OTHER = "other",              // 其他原因
}

/**
 * Coze套餐订单退款DTO
 * 用于接收退款申请数据，包含订单ID等必要参数
 */
export class CozePackageRefundOrderDto {
    /**
     * 订单ID
     */
    @IsNotEmpty({ message: "订单ID不能为空" })
    @IsUUID(4, { message: "订单ID格式不正确" })
    orderId: string;

    /**
     * 退款原因
     */
    @IsNotEmpty({ message: "退款原因不能为空" })
    @IsEnum(RefundReason, { 
        message: "退款原因必须是以下之一：duplicate(重复购买)、notNeeded(不再需要)、technical(技术问题)、service(服务问题)、price(价格问题)、other(其他原因)" 
    })
    reason: RefundReason;

    /**
     * 自定义退款原因说明（当reason为other时必填）
     */
    @ValidateIf(o => o.reason === RefundReason.OTHER)
    @IsNotEmpty({ message: "选择其他原因时，必须填写具体说明" })
    @IsString({ message: "退款原因说明必须是字符串" })
    customReason?: string;

    /**
     * 退款金额（可选，默认为订单实付金额）
     */
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: "退款金额必须是数字" })
    @Min(0, { message: "退款金额不能小于0" })
    refundAmount?: number;

    /**
     * 退款备注
     */
    @IsOptional()
    @IsString({ message: "退款备注必须是字符串" })
    remark?: string;
}