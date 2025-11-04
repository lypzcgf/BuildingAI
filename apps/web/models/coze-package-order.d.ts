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
 * Coze套餐订单列表查询参数
 */
export interface CozePackageOrderListParams {
    /**
     * 页码
     */
    page?: number;
    /**
     * 每页数量
     */
    limit?: number;
    /**
     * 搜索关键词（订单号、用户ID、昵称、手机号）
     */
    keyword?: string;
    /**
     * 订单号
     */
    orderNo?: string;
    /**
     * 用户ID
     */
    userId?: string;
    /**
     * 用户昵称
     */
    username?: string;
    /**
     * 手机号
     */
    phone?: string;
    /**
     * 套餐类型
     */
    packageType?: PackageType;
    /**
     * 订单状态
     */
    orderStatus?: OrderStatus;
    /**
     * 支付状态
     */
    paymentStatus?: PaymentStatus;
    /**
     * 退款状态
     */
    refundStatus?: RefundStatus;
    /**
     * 支付方式
     */
    paymentMethod?: PaymentMethod;
    /**
     * 开始日期
     */
    startDate?: string;
    /**
     * 结束日期
     */
    endDate?: string;
    /**
     * 排序字段
     */
    sortBy?: string;
    /**
     * 排序方向
     */
    sortOrder?: "ASC" | "DESC";
}

/**
 * Coze套餐订单列表响应
 */
export interface CozePackageOrderList {
    items: CozePackageOrderListItem[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    /**
     * 统计数据
     */
    statistics: CozePackageOrderStatistics;
}

/**
 * Coze套餐订单列表项
 */
export interface CozePackageOrderListItem {
    /**
     * 订单ID
     */
    id: string;
    /**
     * 订单编号
     */
    orderNo: string;
    /**
     * 用户信息
     */
    user: CozePackageOrderUser;
    /**
     * 套餐名称
     */
    packageName: string;
    /**
     * 套餐时长（天）
     */
    packageDuration: number;
    /**
     * 套餐价格
     */
    packagePrice: number;
    /**
     * 订单金额
     */
    orderAmount: number;
    /**
     * 支付方式：1-微信支付；2-支付宝支付
     */
    payType: number;
    /**
     * 支付方式描述
     */
    payTypeDesc: string;
    /**
     * 支付状态：1-已支付；0-未支付
     */
    payStatus: number;
    /**
     * 支付状态描述
     */
    payStatusDesc: string;
    /**
     * 退款状态：1-已退款；0-未退款
     */
    refundStatus: number;
    /**
     * 退款状态描述
     */
    refundStatusDesc: string;
    /**
     * 支付时间
     */
    payTime?: string;
    /**
     * 创建时间
     */
    createdAt: string;
    /**
     * 更新时间
     */
    updatedAt: string;
}

/**
 * Coze套餐订单用户信息
 */
export interface CozePackageOrderUser {
    /**
     * 用户ID
     */
    id: string;
    /**
     * 用户名
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
}

/**
 * Coze套餐订单统计数据
 */
export interface CozePackageOrderStatistics {
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
 * 套餐信息
 */
export interface CozePackageInfo {
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
     * 原价
     */
    originalPrice: number;
    /**
     * 时长（天）
     */
    duration: number;
}

/**
 * 用户信息（详情页用）
 */
export interface CozePackageOrderUserInfo {
    /**
     * 用户ID
     */
    id: string;
    /**
     * 用户名
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
 * Coze套餐订单详情
 */
export interface CozePackageOrderDetail {
    /**
     * 订单ID
     */
    id: string;
    /**
     * 订单编号
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
    userInfo: CozePackageOrderUserInfo;
    /**
     * 套餐信息
     */
    packageInfo: CozePackageInfo;
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
     * 下单时间
     */
    createdAt: string;
    /**
     * 更新时间
     */
    updatedAt: string;
    /**
     * 支付时间
     */
    paymentTime?: string;
    /**
     * 过期时间
     */
    expirationTime?: string;
    /**
     * 退款金额
     */
    refundAmount?: number;
    /**
     * 支付方式描述
     */
    payTypeDesc: string;
    /**
     * 支付状态：1-已支付；0-未支付
     */
    payStatus: number;
    /**
     * 支付状态描述
     */
    payStatusDesc: string;
    /**
     * 退款状态：1-已退款；0-未退款
     */
    refundStatus: number;
    /**
     * 退款状态描述
     */
    refundStatusDesc: string;
    /**
     * 退款单号
     */
    refundNo?: string;
    /**
     * 支付时间
     */
    payTime?: string;
    /**
     * 退款时间
     */
    refundTime?: string;
    /**
     * 订单来源/终端描述
     */
    terminalDesc?: string;
    /**
     * 创建时间
     */
    createdAt: string;
    /**
     * 更新时间
     */
    updatedAt: string;
}

/**
 * Coze套餐订单退款请求
 */
export interface CozePackageOrderRefundRequest {
    /**
     * 订单ID
     */
    orderId: string;
}

/**
 * Coze套餐订单退款响应
 */
export interface CozePackageOrderRefundResponse {
    /**
     * 退款是否成功
     */
    success: boolean;
    /**
     * 退款单号
     */
    refundNo?: string;
    /**
     * 消息
     */
    message?: string;
}