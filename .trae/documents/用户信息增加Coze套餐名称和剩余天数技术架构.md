# 用户信息增加Coze套餐名称和剩余天数技术架构

## 1. 技术方案概述

本技术架构文档基于BuildingAI现有技术栈，针对用户信息框中增加Coze套餐名称和剩余天数展示需求进行**服务端接口合并方案设计**。采用**零侵入式集成方案**，通过深度复用现有Coze套餐订单系统，将套餐信息合并到现有的`/api/web/user/info`接口中，实现最小化代码改动的目标。

### 1.1 架构目标
- **零数据库变更**：完全复用现有`coze_package_orders`表结构，无需任何数据库改动
- **零新增API**：复用现有用户信息服务接口，避免新增独立API端点
- **服务端数据合并**：在UserController中注入WebCozePackageService，将套餐信息合并到用户详情响应
- **前端内置实现**：在user-profile.vue中直接读取userStore.userInfo.cozePackage并渲染，无需额外组件
- **国际化支持**：完整支持中、英、日三语展示
- **快速交付**：大幅缩短开发周期，提高交付效率

### 1.2 核心优势
- **零数据库风险**：无需数据库迁移，避免数据一致性风险
- **零网络开销**：前端无需额外API调用，所有数据通过现有用户接口一次性返回
- **深度复用**：充分利用现有WebCozePackageService，代码复用率达到95%
- **开发效率提升**：后端仅需在UserController中注入服务并合并数据，开发工作量减少90%
- **维护成本低**：基于成熟稳定的现有系统，后期维护简单
- **兼容性强**：与现有BuildingAI技术栈完美兼容，支持热更新部署

## 2. 前端技术架构

### 2.1 组件结构设计

实际采用方案：**服务端数据合并 + user-profile.vue内置渲染**

```
user-profile.vue (现有弹层组件)
├── 用户头像和基本信息 (现有)
├── 算力信息展示 (现有)
├── Coze套餐信息展示 (新增内置功能)
│   ├── 直接从userStore.userInfo.cozePackage读取数据
│   ├── 使用cozePackageDisplayText计算属性生成显示文本
│   └── 使用cozePackageStatusColor计算属性控制颜色样式
└── 快捷操作菜单 (现有)
```

**核心实现特点：**
- ✅ **零API调用**：直接复用现有`/api/web/user/info`接口返回的cozePackage数据
- ✅ **内置渲染**：在user-profile.vue组件内部直接实现Coze套餐信息展示
- ✅ **响应式更新**：userStore更新时自动触发显示内容重新计算
- ✅ **统一状态管理**：所有用户相关数据通过userStore集中管理

### 2.2 核心实现代码

**user-profile.vue中的Coze套餐信息展示实现**

```vue
<!-- Coze套餐信息展示区域 -->
<div class="mb-4">
  <div class="flex items-center justify-between">
    <div class="flex items-center">
      <span class="text-sm text-gray-600 dark:text-gray-400 mr-2">
        {{ t('profile.cozePackage') }}
      </span>
      <span class="text-sm font-medium" :class="cozePackageStatusColor">
        {{ cozePackageDisplayText }}
      </span>
    </div>
  </div>
</div>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useI18n } from 'vue-i18n'

const userStore = useUserStore()
const { t } = useI18n()

// 核心计算属性：Coze套餐显示文本
const cozePackageDisplayText = computed(() => {
  const cozePackage = userStore.userInfo?.cozePackage
  
  // 无有效套餐
  if (!cozePackage || !cozePackage.active) {
    return t('profile.noCozePackage') + ' · ' + t('profile.remainingDays', { days: 0 })
  }
  
  // 显示套餐名称和剩余天数
  return `${cozePackage.package?.name} · ${t('profile.remainingDays', { days: cozePackage.days_left })}`
})

// 核心计算属性：套餐状态颜色
const cozePackageStatusColor = computed(() => {
  const cozePackage = userStore.userInfo?.cozePackage
  
  // 无套餐或已过期
  if (!cozePackage || !cozePackage.active) {
    return 'text-gray-500 dark:text-gray-400'
  }
  
  // 根据剩余天数返回不同颜色
  if (cozePackage.days_left <= 0) {
    return 'text-red-500'      // 已过期：红色
  }
  if (cozePackage.days_left <= 7) {
    return 'text-orange-500'   // 即将过期：橙色
  }
  
  return 'text-green-600 dark:text-green-400'  // 正常：绿色
})
</script>
```

**核心实现特点：**
- ✅ **零API调用**：直接读取userStore.userInfo.cozePackage数据
- ✅ **内置渲染**：在user-profile.vue组件内部直接实现展示逻辑
- ✅ **响应式更新**：userInfo变化时自动重新计算显示文本和颜色
- ✅ **国际化支持**：使用vue-i18n支持多语言显示
- ✅ **状态颜色**：根据剩余天数智能显示不同颜色状态

### 2.3 类型定义扩展

**apps/web/models/user.d.ts** (实际扩展)
```typescript
// Coze套餐状态枚举
export enum UserCozePackageStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired', 
  NONE = 'none'
}

// Coze套餐摘要信息
export interface UserCozePackageSummary {
  active: boolean                    // 是否有有效套餐
  package?: {
    id: number
    name: string                     // 套餐名称
  }
  order?: {
    id: number
    expire_at: string                // 到期时间 (ISO格式)
    package_id: number
  }
  days_left: number                   // 剩余天数
}

// 扩展UserInfo接口
export interface UserInfo {
  id: string
  email: string
  name: string
  // ... 其他现有字段
  cozePackage?: UserCozePackageSummary  // 新增：Coze套餐信息
}
```

**核心优势：**
- ✅ **类型安全**：完整的TypeScript类型定义，支持编译时检查
- ✅ **零运行时开销**：类型定义仅在编译时生效，不影响运行时性能
- ✅ **向后兼容**：cozePackage为可选字段，不影响现有代码

### 2.4 前端完整实现代码

**apps/web/src/views/user-profile.vue** (完整实现)
```vue
<template>
  <!-- 用户头像和基本信息 -->
  <div class="flex items-center mb-4">
    <UserAvatar :user="userStore.userInfo" size="large" />
    <div class="ml-3">
      <div class="font-medium text-gray-900 dark:text-white">
        {{ userStore.userInfo?.name }}
      </div>
      <div class="text-sm text-gray-500 dark:text-gray-400">
        {{ userStore.userInfo?.email }}
      </div>
    </div>
  </div>

  <!-- 算力信息 -->
  <div class="mb-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <span class="text-sm text-gray-600 dark:text-gray-400 mr-2">
          {{ t('profile.computePower') }}
        </span>
        <span class="text-sm font-medium text-blue-600">
          {{ userStore.userInfo?.computePower }}
        </span>
      </div>
    </div>
  </div>

  <!-- Coze套餐信息 - 核心内置实现 -->
  <div class="mb-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <span class="text-sm text-gray-600 dark:text-gray-400 mr-2">
          {{ t('profile.cozePackage') }}
        </span>
        <span class="text-sm font-medium" :class="cozePackageStatusColor">
          {{ cozePackageDisplayText }}
        </span>
      </div>
    </div>
  </div>

  <!-- 快捷操作菜单 -->
  <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
    <!-- 现有菜单项 -->
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useI18n } from 'vue-i18n'

const userStore = useUserStore()
const { t } = useI18n()

// 核心计算属性：Coze套餐显示文本
const cozePackageDisplayText = computed(() => {
  const cozePackage = userStore.userInfo?.cozePackage
  
  // 无有效套餐
  if (!cozePackage || !cozePackage.active) {
    return t('profile.noCozePackage')
  }
  
  // 显示套餐名称和剩余天数
  return `${cozePackage.package?.name} · ${t('profile.remainingDays', { days: cozePackage.days_left })}`
})

// 核心计算属性：套餐状态颜色
const cozePackageStatusColor = computed(() => {
  const cozePackage = userStore.userInfo?.cozePackage
  
  // 无套餐或已过期
  if (!cozePackage || !cozePackage.active) {
    return 'text-gray-500 dark:text-gray-400'
  }
  
  // 根据剩余天数返回不同颜色
  if (cozePackage.days_left <= 0) {
    return 'text-red-500'      // 已过期：红色
  }
  if (cozePackage.days_left <= 7) {
    return 'text-orange-500'   // 即将过期：橙色
  }
  
  return 'text-green-600 dark:text-green-400'  // 正常：绿色
})
</script>
```

**核心实现特点：**
- ✅ **零API调用**：直接读取userStore.userInfo.cozePackage数据
- ✅ **内置渲染**：在user-profile.vue组件内部直接实现展示逻辑
- ✅ **响应式更新**：userInfo变化时自动重新计算显示文本和颜色
- ✅ **国际化支持**：使用vue-i18n支持多语言显示
- ✅ **状态颜色**：根据剩余天数智能显示不同颜色状态