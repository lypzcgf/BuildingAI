<script lang="ts" setup>
/**
 * 个人中心布局组件
 * @description 提供个人中心页面的通用布局，包括左侧导航栏和右侧内容区域
 */

import { computed, defineAsyncComponent } from "vue";

import type { NavigationConfig } from "@/app/console/decorate/layout/types";
import { apiGetWebLayoutConfig } from "@/services/web/decorate";
import type { IconType } from "@/types/icon";
const router = useRouter();
const { t } = useI18n();
const route = useRoute();

// 导航菜单项的类型定义
interface MenuItem {
    label: string;
    icon: IconType;
    children?: {
        label: string;
        icon: IconType;
        to: string;
        slot?: string;
    }[];
}

// 导航菜单项
const items = computed<MenuItem[]>(() => [
    {
        label: t("common.label.personalRights"),
        icon: "i-lucide-book-open",
        children: [
            {
                label: t("common.personalRights.rechargeCenter"),
                icon: "i-lucide-badge-dollar-sign",
                to: "/profile/personal-rights/recharge-center",
            },
            {
                label: t("console-common.cozePackageCenter"),
                icon: "i-lucide-package-open" as const,
                to: "/profile/personal-rights/coze-package-center",
            },
        ],
    },
    {
        label: t("common.label.profile"),
        icon: "i-lucide-book-open",
        children: [
            {
                label: t("common.profile.title"),
                icon: "i-lucide-user",
                to: "/profile",
            },
            {
                label: t("common.settings.mcpServer"),
                icon: {
                    type: "svg",
                    content: `<svg viewBox="0 0 195 195" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M25 97.8528L92.8823 29.9706C102.255 20.598 117.451 20.598 126.823 29.9706V29.9706C136.196 39.3431 136.196 54.5391 126.823 63.9117L75.5581 115.177" stroke="currentColor" stroke-width="12" stroke-linecap="round"/>
                        <path d="M76.2653 114.47L126.823 63.9117C136.196 54.5391 151.392 54.5391 160.765 63.9117L161.118 64.2652C170.491 73.6378 170.491 88.8338 161.118 98.2063L99.7248 159.6C96.6006 162.724 96.6006 167.789 99.7248 170.913L112.331 183.52" stroke="currentColor" stroke-width="12" stroke-linecap="round"/>
                        <path d="M109.853 46.9411L59.6482 97.1457C50.2757 106.518 50.2757 121.714 59.6482 131.087V131.087C69.0208 140.459 84.2168 140.459 93.5894 131.087L143.794 80.8822" stroke="currentColor" stroke-width="12" stroke-linecap="round"/>
                    </svg>`,
                },
                to: "/profile/mcp-server-settings",
            },
            {
                label: t("common.profile.purchaseRecord"),
                icon: "i-lucide-clock-8",
                to: "/profile/purchase-record",
            },
            {
                label: t("common.profile.powerDetail"),
                icon: "i-lucide-database-zap",
                to: "/profile/power-detail",
            },
            {
                label: t("common.settings.general"),
                icon: "i-lucide-settings-2",
                slot: "components" as const,
                to: "/profile/general-settings",
            },
        ],
    },
]);

const layoutToComponentMap: Record<string, string> = {
    "layout-1": "style1", // 顶部导航1 -> style1
    "layout-2": "style2", // 顶部导航2 -> style2
    "layout-3": "style3", // 顶部导航3 -> style3
    "layout-4": "style4", // 侧边导航1 -> style4
    "layout-5": "style5", // 侧边导航2 -> style5
};

const { data: layoutResponse } = await useAsyncData(
    "web-layout-config",
    () => apiGetWebLayoutConfig("web"),
    {
        // 默认配置
        default: () => ({
            code: 200,
            data: {
                layout: "layout-5",
                menus: [],
            },
            message: "success",
        }),
        server: import.meta.server,
    },
);

/** 响应式布局配置 */
const layoutConfig = computed(() => {
    return (
        layoutResponse.value?.data || {
            layout: "layout-5",
            menus: [],
        }
    );
});
/** 动态导入布局组件 */
const LayoutComponent = computed(() => {
    const componentName = layoutToComponentMap[layoutConfig.value.layout] || "style1";
    return defineAsyncComponent(() => import(`@/common/components/layout/${componentName}.vue`));
});

/** 构建导航配置 */
const navigationConfig = computed((): NavigationConfig => {
    return {
        items: layoutConfig.value.menus || [
            {
                id: "1",
                title: "首页",
                link: { path: "/" },
                icon: "i-lucide-home",
            },
            {
                id: "2",
                title: "用户",
                link: { path: "/profile" },
                icon: "i-lucide-user",
            },
        ],
    };
});

const pageTitle = ref(route.meta.title as string);

watch(
    () => route.meta.title,
    () => {
        pageTitle.value = route.meta.title as string;
    },
);
</script>

<template>
    <component :is="LayoutComponent" :navigation-config="navigationConfig" class="h-screen">
        <div class="container mx-auto flex h-full justify-between gap-12 py-8">
            <!-- 导航栏 -->
            <div
                class="bg-muted flex w-52 flex-col gap-2 rounded-lg p-4"
                :style="{
                    '--text-color-muted': 'var(--color-accent-foreground)',
                    '--text-color-dimmed': 'var(--color-accent-foreground)',
                }"
            >
                <div v-for="item in items" :key="item.label" class="flex flex-col gap-2">
                    <!-- 分组标题 -->
                    <div class="text-muted-foreground px-2 py-1 text-xs font-medium">
                        {{ item.label }}
                    </div>

                    <!-- 分组内的对话项 -->
                    <div class="flex flex-col gap-2">
                        <div
                            v-for="category in item.children"
                            :key="category.label"
                            class="group relative"
                        >
                            <UButton
                                :label="category.label"
                                :ui="{
                                    base: 'flex justify-between w-full gap-2 cursor-pointer relative pl-6 py-2',
                                }"
                                :variant="category.to === route.path ? 'soft' : 'ghost'"
                                :color="category.to === route.path ? 'primary' : 'neutral'"
                                @click="router.push(category.to)"
                            >
                                <template v-if="typeof category.icon === 'string'">
                                    <UIcon :name="category.icon" size="16" />
                                </template>
                                <template
                                    v-else-if="
                                        typeof category.icon === 'object' &&
                                        category.icon?.type === 'svg'
                                    "
                                >
                                    <div
                                        class="flex size-4 items-center justify-center"
                                        v-html="category.icon.content"
                                    ></div>
                                </template>
                                <span class="block flex-1 truncate text-left">
                                    {{ category.label }}
                                </span>
                            </UButton>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 内容区域 -->
            <div class="flex w-full flex-1 flex-col overflow-hidden">
                <!-- 返回按钮和标题 -->
                <div class="flex h-fit items-center gap-2 pb-4">
                    <UButton
                        variant="soft"
                        color="primary"
                        icon="i-heroicons-arrow-left"
                        @click="router.push('/')"
                    />
                    <h1 class="flex-1 pr-[36px] text-center text-xl font-semibold">
                        <slot name="page-title">{{ t(pageTitle) }}</slot>
                    </h1>
                </div>

                <!-- 页面内容插槽 -->
                <div class="flex-1 overflow-y-auto">
                    <slot />
                </div>
            </div>
        </div>
    </component>
</template>
