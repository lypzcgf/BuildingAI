import { Type } from "class-transformer";
import {
    IsArray,
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    Max,
} from "class-validator";

/**
 * 订单状态枚举
 */
export enum OrderStatus {
    PENDING = "pending",
    PAID = "paid",
    CANCELLED = "cancelled",
    EXPIRED = "expired",
    COMPLETED = "completed",
}

/**
 * 支付状态枚举
 */
export enum PaymentStatus {
    UNPAID = "unpaid",
    PAID = "paid",
    REFUNDED = "refunded",
    PARTIAL_REFUND = "partialRefund",
}

/**
 * 退款状态枚举
 */
export enum RefundStatus {
    NONE = "none",
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    PROCESSING = "processing",
}

/**
 * 支付方式枚举
 */
export enum PaymentMethod {
    WECHAT = "wechat",
    ALIPAY = "alipay",
    BANK = "bank",
    BALANCE = "balance",
    OTHER = "other",
}

/**
 * 套餐类型枚举
 */
export enum PackageType {
    BASIC = "basic",
    PROFESSIONAL = "professional",
    ENTERPRISE = "enterprise",
    CUSTOM = "custom",
}

/**
 * 查询Coze套餐订单DTO
 * 用于接收前端查询请求参数，包含分页、筛选、排序等参数
 */
export class QueryCozePackageOrderDto {
    /**
     * 页码
     */
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: "页码必须是数字" })
    @Min(1, { message: "页码不能小于1" })
    page?: number = 1;

    /**
     * 每页数量
     */
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: "每页数量必须是数字" })
    @Min(1, { message: "每页数量不能小于1" })
    @Max(100, { message: "每页数量不能超过100" })
    limit?: number = 20;

    /**
     * 搜索关键词（订单号、用户ID、昵称、手机号）
     */
    @IsOptional()
    @IsString({ message: "搜索关键词必须是字符串" })
    keyword?: string;

    /**
     * 订单号
     */
    @IsOptional()
    @IsString({ message: "订单号必须是字符串" })
    orderNo?: string;

    /**
     * 用户ID
     */
    @IsOptional()
    @IsUUID(4, { message: "用户ID格式不正确" })
    userId?: string;

    /**
     * 用户昵称
     */
    @IsOptional()
    @IsString({ message: "用户昵称必须是字符串" })
    username?: string;

    /**
     * 手机号
     */
    @IsOptional()
    @IsString({ message: "手机号必须是字符串" })
    phone?: string;

    /**
     * 套餐类型
     */
    @IsOptional()
    @IsEnum(PackageType, { message: "套餐类型不正确" })
    packageType?: PackageType;

    /**
     * 订单状态
     */
    @IsOptional()
    @IsEnum(OrderStatus, { message: "订单状态不正确" })
    orderStatus?: OrderStatus;

    /**
     * 支付状态
     */
    @IsOptional()
    @IsEnum(PaymentStatus, { message: "支付状态不正确" })
    paymentStatus?: PaymentStatus;

    /**
     * 退款状态
     */
    @IsOptional()
    @IsEnum(RefundStatus, { message: "退款状态不正确" })
    refundStatus?: RefundStatus;

    /**
     * 支付方式
     */
    @IsOptional()
    @IsEnum(PaymentMethod, { message: "支付方式不正确" })
    paymentMethod?: PaymentMethod;

    /**
     * 开始日期
     */
    @IsOptional()
    @IsDateString({}, { message: "开始日期格式不正确" })
    startDate?: string;

    /**
     * 结束日期
     */
    @IsOptional()
    @IsDateString({}, { message: "结束日期格式不正确" })
    endDate?: string;

    /**
     * 排序字段
     */
    @IsOptional()
    @IsString({ message: "排序字段必须是字符串" })
    sortBy?: string = "createdAt";

    /**
     * 排序方向
     */
    @IsOptional()
    @IsEnum(["ASC", "DESC"], { message: "排序方向只能是ASC或DESC" })
    sortOrder?: "ASC" | "DESC" = "DESC";
}



/**
 * 订单统计响应DTO
 */
export class OrderStatisticsResponseDto {
    /**
     * 总订单数
     */
    totalOrder: number;

    /**
     * 总金额
     */
    totalAmount: number;

    /**
     * 退款订单数
     */
    totalRefundOrder: number;

    /**
     * 退款金额
     */
    totalRefundAmount: number;

    /**
     * 总收入（总金额 - 退款金额）
     */
    totalIncome: number;
}

/**
 * 用户信息DTO
 */
export class UserInfoDto {
    /**
     * 用户ID
     */
    id: string;

    /**
     * 用户昵称
     */
    username: string;

    /**
     * 邮箱
     */
    email?: string;

    /**
     * 头像
     */
    avatar?: string;

    /**
     * 手机号
     */
    phone?: string;
}

/**
 * 套餐信息DTO
 */
export class PackageInfoDto {
    /**
     * 套餐ID
     */
    id: string;

    /**
     * 套餐名称
     */
    name: string;

    /**
     * 套餐类型
     */
    type: PackageType;

    /**
     * 套餐描述
     */
    description?: string;

    /**
     * 套餐原价
     */
    originalPrice: number;

    /**
     * 套餐时长（天）
     */
    duration: number;
}

/**
 * 订单详情响应DTO
 */
export class OrderDetailResponseDto {
    /**
     * 订单ID
     */
    id: string;

    /**
     * 订单号
     */
    orderNo: string;

    /**
     * 订单来源
     */
    orderSource: string;

    /**
     * 订单类型
     */
    orderType: string;

    /**
     * 用户信息
     */
    userInfo: UserInfoDto;

    /**
     * 套餐信息
     */
    packageInfo: PackageInfoDto;

    /**
     * 购买数量
     */
    quantity: number;

    /**
     * 订单总金额
     */
    totalAmount: number;

    /**
     * 优惠金额
     */
    discountAmount: number;

    /**
     * 实付金额
     */
    actualAmount: number;

    /**
     * 支付方式
     */
    paymentMethod: PaymentMethod;

    /**
     * 订单状态
     */
    orderStatus: OrderStatus;

    /**
     * 支付状态
     */
    paymentStatus: PaymentStatus;

    /**
     * 退款状态
     */
    refundStatus: RefundStatus;

    /**
     * 交易流水号
     */
    transactionId?: string;

    /**
     * 预支付标识（如 WeChat 的 prepay_id 或原生支付的 code_url）
     */
    prepayId?: string;

    /**
     * 支付标识（如微信支付的 transaction_id）
     */
    payId?: string;

    /**
     * 下单时间
     */
    createdAt: Date;

    /**
     * 更新时间
     */
    updatedAt: Date;

    /**
     * 支付时间
     */
    paymentTime?: Date;

    /**
     * 过期时间
     */
    expirationTime?: Date;

    /**
     * 退款金额
     */
    refundAmount?: number;

    /**
     * 退款原因
     */
    refundReason?: string;

    /**
     * 退款时间
     */
    refundAt?: Date;
}