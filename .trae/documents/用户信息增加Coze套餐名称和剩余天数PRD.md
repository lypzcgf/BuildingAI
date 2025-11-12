# 用户信息增加Coze套餐名称和剩余天数PRD

## 1. 项目背景与目标

### 1.1 背景
在BuildingAI平台中，用户头像弹出的信息框目前仅显示算力值信息。为了提升用户体验，增加Coze套餐相关信息的展示，让用户能够快速了解自己的套餐状态和剩余时间，需要在现有信息框中增加Coze套餐名称和剩余天数显示。

通过采用服务端接口合并方案，我们将Coze套餐信息集成到现有的用户信息接口中，避免了额外的API调用，提升了加载性能和用户体验。这种架构设计既保证了功能的完整性，又维持了系统的简洁性。

### 1.2 目标
- **零数据库变更**：完全复用现有`coze_package_orders`表结构，无需新增数据库表
- **最小化改动**：采用服务端接口合并方案，复用现有WebCozePackageService，实现快速开发部署
- **提升用户体验**：在用户头像信息框中直观展示Coze套餐状态和剩余时间
- **促进转化**：提供便捷的套餐开通/续费入口，提升用户付费转化率
- **技术优化**：通过服务端数据合并，减少前端API调用次数，提升加载性能

## 2. 用户故事

| 用户类型 | 用户故事 | 价值点 |
|---------|---------|--------|
| 已有Coze套餐用户 | 作为已有套餐用户，我希望在头像信息框中看到当前套餐名称和剩余天数，以便了解套餐使用情况 | 提升用户体验，减少页面跳转 |
| 无套餐用户 | 作为无套餐用户，我希望在头像信息框中看到"暂无套餐"提示，以便了解当前状态 | 降低使用门槛，提升转化率 |
| 即将到期用户 | 作为套餐即将到期的用户，我希望在头像信息框中看到当前套餐名称和剩余天数（红色提醒），以便及时续费 | 提升用户留存，减少流失 |
| 所有用户 | 作为用户，我希望Coze套餐信息与用户基本信息一起加载，无需等待额外的API调用 | 提升加载性能，优化用户体验 |

## 3. 范围与不做事项

### 3.1 范围
- ✅ 在用户信息框中新增Coze套餐信息展示行
- ✅ 显示当前有效套餐名称（如有）
- ✅ 显示套餐剩余天数（如有）
- ✅ 提供"开通/续费"按钮（无套餐或即将到期时）
- ✅ 支持中英文日三语国际化
- ✅ 复用现有`coze_package_orders`表结构，零数据库变更
- ✅ 基于现有WebCozePackageService扩展查询功能
- ✅ 采用服务端接口合并方案，将Coze套餐信息合并到现有/user/info接口
- ✅ 前端直接读取userStore.userInfo.cozePackage数据，无需额外API调用

### 3.2 不做事项
- ❌ 不新增数据库表结构
- ❌ 不修改现有订单业务流程
- ❌ 不增加复杂的套餐推荐算法
- ❌ 不做套餐到期主动推送通知（仅展示）
- ❌ 不做套餐变更历史记录

## 4. 交互与UI规范

### 4.1 信息展示位置
在现有用户信息框的**算力值下方**新增一行，展示Coze套餐信息。

### 4.2 展示规则
| 用户状态 | 展示内容 | 视觉样式 |
|---------|----------|----------|
| 有有效套餐 | 套餐名称 + 剩余X天 | 正常文本色，剩余天数≤7天时红色提醒 |
| 无套餐 | "暂无套餐（剩余天数 0天）" | 次要文本色 |
| 套餐已过期 | "暂无套餐（剩余天数 0天）" | 次要文本色 |
| 加载中 | 不显示套餐行 | 等待用户信息加载完成 |

### 4.3 视觉规范
- **字体颜色**：套餐名称使用默认文本色（text-gray-900），剩余天数使用次要文本色（text-gray-500）
- **到期提醒**：剩余天数≤7天时使用红色（text-red-500）突出显示
- **布局对齐**：与算力值行保持相同缩进和对齐方式，采用flex布局
- **背景样式**：根据套餐状态显示不同背景色（绿色背景表示有效，红色背景表示即将到期）

### 4.4 交互行为
- **数据加载**：与用户基本信息同步加载，无需额外API调用
- **错误处理**：加载失败时显示"暂无套餐"，不阻断用户操作
- **状态切换**：根据userStore.userInfo.cozePackage实时更新显示内容
- **响应式**：适配移动端和桌面端显示

## 5. 国际化要求

### 5.1 文案规范
支持中文、英文、日文三种语言，确保在不同语言环境下的一致性和准确性。

### 5.2 翻译对照表
| 中文 | English | 日本語 |
|------|---------|--------|
| Coze套餐 | Coze Package | Cozeパッケージ |
| 剩余X天 | X days remaining | 残りX日 |
| 开通Coze套餐 | Activate Coze Package | Cozeパッケージを開通 |
| 续费 | Renew | 継続 |
| 立即续费 | Renew Now | 今すぐ継続 |
| 暂无套餐 | No active package | パッケージなし |

### 5.3 实现要求
- 使用Vue i18n国际化框架，统一在语言包中配置
- 支持动态参数替换（如天数）
- 确保所有文案都能被正确翻译和显示
- 实际使用的翻译key：
  - `profile.coze_package` - Coze套餐标签
  - `profile.remaining_days` - 剩余天数格式化
  - `profile.no_package` - 暂无套餐
  - `profile.package_expired` - 套餐已过期

## 6. 验收标准

### 6.1 功能验收
- ✅ 正确显示当前有效套餐名称
- ✅ 准确计算并显示剩余天数
- ✅ 即将到期（≤7天）时红色提醒
- ✅ 按钮跳转至正确页面
- ✅ 支持中英文日三语切换
- ✅ 零数据库变更，完全复用现有结构

### 6.2 技术验收
- ✅ 查询响应时间≤200ms（接口合并后无额外开销）
- ✅ 接口成功率≥99.9%
- ✅ 不影响现有用户认证流程
- ✅ 支持热更新部署，无需数据库迁移
- ✅ 复用现有WebCozePackageService，代码复用率>95%
- ✅ 零API调用增加，数据与用户基本信息同步返回
- ✅ 服务端模块化解耦，UserModule依赖WebCozePackageModule

### 6.3 兼容性验收
- ✅ 支持现有所有浏览器
- ✅ 移动端适配良好
- ✅ 与现有UI风格保持一致
- ✅ 不影响其他功能模块

## 7. 技术实现方案

### 7.1 服务端实现
采用独立API方案，提供专门的Coze套餐查询接口，同时在用户信息接口中合并套餐数据：

**模块架构** (`web-coze-package.module.ts`):
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([CozePackageOrder])],
  controllers: [WebCozePackageController],
  providers: [WebCozePackageService, CozePackageOrderService],
  exports: [WebCozePackageService],
})
export class WebCozePackageModule {}
```

**独立API控制器** (`web-coze-package.controller.ts`):
```typescript
@Controller('api/web-coze-package')
export class WebCozePackageController {
  // 获取用户当前有效套餐
  @Get('user/current-package')
  async getUserCurrentPackage(@Req() req: any): Promise<UserCozePackageResponseDto | null> {
    const userId = req.user?.id;
    return await this.webCozePackageService.getUserCurrentPackage(userId);
  }

  // 检查用户是否有有效套餐
  @Get('user/has-active-package')
  async hasActivePackage(@Req() req: any): Promise<{ hasActivePackage: boolean }> {
    const userId = req.user?.id;
    const hasActive = await this.webCozePackageService.hasActivePackage(userId);
    return { hasActivePackage: hasActive };
  }

  // 获取用户套餐剩余天数
  @Get('user/remaining-days')
  async getRemainingDays(@Req() req: any): Promise<{ remainingDays: number }> {
    const userId = req.user?.id;
    const remainingDays = await this.webCozePackageService.getRemainingDays(userId);
    return { remainingDays };
  }
}
```

**服务层实现** (`web-coze-package.service.ts`):
```typescript
@Injectable()
export class WebCozePackageService {
  constructor(
    private readonly cozePackageOrderService: CozePackageOrderService,
  ) {}

  // 复用现有的CozePackageOrderService中的getUserActivePackage方法
  async getUserCurrentPackage(userId: string): Promise<UserCozePackageResponseDto | null> {
    const activePackage = await this.cozePackageOrderService.getUserActivePackage(userId);
    return activePackage;
  }
}
```

**用户信息接口集成** (`user.controller.ts`):
```typescript
@Get('info')
async getUserInfo(@Playground() user: UserPlayground) {
  // 获取用户信息（排除敏感字段）
  const userInfo = await this.userService.findOneById(user.id, {
    excludeFields: ['password'],
    relations: ['role'],
  });

  // 获取用户Coze套餐信息（可选，失败时不影响主流程）
  let cozePackage = null;
  try {
    cozePackage = await this.webCozePackageService.getUserCurrentPackage(user.id);
  } catch (error) {
    // 静默处理套餐查询失败的情况
    Logger.warn(`获取用户Coze套餐信息失败: ${error.message}`, UserController.name);
  }

  return {
    ...userInfo,
    cozePackage, // 新增Coze套餐信息
  };
}
```

### 7.2 前端实现
**组合式函数** (`useCozePackage.ts`):
```typescript
/**
 * Coze套餐数据获取组合式函数
 * 用于用户信息框中显示Coze套餐信息
 */
export function useCozePackage(): UseCozePackageReturn {
  // 状态管理
  const packageInfo = ref<UserCozePackage | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // 计算属性
  const status = computed<CozePackageStatus>(() => {
    if (!packageInfo.value) return 'none'
    return calculateCozePackageStatus(packageInfo.value.remainingDays)
  })
  
  const remainingDays = computed(() => {
    return packageInfo.value?.remainingDays || 0
  })
  
  const isExpiring = computed(() => status.value === 'expiring')
  const isExpired = computed(() => status.value === 'expired')
  const hasValidPackage = computed(() => status.value === 'active' || status.value === 'expiring')

  // 获取用户套餐信息
  const fetchPackageInfo = async (): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      const data = await getUserCozePackage()
      packageInfo.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取套餐信息失败'
      console.error('获取Coze套餐信息失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 自动获取数据（已登录才请求，避免无效请求）
  onMounted(() => {
    if (userStore.isLogin) {
      fetchPackageInfo()
    }
  })

  // 每5分钟自动刷新一次
  const { pause, resume } = useIntervalFn(() => {
    if (!loading.value) {
      refreshPackage()
    }
  }, 5 * 60 * 1000)

  return {
    // 状态
    packageInfo: readonly(packageInfo),
    loading: readonly(loading),
    error: readonly(error),
    status: readonly(status),
    remainingDays: readonly(remainingDays),
    isExpiring: readonly(isExpiring),
    isExpired: readonly(isExpired),
    hasValidPackage: readonly(hasValidPackage),
    
    // 方法
    fetchPackageInfo,
    refreshPackage,
    clearError,
    getFormattedRemainingDays,
    getStatusColor
  }
}
```

**数据获取函数** (`useCozePackage.ts`):
```typescript
/**
 * 获取用户Coze套餐信息
 */
export async function getUserCozePackage(): Promise<UserCozePackage | null> {
  try {
    // 统一使用 Web 请求封装（自动附带认证，与"算力值"一致）
    const data = await useWebGet<UserCozePackage | null>(
      '/web-coze-package/user/current-package',
      {},
      { requireAuth: true }
    )
    return data ?? null
  } catch (error) {
    console.error('获取Coze套餐信息失败:', error)
    throw new Error('获取套餐信息失败，请稍后重试')
  }
}
```

**状态存储** (`useCozePackage.ts`):
```typescript
/**
 * 创建Coze套餐存储
 */
export const useCozePackageStore = defineStore('coze-package', () => {
  const packageInfo = ref<UserCozePackage | null>(null)
  const lastFetchTime = ref<number>(0)
  
  /**
   * 是否需要刷新数据
   */
  const shouldRefresh = computed(() => {
    const now = Date.now()
    const timeDiff = now - lastFetchTime.value
    return timeDiff > COZE_PACKAGE_CONSTANTS.CACHE_TTL // 5分钟缓存
  })

  /**
   * 获取套餐信息（带缓存）
   */
  const getCachedPackageInfo = async (): Promise<UserCozePackage | null> => {
    if (!packageInfo.value || shouldRefresh.value) {
      try {
        const data = await getUserCozePackage()
        packageInfo.value = data
        lastFetchTime.value = Date.now()
      } catch (error) {
        console.error('获取Coze套餐信息失败:', error)
        throw error
      }
    }
    return packageInfo.value
  }
  
  return {
    packageInfo: readonly(packageInfo),
    lastFetchTime: readonly(lastFetchTime),
    shouldRefresh: readonly(shouldRefresh),
    getCachedPackageInfo,
    updatePackageInfo,
    clearCache
  }
})
```

**组件实现** (`user-profile.vue`):
```vue
<template>
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
      @click="navigateTo('/profile/personal-rights/coze-package-center')"
    >
      {{ t("console-common.cozePackageCenter") }}
    </UButton>
  </div>
</template>

<script setup>
const cozePackageStatusColor = computed(() => {
  const pkg = userStore.userInfo?.cozePackage;
  if (!pkg) return 'border-gray-200 bg-gray-50';
  switch (pkg.status) {
    case 'active':
      return 'border-green-200 bg-green-50';
    case 'expired':
      return 'border-red-200 bg-red-50';
    default:
      return 'border-gray-200 bg-gray-50';
  }
});
</script>
```

### 7.3 数据类型定义
**用户Coze套餐接口** (`coze-package.ts`):
```typescript
/**
 * 前端用户Coze套餐类型（对齐服务端DTO）
 */
export interface UserCozePackage {
  /** 套餐名称 */
  packageName: string
  /** 剩余天数 */
  remainingDays: number
  /** 服务端状态（active/expired/none） */
  status: 'active' | 'expired' | 'none'
  /** 过期时间（ISO字符串） */
  expireDate: string
  /** 是否自动续费 */
  autoRenew?: boolean
  /** 套餐ID */
  packageId: string
  /** 订单ID */
  orderId?: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}
```

**套餐状态枚举** (`coze-package.ts`):
```typescript
/**
 * 套餐状态
 */
export enum CozePackageStatus {
  ACTIVE = 'active',    // 有效
  EXPIRING = 'expiring', // 即将到期
  EXPIRED = 'expired',  // 已过期
  NONE = 'none'         // 无套餐
}
```

**状态计算工具函数** (`coze-package.ts`):
```typescript
/**
 * 工具函数：计算套餐状态
 */
export function calculateCozePackageStatus(remainingDays: number): CozePackageStatus {
  if (remainingDays <= 0) {
    return CozePackageStatus.EXPIRED
  }
  if (remainingDays <= COZE_PACKAGE_CONSTANTS.EXPIRING_DAYS_THRESHOLD) {
    return CozePackageStatus.EXPIRING
  }
  return CozePackageStatus.ACTIVE
}
```

### 7.4 数据流架构
```
用户请求 → WebCozePackageController → WebCozePackageService → CozePackageOrderService
                ↓
        复用现有订单服务 → 查询coze_package_orders表 → 返回套餐信息
                ↓
        前端useCozePackage → 缓存管理 → 组件展示
```

## 8. 国际化实现

### 8.1 文案设计
支持中英文日三语，文案设计如下：

**中文文案** (`zh-CN.json`):
```json
{
  "console-common": {
    "cozePackage": "Coze 套餐",
    "cozePackageCenter": "套餐中心",
    "noPackage": "暂无套餐",
    "remainingDaysPrefix": "剩余",
    "dayUnit": "天",
    "day": "天",
    "days": "天"
  }
}
```

**英文文案** (`en-US.json`):
```json
{
  "console-common": {
    "cozePackage": "Coze Package",
    "cozePackageCenter": "Package Center",
    "noPackage": "No Package",
    "remainingDaysPrefix": "",
    "dayUnit": " days",
    "day": "day",
    "days": "days"
  }
}
```

**日文文案** (`ja-JP.json`):
```json
{
  "console-common": {
    "cozePackage": "Coze プラン",
    "cozePackageCenter": "プランセンター",
    "noPackage": "プランなし",
    "remainingDaysPrefix": "残り",
    "dayUnit": "日",
    "day": "日",
    "days": "日"
  }
}
```

### 8.2 使用方式
在组件中使用：
```vue
<!-- 套餐名称 -->
{{ t("console-common.cozePackage") }}

<!-- 剩余天数 -->
{{ t('console-common.remainingDaysPrefix') }} {{ remainingDays }}{{ t('console-common.dayUnit') }}

<!-- 无套餐状态 -->
{{ t("console-common.noPackage") }}

<!-- 套餐中心按钮 -->
{{ t("console-common.cozePackageCenter") }}
```

### 8.3 状态颜色配置
**状态颜色映射** (`coze-package.ts`):
```typescript
/**
 * 套餐状态颜色映射
 */
export const COZE_PACKAGE_STATUS_COLORS = {
  [CozePackageStatus.ACTIVE]: {
    border: 'border-green-200',
    background: 'bg-green-50',
    text: 'text-green-600'
  },
  [CozePackageStatus.EXPIRING]: {
    border: 'border-yellow-200',
    background: 'bg-yellow-50',
    text: 'text-yellow-600'
  },
  [CozePackageStatus.EXPIRED]: {
    border: 'border-red-200',
    background: 'bg-red-50',
    text: 'text-red-600'
  },
  [CozePackageStatus.NONE]: {
    border: 'border-gray-200',
    background: 'bg-gray-50',
    text: 'text-gray-600'
  }
} as const
```

**状态颜色获取函数** (`coze-package.ts`):
```typescript
/**
 * 获取套餐状态颜色
 */
export function getCozePackageStatusColor(status: CozePackageStatus): typeof COZE_PACKAGE_STATUS_COLORS[CozePackageStatus] {
  return COZE_PACKAGE_STATUS_COLORS[status]
}
```

## 9. 附录

### 9.1 相关文件路径
**前端文件：**
- 用户信息组件：`src/components/user/user-profile.vue`
- Coze套餐组合式函数：`src/composables/useCozePackage.ts`
- Coze套餐类型定义：`src/types/coze-package.ts`
- Coze套餐API：`src/api/coze-package.ts`
- 国际化配置：`src/locales/zh-CN.json`、`src/locales/en-US.json`、`src/locales/ja-JP.json`

**服务端文件：**
- Coze套餐控制器：`src/web-coze-package/web-coze-package.controller.ts`
- Coze套餐服务：`src/web-coze-package/web-coze-package.service.ts`
- Coze套餐订单服务：`src/coze-package-order/coze-package-order.service.ts`
- 用户信息控制器：`src/user/user.controller.ts`
- 用户服务：`src/user/user.service.ts`

**数据库文件：**
- Coze套餐订单实体：`src/coze-package-order/entities/coze-package-order.entity.ts`
- Coze套餐实体：`src/coze-package/entities/coze-package.entity.ts`

### 9.2 测试要点
- 用户无套餐时的显示（灰色边框，暂无套餐文案）
- 用户套餐有效时的显示（绿色边框，套餐名称+剩余天数）
- 用户套餐即将到期（≤7天）时的显示（黄色边框，提醒文案）
- 用户套餐已过期时的显示（红色边框，已过期文案）
- 多语言切换测试（中文、英文、日文）
- 接口异常时的降级处理（返回null，不影响主流程）
- 缓存机制测试（5分钟内不重复请求）
- 自动刷新测试（每5分钟自动更新数据）
- 未登录用户行为（不发送套餐请求）

### 9.3 性能考虑
- 独立API设计，避免影响用户信息主接口性能
- 前端缓存机制，5分钟内不重复请求
- 服务端复用现有订单服务，避免重复数据库查询
- 静默处理套餐查询失败，确保用户信息主流程不受影响
- 组合式函数设计，支持按需使用和状态共享
- 响应式设计，支持移动端显示优化

### 9.4 安全考虑
- 所有套餐相关接口都需要用户认证
- 服务端对用户ID进行权限校验
- 敏感信息（如订单详情）不返回给前端
- 错误信息不暴露内部实现细节
- 缓存数据不包含敏感信息

### 9.5 扩展性设计
- 支持多种套餐状态（active/expiring/expired/none）
- 支持未来添加更多套餐类型
- 支持自动续费功能扩展
- 支持套餐升级/降级功能
- 支持批量查询多个用户套餐信息
- 支持套餐使用统计和报表功能

### 9.6 相关文件详解

#### 前端文件详解

**用户信息组件 (`src/components/user/user-profile.vue`)**
这是展示用户基本信息的核心组件，负责在用户头像和基础信息区域显示Coze套餐状态。组件通过调用`useCozePackage`组合式函数获取套餐数据，根据返回的状态信息动态渲染不同颜色的边框和文案。支持四种状态的视觉展示：有效(绿色)、即将到期(黄色)、已过期(红色)、无套餐(灰色)。组件采用响应式设计，确保在不同屏幕尺寸下都能良好显示。

**Coze套餐组合式函数 (`src/composables/useCozePackage.ts`)**
这是前端数据管理的核心逻辑封装，提供统一的套餐数据获取和管理接口。函数内部实现了5分钟TTL缓存机制，避免频繁API调用；支持自动刷新功能，确保数据实时性；提供完整的错误处理机制，当API调用失败时返回null，不影响主流程。返回的数据包含套餐信息、加载状态、错误信息、套餐状态、剩余天数等，方便组件按需使用。

**Coze套餐类型定义 (`src/types/coze-package.ts`)**
定义了整个Coze套餐功能所需的所有TypeScript类型，包括`CozePackageStatus`枚举(有效/即将到期/已过期/无套餐)、`UserCozePackage`接口(用户套餐数据结构)、状态颜色映射配置等。类型定义确保了前后端数据交互的类型安全，提供了状态计算工具函数和颜色获取函数，是整个功能的数据契约基础。

**Coze套餐API (`src/api/coze-package.ts`)**
封装了所有Coze套餐相关的API调用，提供统一的接口访问层。当前主要提供获取用户当前套餐的接口，支持错误处理和响应标准化。API层的设计遵循单一职责原则，将网络请求逻辑与业务逻辑分离，便于维护和测试。接口返回的数据结构严格遵循`UserCozePackage`类型定义。

**国际化配置文件**
- `src/locales/zh-CN.json`: 中文语言包，包含"Coze套餐"、"剩余X天"、"暂无套餐"等文案
- `src/locales/en-US.json`: 英文语言包，适配英文语法习惯(如复数形式days/day)
- `src/locales/ja-JP.json`: 日文语言包，使用日文汉字和假名混合表达
三个语言文件保持相同的键名结构，支持动态参数替换，确保多语言环境下的用户体验一致性。

#### 服务端文件详解

**Coze套餐控制器 (`src/web-coze-package/web-coze-package.controller.ts`)**
提供RESTful API接口，处理前端Coze套餐相关的HTTP请求。控制器负责请求参数校验、用户身份验证、调用对应的服务层方法，并将结果封装成标准响应格式返回。当前主要提供获取用户当前套餐信息的接口，支持异常处理和错误码返回。控制器的设计遵循RESTful原则，接口路径清晰，便于前端调用和维护。

**Coze套餐服务 (`src/web-coze-package/web-coze-package.service.ts`)**
业务逻辑的核心实现层，负责Coze套餐相关的业务处理。服务层调用订单服务获取用户的有效套餐订单，提取套餐信息并计算剩余天数，根据剩余天数确定套餐状态。服务层还负责数据转换和格式化，确保返回给控制器的数据符合前端期望的格式。实现了缓存机制，提高查询性能。

**Coze套餐订单服务 (`src/coze-package-order/coze-package-order.service.ts`)**
专门处理Coze套餐订单相关业务的服务层，提供订单查询、状态管理、有效性验证等功能。该服务负责从数据库查询用户的套餐订单，过滤出有效的订单，并提供订单详情的封装。服务层还处理订单状态的逻辑判断，如判断订单是否过期、是否有效等，为上层服务提供可靠的数据支持。

**用户信息控制器 (`src/user/user.controller.ts`)**
处理用户信息相关的HTTP请求，包括用户基本信息查询、用户信息更新等。在Coze套餐功能中，该控制器可能需要扩展以支持用户信息的批量查询，或者在用户信息中包含套餐相关的统计信息。控制器负责用户身份的校验和权限控制，确保用户只能访问自己的信息。

**用户服务 (`src/user/user.service.ts`)**
用户业务逻辑的核心实现，处理用户注册、登录、信息管理等核心业务。在Coze套餐功能中，用户服务可能需要提供用户套餐统计、用户状态判断等辅助功能。服务层负责用户数据的完整性校验和业务规则的实施，如判断用户是否具有购买套餐的资格、用户账户状态是否正常等。

#### 数据库文件详解

**Coze套餐订单实体 (`src/coze-package-order/entities/coze-package-order.entity.ts`)**
定义了Coze套餐订单的数据库表结构，包含订单ID、用户ID、套餐ID、订单状态、创建时间、过期时间等核心字段。实体定义遵循TypeORM规范，支持数据库操作的类型安全和自动映射。字段设计考虑了订单生命周期的各个阶段，支持订单状态跟踪和历史记录查询。索引设计优化了用户ID和订单状态的查询性能。

**Coze套餐实体 (`src/coze-package/entities/coze-package.entity.ts`)**
定义了Coze套餐的基础信息表结构，包含套餐ID、套餐名称、套餐时长、价格、描述等字段。实体设计支持套餐的灵活配置，包括不同时长的套餐类型、不同的价格策略等。表结构支持套餐的上下架管理，为未来套餐种类的扩展预留了空间。字段命名遵循数据库设计规范，支持国际化和多币种等扩展需求。

## 10. 术语定义

| 术语 | 定义 |
|------|------|
| Coze套餐 | 用户购买的AI服务套餐，包含特定的使用额度和有效期 |
| 剩余天数 | 当前有效套餐距离过期还有多少天 |
| 状态 | 套餐的当前状态：有效(active)、即将到期(expiring)、已过期(expired)、无套餐(none) |
| 用户信息框 | 显示用户基本信息的UI组件区域 |
| 组合式函数 | Vue 3的组合式API函数，用于封装可复用的逻辑 |
| 缓存TTL | Time To Live，数据缓存的有效时间 |
| 降级处理 | 当某个功能失败时，系统继续运行但不提供该功能 |
| 静默处理 | 错误发生时，不打扰用户，后台记录日志 |
| 响应式设计 | 界面能够自适应不同屏幕尺寸的设计方案 |
| 零数据库变更 | 不新增、不修改任何数据库表结构 |
| 深度复用 | 最大化利用现有代码和服务，减少重复开发 |
| 接口合并方案 | 在现有接口中合并多个数据源，减少前端API调用次数 |