<script setup lang="ts">
// cspell:ignore vueuse tanstack
import { ProModal, useMessage } from "@fastbuildai/ui";
import { useBreakpoints } from "@vueuse/core";
import { useI18n } from "vue-i18n";

import type { CozePackageOrderDetail } from "@/models/coze-package-order";

const props = defineProps<{
    order?: CozePackageOrderDetail | null;
    visible: boolean;
}>();

const emits = defineEmits<{
    (e: "close"): void;
    (e: "refresh"): void;
}>();

const { t } = useI18n();
const toast = useMessage();

// 响应式断点检测
const breakpoints = useBreakpoints({
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
});

const isMobile = breakpoints.smaller('md');
const isTablet = breakpoints.between('md', 'lg');

// 加载状态
const detailLoading = ref(false);
const detailError = ref('');

// 已移除退款相关操作逻辑

// 关闭弹窗
const handleClose = () => {
    emits("close");
};

// 复制订单号
const copyOrderNo = async () => {
    if (!props.order?.orderNo) return;
    
    try {
        await navigator.clipboard.writeText(props.order.orderNo);
        toast.success("订单号已复制到剪贴板");
    } catch (error) {
        console.error("Copy failed:", error);
        toast.error("复制失败");
    }
};

// 格式化金额
const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY",
    }).format(amount);
};

// 获取支付状态样式（支持字符串/数字）
const getPayStatusStyle = (status: string | number | undefined) => {
    const s = typeof status === 'number' ? (status === 1 ? 'paid' : 'unpaid') : (status || 'unpaid');
    return s === 'paid'
        ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
        : s === 'refunded'
            ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20"
            : "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20";
};

// 获取退款状态样式（支持字符串/数字）
const getRefundStatusStyle = (status: string | number | undefined) => {
    const s = typeof status === 'number' ? (status === 1 ? 'refunded' : 'none') : (status || 'none');
    return s === 'approved' || s === 'refunded'
        ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
        : s === 'pending' || s === 'processing'
            ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20"
            : "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20";
};

// 重新加载订单详情
const reloadDetail = () => {
    detailError.value = '';
    emits("refresh");
};

// 监听订单变化，重置错误状态
watch(() => props.order, () => {
    detailError.value = '';
}, { immediate: true });
</script>

<template>
    <ProModal 
        :model-value="visible" 
        @update:model-value="handleClose"
        :size="isMobile ? 'full' : '2xl'"
        :title="t('console-coze-package-order.detail.title')"
        :ui="{
            wrapper: isMobile ? 'w-full h-full' : 'sm:max-w-2xl',
            container: isMobile ? 'h-full' : 'max-h-[90vh]',
            body: isMobile ? 'p-4' : 'p-6'
        }"
    >
        <!-- 加载状态 -->
        <div v-if="detailLoading" class="flex items-center justify-center py-12">
            <div class="flex flex-col items-center gap-3">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ t('console-common.loading') }}
                </p>
            </div>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="detailError" class="flex items-center justify-center py-12">
            <div class="text-center">
                <i class="i-lucide-alert-circle w-12 h-12 text-red-500 mx-auto mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {{ t('console-common.error.title') }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {{ detailError || t('console-common.error.unknown') }}
                </p>
                <button
                    @click="reloadDetail"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <i class="i-lucide-refresh-cw w-4 h-4"></i>
                    {{ t('console-common.retry') }}
                </button>
            </div>
        </div>

        <!-- 无数据状态 -->
        <div v-else-if="!order" class="flex items-center justify-center py-12">
            <div class="text-center">
                <i class="i-lucide-file-x w-12 h-12 text-gray-400 mx-auto mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {{ t('console-common.noData') }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ t('console-coze-package-order.detail.noData') }}
                </p>
            </div>
        </div>

        <!-- 订单详情内容 -->
        <div v-else class="space-y-6">
            <!-- 订单基本信息 -->
            <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-4">
                    <i class="i-lucide-file-text w-5 h-5 text-primary-600 dark:text-primary-400"></i>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {{ t('console-coze-package-order.detail.basicInfo') }}
                    </h3>
                </div>
                
                <div class="grid grid-cols-1 gap-4" :class="{ 'sm:grid-cols-2': !isMobile, 'lg:grid-cols-2': isTablet }">
                    <!-- 订单编号 -->
                    <div>
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {{ t('console-coze-package-order.list.orderNo') }}
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="font-mono text-sm font-medium text-primary-600 dark:text-primary-400">
                                {{ order.orderNo }}
                            </span>
                            <button
                                @click="copyOrderNo"
                                class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                :title="t('console-common.copy')"
                            >
                                <i class="i-lucide-copy w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- 订单金额 -->
                    <div>
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {{ t('console-coze-package-order.list.orderAmount') }}
                        </div>
                        <div class="text-lg font-semibold text-green-600 dark:text-green-400">
                            {{ formatAmount(order.actualAmount) }}
                        </div>
                    </div>
                    
                    <!-- 支付状态 -->
                    <div>
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {{ t('console-coze-package-order.list.payStatus') }}
                        </div>
                        <span 
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            :class="getPayStatusStyle(order.paymentStatus)"
                        >
                            <i 
                                :class="order.paymentStatus === 'paid' ? 'i-lucide-check-circle' : 'i-lucide-clock'"
                                class="w-3 h-3 mr-1"
                            ></i>
                            {{ t('console-coze-package-order.status.payment.' + (order.paymentStatus || 'unpaid')) }}
                        </span>
                    </div>
                    
                    <!-- 退款状态 -->
                    <div>
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {{ t('console-coze-package-order.list.refundStatus') }}
                        </div>
                        <span 
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            :class="getRefundStatusStyle(order.refundStatus)"
                        >
                            <i 
                                :class="order.refundStatus === 'approved' || order.paymentStatus === 'refunded' ? 'i-lucide-undo-2' : (order.refundStatus === 'pending' ? 'i-lucide-hourglass' : 'i-lucide-minus-circle')"
                                class="w-3 h-3 mr-1"
                            ></i>
                            {{ t('console-coze-package-order.status.refund.' + (order.refundStatus || 'none')) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- 用户信息 -->
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-4">
                    <i class="i-lucide-user w-5 h-5 text-blue-600 dark:text-blue-400"></i>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {{ t('console-coze-package-order.detail.userInfo') }}
                    </h3>
                </div>
                
                <div class="grid grid-cols-1 gap-4" :class="{ 'sm:grid-cols-2': !isMobile, 'lg:grid-cols-2': isTablet }">
                    <!-- 用户名 -->
                    <div>
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {{ t('console-coze-package-order.detail.username') }}
                        </div>
                        <div class="flex items-center gap-2">
                            <img 
                                v-if="order.userInfo.avatar"
                                :src="order.userInfo.avatar" 
                                :alt="order.userInfo.username"
                                class="w-6 h-6 rounded-full"
                            >
                            <i v-else class="i-lucide-user-circle w-6 h-6 text-gray-400"></i>
                            <span class="font-medium text-gray-900 dark:text-gray-100">
                                {{ order.userInfo.username }}
                            </span>
                        </div>
                    </div>
                    
                    <!-- 邮箱 -->
                    <div v-if="order.userInfo.email">
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {{ t('console-coze-package-order.detail.email') }}
                        </div>
                        <div class="text-gray-900 dark:text-gray-100">
                            {{ order.userInfo.email }}
                        </div>
                    </div>
                    
                    <!-- 用户ID -->
                    <div>
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {{ t('console-coze-package-order.detail.userId') }}
                        </div>
                        <div class="font-mono text-sm text-gray-600 dark:text-gray-400">
                            {{ order.userInfo.id }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- 套餐信息 -->
            <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-4">
                    <i class="i-lucide-package w-5 h-5 text-green-600 dark:text-green-400"></i>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {{ t('console-coze-package-order.detail.packageInfo') }}
                    </h3>
                </div>
                
                <div class="grid grid-cols-1 gap-4" :class="{ 'sm:grid-cols-2': !isMobile, 'lg:grid-cols-2': isTablet }">
                    <!-- 套餐名称 -->
                    <div>
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {{ t('console-coze-package-order.list.packageName') }}
                        </div>
                        <div class="font-medium text-gray-900 dark:text-gray-100">
                            {{ order.packageInfo.name }}
                        </div>
                    </div>
                    
                    <!-- 套餐时长 -->
                    <div>
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {{ t('console-coze-package-order.list.packageDuration') }}
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="font-semibold text-green-600 dark:text-green-400">
                                {{ order.packageInfo.duration }}
                            </span>
                            <span class="text-sm text-gray-500 dark:text-gray-400">
                                {{ t('console-common.days') }}
                            </span>
                        </div>
                    </div>
                    
                    <!-- 套餐价格 -->
                    <div>
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {{ t('console-coze-package-order.list.packagePrice') }}
                        </div>
                        <div class="font-semibold text-green-600 dark:text-green-400">
                            {{ formatAmount(order.packageInfo.originalPrice) }}
                        </div>
                    </div>
                    

                </div>
            </div>

            <!-- 支付信息 -->
            <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-4">
                    <i class="i-lucide-credit-card w-5 h-5 text-purple-600 dark:text-purple-400"></i>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {{ t('console-coze-package-order.detail.paymentInfo') }}
                    </h3>
                </div>
                
                <div class="grid grid-cols-1 gap-4" :class="{ 'sm:grid-cols-2': !isMobile, 'lg:grid-cols-2': isTablet }">
                    <!-- 支付方式 -->
                    <div>
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {{ t('console-coze-package-order.list.payType') }}
                        </div>
                        <div class="flex items-center gap-2">
                            <i 
                                :class="order.paymentMethod === 'wechat' ? 'i-lucide-smartphone' : 'i-lucide-wallet'"
                                class="w-4 h-4 text-purple-600 dark:text-purple-400"
                            ></i>
                            <span class="text-gray-900 dark:text-gray-100">
                                {{ t('console-coze-package-order.paymentMethod.' + (order.paymentMethod || 'other')) }}
                            </span>
                        </div>
                    </div>
                    
                    <!-- 交易流水号 -->
                    <div v-if="order.transactionId">
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {{ t('console-coze-package-order.detail.transactionId') }}
                        </div>
                        <div class="font-mono text-sm text-gray-600 dark:text-gray-400">
                            {{ order.transactionId }}
                        </div>
                    </div>
                    
                    <!-- 退款金额 -->
                    <div v-if="order.refundAmount">
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {{ t('console-coze-package-order.detail.refundAmount') }}
                        </div>
                        <div class="font-mono text-sm text-red-600 dark:text-red-400">
                            {{ formatAmount(order.refundAmount) }}
                        </div>
                    </div>
                    
                    <!-- 订单来源 -->
                    <div v-if="order.orderSource">
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {{ t('console-coze-package-order.detail.orderSource') }}
                        </div>
                        <div class="text-gray-900 dark:text-gray-100">
                            {{ order.orderSource }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- 时间信息 -->
            <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-4">
                    <i class="i-lucide-clock w-5 h-5 text-orange-600 dark:text-orange-400"></i>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {{ t('console-coze-package-order.detail.timeInfo') }}
                    </h3>
                </div>
                
                <div class="grid grid-cols-1 gap-4" :class="{ 'sm:grid-cols-2': !isMobile, 'lg:grid-cols-2': isTablet }">
                    <!-- 创建时间 -->
                    <div>
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {{ t('console-coze-package-order.list.createdAt') }}
                        </div>
                        <div class="text-gray-900 dark:text-gray-100">
                            <TimeDisplay :datetime="order.createdAt" mode="datetime" />
                        </div>
                    </div>
                    
                    <!-- 支付时间 -->
                    <div v-if="order.paymentTime">
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {{ t('console-coze-package-order.detail.payTime') }}
                        </div>
                        <div class="text-gray-900 dark:text-gray-100">
                            <TimeDisplay :datetime="order.paymentTime" mode="datetime" />
                        </div>
                    </div>
                    
                    <!-- 退款时间 -->
                    <div v-if="order.refundTime">
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {{ t('console-coze-package-order.detail.refundTime') }}
                        </div>
                        <div class="text-red-600 dark:text-red-400">
                            <TimeDisplay :datetime="order.refundTime" mode="datetime" />
                        </div>
                    </div>
                    
                    <!-- 更新时间 -->
                    <div>
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {{ t('console-coze-package-order.detail.updatedAt') }}
                        </div>
                        <div class="text-gray-900 dark:text-gray-100">
                            <TimeDisplay :datetime="order.updatedAt" mode="datetime" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex items-center justify-end gap-3">
                <!-- 关闭按钮 -->
                <UButton
                    color="neutral"
                    variant="soft"
                    @click="handleClose"
                >
                    <template #leading>
                        <i class="i-lucide-x w-4 h-4"></i>
                    </template>
                    {{ t('console-common.close') }}
                </UButton>
            </div>
        </template>
    </ProModal>
</template>