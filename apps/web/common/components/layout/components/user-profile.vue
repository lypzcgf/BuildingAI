<script lang="ts" setup>
import type { PopoverContentProps } from "reka-ui";
import { useUserStore } from "@/common/stores/user";
import { useControlsStore } from "@/common/stores/controls";
import { computed } from "vue";


interface MenuItem {
    id: number;
    icon: string;
    title: string;
    path?: string;
    target?: string;
    click?: () => void;
}

const props = withDefaults(
    defineProps<{
        size?: "3xs" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
        collapsed?: boolean;
        content?: PopoverContentProps;
    }>(),
    {
        size: "md",
        collapsed: false,
    },
);

const { t } = useI18n();
const userStore = useUserStore();
const controlStore = useControlsStore();
const router = useRouter();

// 使用Coze套餐组合式函数


const isOpen = ref<boolean>(false);

// 快捷操作菜单
const quickActions = ref<MenuItem[]>([
    {
        id: 1,
        icon: "i-lucide-settings",
        title: "common.menu.system",
        click: () => router.push("/profile/general-settings"),
    },
    {
        id: 2,
        title: "menu.powerDetail",
        icon: "i-lucide-database-zap",
        click: () => router.push("/profile/power-detail"),
    },
    {
        id: 3,
        title: "login.userAgreement",
        icon: "i-lucide-file-text",
        target: "_blank",
        path: "/agreement?type=agreement&item=service",
    },
    {
        id: 4,
        title: "login.privacyPolicy",
        icon: "i-lucide-shield-check",
        target: "_blank",
        path: "/agreement?type=agreement&item=privacy",
    },
    {
        id: 5,
        title: "common.menu.cozePackage",
        icon: "i-lucide-package",
        click: () => router.push("/profile/coze-package"),
    },
]);

/**
 * 处理菜单点击事件
 */
const handleMenuClick = (item: MenuItem) => {
    if (item.click) {
        item.click();
    } else if (item.path) {
        if (item.target === "_blank") {
            window.open(item.path, "_blank");
        } else {
            navigateTo(item.path);
        }
    }
    isOpen.value = false;
};

watch(isOpen, (open) => {
    // 弹层打开后可根据需要触发其他刷新逻辑
});

const cozePackageStatusColor = computed(() => {
  const pkg = userStore.userInfo?.cozePackage;
  if (!pkg) return 'border-gray-200 bg-gray-50';
  switch (pkg.status) {
    case 'active':
      return 'border-green-200 bg-green-50';
    case 'expired':
      return 'border-red-200 bg-red-50';
    case 'frozen':
      return 'border-orange-200 bg-orange-50';
    default:
      return 'border-gray-200 bg-gray-50';
  }
});
</script>

<template>
    <UPopover
        v-if="userStore.isLogin"
        v-model:open="isOpen"
        class="flex"
        mode="click"
        :ui="{ content: 'rounded-2xl' }"
        :content="content"
        :close-delay="300"
    >
        <slot>
            <div
                class="hover:bg-muted flex items-center gap-1 rounded-lg p-1.5"
                :class="{ 'p-3': !collapsed }"
                v-ripple
            >
                <div class="flex flex-1 items-center justify-center gap-2">
                    <UChip color="success" inset>
                        <UAvatar
                            :src="userStore.userInfo?.avatar"
                            :alt="userStore.userInfo?.nickname"
                            :icon="userStore.userInfo?.nickname ? 'tabler:user' : undefined"
                            :size="size"
                            :ui="{ root: 'rounded-lg' }"
                        />
                    </UChip>
                    <div v-if="!collapsed" class="flex w-[100px] flex-col">
                        <span class="truncate text-sm font-medium">
                            {{ userStore.userInfo?.nickname }}
                        </span>
                        <span class="text-secondary-foreground truncate text-xs">
                            {{ userStore.userInfo?.email || userStore.userInfo?.phone }}
                        </span>
                    </div>
                </div>

                <div v-if="!collapsed">
                    <UButton
                        icon="i-lucide-chevrons-up-down"
                        color="neutral"
                        variant="link"
                        :ui="{ leadingIcon: 'size-4' }"
                    />
                </div>
            </div>
        </slot>

        <template #content>
            <div class="p-3">
                <!-- 用户信息区域 -->
                <div
                    class="hover:bg-muted flex cursor-pointer items-center gap-4 rounded-lg p-3"
                    @click="navigateTo('/profile')"
                >
                    <UAvatar
                        :src="userStore.userInfo?.avatar"
                        alt="Avatar"
                        size="md"
                        img-class="bg-foreground/30"
                    />
                    <div class="flex flex-col">
                        <span class="max-w-32 truncate text-sm">
                            {{ userStore.userInfo?.nickname }}
                        </span>
                        <span class="text-foreground/60 max-w-32 truncate text-xs">
                            {{ userStore.userInfo?.username }}
                        </span>
                    </div>
                    <UIcon
                        name="i-lucide-chevron-right"
                        class="text-foreground/60 ml-auto"
                        size="20"
                    />
                </div>

                <div class="bg-primary/10 mt-4 flex items-center justify-between rounded-xl p-3">
                    <div class="flex items-center gap-2 text-sm">
                        <span class="font-medium">{{ t("console-common.power") }}:</span>
                        <span class="text-primary">{{ userStore.userInfo?.power }}</span>
                    </div>
                    <UButton
                        size="xs"
                        @click="navigateTo('/profile/personal-rights/recharge-center')"
                    >
                        {{ t("console-common.recharge") }}
                    </UButton>
                </div>

                <!-- Coze套餐信息区域 -->
                <div class="mt-3 flex items-center justify-between rounded-xl border p-3" :class="cozePackageStatusColor">
                    <div class="flex items-center gap-2 text-sm">
                        <UIcon name="i-lucide-package" class="size-4" />
                        <span class="font-medium">{{ t("console-common.cozePackage") }}:</span>
                        <div class="flex items-center gap-1">
                            <template v-if="userStore.userInfo?.cozePackage">
                                <span class="font-medium">{{ userStore.userInfo.cozePackage.packageName }}</span>
                                <span class="text-xs">（{{ t('console-common.remainingDaysPrefix') }} {{ userStore.userInfo.cozePackage.remainingDays }}{{ t('console-common.dayUnit') }}）</span>
                            </template>
                            <template v-else>
                                <span class="text-muted-foreground text-xs">{{ t("console-common.noPackage") }}</span>
                                <span class="text-xs">（{{ t('console-common.remainingDaysPrefix') }} 0{{ t('console-common.dayUnit') }}）</span>
                            </template>
                        </div>
                    </div>
                    <UButton
                        size="xs"
                        variant="outline"
                        @click="navigateTo('/profile/coze-package')"
                    >
                        {{ t("console-common.cozePackageCenter") }}
                    </UButton>
                </div>

                <!-- 快捷操作菜单 -->
                <div class="mt-4 grid w-72 grid-cols-4 gap-6">
                    <div
                        v-for="item in quickActions"
                        :key="item.id"
                        class="group flex w-full flex-1 cursor-pointer flex-col items-center gap-2"
                        @click="handleMenuClick(item)"
                    >
                        <div
                            class="bg-foreground/5 hover:bg-foreground/10 active:bg-foreground/15 flex h-8 w-8 items-center justify-center rounded-full"
                            v-ripple
                        >
                            <UIcon :name="item.icon" />
                        </div>
                        <p class="max-w-full truncate text-center text-xs">{{ t(item.title) }}</p>
                    </div>
                </div>

                <USeparator class="py-4" />

                <!-- 底部操作区 -->
                <div class="flex justify-between">
                    <!-- 退出登录 -->
                    <div
                        class="flex cursor-pointer items-center gap-1 rounded-md px-2 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                        v-ripple
                        @click="userStore.logout()"
                    >
                        <UIcon name="i-lucide-log-out" size="18" />
                        <p class="select-none">
                            {{ t("console-common.logout") }}
                        </p>
                    </div>

                    <!-- 主题切换 -->
                    <ThemeToggle />
                </div>
            </div>
        </template>
    </UPopover>
    <div v-else class="flex items-center gap-1 rounded-lg" @click="navigateTo('/login')">
        <UAvatar icon="i-lucide-user" alt="未登录" :size="size" :ui="{ root: 'rounded-lg' }" />
    </div>
</template>
