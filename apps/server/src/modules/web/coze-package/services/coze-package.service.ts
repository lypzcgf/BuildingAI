import { Injectable } from '@nestjs/common';
import { WxPayService } from '@common/modules/pay/services/wxpay.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CozePackageOrder } from '@modules/console/coze-package/entities/coze-package-order.entity';
import { CozePackageConfig } from '@modules/console/coze-package/entities/coze-package-config.entity';
import { DictService } from '@common/modules/dict/services/dict.service';
import { Payconfig } from '@modules/console/system/entities/payconfig.entity';
import { BooleanNumber } from '@modules/console/system/inerface/payconfig.constant';
// 从 src/web-coze-package 引入服务（修正相对路径）
import { WebCozePackageService } from '../../../../web-coze-package/services/web-coze-package.service';

// 复用 CozePackageRule 结构（与控制台配置一致的字段命名）
interface CozePackageRule {
  id: string;
  name: string;
  duration: number;
  originalPrice: number;
  currentPrice: number;
  description?: string;
}

export interface CozePackageCenterResp {
  user?: any;
  payWayList: Array<{ value: 'wechat' | 'alipay'; label: string; logo?: string }>;
  explain: string;
  list: CozePackageRule[];
}

export interface CozePackageOrderVo {
  orderId: string;
  orderNo: string;
}

@Injectable()
export class CozePackageService {
  private centerCache: {
    list: CozePackageRule[];
    explain: string;
    payWayList: Array<{ value: 'wechat' | 'alipay'; label: string; logo?: string }>;
    expiresAt: number;
  } | null = null;

  constructor(
    private readonly wxpayService: WxPayService,
    @InjectRepository(CozePackageOrder)
    private readonly orderRepo: Repository<CozePackageOrder>,
    @InjectRepository(CozePackageConfig)
    private readonly configRepo: Repository<CozePackageConfig>,
    @InjectRepository(Payconfig)
    private readonly payconfigRepo: Repository<Payconfig>,
    private readonly dictService: DictService,
    private readonly webCozePackageService: WebCozePackageService,
  ) {}

  async listPackages(userId?: string): Promise<CozePackageCenterResp> {
    const now = Date.now();
    let list: CozePackageRule[];
    let explain: string;
    let payWayList: CozePackageCenterResp['payWayList'];

    // 命中缓存（5分钟 TTL）
    if (this.centerCache && this.centerCache.expiresAt > now) {
      ({ list, explain, payWayList } = this.centerCache);
    } else {
      // 读取字典配置：状态与说明
      const status = await this.dictService.get<boolean>('coze_package_status', false, 'coze_package_config');
      explain = await this.dictService.get<string>('coze_package_explain', '', 'coze_package_config');
      // 读取套餐配置表
      const configs = await this.configRepo.find({ order: { createdAt: 'ASC' } });
      // 支付方式：从 payconfig 表获取启用的方式
      const payConfigs = await this.payconfigRepo.find({ where: { isEnable: BooleanNumber.YES }, order: { sort: 'ASC' }, select: ['name', 'payType', 'logo'] });
      payWayList = payConfigs.map((p) => ({
        value: p.payType === 1 ? 'wechat' : 'alipay',
        label: p.name,
        logo: p.logo,
      }));
      // 结构化返回
      list = configs.map((c) => ({
        id: c.id,
        name: c.name,
        duration: c.duration,
        originalPrice: Number(c.originalPrice),
        currentPrice: Number(c.currentPrice),
        description: c.description || '',
      }));

      // 写入缓存
      this.centerCache = { list, explain, payWayList, expiresAt: now + 5 * 60 * 1000 };
    }
    // 用户当前套餐信息（可选）
    const user = userId ? await this.webCozePackageService.getUserCurrentPackage(userId) : undefined;
    return {
      user,
      payWayList,
      explain,
      list,
    };
  }

  async createOrder(packageConfigId: string, paymentMethod?: 'wechat' | 'alipay'): Promise<CozePackageOrderVo> {
    const config = await this.configRepo.findOne({ where: { id: packageConfigId } });
    if (!config) throw new Error('套餐不存在');
    const priceYuan = Number(config.currentPrice);
    const order = await this.orderRepo.save({
      orderNo: `COZE${Date.now()}`,
      packageConfigId: config.id,
      packageName: config.name,
      packageDescription: config.description || '',
      packageOriginalPrice: Number(config.originalPrice),
      packageCurrentPrice: Number(config.currentPrice),
      packageDuration: config.duration,
      quantity: 1,
      totalAmount: priceYuan,
      discountAmount: 0,
      paidAmount: 0,
      orderStatus: 'pending',
      paymentStatus: 'unpaid',
      paymentMethod: paymentMethod,
    } as any);
    return { orderId: order.id, orderNo: order.orderNo };
  }

  /**
   * 统一下单，返回真实二维码链接
   */
  async prepay(orderId: string): Promise<{ codeUrl: string }> {
    const order = await this.orderRepo.findOneBy({ id: orderId });
    if (!order) throw new Error('订单不存在');
    if (order.orderStatus !== 'pending') throw new Error('订单状态异常');

    // 使用注入的 WxPayService，走工厂+缓存配置
    const result = await this.wxpayService.createwxPayOrder({
      orderSn: order.orderNo,
      amount: Math.round(Number(order.totalAmount) * 100),
      payType: 1, // WECHAT
      from: 'coze',
    });
    const codeUrl: string = ((result as any)?.codeUrl ?? (result as { code_url: string }).code_url) || '';

    // 落库预支付标识（prepayId 或 code_url），便于后续查单
    // 注意：不同渠道返回字段不同，这里统一保存为 prepayId
    order.prepayId = codeUrl;
    await this.orderRepo.update(orderId, { prepayId: codeUrl });

    return { codeUrl };
  }

  /**
   * 主动查单（与充值中心一致）：支持 orderId + from 参数，返回 { payStatus: number }
   * 兼容旧入参：orderNo
   */
  async queryPayResult(
    params: { orderId?: string; from?: string; orderNo?: string },
    userId?: string,
  ): Promise<{ payStatus: number }> {
    const { orderId, orderNo } = params || {};
    let order: CozePackageOrder | null = null;

    if (orderId) {
      order = await this.orderRepo.findOne({ where: { id: orderId, ...(userId ? { userId } : {}) } });
    } else if (orderNo) {
      order = await this.orderRepo.findOne({ where: { orderNo, ...(userId ? { userId } : {}) } });
    }
    if (!order) {
      throw new Error('订单不存在');
    }

    // 已支付直接返回
    if (order.orderStatus === 'paid' || order.paymentStatus === 'paid') {
      return { payStatus: 1 };
    }

    // 查询微信支付真实状态并做落库（与旧逻辑保持一致）
    const res = await this.wxpayService.queryPayOrder(order.orderNo);
    if ((res as any)?.trade_state === 'SUCCESS') {
      const paidAt = new Date();
      const payId = (res as any)?.transaction_id || (res as any)?.transactionId || '';
      await this.orderRepo.update(order.id, {
        orderStatus: 'paid',
        paymentStatus: 'paid',
        paidAt,
        payId,
      });
      return { payStatus: 1 };
    }
    return { payStatus: 0 };
  }
}