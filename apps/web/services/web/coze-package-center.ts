// cspell:words weixin
import type { RequestOptions } from "@fastbuildai/http";
import { useWebRequest, useWebGet } from "@/common/composables/useRequest";
import type { PayResult } from "@/models/recharge-center";
import type { CozePackageRule } from "@/models/coze-package";

// 复用控制台定义的 CozePackageRule
export type CozePackageItem = CozePackageRule;

export interface CozePackageCenterResp {
  list: CozePackageRule[];
  explain: string;
  payWayList: Array<{ value: 'wechat' | 'alipay'; label: string; logo?: string }>
}

export interface CreateOrderReq {
    packageId: string;
    paymentMethod: "wechat" | "alipay";
}

export interface CreateOrderResp {
    orderId: string;
    orderNo: string;
    payUrl?: string; // 支付跳转链接（H5 场景）
}

/**
 * 获取套餐列表
 */
export const apiCozePackageCenter = (opts?: RequestOptions) => {
  return useWebRequest<CozePackageCenterResp>("/coze-package/center", {
    method: "GET",
    ...opts,
  });
};

/**
 * 创建订单
 */
export const apiCozePackageCreateOrder = (
    body: CreateOrderReq,
    opts?: RequestOptions,
) => {
    return useWebRequest<CreateOrderResp>("/coze-package/order", {
        method: "POST",
        data: body as unknown as Record<string, unknown>,
        ...opts,
    });
};

export interface PrepayReq {
  orderId: string
  from: 'coze'
}

export interface PrepayResp {
  codeUrl: string        // 二维码内容（weixin://wxpay/...）
  expireAt: number       // 过期时间戳（秒）
}

/**
 * 获取支付二维码
 */
export const apiPayPrepay = (body: PrepayReq, opts?: RequestOptions) => {
  return useWebRequest<PrepayResp>('/coze-package/pay/prepay', {
    method: 'POST',
    data: body as unknown as Record<string, unknown>,
    ...opts
  })
}

/**
 * 查询支付结果（与充值中心一致）
 */
export const apiPayGetPayResult = (
  params: { orderId?: string; from: string },
  opts?: RequestOptions
) => {
  return useWebGet<PayResult>("/pay/getPayResult", params, opts);
}