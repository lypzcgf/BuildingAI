import { Playground } from "@common/decorators";
import { ConsoleController } from "@common/decorators/controller.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
import { UserPlayground } from "@common/interfaces/context.interface";
import { Body, Get, Param, Post, Query } from "@nestjs/common";

import {
    QueryCozePackageOrderDto,
    OrderDetailResponseDto,
    OrderStatisticsResponseDto,
} from "../dto/coze-package-order.dto";
import { CozePackageRefundOrderDto } from "../dto/coze-package-refund-order.dto";
import { CozePackageOrderService } from "../services/coze-package-order.service";

/**
 * Coze套餐订单控制器
 * 提供订单管理相关的API接口
 */
@ConsoleController("coze-package-order", "Coze套餐订单")
export class CozePackageOrderController {
    constructor(private readonly orderService: CozePackageOrderService) {}

    /**
     * 获取订单列表
     *
     * 支持分页查询、多条件筛选和排序
     * 可根据用户ID、订单状态、支付状态、退款状态、套餐类型等条件筛选
     * 支持关键词搜索（订单号、用户名、套餐名称）
     *
     * @param dto 查询参数
     * @returns 订单列表和分页信息
     */
    @Get()
    @Permissions({
        code: "list",
        name: "查询订单列表",
    })
    async getOrderList(@Query() dto: QueryCozePackageOrderDto) {
        return this.orderService.getOrderList(dto);
    }

    /**
     * 获取订单统计信息
     *
     * 返回订单的统计数据，包括总订单数、各状态订单数、总金额等
     *
     * @param userId 用户ID（可选，如果不传则统计所有用户）
     * @returns 订单统计信息
     */
    @Get("statistics")
    @Permissions({
        code: "statistics",
        name: "查看订单统计",
    })
    async getOrderStatistics(
        @Query("userId") userId?: string,
    ): Promise<OrderStatisticsResponseDto> {
        return this.orderService.getOrderStatistics(userId);
    }

    /**
     * 获取订单详情
     *
     * 返回指定订单的完整信息，包括用户信息、套餐信息、支付信息等
     *
     * @param id 订单ID
     * @returns 订单详情
     */
    @Get(":id")
    @Permissions({
        code: "detail",
        name: "查看订单详情",
    })
    async getOrderDetail(@Param("id") id: string): Promise<OrderDetailResponseDto> {
        return this.orderService.getOrderDetail(id);
    }

    /**
     * 申请退款
     *
     * 用户可以对已支付的订单申请退款
     * 需要提供退款原因和退款金额（可选，默认全额退款）
     *
     * @param dto 退款申请数据
     * @param user 当前用户信息
     * @returns 退款申请结果
     */
    @Post("refund")
    @Permissions({
        code: "refund",
        name: "申请退款",
    })
    async applyRefund(
        @Body() dto: CozePackageRefundOrderDto,
        @Playground() user: UserPlayground,
    ) {
        return this.orderService.applyRefund(dto, user);
    }
}