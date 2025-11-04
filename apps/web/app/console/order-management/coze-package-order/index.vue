<script setup lang="ts">
import { ProPaginaction, useMessage, useModal } from "@fastbuildai/ui";
import type { TableColumn } from "@nuxt/ui";
import { type Row } from "@tanstack/table-core";
import { resolveComponent } from "vue";
import { useI18n } from "vue-i18n";
import { useBreakpoints, useDebounceFn } from "@vueuse/core";
import { useAccessControl } from "@/common/composables/useAccessControl";

import type {
    CozePackageOrderDetail,
    CozePackageOrderListItem,
    CozePackageOrderStatistics,
} from "@/models/coze-package-order";
import {
    apiGetCozePackageOrderList,
    apiGetCozePackageOrderDetail,
    apiCozePackageOrderRefund,
} from "@/services/console/coze-package-order";

import CozePackageOrderDetailComponent from "./components/coze-package-order-detail.vue";
import RefundApplication from "./components/refund-application.vue";

const TimeDisplay = resolveComponent("TimeDisplay");
const { t } = useI18n();
const UButton = resolveComponent("UButton");
const { hasAccessByCodes } = useAccessControl();
const UDropdownMenu = resolveComponent("UDropdownMenu");
const toast = useMessage();

// 订单详情相关状态
const orderDetailVisible = ref(false);
const orderDetail = ref<CozePackageOrderDetail | null>(null);

// 退款申请相关状态
const refundApplicationVisible = ref(false);
const refundOrderData = ref<CozePackageOrderDetail | null>(null);

// 状态轮询相关
const pollingInterval = ref<NodeJS.Timeout | null>(null);
const isPolling = ref(false);
const pollingOrders = ref<Set<string>>(new Set()); // 需要轮询的订单ID集合

// 加载状态
const loading = ref(false);
const refreshing = ref(false);

// 统计数据
const statistics = ref<CozePackageOrderStatistics>({
    totalOrder: 0,
    totalAmount: 0,
    totalRefundOrder: 0,
    totalRefundAmount: 0,
    totalIncome: 0,
});

// 统计卡片配置
const statisticsItems = [
    {
        key: "totalOrder",
        unit: "console-common.unit",
        label: "console-coze-package-order.packageOrderCount",
        icon: "i-lucide-shopping-cart",
        color: "blue",
    },
    {
        key: "totalAmount",
        unit: "console-common.yuan",
        label: "console-coze-package-order.totalPackageAmount",
        icon: "i-lucide-coins",
        color: "green",
    },
    {
        key: "totalRefundOrder",
        unit: "console-common.unit",
        label: "console-coze-package-order.refundCount",
        icon: "i-lucide-undo-2",
        color: "orange",
    },
    {
        key: "totalRefundAmount",
        unit: "console-common.yuan",
        label: "console-coze-package-order.totalRefundAmount",
        icon: "i-lucide-arrow-left-circle",
        color: "red",
    },
    {
        key: "totalIncome",
        unit: "console-common.yuan",
        label: "console-coze-package-order.netIncome",
        icon: "i-lucide-trending-up",
        color: "emerald",
    },
] as const;

// 搜索筛选参数
const keyword = ref<string>("");
const orderNo = ref<string>("");
const payType = ref<string | undefined>(undefined);
const payStatus = ref<string | undefined>(undefined);
const refundStatus = ref<string | undefined>(undefined);
const startDate = ref<string>("");
const endDate = ref<string>("");
const packageName = ref<string>("");
const minAmount = ref<string>("");
const maxAmount = ref<string>("");

// 搜索状态
const isSearching = ref(false);
const searchError = ref<string>("");
const hasActiveFilters = computed(() => {
    return !!(
        keyword.value ||
        orderNo.value ||
        payType.value ||
        payStatus.value ||
        refundStatus.value ||
        startDate.value ||
        endDate.value ||
        packageName.value ||
        minAmount.value ||
        maxAmount.value
    );
});

// 筛选器状态管理
const filterState = ref({
    isApplying: false,
    lastAppliedFilters: {},
    hasChanges: false,
});

// 验证搜索条件
const validateSearchConditions = () => {
    searchError.value = "";

    // 验证日期范围
    if (startDate.value && endDate.value) {
        const start = new Date(startDate.value);
        const end = new Date(endDate.value);
        if (start > end) {
            searchError.value = "开始日期不能晚于结束日期";
            return false;
        }

        // 检查日期范围是否过大（超过1年）
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 365) {
            searchError.value = "日期范围不能超过365天";
            return false;
        }
    }

    // 验证金额范围
    if (minAmount.value && maxAmount.value) {
        const min = parseFloat(minAmount.value);
        const max = parseFloat(maxAmount.value);
        if (min > max) {
            searchError.value = "最低金额不能大于最高金额";
            return false;
        }
        if (min < 0 || max < 0) {
            searchError.value = "金额不能为负数";
            return false;
        }
    }

    return true;
};

// 获取当前筛选条件
const getCurrentFilters = () => {
    return {
        keyword: keyword.value,
        orderNo: orderNo.value,
        payType: payType.value,
        payStatus: payStatus.value,
        refundStatus: refundStatus.value,
        startDate: startDate.value,
        endDate: endDate.value,
        packageName: packageName.value,
        minAmount: minAmount.value,
        maxAmount: maxAmount.value,
    };
};

// 检查筛选条件是否有变化
const hasFilterChanges = computed(() => {
    const current = getCurrentFilters();
    return JSON.stringify(current) !== JSON.stringify(filterState.value.lastAppliedFilters);
});

// 应用筛选条件
const applyFilters = async () => {
    if (!validateSearchConditions()) {
        return;
    }

    try {
        filterState.value.isApplying = true;
        searchError.value = "";
        paging.value.page = 1;

        await getOrderList();

        // 保存当前筛选条件
        filterState.value.lastAppliedFilters = getCurrentFilters();
        filterState.value.hasChanges = false;

        toast.success("筛选条件已应用");
    } catch (error) {
        console.error("Apply filters error:", error);
        searchError.value = "应用筛选条件失败，请重试";
    } finally {
        filterState.value.isApplying = false;
    }
};

// 快速筛选预设
const quickFilters = [
    {
        label: "今日订单",
        icon: "i-lucide-calendar-days",
        action: async () => {
            const today = new Date().toISOString().split('T')[0];
            startDate.value = today;
            endDate.value = today;
            await applyFilters();
        }
    },
    {
        label: "本周订单",
        icon: "i-lucide-calendar-week",
        action: async () => {
            const now = new Date();
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
            startDate.value = startOfWeek.toISOString().split('T')[0];
            endDate.value = endOfWeek.toISOString().split('T')[0];
            await applyFilters();
        }
    },
    {
        label: "未支付订单",
        icon: "i-lucide-alert-circle",
        action: async () => {
            payStatus.value = "0";
            refundStatus.value = "0";
            await applyFilters();
        }
    },
    {
        label: "已退款订单",
        icon: "i-lucide-undo-2",
        action: async () => {
            refundStatus.value = "1";
            await applyFilters();
        }
    }
];

// 分页参数
const paging = ref({
    page: 1,
    pageSize: 50, // 增加默认分页大小，确保能显示更多订单
    total: 0,
});

// 订单列表
const orders = ref<CozePackageOrderListItem[]>([]);

// 表格列定义
const columns: TableColumn<CozePackageOrderListItem>[] = [
    {
        accessorKey: "orderNo",
        header: t("console-coze-package-order.list.orderNo"),
        size: 160,
        cell: ({ row }) => {
            const orderNo = row.getValue("orderNo") as string;
            // 只显示ORD后面的数字部分
            const displayOrderNo = orderNo.startsWith('ORD') ? orderNo.substring(3) : orderNo;
            return h("div", {
                class: "group relative",
            }, [
                h("div", {
                    class: "font-mono text-sm font-medium text-primary-600 dark:text-primary-400 cursor-pointer hover:text-primary-700 dark:hover:text-primary-300 transition-colors",
                    title: `点击复制完整订单号: ${orderNo}`,
                    onClick: () => {
                        navigator.clipboard.writeText(orderNo);
                        toast.success("完整订单号已复制到剪贴板");
                    },
                }, displayOrderNo),
                h("i", {
                    class: "i-lucide-copy w-3 h-3 absolute -right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600",
                }),
            ]);
        },
    },
    {
        accessorKey: "user",
        header: t("console-coze-package-order.list.user"),
        size: 200,
    },
    {
        accessorKey: "packageConfig",
        header: t("console-coze-package-order.list.packageName"),
        size: 200,
        cell: ({ row }) => {
            const packageConfig = row.getValue("packageConfig") as any;
            // 优先使用 packageConfig 中的名称，然后是 packageDescription，最后是默认值
            let packageName = "未知套餐";
            if (packageConfig?.name) {
                packageName = packageConfig.name;
            } else if (row.original.packageDescription && !row.original.packageDescription.includes('console-common')) {
                packageName = row.original.packageDescription;
            } else {
                // 根据套餐时长推断套餐名称
                const duration = row.original.packageDuration;
                if (duration === 30) {
                    packageName = "月度套餐";
                } else if (duration === 90) {
                    packageName = "季度套餐";
                } else if (duration === 365) {
                    packageName = "年度套餐";
                } else {
                    packageName = `${duration}天套餐`;
                }
            }

            return h("div", {
                class: "font-medium text-gray-900 dark:text-gray-100 truncate",
                title: packageName,
            }, packageName);
        },
    },
    {
        accessorKey: "packageDuration",
        header: t("console-coze-package-order.list.packageDuration"),
        size: 120,
        cell: ({ row }) => {
            const duration = row.getValue("packageDuration") as number;
            const durationColor = duration >= 365 ? "text-purple-600 dark:text-purple-400" :
                                 duration >= 30 ? "text-blue-600 dark:text-blue-400" :
                                 "text-green-600 dark:text-green-400";
            return h("div", {
                class: "text-center",
            }, [
                h("div", {
                    class: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${durationColor} bg-gray-100 dark:bg-gray-800`,
                }, [
                    h("span", { class: "font-semibold" }, duration.toString()),
                    h("span", { class: "ml-1" }, "天"),
                ]),
            ]);
        },
    },
    {
        accessorKey: "packageOriginalPrice",
        header: t("console-coze-package-order.list.packagePrice"),
        size: 120,
        cell: ({ row }) => {
            const price = Number.parseFloat(row.getValue("packageOriginalPrice") || "0");
            const formattedPrice = new Intl.NumberFormat("zh-CN", {
                style: "currency",
                currency: "CNY",
            }).format(price);
            return h("div", {
                class: "text-right",
            }, [
                h("div", {
                    class: "font-semibold text-green-600 dark:text-green-400",
                }, formattedPrice),
                h("div", {
                    class: "text-xs text-gray-500 dark:text-gray-400",
                }, "原价"),
            ]);
        },
    },
    {
        accessorKey: "packageCurrentPrice",
        header: ({ column }) => {
            const isSorted = column.getIsSorted();
            const isLoading = sortState.value.isLoading && sortState.value.column === 'packageCurrentPrice';

            return h(UButton, {
                color: "neutral",
                variant: "ghost",
                label: t("console-coze-package-order.list.orderAmount"),
                icon: isLoading
                    ? "i-lucide-loader-2"
                    : isSorted
                        ? isSorted === "asc"
                            ? "i-lucide-arrow-up-narrow-wide"
                            : "i-lucide-arrow-down-wide-narrow"
                        : "i-lucide-arrow-up-down",
                class: "text-sm",
                loading: isLoading,
                onClick: () => {
                    // 交替排序：奇数次降序，偶数次升序
                    const key = 'packageCurrentPrice';
                    const count = (sortClickCount.value[key] ?? 0) + 1;
                    sortClickCount.value[key] = count;
                    const newDirection: 'asc' | 'desc' = count % 2 === 1 ? 'desc' : 'asc';
                    // 修正：toggleSorting 参数为是否降序
                    column.toggleSorting(newDirection === 'desc');
                    handleSort('packageCurrentPrice', newDirection);
                },
            });
        },
        size: 140,
        cell: ({ row }) => {
            const amount = Number.parseFloat(row.getValue("packageCurrentPrice") || "0");
            const packagePrice = Number.parseFloat(row.original.packageOriginalPrice || "0");
            const isDiscounted = amount < packagePrice;
            const formattedAmount = new Intl.NumberFormat("zh-CN", {
                style: "currency",
                currency: "CNY",
            }).format(amount);

            return h("div", {
                class: "text-right space-y-1",
            }, [
                h("div", {
                    class: "font-bold text-lg text-blue-600 dark:text-blue-400",
                }, formattedAmount),
                isDiscounted ? h("div", {
                    class: "text-xs text-orange-500 dark:text-orange-400 flex items-center justify-end gap-1",
                }, [
                    h("i", { class: "i-lucide-percent w-3 h-3" }),
                    h("span", {}, "优惠价"),
                ]) : null,
            ]);
        },
    },
    {
        accessorKey: "paymentMethod",
        header: t("console-coze-package-order.list.paymentMethod"),
        size: 120,
        cell: ({ row }) => {
            const paymentMethod = row.getValue("paymentMethod") as string;
            const methodMap: Record<string, { label: string; icon: string; color: string }> = {
                'wechat': { label: '微信支付', icon: 'i-lucide-smartphone', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
                'alipay': { label: '支付宝', icon: 'i-lucide-credit-card', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
                'bank': { label: '银行卡', icon: 'i-lucide-credit-card', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
                'balance': { label: '余额支付', icon: 'i-lucide-wallet', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
                'other': { label: '其他', icon: 'i-lucide-more-horizontal', color: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20' }
            };

            const method = methodMap[paymentMethod] || { label: paymentMethod || '未知', icon: 'i-lucide-wallet', color: 'text-gray-500 bg-gray-50 dark:bg-gray-800' };

            return h("div", {
                class: `inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${method.color}`,
            }, [
                h("i", {
                    class: `${method.icon} w-3 h-3`,
                }),
                h("span", {}, method.label),
            ]);
        },
    },
    {
        accessorKey: "paymentStatus",
        header: t("console-coze-package-order.list.paymentStatus"),
        size: 140,
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => {
            const isSorted = column.getIsSorted();
            const isLoading = sortState.value.isLoading && sortState.value.column === 'createdAt';

            return h(UButton, {
                color: "neutral",
                variant: "ghost",
                label: t("console-coze-package-order.list.createdAt"),
                icon: isLoading
                    ? "i-lucide-loader-2"
                    : isSorted
                        ? isSorted === "asc"
                            ? "i-lucide-arrow-up-narrow-wide"
                            : "i-lucide-arrow-down-wide-narrow"
                        : "i-lucide-arrow-up-down",
                class: "text-sm",
                loading: isLoading,
                onClick: () => {
                    // 交替排序：奇数次降序，偶数次升序
                    const key = 'createdAt';
                    const count = (sortClickCount.value[key] ?? 0) + 1;
                    sortClickCount.value[key] = count;
                    const newDirection: 'asc' | 'desc' = count % 2 === 1 ? 'desc' : 'asc';
                    // 修正：toggleSorting 参数为是否降序
                    column.toggleSorting(newDirection === 'desc');
                    handleSort('createdAt', newDirection);
                },
            });
        },
        size: 160,
        cell: ({ row }) => {
            const createdAt = row.getValue("createdAt") as string;
            const date = new Date(createdAt);

            // 格式化日期和时间 - 使用 YYYY/M/D 格式
            const year = date.getFullYear();
            const month = date.getMonth() + 1; // getMonth() 返回 0-11
            const day = date.getDate();
            const dateStr = `${year}/${month}/${day}`;

            const timeStr = date.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });

            return h("div", {
                class: "text-sm text-gray-600 dark:text-gray-400 space-y-1",
            }, [
                h("div", {
                    class: "font-medium text-gray-900 dark:text-gray-100",
                }, dateStr),
                h("div", {
                    class: "text-xs text-gray-500 dark:text-gray-400",
                }, timeStr),
            ]);
        },
    },
    {
        accessorKey: "actions",
        header: t("console-coze-package-order.list.actions"),
        size: 80,
        enableSorting: false,
        enableHiding: true,
    },
];

// 退款操作 - 打开退款申请弹窗
const refund = async (id?: string) => {
    if (!id) return;

    try {
        loading.value = true;
        // 获取订单详情用于退款申请
        const orderDetail = await apiGetCozePackageOrderDetail(id);
        refundOrderData.value = orderDetail;
        refundApplicationVisible.value = true;
    } catch (error) {
        console.error("Get order detail for refund error:", error);
        toast.error("获取订单信息失败，无法申请退款");
    } finally {
        loading.value = false;
    }
};

// 退款申请成功回调
const handleRefundSuccess = () => {
    const orderId = refundOrderData.value?.id;
    refundApplicationVisible.value = false;
    refundOrderData.value = null;

    // 添加到轮询列表
    if (orderId) {
        pollingOrders.value.add(orderId);
        startPolling();
    }

    getOrderList(); // 刷新订单列表
    toast.success("退款申请已提交，正在处理中，我们将实时更新退款状态");
};

// 关闭退款申请弹窗
const handleRefundClose = () => {
    refundApplicationVisible.value = false;
    refundOrderData.value = null;
};

// 开始状态轮询
const startPolling = () => {
    if (isPolling.value || pollingOrders.value.size === 0) return;

    isPolling.value = true;
    pollingInterval.value = setInterval(async () => {
        await checkOrderStatus();
    }, 10000); // 每10秒检查一次
};

// 停止状态轮询
const stopPolling = () => {
    if (pollingInterval.value) {
        clearInterval(pollingInterval.value);
        pollingInterval.value = null;
    }
    isPolling.value = false;
};

// 检查订单状态
const checkOrderStatus = async () => {
    if (pollingOrders.value.size === 0) {
        stopPolling();
        return;
    }

    try {
        const orderIds = Array.from(pollingOrders.value);
        const completedOrders: string[] = [];

        for (const orderId of orderIds) {
            try {
                const orderDetail = await apiGetCozePackageOrderDetail(orderId);

                // 检查退款状态是否已完成（成功或失败）
                if (orderDetail.refundStatus === 1) {
                    // 退款成功
                    completedOrders.push(orderId);
                    toast.success(`订单 ${orderDetail.orderNo} 退款已完成`);
                } else if (orderDetail.refundStatus === 2) {
                    // 退款失败
                    completedOrders.push(orderId);
                    toast.error(`订单 ${orderDetail.orderNo} 退款失败，请联系客服`);
                }
            } catch (error) {
                console.error(`Check order ${orderId} status error:`, error);
                // 如果订单查询失败，可能是订单不存在，从轮询列表中移除
                completedOrders.push(orderId);
            }
        }

        // 移除已完成的订单
        completedOrders.forEach(orderId => {
            pollingOrders.value.delete(orderId);
        });

        // 如果有状态变化，刷新订单列表
        if (completedOrders.length > 0) {
            getOrderList(false); // 静默刷新，不显示加载状态
        }

        // 如果没有需要轮询的订单了，停止轮询
        if (pollingOrders.value.size === 0) {
            stopPolling();
        }
    } catch (error) {
        console.error("Check order status error:", error);
    }
};

// 操作栏
function getRowItems(row: Row<CozePackageOrderListItem>) {
    return [
        hasAccessByCodes(["coze-package-order:detail"])
            ? {
                  label: t("console-coze-package-order.list.viewDetails"),
                  icon: "i-lucide-eye",
                  color: "info",
                  onClick: () => {
                      getOrderDetail(row.original.id);
                  },
              }
            : null,
        row.original.paymentStatus === 'paid' &&
        hasAccessByCodes(["coze-package-order:refund"]) &&
        row.original.refundStatus === 'none'
            ? {
                  label: t("console-coze-package-order.list.refund"),
                  icon: "i-lucide-undo-2",
                  color: "error",
                  onClick: () => {
                      refund(row.original.id);
                  },
              }
            : null,
    ].filter(Boolean);
}

// 设置操作列固定在右侧
const columnPinning = ref({
    left: [],
    right: ["actions"],
});

// 参数转换函数
const convertPaymentMethod = (value: string | undefined): string | undefined => {
    if (!value || value === 'all') return undefined;
    const mapping: Record<string, string> = {
        '1': 'wechat',
        '2': 'alipay',
        '3': 'bank',
        '4': 'balance',
        '5': 'other'
    };
    return mapping[value];
};

const convertPaymentStatus = (value: string | undefined): string | undefined => {
    if (!value || value === 'all') return undefined;
    const mapping: Record<string, string> = {
        '0': 'unpaid',
        '1': 'paid',
        '2': 'refunded',
        '3': 'partialRefund'
    };
    return mapping[value];
};

const convertRefundStatus = (value: string | undefined): string | undefined => {
    if (!value || value === 'all') return undefined;
    const mapping: Record<string, string> = {
        '0': 'none',
        '1': 'pending',
        '2': 'approved',
        '3': 'rejected',
        '4': 'processing'
    };
    return mapping[value];
};

// 构建API参数
const buildApiParams = () => {
    const params: any = {
        page: paging.value.page,
        limit: paging.value.pageSize,
    };

    // 只添加有效的非空参数
    if (keyword.value) params.keyword = keyword.value;
    if (orderNo.value) params.orderNo = orderNo.value;
    if (startDate.value) params.startDate = startDate.value;
    if (endDate.value) params.endDate = endDate.value;

    // 添加排序参数
    if (sortState.value.column) {
        params.sortBy = sortState.value.column;
        params.sortOrder = sortState.value.direction.toUpperCase();
    }

    // 转换枚举参数
    const convertedPaymentMethod = convertPaymentMethod(payType.value);
    const convertedPaymentStatus = convertPaymentStatus(payStatus.value);
    const convertedRefundStatus = convertRefundStatus(refundStatus.value);

    if (convertedPaymentMethod) params.paymentMethod = convertedPaymentMethod;
    if (convertedPaymentStatus) params.paymentStatus = convertedPaymentStatus;
    if (convertedRefundStatus) params.refundStatus = convertedRefundStatus;

    return params;
};

// 获取订单列表
const getOrderList = async (showLoading = true) => {
    try {
        if (showLoading) {
            loading.value = true;
        } else {
            refreshing.value = true;
        }

        // 清除之前的错误信息
        searchError.value = "";

        const params = buildApiParams();
        const res = await apiGetCozePackageOrderList(params);

        orders.value = res.items;
        paging.value = {
            page: res.page,
            pageSize: res.pageSize,
            total: res.total,
        };
        statistics.value = res.statistics;
    } catch (error) {
        console.error("Get order list error:", error);

        // 设置错误信息，让用户能看到具体的错误
        if (error && typeof error === 'object' && 'message' in error) {
            searchError.value = `数据加载失败: ${error.message}`;
        } else {
            searchError.value = "数据加载失败，请检查网络连接或稍后重试";
        }

        toast.error(t("console-common.loadingFailed"));
        orders.value = [];

        // 重置统计数据
        statistics.value = {
            totalOrder: 0,
            totalAmount: 0,
            totalRefundOrder: 0,
            totalRefundAmount: 0,
            totalIncome: 0,
        };
    } finally {
        loading.value = false;
        refreshing.value = false;
    }
};

// 获取订单详情
const getOrderDetail = async (id: string | undefined) => {
    if (!id) return;
    try {
        loading.value = true;
        const res = await apiGetCozePackageOrderDetail(id);
        orderDetailVisible.value = true;
        orderDetail.value = res;
    } catch (error) {
        console.error("Get order detail error:", error);
        toast.error(t("console-common.loadDetailFailed"));
    } finally {
        loading.value = false;
    }
};

// 重置搜索条件
const resetSearch = () => {
    keyword.value = "";
    orderNo.value = "";
    payType.value = undefined;
    payStatus.value = undefined;
    refundStatus.value = undefined;
    startDate.value = "";
    endDate.value = "";
    paging.value.page = 1;
    getOrderList();
};

// 排序状态管理
const sortState = ref({
    column: '',
    direction: 'desc' as 'asc' | 'desc',
    isLoading: false
});
// 新增：排序点击计数器（按列名记录点击次数）
const sortClickCount = ref<Record<string, number>>({});

// 响应式断点（保留用于其他组件）
const breakpoints = useBreakpoints({
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
});

const isTablet = breakpoints.between('md', 'lg');

// 搜索防抖
const searchDebounce = useDebounceFn(() => {
    paging.value.page = 1;
    getOrderList();
}, 500);

// 简化的分页大小变更
const changePageSize = () => {
    paging.value.page = 1;
    getOrderList();
};

// 简化的页码变更
const changePage = () => {
    getOrderList();
};

// 排序处理
const handleSort = async (column: string, direction: 'asc' | 'desc') => {
    try {
        sortState.value.isLoading = true;
        sortState.value.column = column;
        sortState.value.direction = direction;

        // 重置到第一页
        paging.value.page = 1;

        await getOrderList();

        // 显示排序提示
        const directionText = direction === 'asc' ? '升序' : '降序';
        toast.success(`已按${column}${directionText}排序`);
    } catch (error) {
        console.error('Sort error:', error);
        toast.error('排序失败');
    } finally {
        sortState.value.isLoading = false;
    }
};



const changeSelect = () => {
    if (payType.value === "all") {
        payType.value = undefined;
    }
    if (payStatus.value === "all") {
        payStatus.value = undefined;
    }
    if (refundStatus.value === "all") {
        refundStatus.value = undefined;
    }
    paging.value.page = 1;
    getOrderList();
};

// 刷新数据
const refreshData = () => {
    getOrderList(false);
};

onMounted(() => {
    getOrderList();

    // 检查是否有需要轮询的订单（页面刷新后恢复轮询）
    // 这里可以从 localStorage 或其他持久化存储中恢复轮询状态
    // 暂时不实现持久化，只在当前会话中轮询
});

onUnmounted(() => {
    // 清理轮询
    stopPolling();
    pollingOrders.value.clear();
});
</script>

<template>
    <div class="flex h-full flex-col space-y-6 pb-6">
        <!-- 状态轮询指示器 -->
        <div v-if="isPolling && pollingOrders.size > 0" class="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span class="text-sm text-blue-700 dark:text-blue-300">
                正在监控 {{ pollingOrders.size }} 个订单的退款状态
            </span>
        </div>

        <!-- 统计卡片 -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <UCard
                v-for="(item, index) in statisticsItems"
                :key="index"
                :ui="{
                    body: {
                        padding: 'p-4 sm:p-6'
                    }
                }"
                class="transition-all duration-200 hover:shadow-md"
            >
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div :class="`w-8 h-8 bg-${item.color}-100 dark:bg-${item.color}-900/20 rounded-lg flex items-center justify-center`">
                            <UIcon
                                :name="item.icon"
                                :class="`w-5 h-5 text-${item.color}-600 dark:text-${item.color}-400`"
                            />
                        </div>
                    </div>
                    <div class="ml-4 flex-1">
                        <div class="flex items-baseline">
                            <span class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {{
                                    item.key === 'totalAmount' || item.key === 'totalRefundAmount' || item.key === 'totalIncome'
                                        ? new Intl.NumberFormat("zh-CN", {
                                            style: "currency",
                                            currency: "CNY",
                                        }).format(statistics[item.key as keyof CozePackageOrderStatistics])
                                        : statistics[item.key as keyof CozePackageOrderStatistics]
                                }}
                            </span>
                            <span class="ml-1 text-xs text-gray-500 dark:text-gray-400">
                                {{ t(item.unit) }}
                            </span>
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                            {{ t(item.label) }}
                        </div>
                    </div>
                </div>
            </UCard>
        </div>

        <!-- 订单列表 -->
        <div class="flex flex-1 flex-col min-h-0">
             <!-- 搜索筛选区域 -->
             <div class="mb-6">
                 <!-- 高级搜索表单 -->
                 <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                     <!-- 基础搜索 -->
                     <UInput
                         :placeholder="t('console-coze-package-order.list.searchOrderNo')"
                         icon="i-lucide-search"
                         v-model="orderNo"
                         @update:modelValue="searchDebounce"
                         :loading="isSearching"
                         clearable
                     />
                     <UInput
                         :placeholder="t('console-coze-package-order.list.searchUser')"
                         icon="i-lucide-user"
                         v-model="keyword"
                         @update:modelValue="searchDebounce"
                         :loading="isSearching"
                         clearable
                     />



                     <!-- 金额范围 -->
                     <div class="flex gap-2">
                         <UInput
                             placeholder="最低金额"
                             icon="i-lucide-coins"
                             v-model="minAmount"
                             @update:modelValue="searchDebounce"
                             :loading="isSearching"
                             type="number"
                             step="0.01"
                             min="0"
                             class="flex-1"
                         />
                         <UInput
                             placeholder="最高金额"
                             icon="i-lucide-coins"
                             v-model="maxAmount"
                             @update:modelValue="searchDebounce"
                             :loading="isSearching"
                             type="number"
                             step="0.01"
                             min="0"
                             class="flex-1"
                         />
                     </div>

                     <!-- 状态筛选 -->
                     <USelect
                         :placeholder="t('console-coze-package-order.list.paymentMethod')"
                         :items="[
                             {
                                 label: t('console-common.all'),
                                 value: 'all',
                             },
                             {
                                 label: t('console-coze-package-order.list.wechatPay'),
                                 value: '1',
                             },
                             {
                                 label: t('console-coze-package-order.list.alipayPay'),
                                 value: '2',
                             },
                         ]"
                         v-model="payType"
                         @update:modelValue="changeSelect"
                         :loading="isSearching"
                         clearable
                     />
                     <USelect
                         :placeholder="t('console-coze-package-order.list.paymentStatus')"
                         :items="[
                             {
                                 label: t('console-common.all'),
                                 value: 'all',
                             },
                             {
                                 label: t('console-coze-package-order.list.paid'),
                                 value: '1',
                             },
                             {
                                 label: t('console-coze-package-order.list.unpaid'),
                                 value: '0',
                             },
                         ]"
                         v-model="payStatus"
                         @update:modelValue="changeSelect"
                         :loading="isSearching"
                         clearable
                     />
                     <USelect
                         :placeholder="t('console-coze-package-order.list.refundStatus')"
                         :items="[
                             {
                                 label: t('console-common.all'),
                                 value: 'all',
                             },
                             {
                                 label: t('console-coze-package-order.list.refunded'),
                                 value: '1',
                             },
                             {
                                 label: t('console-coze-package-order.list.notRefunded'),
                                 value: '0',
                             },
                         ]"
                         v-model="refundStatus"
                         @update:modelValue="changeSelect"
                         :loading="isSearching"
                         clearable
                     />

                     <!-- 时间范围 -->
                     <UInput
                         type="date"
                         :placeholder="t('console-common.startDate')"
                         v-model="startDate"
                         @update:modelValue="searchDebounce"
                         :loading="isSearching"
                         icon="i-lucide-calendar"
                     />
                     <UInput
                         type="date"
                         :placeholder="t('console-common.endDate')"
                         v-model="endDate"
                         @update:modelValue="searchDebounce"
                         :loading="isSearching"
                         icon="i-lucide-calendar"
                     />
                 </div>

                 <!-- 搜索状态指示器和错误提示 -->
                 <div v-if="isSearching || searchError || filterState.isApplying" class="mt-4 space-y-2">
                     <!-- 搜索状态 -->
                     <div v-if="isSearching" class="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                         <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
                         <span>正在搜索...</span>
                     </div>

                     <!-- 筛选器应用状态 -->
                     <div v-if="filterState.isApplying" class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                         <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
                         <span>正在应用筛选条件...</span>
                     </div>

                     <!-- 错误提示 -->
                     <UAlert
                         v-if="searchError"
                         icon="i-lucide-alert-triangle"
                         color="red"
                         variant="soft"
                         :title="searchError"
                         :close-button="{ icon: 'i-lucide-x', color: 'gray', variant: 'link', padded: false }"
                         @close="searchError = ''"
                     />

                     <!-- 筛选条件变化提示 -->
                     <div v-if="hasFilterChanges && !filterState.isApplying" class="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                         <div class="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                             <UIcon name="i-lucide-info" class="w-4 h-4" />
                             <span>筛选条件已修改，点击应用以更新结果</span>
                         </div>
                         <UButton
                             size="sm"
                             color="amber"
                             variant="solid"
                             @click="applyFilters"
                             :loading="filterState.isApplying"
                         >
                             应用筛选
                         </UButton>
                     </div>
                 </div>

                 <!-- 活跃筛选条件摘要 -->
                 <div v-if="hasActiveFilters && !searchError" class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                     <div class="flex items-center justify-between">
                         <div class="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                             <UIcon name="i-lucide-filter" class="w-4 h-4" />
                             <span>当前筛选条件：</span>
                         </div>
                         <UButton
                             size="sm"
                             color="blue"
                             variant="ghost"
                             icon="i-lucide-x"
                             @click="resetSearch"
                         >
                             清除所有
                         </UButton>
                     </div>
                     <div class="mt-2 flex flex-wrap gap-2">
                         <UBadge
                             v-if="orderNo"
                             color="blue"
                             variant="subtle"
                             size="sm"
                         >
                             订单号: {{ orderNo }}
                         </UBadge>
                         <UBadge
                             v-if="keyword"
                             color="blue"
                             variant="subtle"
                             size="sm"
                         >
                             用户: {{ keyword }}
                         </UBadge>
                         <UBadge
                             v-if="packageName"
                             color="blue"
                             variant="subtle"
                             size="sm"
                         >
                             套餐: {{ packageName }}
                         </UBadge>
                         <UBadge
                             v-if="payType"
                             color="blue"
                             variant="subtle"
                             size="sm"
                         >
                             支付方式: {{ payType === '1' ? '微信支付' : payType === '2' ? '支付宝' : payType }}
                         </UBadge>
                         <UBadge
                             v-if="payStatus"
                             color="blue"
                             variant="subtle"
                             size="sm"
                         >
                             支付状态: {{ payStatus === '1' ? '已支付' : '未支付' }}
                         </UBadge>
                         <UBadge
                             v-if="refundStatus"
                             color="blue"
                             variant="subtle"
                             size="sm"
                         >
                             退款状态: {{ refundStatus === '1' ? '已退款' : '未退款' }}
                         </UBadge>
                         <UBadge
                             v-if="startDate || endDate"
                             color="blue"
                             variant="subtle"
                             size="sm"
                         >
                             时间: {{ startDate || '开始' }} ~ {{ endDate || '结束' }}
                         </UBadge>
                         <UBadge
                             v-if="minAmount || maxAmount"
                             color="blue"
                             variant="subtle"
                             size="sm"
                         >
                             金额: {{ minAmount || '0' }} ~ {{ maxAmount || '∞' }}
                         </UBadge>
                     </div>
                 </div>
             </div>

             <div class="relative">
                     <!-- 加载遮罩 -->
                     <div
                         v-if="loading"
                         class="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-gray-900/80"
                     >
                         <div class="flex flex-col items-center gap-3">
                             <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-primary-500" />
                             <span class="text-sm text-gray-600 dark:text-gray-400">正在加载订单数据...</span>
                         </div>
                     </div>

                     <!-- 空状态 -->
                     <div
                         v-if="!loading && orders.length === 0 && !searchError"
                         class="flex flex-col items-center justify-center py-16 text-center"
                     >
                         <div class="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600">
                             <UIcon
                                 :name="hasActiveFilters ? 'i-lucide-search-x' : 'i-lucide-package-x'"
                                 class="w-full h-full"
                             />
                         </div>
                         <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                             {{ hasActiveFilters ? '未找到匹配的订单' : '暂无订单数据' }}
                         </h3>
                         <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                             {{ hasActiveFilters
                                 ? '请尝试调整筛选条件或清除筛选器以查看更多结果'
                                 : '当前还没有任何订单记录，用户购买套餐后订单将显示在这里'
                             }}
                         </p>
                         <div class="flex gap-3">
                             <UButton
                                 v-if="hasActiveFilters"
                                 icon="i-lucide-x"
                                 variant="outline"
                                 @click="resetSearch"
                             >
                                 清除筛选条件
                             </UButton>
                             <UButton
                                 icon="i-lucide-refresh-cw"
                                 @click="refreshData"
                                 :loading="loading"
                             >
                                 刷新数据
                             </UButton>
                         </div>
                     </div>

                     <!-- 错误状态 -->
                     <div
                         v-if="!loading && searchError && orders.length === 0"
                         class="flex flex-col items-center justify-center py-16 text-center"
                     >
                         <div class="w-24 h-24 mx-auto mb-4 text-red-300 dark:text-red-600">
                             <UIcon name="i-lucide-alert-triangle" class="w-full h-full" />
                         </div>
                         <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                             数据加载失败
                         </h3>
                         <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                             {{ searchError }}
                         </p>
                         <div class="flex gap-3">
                             <UButton
                                 icon="i-lucide-refresh-cw"
                                 @click="refreshData"
                                 :loading="loading"
                             >
                                 重新加载
                             </UButton>
                             <UButton
                                 variant="outline"
                                 icon="i-lucide-x"
                                 @click="searchError = ''"
                             >
                                 清除错误
                             </UButton>
                         </div>
                     </div>

                     <div class="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg" style="max-height: calc(100vh - 400px); min-height: 500px;">
                         <UTable
                             v-if="!loading"
                             ref="table"
                             sticky
                             :data="orders"
                             :columns="columns"
                             v-model:column-pinning="columnPinning"
                             :ui="{
                                 base: 'table-fixed border-separate border-spacing-0 w-full',
                                 thead: '[&>tr]:bg-gray-50 dark:[&>tr]:bg-gray-800/50 [&>tr]:after:content-none sticky top-0 z-10',
                                 tbody: '[&>tr]:last:[&>td]:border-b-0 [&>tr]:hover:bg-gray-50 dark:[&>tr]:hover:bg-gray-800/30',
                                 th: 'py-3 px-4 first:rounded-l-lg last:rounded-r-lg border-y border-gray-200 dark:border-gray-700 first:border-l last:border-r font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/50',
                                 td: 'py-3 px-4 border-b border-gray-200 dark:border-gray-700',
                                 tr: '[&:has(>td[colspan])]:hidden',
                             }"
                             :class="{ 'opacity-50': loading }"
                         >
                         <template #user-cell="{ row }">
                             <div class="flex flex-col">
                                 <span class="font-medium text-gray-900 dark:text-gray-100">
                                     {{ row.original.user?.username || row.original.user?.email || '未知用户' }}
                                 </span>
                             </div>
                         </template>

                         <template #paymentStatus-cell="{ row }">
                             <div class="flex flex-col items-start gap-2">
                                 <!-- 原始状态提示 -->
                                 <div
                                     v-if="row.original.refundStatus === 'refunded'"
                                     class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"
                                 >
                                     <i class="i-lucide-info w-3 h-3"></i>
                                     <span>{{ t("console-coze-package-order.list.originallyPaid") }}</span>
                                 </div>

                                 <!-- 主要状态标签 -->
                                 <div class="relative group">
                                     <UBadge
                                         :color="
                                             row.original.refundStatus === 'refunded'
                                                 ? 'orange'
                                                 : row.original.paymentStatus === 'paid'
                                                   ? 'green'
                                                   : 'red'
                                         "
                                         :variant="row.original.refundStatus === 'refunded' ? 'solid' : 'subtle'"
                                         size="sm"
                                         class="transition-all duration-200 hover:scale-105 cursor-default"
                                     >
                                         <div class="flex items-center gap-1.5">
                                             <!-- 状态指示器 -->
                                             <div
                                                 :class="[
                                                     'w-2 h-2 rounded-full',
                                                     row.original.refundStatus === 'refunded'
                                                         ? 'bg-orange-400 animate-pulse'
                                                         : row.original.paymentStatus === 'paid'
                                                           ? 'bg-green-400'
                                                           : 'bg-red-400 animate-pulse'
                                                 ]"
                                             ></div>

                                             <!-- 状态图标 -->
                                             <UIcon
                                                 :name="
                                                     row.original.refundStatus === 'refunded'
                                                         ? 'i-lucide-undo-2'
                                                         : row.original.paymentStatus === 'paid'
                                                           ? 'i-lucide-check-circle'
                                                           : 'i-lucide-x-circle'
                                                 "
                                                 class="w-3 h-3"
                                             />

                                             <!-- 状态文本 -->
                                             <span class="font-medium">
                                                 {{
                                                     row.original.refundStatus === 'refunded'
                                                         ? t("console-coze-package-order.list.refunded")
                                                         : row.original.paymentStatus === 'paid'
                                                           ? t("console-coze-package-order.list.paid")
                                                           : t("console-coze-package-order.list.unpaid")
                                                 }}
                                             </span>
                                         </div>
                                     </UBadge>

                                     <!-- 悬浮提示 -->
                                     <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                         {{
                                             row.original.refundStatus === 'refunded'
                                                 ? '订单已退款，资金已返还'
                                                 : row.original.paymentStatus === 'paid'
                                                   ? '订单支付成功，可正常使用'
                                                   : '订单未支付，请及时处理'
                                         }}
                                         <div class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                                     </div>
                                 </div>

                                 <!-- 支付时间信息 -->
                                 <div
                                     v-if="row.original.paymentStatus === 'paid' && row.original.payTime"
                                     class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"
                                 >
                                     <i class="i-lucide-clock w-3 h-3"></i>
                                     <TimeDisplay
                                         :datetime="row.original.payTime"
                                         mode="relative"
                                         class="text-xs"
                                     />
                                 </div>

                                 <!-- 退款时间信息 -->
                                 <div
                                     v-if="row.original.refundStatus === 'refunded' && row.original.refundTime"
                                     class="text-xs text-orange-500 dark:text-orange-400 flex items-center gap-1"
                                 >
                                     <i class="i-lucide-undo-2 w-3 h-3"></i>
                                     <TimeDisplay
                                         :datetime="row.original.refundTime"
                                         mode="relative"
                                         class="text-xs"
                                     />
                                 </div>
                             </div>
                         </template>

                         <template #actions-cell="{ row }">
                             <UDropdownMenu :items="getRowItems(row)">
                                 <UButton
                                     icon="i-lucide-more-vertical"
                                     color="gray"
                                     variant="ghost"
                                     size="sm"
                                     :aria-label="t('console-common.actions')"
                                 />
                             </UDropdownMenu>
                         </template>
                     </UTable>
                 </div>
             </div>

                 <!-- 分页 -->
                 <div
                     class="border-default mt-auto flex items-center justify-between gap-3 border-t pt-4"
                 >
                     <div class="text-muted flex items-center gap-2 text-sm">
                         <span
                             >{{ t("console-common.total") }} {{ paging.total }}
                             {{ t("console-common.items") }}</span
                         >
                         <USelect
                             v-model="paging.pageSize"
                             size="lg"
                             :items="[
                                 {
                                     label:
                                         '10 ' +
                                         t('console-common.items') +
                                         '/' +
                                         t('console-common.page'),
                                     value: 10,
                                 },
                                 {
                                     label:
                                         '20 ' +
                                         t('console-common.items') +
                                         '/' +
                                         t('console-common.page'),
                                     value: 20,
                                 },
                                 {
                                     label:
                                         '50 ' +
                                         t('console-common.items') +
                                         '/' +
                                         t('console-common.page'),
                                     value: 50,
                                 },
                                 {
                                     label:
                                         '100 ' +
                                         t('console-common.items') +
                                         '/' +
                                         t('console-common.page'),
                                     value: 100,
                                 },
                             ]"
                             class="w-28"
                             @change="changePageSize()"
                         />
                     </div>
                     <div class="flex items-center gap-1.5">
                         <ProPaginaction
                             v-model:page="paging.page"
                             v-model:size="paging.pageSize"
                             show-edges
                             :total="paging.total"
                             @change="getOrderList()"
                         />
                         <div class="text-muted flex items-center gap-2 text-sm">
                             <span>{{ t("console-common.goTo") }}</span>
                             <UInput
                                 v-model="paging.page"
                                 size="lg"
                                 type="number"
                                 class="w-18"
                                 @change="changePage()"
                             />
                             <span>{{ t("console-common.page") }}</span>
                         </div>
                     </div>
                 </div>
             </div>
         </div>

     <!-- 订单详情弹窗 -->
     <CozePackageOrderDetailComponent
         :visible="orderDetailVisible"
         :order="orderDetail"
         @close="orderDetailVisible = false"
         @refresh="getOrderList"
     />

     <!-- 退款申请弹窗 -->
     <RefundApplication
         :visible="refundApplicationVisible"
         :order="refundOrderData"
         @close="handleRefundClose"
         @success="handleRefundSuccess"
     />
</template>
