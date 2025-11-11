import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CozePackageService } from '../services/coze-package.service';
import { WebController } from '@common/decorators/controller.decorator';
import { Playground } from '@common/decorators/playground.decorator';
import { UserPlayground } from '@common/interfaces/context.interface';

@ApiTags('web/coze-package')
@WebController('coze-package')
export class CozePackageController {
  constructor(private readonly service: CozePackageService) {}

  @Get('center')
  @ApiOperation({ summary: 'Coze 套餐中心列表' })
  @ApiResponse({ status: 200, description: '套餐列表' })
  async center(@Playground() user?: UserPlayground) {
    return this.service.listPackages(user?.id);
  }

  @Post('order')
  @ApiOperation({ summary: '创建套餐订单' })
  @ApiResponse({ status: 200, description: '订单号 & ID' })
  async createOrder(@Body() dto: { packageId: string; paymentMethod?: 'wechat' | 'alipay' }) {
    return this.service.createOrder(dto.packageId, dto.paymentMethod);
  }

  @Post('pay/prepay')
  @ApiOperation({ summary: '预支付：返回真实二维码链接' })
  @ApiResponse({ status: 200, description: '二维码链接' })
  async prepay(@Body() dto: { orderId: string }) {
    return this.service.prepay(dto.orderId);
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
    return this.service.queryPayResult({ orderId, from, orderNo }, user?.id);
  }
}