import { AppEntity } from "@common/decorators/app-entity.decorator";
import { Column, CreateDateColumn, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "@common/modules/auth/entities/user.entity";
import { CozePackageConfig } from "./coze-package-config.entity";

/**
 * Coze套餐订单实体
 */
@AppEntity({ name: "coze_package_orders", comment: "Coze套餐订单" })
@Index(["orderNo"], { unique: true })
@Index(["userId"])
@Index(["orderStatus"])
@Index(["paymentStatus"])
@Index(["refundStatus"])
@Index(["createdAt"])
export class CozePackageOrder {
    /**
     * 主键ID
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;
    /**
     * 订单号（唯一）
     */
    @Column({ type: "varchar", length: 64, unique: true, comment: "订单号" })
    orderNo: string;

    /**
     * 用户ID
     */
    @Column({ type: "uuid", comment: "用户ID" })
    userId: string;

    /**
     * 用户关联
     */
    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: "userId" })
    user: User;

    /**
     * 套餐配置ID
     */
    @Column({ type: "uuid", comment: "套餐配置ID" })
    packageConfigId: string;

    /**
     * 套餐配置关联
     */
    @ManyToOne(() => CozePackageConfig, { eager: false })
    @JoinColumn({ name: "packageConfigId" })
    packageConfig: CozePackageConfig;

    /**
     * 套餐名称（冗余字段，防止配置变更影响历史订单）
     */
    @Column({ type: "varchar", length: 255, comment: "套餐名称" })
    packageName: string;

    /**
     * 套餐类型
     */
    @Column({ 
        type: "enum", 
        enum: ["basic", "professional", "enterprise", "custom"],
        default: "basic",
        comment: "套餐类型" 
    })
    packageType: string;

    /**
     * 套餐描述
     */
    @Column({ type: "text", nullable: true, comment: "套餐描述" })
    packageDescription: string;

    /**
     * 套餐原价
     */
    @Column({ type: "decimal", precision: 10, scale: 2, comment: "套餐原价" })
    packageOriginalPrice: number;

    /**
     * 套餐现价
     */
    @Column({ type: "decimal", precision: 10, scale: 2, comment: "套餐现价" })
    packageCurrentPrice: number;

    /**
     * 套餐时长（天）
     */
    @Column({ type: "int", comment: "套餐时长（天）" })
    packageDuration: number;

    /**
     * 购买数量
     */
    @Column({ type: "int", default: 1, comment: "购买数量" })
    quantity: number;

    /**
     * 订单总金额
     */
    @Column({ type: "decimal", precision: 10, scale: 2, comment: "订单总金额" })
    totalAmount: number;

    /**
     * 优惠金额
     */
    @Column({ type: "decimal", precision: 10, scale: 2, default: 0, comment: "优惠金额" })
    discountAmount: number;

    /**
     * 实付金额
     */
    @Column({ type: "decimal", precision: 10, scale: 2, comment: "实付金额" })
    paidAmount: number;

    /**
     * 支付方式
     */
    @Column({ 
        type: "enum", 
        enum: ["wechat", "alipay", "bank", "balance", "other"],
        nullable: true,
        comment: "支付方式" 
    })
    paymentMethod: string;

    /**
     * 订单状态
     */
    @Column({ 
        type: "enum", 
        enum: ["pending", "paid", "cancelled", "expired", "completed"],
        default: "pending",
        comment: "订单状态" 
    })
    orderStatus: string;

    /**
     * 支付状态
     */
    @Column({ 
        type: "enum", 
        enum: ["unpaid", "paid", "refunded", "partialRefund"],
        default: "unpaid",
        comment: "支付状态" 
    })
    paymentStatus: string;

    /**
     * 退款状态
     */
    @Column({ 
        type: "enum", 
        enum: ["none", "pending", "approved", "rejected", "processing"],
        default: "none",
        comment: "退款状态" 
    })
    refundStatus: string;

    /**
     * 交易流水号
     */
    @Column({ type: "varchar", length: 128, nullable: true, comment: "交易流水号" })
    transactionId: string;

    /**
     * 预支付标识
     * 对于不同渠道：可能是 WeChat 的 prepay_id，或原生支付的 code_url
     */
    @Column({ type: "varchar", length: 128, nullable: true, comment: "预支付标识（prepay_id 或 code_url）" })
    prepayId: string;

    /**
     * 支付标识
     * 例如微信支付的 transaction_id（支付成功后回传）
     */
    @Column({ type: "varchar", length: 128, nullable: true, comment: "支付标识（transaction_id）" })
    payId: string;

    /**
     * 订单来源
     */
    @Column({ type: "varchar", length: 64, default: "web", comment: "订单来源" })
    orderSource: string;

    /**
     * 订单类型
     */
    @Column({ type: "varchar", length: 64, default: "coze-package", comment: "订单类型" })
    orderType: string;

    /**
     * 支付时间
     */
    @Column({ type: "timestamp", nullable: true, comment: "支付时间" })
    paidAt: Date;

    /**
     * 过期时间
     */
    @Column({ type: "timestamp", nullable: true, comment: "过期时间" })
    expiredAt: Date;

    /**
     * 退款金额
     */
    @Column({ type: "decimal", precision: 10, scale: 2, default: 0, comment: "退款金额" })
    refundAmount: number;

    /**
     * 退款原因
     */
    @Column({ type: "varchar", length: 255, nullable: true, comment: "退款原因" })
    refundReason: string;

    /**
     * 退款时间
     */
    @Column({ type: "timestamp", nullable: true, comment: "退款时间" })
    refundAt: Date;

    /**
     * 备注信息
     */
    @Column({ type: "text", nullable: true, comment: "备注信息" })
    remark: string;

    /**
     * 扩展数据（JSON格式）
     */
    @Column({ type: "json", nullable: true, comment: "扩展数据" })
    metadata: Record<string, any>;

    /**
     * 创建时间
     */
    @CreateDateColumn({ type: "timestamp with time zone", comment: "创建时间" })
    createdAt: Date;

    /**
     * 更新时间
     */
    @UpdateDateColumn({ type: "timestamp with time zone", comment: "更新时间" })
    updatedAt: Date;
}