import { useConsoleGet, useConsolePost } from "@/common/composables/useRequest";
import type {
    CozePackageOrderList,
    CozePackageOrderListParams,
    CozePackageOrderDetail,
    CozePackageOrderRefundRequest,
    CozePackageOrderRefundResponse,
} from "@/models/coze-package-order";

/**
 * 获取Coze套餐订单列表
 * @param params 查询参数
 * @returns 订单列表数据
 */
export const apiGetCozePackageOrderList = (
    params: CozePackageOrderListParams
): Promise<CozePackageOrderList> => {
    return useConsoleGet("/coze-package-order", params);
};

/**
 * 获取Coze套餐订单详情
 * @param id 订单ID
 * @returns 订单详情数据
 */
export const apiGetCozePackageOrderDetail = (id: string): Promise<CozePackageOrderDetail> => {
    return useConsoleGet(`/coze-package-order/${id}`);
};

/**
 * 申请Coze套餐订单退款
 * @param data 退款请求数据
 * @returns 退款响应
 */
export const apiCozePackageOrderRefund = (
    data: CozePackageOrderRefundRequest
): Promise<CozePackageOrderRefundResponse> => {
    return useConsolePost("/coze-package-order/refund", data);
};