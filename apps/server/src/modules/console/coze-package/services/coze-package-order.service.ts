import { BaseService } from "@common/base/services/base.service";
import { PaginationDto } from "@common/dto/pagination.dto";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { UserPlayground } from "@common/interfaces/context.interface";
import { Injectable, Logger } from "@nestjs/common";
import { isUUID } from "class-validator";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";

import {
    OrderStatus,
    PaymentStatus,
    RefundStatus,
    PaymentMethod,
    PackageType,
    QueryCozePackageOrderDto,
    OrderStatisticsResponseDto,
    OrderDetailResponseDto,
    UserInfoDto,
    PackageInfoDto,
} from "../dto/coze-package-order.dto";
import { CozePackageRefundOrderDto, RefundReason } from "../dto/coze-package-refund-order.dto";
import { CozePackageOrder } from "../entities/coze-package-order.entity";
// import { UserCozePackageResponseDto, UserCozePackageStatus } from "../../../web-coze-package/dto/user-coze-package.dto";

/**
 * Coze套餐订单服务
 * 提供订单查询、详情获取、退款申请等业务逻辑
 */
@Injectable()
export class CozePackageOrderService extends BaseService<CozePackageOrder> {
    protected readonly logger = new Logger(CozePackageOrderService.name);

    constructor(
        @InjectRepository(CozePackageOrder)
        private readonly orderRepository: Repository<CozePackageOrder>,
    ) {
        super(orderRepository);
    }

    /**
     * 获取用户有效套餐
     * 查询当前用户最新的有效套餐订单
     * @param userId 用户ID
     * @returns 用户有效套餐信息，如果没有有效套餐则返回null
     */
    async getUserActivePackage(userId: string): Promise<any | null> {
        try {
            // 查询用户最新的有效套餐订单
            const order = await this.orderRepository
                .createQueryBuilder("order")
                .leftJoinAndSelect("order.user", "user")
                .leftJoinAndSelect("order.packageConfig", "packageConfig")
                .where("order.userId = :userId", { userId })
                .andWhere("order.orderStatus = :orderStatus", { orderStatus: OrderStatus.COMPLETED })
                .andWhere("order.paymentStatus = :paymentStatus", { paymentStatus: PaymentStatus.PAID })
                .andWhere("order.expiredAt > :now", { now: new Date() })
                .orderBy("order.expiredAt", "DESC")
                .getOne();

            // 如果没有找到有效套餐，返回null
            if (!order) {
                this.logger.log(`[+] 用户 ${userId} 没有有效套餐`);
                return null;
            }

            // 计算剩余天数
            const now = new Date();
            const expireDate = new Date(order.expiredAt);
            const remainingDays = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            // 构建响应数据
            const packageInfo: any = {
                packageName: order.packageName || "未知套餐",
                remainingDays: Math.max(0, remainingDays),
                status: "active",
                expireDate: expireDate,
                autoRenew: false, // 默认不支持自动续费，后续可根据业务需求扩展
                packageId: order.packageConfigId || order.id,
                orderId: order.id,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            };

            this.logger.log(`[+] 用户 ${userId} 有效套餐查询成功: ${order.packageName}, 剩余${remainingDays}天`);
            return packageInfo;
        } catch (error) {
            this.logger.error(`[!] 查询用户有效套餐失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.internal(`查询用户有效套餐失败: ${error.message}`);
        }
    }

    /**
     * 获取订单列表（分页查询）
     * @param dto 查询参数
     * @returns 订单列表和分页信息
     */
    async getOrderList(dto: QueryCozePackageOrderDto) {
        try {
            const queryBuilder = this.createOrderQueryBuilder();

            // 应用筛选条件
            this.applyFilters(queryBuilder, dto);

            // 应用排序
            this.applySorting(queryBuilder, dto);

            // 执行分页查询
            const result = await this.paginateQueryBuilder(queryBuilder, {
                page: dto.page || 1,
                pageSize: dto.limit || 10,
            });

            // 获取统计数据
            const statistics = await this.getOrderStatistics();

            this.logger.log(`[+] 订单列表查询成功，共 ${result.total} 条记录`);
            return {
                ...result,
                statistics,
            };
        } catch (error) {
            this.logger.error(`[!] 订单列表查询失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.internal(`订单列表查询失败: ${error.message}`);
        }
    }

    /**
     * 获取订单详情
     * @param orderId 订单ID
     * @returns 订单详情
     */
    async getOrderDetail(orderId: string): Promise<OrderDetailResponseDto> {
        try {
            const queryBuilder = this.orderRepository
                .createQueryBuilder("order")
                .leftJoinAndSelect("order.user", "user")
                .leftJoinAndSelect("order.packageConfig", "packageConfig");

            // 支持使用订单ID（UUID）或订单号查询，避免非UUID导致数据库报错
            if (isUUID(orderId)) {
                queryBuilder.where("order.id = :orderId", { orderId });
            } else {
                queryBuilder.where("order.orderNo = :orderNo", { orderNo: orderId });
            }

            const order = await queryBuilder.getOne();

            if (!order) {
                throw HttpExceptionFactory.notFound("订单不存在");
            }

            // 构建用户信息 - 添加null检查
            const userInfo: UserInfoDto = {
                id: order.user?.id || order.userId || "",
                username: order.user?.username || "未知用户",
                email: order.user?.email || "",
                avatar: order.user?.avatar || "",
                phone: order.user?.phone || "",
            };

            // 构建套餐信息 - 添加null检查
            const packageInfo: PackageInfoDto = {
                id: order.packageConfig?.id || order.packageConfigId || "",
                name: order.packageName || "未知套餐",
                type: (order.packageType as PackageType) || PackageType.BASIC,
                description: order.packageDescription || "",
                originalPrice: order.packageOriginalPrice || 0,
                duration: order.packageDuration || 0,
            };

            const orderDetail: OrderDetailResponseDto = {
                id: order.id || "",
                orderNo: order.orderNo || "",
                userInfo,
                packageInfo,
                quantity: order.quantity || 1,
                totalAmount: order.totalAmount || 0,
                discountAmount: order.discountAmount || 0,
                actualAmount: order.paidAmount || 0,
                paymentMethod: (order.paymentMethod as PaymentMethod) || PaymentMethod.OTHER,
                orderStatus: (order.orderStatus as OrderStatus) || OrderStatus.PENDING,
                paymentStatus: (order.paymentStatus as PaymentStatus) || PaymentStatus.UNPAID,
                refundStatus: (order.refundStatus as RefundStatus) || RefundStatus.NONE,
                transactionId: order.transactionId || "",
                prepayId: order.prepayId || "",
                payId: order.payId || "",
                orderSource: order.orderSource || "web",
                orderType: order.orderType || "coze-package",
                paymentTime: order.paidAt || null,
                expirationTime: order.expiredAt || null,
                refundAmount: order.refundAmount || 0,
                createdAt: order.createdAt || new Date(),
                updatedAt: order.updatedAt || new Date(),
            };

            this.logger.log(`[+] 订单详情查询成功: ${orderId}`);
            return orderDetail;
        } catch (error) {
            this.logger.error(`[!] 订单详情查询失败: ${error.message}`, error.stack);
            if (error.status) {
                throw error;
            }
            throw HttpExceptionFactory.internal(`订单详情查询失败: ${error.message}`);
        }
    }

    /**
     * 申请退款
     * @param dto 退款申请数据
     * @param user 当前用户
     * @returns 退款申请结果
     */
    async applyRefund(dto: CozePackageRefundOrderDto, user: UserPlayground) {
        try {
            // 查询订单
            const order = await this.orderRepository.findOne({
                where: { id: dto.orderId },
                relations: ["user"],
            });

            if (!order) {
                throw HttpExceptionFactory.notFound("订单不存在");
            }

            // 验证订单所有权
            if (order.userId !== user.id) {
                throw HttpExceptionFactory.forbidden("无权操作此订单");
            }

            // 验证订单状态
            if (order.orderStatus !== OrderStatus.COMPLETED) {
                throw HttpExceptionFactory.badRequest("只有已完成的订单才能申请退款");
            }

            if (order.paymentStatus !== PaymentStatus.PAID) {
                throw HttpExceptionFactory.badRequest("只有已支付的订单才能申请退款");
            }

            if (order.refundStatus !== RefundStatus.NONE) {
                throw HttpExceptionFactory.badRequest("订单已申请过退款");
            }

            // 验证退款金额
            if (dto.refundAmount && dto.refundAmount > order.paidAmount) {
                throw HttpExceptionFactory.badRequest("退款金额不能超过实付金额");
            }

            // 计算退款金额（如果未指定，则全额退款）
            const refundAmount = dto.refundAmount || order.paidAmount;

            // 更新订单退款状态
            await this.orderRepository.update(dto.orderId, {
                refundStatus: RefundStatus.PENDING,
                refundAmount: refundAmount,
                updatedAt: new Date(),
            });

            // TODO: 这里可以集成实际的退款处理逻辑
            // 例如调用支付网关的退款API

            this.logger.log(
                `[+] 退款申请成功: 订单ID=${dto.orderId}, 退款金额=${refundAmount}, 退款原因=${dto.reason}`,
            );

            return {
                success: true,
                message: "退款申请已提交，请等待处理",
                refundAmount,
                orderId: dto.orderId,
            };
        } catch (error) {
            this.logger.error(`[!] 退款申请失败: ${error.message}`, error.stack);
            if (error.status) {
                throw error;
            }
            throw HttpExceptionFactory.internal(`退款申请失败: ${error.message}`);
        }
    }

    /**
     * 获取订单统计信息
     * @param userId 用户ID（可选，如果不传则统计所有用户）
     * @returns 订单统计信息
     */
    async getOrderStatistics(userId?: string): Promise<OrderStatisticsResponseDto> {
        try {
            // 检查数据库连接状态
            if (!this.orderRepository.manager.connection.isInitialized) {
                this.logger.warn(`[!] 数据库连接未初始化，返回默认统计数据`);
                return this.getDefaultStatistics();
            }

            const queryBuilder = this.orderRepository.createQueryBuilder("order");

            if (userId) {
                queryBuilder.where("order.userId = :userId", { userId });
            }

            let results: any[];
            try {
                results = await Promise.all([
                    // 总订单数
                    queryBuilder.getCount().catch(() => 0),
                    // 总金额（所有订单的金额）
                    queryBuilder
                        .clone()
                        .select("SUM(order.totalAmount)", "total")
                        .getRawOne()
                        .catch(() => ({ total: "0" })),
                    // 退款订单数
                    queryBuilder
                        .clone()
                        .andWhere("order.refundStatus != :refundStatus", {
                            refundStatus: RefundStatus.NONE,
                        })
                        .getCount()
                        .catch(() => 0),
                    // 退款总金额（退款订单的总金额）
                    queryBuilder
                        .clone()
                        .select("SUM(order.totalAmount)", "total")
                        .andWhere("order.refundStatus != :refundStatus", {
                            refundStatus: RefundStatus.NONE,
                        })
                        .getRawOne()
                        .catch(() => ({ total: "0" })),
                ]);
            } catch (error) {
                this.logger.error(`[!] Promise.all 执行失败: ${error.message}`, error.stack);
                return this.getDefaultStatistics();
            }

            // 检查 Promise.all 结果是否有效
            if (!results || !Array.isArray(results) || results.length !== 4) {
                this.logger.error(`[!] Promise.all 返回结果无效: ${JSON.stringify(results)}`);
                return this.getDefaultStatistics();
            }

            const [totalOrder, totalAmount, totalRefundOrder, totalRefundAmount] = results;

            // 安全地解析数值
            const totalAmountValue = parseFloat(totalAmount?.total || "0");
            const totalRefundAmountValue = parseFloat(totalRefundAmount?.total || "0");

            const statistics: OrderStatisticsResponseDto = {
                totalOrder: totalOrder || 0,
                totalAmount: isNaN(totalAmountValue) ? 0 : totalAmountValue,
                totalRefundOrder: totalRefundOrder || 0,
                totalRefundAmount: isNaN(totalRefundAmountValue) ? 0 : totalRefundAmountValue,
                totalIncome:
                    (isNaN(totalAmountValue) ? 0 : totalAmountValue) -
                    (isNaN(totalRefundAmountValue) ? 0 : totalRefundAmountValue),
            };

            this.logger.log(`[+] 订单统计查询成功: ${JSON.stringify(statistics)}`);
            return statistics;
        } catch (error) {
            this.logger.error(`[!] 订单统计查询失败: ${error.message}`, error.stack);
            // 返回默认统计数据而不是抛出异常
            return this.getDefaultStatistics();
        }
    }

    /**
     * 获取默认统计数据（当数据库连接失败时使用）
     */
    private getDefaultStatistics(): OrderStatisticsResponseDto {
        const defaultStats = {
            totalOrder: 0,
            totalAmount: 0,
            totalRefundOrder: 0,
            totalRefundAmount: 0,
            totalIncome: 0,
        };
        this.logger.warn(`[!] 返回默认统计数据: ${JSON.stringify(defaultStats)}`);
        return defaultStats;
    }

    /**
     * 创建订单查询构建器
     */
    private createOrderQueryBuilder(): SelectQueryBuilder<CozePackageOrder> {
        return this.orderRepository
            .createQueryBuilder("order")
            .leftJoinAndSelect("order.user", "user")
            .leftJoinAndSelect("order.packageConfig", "packageConfig");
    }

    /**
     * 应用筛选条件
     */
    private applyFilters(
        queryBuilder: SelectQueryBuilder<CozePackageOrder>,
        dto: QueryCozePackageOrderDto,
    ): void {
        // 用户ID筛选
        if (dto.userId) {
            queryBuilder.andWhere("order.userId = :userId", { userId: dto.userId });
        }

        // 订单号筛选
        if (dto.orderNo) {
            queryBuilder.andWhere("order.orderNo ILIKE :orderNo", {
                orderNo: `%${dto.orderNo}%`,
            });
        }

        // 订单状态筛选
        if (dto.orderStatus) {
            queryBuilder.andWhere("order.orderStatus = :orderStatus", {
                orderStatus: dto.orderStatus,
            });
        }

        // 支付状态筛选
        if (dto.paymentStatus) {
            queryBuilder.andWhere("order.paymentStatus = :paymentStatus", {
                paymentStatus: dto.paymentStatus,
            });
        }

        // 退款状态筛选
        if (dto.refundStatus) {
            queryBuilder.andWhere("order.refundStatus = :refundStatus", {
                refundStatus: dto.refundStatus,
            });
        }

        // 套餐类型筛选
        if (dto.packageType) {
            queryBuilder.andWhere("order.packageType = :packageType", {
                packageType: dto.packageType,
            });
        }

        // 支付方式筛选
        if (dto.paymentMethod) {
            queryBuilder.andWhere("order.paymentMethod = :paymentMethod", {
                paymentMethod: dto.paymentMethod,
            });
        }

        // 日期范围筛选
        if (dto.startDate) {
            queryBuilder.andWhere("order.createdAt >= :startDate", {
                startDate: new Date(dto.startDate),
            });
        }

        if (dto.endDate) {
            queryBuilder.andWhere("order.createdAt <= :endDate", {
                endDate: new Date(dto.endDate),
            });
        }

        // 关键词搜索（订单号、用户名、套餐名称）
        if (dto.keyword) {
            queryBuilder.andWhere(
                "(order.orderNo ILIKE :keyword OR user.username ILIKE :keyword OR order.packageName ILIKE :keyword)",
                { keyword: `%${dto.keyword}%` },
            );
        }
    }

    /**
     * 应用排序
     */
    private applySorting(
        queryBuilder: SelectQueryBuilder<CozePackageOrder>,
        dto: QueryCozePackageOrderDto,
    ): void {
        const sortBy = dto.sortBy || "createdAt";
        const sortOrder = dto.sortOrder || "DESC";

        // 字段映射：前端字段名 -> 数据库字段名
        const fieldMapping: Record<string, string> = {
            "createdAt": "order.createdAt",
            "updatedAt": "order.updatedAt", 
            "orderNo": "order.orderNo",
            "totalAmount": "order.totalAmount",
            "actualAmount": "order.paidAmount",
            "paymentTime": "order.paidAt",
            "packageCurrentPrice": "order.packageCurrentPrice", // 前端传递的订单金额字段
            "packageOriginalPrice": "order.packageOriginalPrice", // 套餐原价字段
        };

        // 确保排序字段安全
        if (fieldMapping[sortBy]) {
            queryBuilder.orderBy(fieldMapping[sortBy], sortOrder as "ASC" | "DESC");
        } else {
            // 默认按创建时间倒序排列
            queryBuilder.orderBy("order.createdAt", "DESC");
        }
    }
}
