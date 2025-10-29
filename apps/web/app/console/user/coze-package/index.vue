<script setup lang="ts">
import { useMessage } from "@fastbuildai/ui";
import type { TableColumn } from "@nuxt/ui";
import { useI18n } from "vue-i18n";

import type { CozePackageConfigData, CozePackageRule } from "@/models/coze-package";
import { 
    apiGetCozePackageConfig, 
    apiSaveCozePackageConfig
} from "@/services/console/coze-package.service";

const { t } = useI18n();
const toast = useMessage();

// 响应式数据
const loading = ref(false);
const saveLoading = ref(false);
const cozePackageStatus = ref(true);
const changeValue = ref(false);
const cozePackageRules = ref<CozePackageRule[]>([]);
const cozePackageExplain = ref("");

// 存储原始数据用于比较变化
const originalData = ref<CozePackageConfigData>();

// 表格列定义
const columns: TableColumn<CozePackageRule>[] = [
  {
    id: "move",
    header: "#",
    size: 40,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "name",
    accessorKey: "name",
    header: t('console-coze-package.table.name'),
  },
  {
    id: "duration",
    accessorKey: "duration",
    header: t('console-coze-package.table.duration'),
  },
  {
    id: "originalPrice",
    accessorKey: "originalPrice",
    header: t('console-coze-package.table.originalPrice'),
  },
  {
    id: "currentPrice",
    accessorKey: "currentPrice",
    header: t('console-coze-package.table.currentPrice'),
  },
  {
    id: "description",
    accessorKey: "description",
    header: t('console-coze-package.table.description'),
  },
  {
    id: "actions",
    header: t('console-coze-package.table.action'),
    size: 40,
    enableSorting: false,
    enableHiding: false,
  }
];

// 判断套餐规则是否变化
const isEqual = (arr1: CozePackageRule[], arr2: CozePackageRule[] | undefined) => {
    if (!arr2) return false;
    if (arr1.length !== arr2.length) return false;
    return arr1.every((item, index) => {
        const oldItem = arr2[index];
        return (
            item?.name === oldItem?.name &&
            item?.duration === oldItem?.duration &&
            item?.originalPrice === oldItem?.originalPrice &&
            item?.currentPrice === oldItem?.currentPrice &&
            item?.description === oldItem?.description
        );
    });
};

// 获取配置数据
const getCozePackageConfig = async () => {
  try {
    loading.value = true;
    const data = await apiGetCozePackageConfig();
    
    cozePackageStatus.value = data.cozePackageStatus;
    cozePackageExplain.value = data.cozePackageExplain;
    cozePackageRules.value = data.cozePackageRule || [];
    
    // 保存原始数据用于比较
    originalData.value = JSON.parse(JSON.stringify(data));
    changeValue.value = false;
  } catch (error) {
    console.error('获取配置失败:', error);
    toast.error(t('console-coze-package.message.getConfigFailed'));
  } finally {
    loading.value = false;
  }
};

// 添加新行
const addRow = () => {
    const newRow: CozePackageRule = {
        name: "",
        duration: 1,
        originalPrice: 0,
        currentPrice: 0,
        description: "",
    };
    cozePackageRules.value.push(newRow);
};

// 删除行
const deleteRow = (row: CozePackageRule) => {
    cozePackageRules.value = cozePackageRules.value.filter((item) => item !== row);
};

// 保存配置
const saveConfig = async () => {
    try {
        saveLoading.value = true;
        await apiSaveCozePackageConfig({
            cozePackageStatus: cozePackageStatus.value,
            cozePackageExplain: cozePackageExplain.value,
            cozePackageRule: cozePackageRules.value
        });
        await getCozePackageConfig();
        toast.success(t('console-coze-package.message.saveSuccess'));
    } catch (error) {
        console.error('保存失败:', error);
        toast.error(t('console-coze-package.message.saveFailed'));
    } finally {
        saveLoading.value = false;
    }
};

// 监听数据变化
watch(cozePackageStatus, () => {
    if (cozePackageStatus.value !== originalData.value?.cozePackageStatus) {
        changeValue.value = true;
    } else {
        changeValue.value = false;
    }
});

watch(cozePackageExplain, () => {
    if (cozePackageExplain.value !== originalData.value?.cozePackageExplain) {
        changeValue.value = true;
    } else {
        changeValue.value = false;
    }
});

watch(
    cozePackageRules,
    () => {
        if (!isEqual(cozePackageRules.value, originalData.value?.cozePackageRule)) {
            changeValue.value = true;
        } else {
            changeValue.value = false;
        }
    },
    { deep: true }
);

// 页面挂载时获取数据
onMounted(() => {
    getCozePackageConfig();
});
</script>

<template>
    <div class="my-px space-y-4 pb-6">
        <div class="flex flex-col gap-6">
            <!-- 功能状态管理 -->
            <div class="">
                <div>
                    <div class="mb-4 flex flex-col gap-1">
                        <div class="text-secondary-foreground text-md font-bold">
                            {{ $t("console-coze-package.status.title") }}
                        </div>
                        <div class="text-muted-foreground text-xs">
                            {{ $t("console-coze-package.status.description") }}
                        </div>
                    </div>
                    <USwitch v-model="cozePackageStatus" />
                </div>
            </div>

            <!-- 套餐说明 -->
            <div v-if="cozePackageStatus">
                <div class="mb-4 flex flex-col gap-1">
                    <div class="text-secondary-foreground text-md font-bold">
                        {{ $t("console-coze-package.explain.title") }}
                    </div>
                    <div class="text-muted-foreground text-xs">
                        {{ $t("console-coze-package.explain.description") }}
                    </div>
                </div>
                <div class="w-full text-sm">
                    <UTextarea
                        v-model="cozePackageExplain"
                        class="w-full"
                        :rows="6"
                        :placeholder="$t('console-coze-package.explain.placeholder')"
                    />
                </div>
            </div>

            <!-- 套餐规则管理 -->
            <div v-if="cozePackageStatus" class="flex-1">
                <div class="flex w-full items-center justify-between">
                    <div class="text-secondary-foreground text-md font-bold">
                        {{ $t("console-coze-package.rules.title") }}
                    </div>
                    <div class="flex items-center justify-between gap-2 px-4">
                        <UButton
                            color="primary"
                            variant="outline"
                            icon="tabler:plus"
                            :ui="{ leadingIcon: 'size-4' }"
                            @click="addRow"
                        >
                            {{ $t("console-coze-package.button.new") }}
                        </UButton>
                    </div>
                </div>

                <!-- 套餐规则表格 -->
                <div class="mt-4">
                    <UTable
                        :data="cozePackageRules"
                        :columns="columns"
                        :ui="{
                            base: 'table-fixed border-separate border-spacing-0',
                            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                            tbody: '[&>tr]:last:[&>td]:border-b-0',
                            th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                            td: 'border-b border-default',
                            tr: '[&:has(>td[colspan])]:hidden',
                        }"
                    >
                        <!-- 序号列 -->
                        <template #move-cell="{ row }">
                            <div class="flex items-center justify-center">
                                <span class="text-muted-foreground text-sm">{{ row.index + 1 }}</span>
                            </div>
                        </template>

                        <!-- 套餐名称列 -->
                        <template #name-cell="{ row }">
                            <UInput
                                v-model="row.original.name"
                                :placeholder="t('console-coze-package.table.namePlaceholder')"
                                size="sm"
                                class="min-w-32"
                            />
                        </template>

                        <!-- 套餐时长列 -->
                        <template #duration-cell="{ row }">
                            <UInput
                                v-model.number="row.original.duration"
                                type="number"
                                :placeholder="t('console-coze-package.table.durationPlaceholder')"
                                size="sm"
                                class="min-w-24"
                                :min="1"
                                :ui="{
                                    trailing:
                                        'bg-muted-foreground/15 pl-2 rounded-tr-lg rounded-br-lg',
                                }"
                            >
                                <template #trailing>
                                    <span>{{ t('console-coze-package.table.durationUnit') }}</span>
                                </template>
                            </UInput>
                        </template>

                        <!-- 套餐原价列 -->
                        <template #originalPrice-cell="{ row }">
                            <UInput
                                v-model.number="row.original.originalPrice"
                                type="number"
                                :placeholder="t('console-coze-package.table.originalPricePlaceholder')"
                                size="sm"
                                class="min-w-24"
                                :min="0"
                                :step="0.01"
                                :ui="{
                                    trailing:
                                        'bg-muted-foreground/15 pl-2 rounded-tr-lg rounded-br-lg',
                                }"
                            >
                                <template #trailing>
                                    <span>{{ t('console-coze-package.table.priceUnit') }}</span>
                                </template>
                            </UInput>
                        </template>

                        <!-- 套餐现价列 -->
                        <template #currentPrice-cell="{ row }">
                            <UInput
                                v-model.number="row.original.currentPrice"
                                type="number"
                                :placeholder="t('console-coze-package.table.currentPricePlaceholder')"
                                size="sm"
                                class="min-w-24"
                                :min="0"
                                :step="0.01"
                                :ui="{
                                    trailing:
                                        'bg-muted-foreground/15 pl-2 rounded-tr-lg rounded-br-lg',
                                }"
                            >
                                <template #trailing>
                                    <span>{{ t('console-coze-package.table.priceUnit') }}</span>
                                </template>
                            </UInput>
                        </template>

                        <!-- 套餐说明列 -->
                        <template #description-cell="{ row }">
                            <UInput
                                v-model="row.original.description"
                                :placeholder="t('console-coze-package.table.descriptionPlaceholder')"
                                size="sm"
                                class="min-w-40"
                            />
                        </template>

                        <!-- 操作列 -->
                        <template #actions-cell="{ row }">
                            <div class="flex items-center gap-2">
                                <UButton
                                    color="red"
                                    variant="ghost"
                                    icon="tabler:trash"
                                    size="sm"
                                    @click="deleteRow(row.original)"
                                />
                            </div>
                        </template>
                    </UTable>
                </div>
            </div>

            <!-- 保存按钮 -->
            <div class="flex justify-end">
                <AccessControl :codes="['coze-package:setConfig']">
                    <UButton
                        color="primary"
                        :disabled="!changeValue"
                        :ui="{ base: 'w-16 flex justify-center items-center' }"
                        @click="saveConfig"
                        :loading="saveLoading"
                    >
                        {{ t("console-coze-package.button.save") }}
                    </UButton>
                </AccessControl>
            </div>
        </div>
    </div>
</template>