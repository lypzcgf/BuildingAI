import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CozePackageService } from '../services/coze-package.service';
import { WebController } from '@common/decorators/controller.decorator';
import { Playground } from '@common/decorators/playground.decorator';
import { UserPlayground } from '@common/interfaces/context.interface';
import { UserCozePackageResponseDto } from '../dto/user-coze-package.dto';

@ApiTags('web/coze-package')
@WebController('coze-package')
export class CozePackageController {
    constructor(
        private readonly cozePackageService: CozePackageService,
    ) {}

  @Get('center')
    @ApiOperation({ summary: '获取Coze套餐中心列表' })
    @ApiResponse({ status: 200, description: '套餐列表获取成功' })
    async center(@Playground() user: UserPlayground) {
        return this.cozePackageService.listPackages(user?.id);
  }

  @Post('order')
  @ApiOperation({ summary: '创建套餐订单' })
  @ApiResponse({ status: 200, description: '订单号 & ID' })
  async createOrder(@Body() dto: { packageId: string; paymentMethod?: 'wechat' | 'alipay' }) {
    return this.cozePackageService.createOrder(dto.packageId, dto.paymentMethod);
  }

  @Post('pay/prepay')
  @ApiOperation({ summary: '预支付：返回真实二维码链接' })
  @ApiResponse({ status: 200, description: '二维码链接' })
  async prepay(@Body() dto: { orderId: string }) {
    return this.cozePackageService.prepay(dto.orderId);
  }

  @Get('pay/queryPayResult')
  @ApiOperation({ summary: '主动查单（与充值中心一致）' })
  @ApiResponse({ status: 200, description: '支付状态：{ payStatus: number }' })
  async queryPayResult(
    @Query('orderId') orderId?: string,
    @Query('from') from?: string,
    @Query('orderNo') orderNo?: string,
    @Playground() user?: UserPlayground,
  ) {
    return this.cozePackageService.queryPayResult({ orderId, from, orderNo }, user?.id);
  }

    /**
     * 获取用户当前有效套餐
     * 查询当前登录用户的有效Coze套餐信息
     */
    @Get('user/current-package')
    @ApiOperation({ summary: '获取用户当前有效套餐' })
    @ApiResponse({ 
        status: 200, 
        description: '获取用户当前有效套餐成功',
        type: UserCozePackageResponseDto
    })
    @ApiResponse({ status: 401, description: '未授权' })
    @ApiResponse({ status: 500, description: '服务器内部错误' })
    async getUserCurrentPackage(@Playground() user: UserPlayground): Promise<UserCozePackageResponseDto | null> {
        if (!user?.id) {
            throw new Error('用户未登录');
        }
        return this.cozePackageService.getUserCurrentPackage(user.id);
    }

    /**
     * 检查用户是否有有效套餐
     * 快速检查当前用户是否有有效的Coze套餐
     */
    @Get('user/has-active-package')
    @ApiOperation({ summary: '检查用户是否有有效套餐' })
    @ApiResponse({ 
        status: 200, 
        description: '检查用户是否有有效套餐成功',
        schema: {
            type: 'object',
            properties: {
                hasActivePackage: { type: 'boolean', description: '是否有有效套餐' }
            }
        }
    })
    @ApiResponse({ status: 401, description: '未授权' })
    @ApiResponse({ status: 500, description: '服务器内部错误' })
    async hasActivePackage(@Playground() user: UserPlayground): Promise<{ hasActivePackage: boolean }> {
        if (!user?.id) {
            throw new Error('用户未登录');
        }
        const hasActive = await this.cozePackageService.hasActivePackage(user.id);
        return { hasActivePackage: hasActive };
    }

    /**
     * 获取用户套餐剩余天数
     * 查询当前用户套餐的剩余有效天数
     */
    @Get('user/remaining-days')
    @ApiOperation({ summary: '获取用户套餐剩余天数' })
    @ApiResponse({ 
        status: 200, 
        description: '获取用户套餐剩余天数成功',
        schema: {
            type: 'object',
            properties: {
                remainingDays: { type: 'number', description: '剩余天数', minimum: 0 }
            }
        }
    })
    @ApiResponse({ status: 401, description: '未授权' })
    @ApiResponse({ status: 500, description: '服务器内部错误' })
    async getRemainingDays(@Playground() user: UserPlayground): Promise<{ remainingDays: number }> {
        if (!user?.id) {
            throw new Error('用户未登录');
        }
        const remainingDays = await this.cozePackageService.getRemainingDays(user.id);
        return { remainingDays };
    }
}