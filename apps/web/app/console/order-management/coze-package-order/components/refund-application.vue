<script setup lang="ts">
import { ProModal, useMessage, useModal } from "@fastbuildai/ui";
import { useBreakpoints } from "@vueuse/core";
import { useI18n } from "vue-i18n";

import type { CozePackageOrderDetail } from "@/models/coze-package-order";
import { apiCozePackageOrderRefund } from "@/services/console/coze-package-order";

const props = defineProps<{
    order?: CozePackageOrderDetail | null;
    visible: boolean;
}>();

const emits = defineEmits<{
    (e: "close"): void;
    (e: "success"): void;
}>();

const { t } = useI18n();
const toast = useMessage();

// 响应式断点
const { sm, md, lg, xl } = useBreakpoints();
const isMobile = computed(() => !sm.value);
const isTablet = computed(() => md.value && !lg.value);

// 表单数据
const formData = ref({
    refundReason: '',
    refundReasonOther: '',
    confirmRefund: false,
    agreeTerms: false,
});

// 加载状态
const submitting = ref(false);
const validating = ref(false);
const formLoading = ref(false);
const formError = ref('');

// 退款原因选项
const refundReasons = [
    {
        value: 'user_request',
        label: '用户主动申请退款',
        description: '用户因个人原因申请退款',
        icon: 'i-lucide-user-x',
        color: 'blue'
    },
    {
        value: 'service_issue',
        label: '服务质量问题',
        description: '服务未达到预期效果或存在质量问题',
        icon: 'i-lucide-alert-triangle',
        color: 'orange'
    },
    {
        value: 'technical_issue',
        label: '技术故障',
        description: '系统技术故障导致服务无法正常使用',
        icon: 'i-lucide-bug',
        color: 'red'
    },
    {
        value: 'duplicate_payment',
        label: '重复支付',
        description: '用户重复支付同一订单',
        icon: 'i-lucide-copy',
        color: 'purple'
    },
    {
        value: 'policy_violation',
        label: '违反平台政策',
        description: '订单内容违反平台使用政策',
        icon: 'i-lucide-shield-alert',
        color: 'yellow'
    },
    {
        value: 'other',
        label: '其他原因',
        description: '其他未列出的退款原因',
        icon: 'i-lucide-more-horizontal',
        color: 'gray'
    }
];

// 表单验证规则
const formErrors = ref<Record<string, string>>({});
const businessRuleErrors = ref<string[]>([]);

// 业务规则检查
const validateBusinessRules = () => {
    businessRuleErrors.value = [];
    
    if (!props.order) return false;
    
    // 检查订单状态
    if (props.order.payStatus !== 1) {
        businessRuleErrors.value.push('只有已支付的订单才能申请退款');
    }
    
    // 检查是否已经退款
    if (props.order.refundStatus === 1) {
        businessRuleErrors.value.push('该订单已经退款，无法重复申请');
    }
    
    // 检查订单时间（例如：超过30天不能退款）
    if (props.order.payTime) {
        const payDate = new Date(props.order.payTime);
        const now = new Date();
        const diffDays = Math.ceil((now.getTime() - payDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 30) {
            businessRuleErrors.value.push('订单支付超过30天，无法申请退款');
        }
    }
    
    // 检查套餐使用情况（如果有使用记录，可能需要特殊处理）
    if (props.order.packageDays && props.order.packageDays > 0) {
        // 这里可以添加更复杂的使用情况检查
        // 例如：检查套餐是否已经开始使用
    }
    
    return businessRuleErrors.value.length === 0;
};

const validateForm = () => {
    formErrors.value = {};
    let isValid = true;

    // 业务规则检查
    if (!validateBusinessRules()) {
        isValid = false;
    }

    // 验证退款原因
    if (!formData.value.refundReason) {
        formErrors.value.refundReason = '请选择退款原因';
        isValid = false;
    }

    // 验证其他原因的详细说明
    if (formData.value.refundReason === 'other' && !formData.value.refundReasonOther.trim()) {
        formErrors.value.refundReasonOther = '请详细说明其他退款原因';
        isValid = false;
    }

    // 验证退款确认
    if (!formData.value.confirmRefund) {
        formErrors.value.confirmRefund = '请确认退款操作';
        isValid = false;
    }

    // 验证条款同意
    if (!formData.value.agreeTerms) {
        formErrors.value.agreeTerms = '请同意退款条款';
        isValid = false;
    }

    return isValid;
};

// 获取退款原因显示文本
const getRefundReasonText = () => {
    const reason = refundReasons.find(r => r.value === formData.value.refundReason);
    if (!reason) return '';
    
    if (reason.value === 'other' && formData.value.refundReasonOther) {
        return `${reason.label}: ${formData.value.refundReasonOther}`;
    }
    
    return reason.label;
};

// 计算退款金额
const refundAmount = computed(() => {
    if (!props.order) return 0;
    return props.order.orderAmount;
});

// 格式化金额
const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY",
    }).format(amount);
};

// 提交退款申请
const submitRefund = async () => {
    if (!props.order?.id) return;
    
    validating.value = true;
    
    // 表单验证
    if (!validateForm()) {
        validating.value = false;
        toast.error('请完善表单信息');
        return;
    }
    
    try {
        // 最终确认弹窗
        await useModal({
            title: '确认退款申请',
            description: `确定要为订单 ${props.order.orderNo} 申请退款 ${formatAmount(refundAmount.value)} 吗？此操作不可撤销。`,
            color: "warning",
        });
        
        submitting.value = true;
        
        // 调用退款API
        await apiCozePackageOrderRefund({ 
            orderId: props.order.id,
            refundReason: getRefundReasonText(),
        });
        
        toast.success('退款申请提交成功');
        emits("success");
        handleClose();
        
    } catch (error) {
        console.error("Refund application error:", error);
        toast.error('退款申请提交失败，请重试');
    } finally {
        submitting.value = false;
        validating.value = false;
    }
};

// 关闭弹窗
const handleClose = () => {
    // 重置表单
    formData.value = {
        refundReason: '',
        refundReasonOther: '',
        confirmRefund: false,
        agreeTerms: false,
    };
    formErrors.value = {};
    emits("close");
};

// 监听退款原因变化，清除其他原因的错误
watch(() => formData.value.refundReason, (newValue) => {
    if (newValue !== 'other') {
        formData.value.refundReasonOther = '';
        delete formErrors.value.refundReasonOther;
    }
    delete formErrors.value.refundReason;
});

// 监听确认状态变化
watch(() => formData.value.confirmRefund, () => {
    delete formErrors.value.confirmRefund;
});

watch(() => formData.value.agreeTerms, () => {
    delete formErrors.value.agreeTerms;
});

// 监听订单数据变化，重新进行业务规则检查
watch(() => props.order, () => {
    formError.value = '';
    if (props.order) {
        validateBusinessRules();
    }
}, { immediate: true });

// 重新加载表单
const reloadForm = () => {
    formError.value = '';
    formLoading.value = false;
    if (props.order) {
        validateBusinessRules();
    }
};
</script>

<template>
    <ProModal 
        :model-value="visible" 
        @update:model-value="handleClose"
        :size="isMobile ? 'full' : 'xl'"
        :width="isMobile ? '100vw' : '900px'"
        :height="isMobile ? '100vh' : 'auto'"
        :padding="isMobile ? '16px' : '24px'"
        :title="t('console-coze-package-order.refund.title')"
        :closable="!submitting"
    >
        <!-- 表单加载状态 -->
        <div v-if="formLoading" class="flex items-center justify-center py-12">
            <div class="flex flex-col items-center gap-3">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ t('console-common.loading') }}
                </p>
            </div>
        </div>

        <!-- 表单错误状态 -->
        <div v-else-if="formError" class="flex items-center justify-center py-12">
            <div class="text-center">
                <i class="i-lucide-alert-circle w-12 h-12 text-red-500 mx-auto mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {{ t('console-common.error.title') }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {{ formError || t('console-common.error.unknown') }}
                </p>
                <button
                    @click="reloadForm"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <i class="i-lucide-refresh-cw w-4 h-4"></i>
                    {{ t('console-common.retry') }}
                </button>
            </div>
        </div>

        <!-- 无订单数据状态 -->
        <div v-else-if="!order" class="flex items-center justify-center py-12">
            <div class="text-center">
                <i class="i-lucide-file-x w-12 h-12 text-gray-400 mx-auto mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {{ t('console-common.noData') }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ t('console-coze-package-order.refund.noOrder') }}
                </p>
            </div>
        </div>

        <!-- 退款申请表单 -->
        <div v-else class="space-y-6">
            <!-- 业务规则检查错误提示 -->
            <div v-if="businessRuleErrors.length > 0" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div class="flex items-start gap-2">
                    <i class="i-lucide-x-circle w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"></i>
                    <div>
                        <h4 class="font-medium text-red-800 dark:text-red-200 mb-2">无法申请退款</h4>
                        <ul class="text-sm text-red-700 dark:text-red-300 space-y-1">
                            <li v-for="error in businessRuleErrors" :key="error">• {{ error }}</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- 订单信息概览 -->
            <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-3">
                    <i class="i-lucide-info w-5 h-5 text-blue-600 dark:text-blue-400"></i>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        退款订单信息
                    </h3>
                </div>
                
                <div class="grid grid-cols-1 gap-4 text-sm" :class="{ 'sm:grid-cols-2': !isMobile, 'lg:grid-cols-2': isTablet }">
                    <div>
                        <span class="text-gray-500 dark:text-gray-400">订单编号：</span>
                        <span class="font-mono font-medium text-gray-900 dark:text-gray-100">{{ order.orderNo }}</span>
                    </div>
                    <div>
                        <span class="text-gray-500 dark:text-gray-400">套餐名称：</span>
                        <span class="font-medium text-gray-900 dark:text-gray-100">{{ order.packageName }}</span>
                    </div>
                    <div>
                        <span class="text-gray-500 dark:text-gray-400">订单金额：</span>
                        <span class="font-semibold text-green-600 dark:text-green-400">{{ formatAmount(order.orderAmount) }}</span>
                    </div>
                    <div>
                        <span class="text-gray-500 dark:text-gray-400">用户：</span>
                        <span class="font-medium text-gray-900 dark:text-gray-100">{{ order.user.username }}</span>
                    </div>
                    <div>
                        <span class="text-gray-500 dark:text-gray-400">{{ t('console-coze-package-order.list.payStatus') }}：</span>
                        <span class="font-medium" :class="order.payStatus === 1 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                            {{ order.payStatus === 1 ? t('console-coze-package-order.list.paid') : t('console-coze-package-order.list.unpaid') }}
                        </span>
                    </div>
                    <div>
                        <span class="text-gray-500 dark:text-gray-400">{{ t('console-coze-package-order.list.refundStatus') }}：</span>
                        <span class="font-medium" :class="order.refundStatus === 1 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'">
                            {{ order.refundStatus === 1 ? t('console-coze-package-order.list.refunded') : t('console-coze-package-order.list.notRefunded') }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- 退款原因选择 -->
            <div class="space-y-4">
                <div class="flex items-center gap-2">
                    <i class="i-lucide-help-circle w-5 h-5 text-orange-600 dark:text-orange-400"></i>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        选择退款原因 <span class="text-red-500">*</span>
                    </h3>
                </div>
                
                <div class="grid grid-cols-1 gap-3" :class="{ 'sm:grid-cols-2': !isMobile, 'lg:grid-cols-2': isTablet }">
                    <div
                        v-for="reason in refundReasons"
                        :key="reason.value"
                        class="relative"
                    >
                        <input
                            :id="`reason-${reason.value}`"
                            v-model="formData.refundReason"
                            :value="reason.value"
                            type="radio"
                            class="sr-only peer"
                        />
                        <label
                            :for="`reason-${reason.value}`"
                            class="flex items-start gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/20"
                            :class="{ 'border-red-300 dark:border-red-600': formErrors.refundReason }"
                        >
                            <div class="flex-shrink-0 mt-0.5">
                                <i 
                                    :class="[reason.icon, `text-${reason.color}-600 dark:text-${reason.color}-400`]"
                                    class="w-5 h-5"
                                ></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="font-medium text-gray-900 dark:text-gray-100">
                                    {{ reason.label }}
                                </div>
                                <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {{ reason.description }}
                                </div>
                            </div>
                            <div class="flex-shrink-0">
                                <div class="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-full peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-all duration-200">
                                    <div class="w-2 h-2 bg-white rounded-full m-0.5 opacity-0 peer-checked:opacity-100 transition-opacity duration-200"></div>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
                
                <div v-if="formErrors.refundReason" class="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <i class="i-lucide-alert-circle w-4 h-4"></i>
                    {{ formErrors.refundReason }}
                </div>
            </div>

            <!-- 其他原因详细说明 -->
            <div v-if="formData.refundReason === 'other'" class="space-y-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    详细说明 <span class="text-red-500">*</span>
                </label>
                <UTextarea
                    v-model="formData.refundReasonOther"
                    placeholder="请详细说明退款原因..."
                    rows="4"
                    :class="{ 'border-red-300 dark:border-red-600': formErrors.refundReasonOther }"
                />
                <div v-if="formErrors.refundReasonOther" class="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <i class="i-lucide-alert-circle w-4 h-4"></i>
                    {{ formErrors.refundReasonOther }}
                </div>
            </div>

            <!-- 退款金额确认 -->
            <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-2">
                    <i class="i-lucide-coins w-5 h-5 text-yellow-600 dark:text-yellow-400"></i>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        退款金额确认
                    </h3>
                </div>
                <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {{ formatAmount(refundAmount) }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    退款将原路返回到用户的支付账户，预计1-3个工作日到账
                </div>
            </div>

            <!-- 确认选项 -->
            <div class="space-y-4">
                <div class="flex items-start gap-3">
                    <UCheckbox
                        v-model="formData.confirmRefund"
                        :class="{ 'text-red-600': formErrors.confirmRefund }"
                    />
                    <div class="flex-1">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                            我确认要为此订单申请退款 <span class="text-red-500">*</span>
                        </label>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            退款申请提交后将立即处理，无法撤销
                        </div>
                    </div>
                </div>
                
                <div v-if="formErrors.confirmRefund" class="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 ml-7">
                    <i class="i-lucide-alert-circle w-4 h-4"></i>
                    {{ formErrors.confirmRefund }}
                </div>

                <div class="flex items-start gap-3">
                    <UCheckbox
                        v-model="formData.agreeTerms"
                        :class="{ 'text-red-600': formErrors.agreeTerms }"
                    />
                    <div class="flex-1">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                            我已阅读并同意 <a href="#" class="text-blue-600 dark:text-blue-400 hover:underline">退款条款</a> <span class="text-red-500">*</span>
                        </label>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            包括退款处理时间、退款方式等相关条款
                        </div>
                    </div>
                </div>
                
                <div v-if="formErrors.agreeTerms" class="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 ml-7">
                    <i class="i-lucide-alert-circle w-4 h-4"></i>
                    {{ formErrors.agreeTerms }}
                </div>
            </div>

            <!-- 风险提示 -->
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div class="flex items-start gap-2">
                    <i class="i-lucide-alert-triangle w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"></i>
                    <div>
                        <h4 class="font-medium text-red-800 dark:text-red-200 mb-2">重要提示</h4>
                        <ul class="text-sm text-red-700 dark:text-red-300 space-y-1">
                            <li>• 退款申请提交后将立即处理，无法撤销</li>
                            <li>• 退款金额将原路返回到用户的支付账户</li>
                            <li>• 退款处理时间为1-3个工作日</li>
                            <li>• 退款完成后，用户将无法继续使用该套餐服务</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex items-center justify-end gap-3">
                <!-- 取消按钮 -->
                <UButton
                    color="neutral"
                    variant="soft"
                    :disabled="submitting"
                    @click="handleClose"
                >
                    <template #leading>
                        <i class="i-lucide-x w-4 h-4"></i>
                    </template>
                    取消
                </UButton>
                
                <!-- 提交退款申请按钮 -->
                <UButton
                    color="red"
                    :loading="submitting || validating"
                    :disabled="businessRuleErrors.length > 0 || !formData.refundReason || !formData.confirmRefund || !formData.agreeTerms"
                    @click="submitRefund"
                >
                    <template #leading>
                        <i class="i-lucide-undo-2 w-4 h-4"></i>
                    </template>
                    {{ 
                        businessRuleErrors.length > 0 ? '无法申请退款' :
                        submitting ? '提交中...' : 
                        validating ? '验证中...' : 
                        '提交退款申请' 
                    }}
                </UButton>
            </div>
        </template>
    </ProModal>
</template>