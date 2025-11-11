# 用户信息增加Coze套餐名称和剩余天数详细开发计划

## 1. 项目概述

### 1.1 项目背景
BuildingAI控制台用户信息框需要新增Coze套餐信息展示功能，在现有"算力值"信息下方新增一行显示当前用户的Coze套餐名称和剩余天数，并提供开通/续费操作入口。

### 1.2 项目目标
- 在用户信息框中直观展示Coze套餐状态
- 提供一键开通/续费入口，提升用户体验
- 支持中英日三语国际化
- 确保数据实时性和准确性
- **最小化代码改动，复用现有后端代码和数据库表结构**

### 1.3 开发范围
- **前端范围**：修改用户信息框组件，新增Coze套餐信息展示行
- **后端范围**：**在现有CozePackageOrderService中增加一个查询当前用户有效套餐的方法**，无需新建控制器和服务
- **数据范围**：**复用现有的coze_package_orders表**，无需新增数据库表
- **国际化范围**：新增8个国际化文案键值

### 1.4 技术栈
- **前端**：Vue3 + Nuxt3 + TypeScript + @fastbuildai/ui组件库
- **后端**：NestJS + TypeScript + TypeORM（**复用现有代码**）
- **数据库**：PostgreSQL（**复用现有coze_package_orders表**）
- **国际化**：基于console-common.json的多语言支持
- **部署**：Docker容器化部署

## 2. 前端文件开发计划

### 2.1 用户信息框组件修改

| 文件路径 | 开发状态 | 功能描述 |
|---------|---------|---------|
| `apps/web/components/layout/UserProfile.vue` | ✅ 待开发 | 用户信息框主组件，新增Coze套餐信息展示行 |
| `apps/web/composables/useCozePackage.ts` | ✅ 待开发 | Coze套餐数据获取和状态管理组合式函数 |
| `apps/web/types/coze-package.ts` | ✅ 待开发 | Coze套餐相关TypeScript类型定义 |

#### 核心功能
- 在现有"算力值"信息下方新增Coze套餐信息展示行
- 显示套餐名称和剩余天数（格式：{套餐名称} · 剩余 {N} 天）
- 根据剩余天数显示不同状态样式（正常/即将到期/已到期）
- 提供开通/续费按钮，支持状态切换

#### 代码结构
```typescript
// 主要状态管理
const cozePackageInfo = ref<CozePackageInfo | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// 核心计算方法
const daysLeft = computed(() => calculateDaysLeft(cozePackageInfo.value?.expireAt))
const statusType = computed(() => getPackageStatusType(daysLeft.value))
const buttonText = computed(() => getActionButtonText(cozePackageInfo.value?.isActive))
```

#### UI组件使用
- 使用现有`<UiCard>`组件作为信息框容器
- 使用`<UiRow>`和`<UiCol>`进行布局
- 使用`<UiButton>`实现开通/续费按钮
- 使用`<UiText>`显示文本信息，支持不同颜色状态

#### 技术特点
- 响应式布局，适配移动端
- 懒加载机制，减少首屏渲染成本
- 错误边界处理，确保组件稳定性
- 支持SSR服务端渲染

### 2.2 样式和主题

| 文件路径 | 开发状态 | 功能描述 |
|---------|---------|---------|
| `apps/web/assets/styles/components/_user-profile.scss` | ✅ 待开发 | 用户信息框样式定义，包含Coze套餐信息样式 |

## 3. 后端文件开发计划（大幅简化）

### 3.1 后端架构调整
新增 **WebCozePackageModule** 模块，专门处理用户端Coze套餐业务，实现以下架构优化：

- **职责分离**：Web模块专注用户端业务，Console模块专注管理后台，避免权限混淆
- **代码复用**：通过依赖注入复用现有CozePackageModule的核心逻辑，保持业务规则一致性
- **零数据库变更**：完全复用现有数据模型，无需新增表结构或字段

### 3.2 文件结构调整
新增4个后端文件，保持与现有架构一致性：

| 文件路径 | 用途 | 开发时间 |
|---------|------|----------|
| `apps/server/src/web-coze-package/web-coze-package.module.ts` | 模块定义和依赖配置 | 0.1天 |
| `apps/server/src/web-coze-package/web-coze-package.controller.ts` | RESTful接口控制器 | 0.2天 |
| `apps/server/src/web-coze-package/web-coze-package.service.ts` | 业务逻辑封装层 | 0.1天 |
| `apps/server/src/web-coze-package/dto/user-coze-package.dto.ts` | 响应数据传输对象 | 0.1天 |

### 3.3 接口设计优化
设计 **GET /api/coze-package/user-current** 接口，支持多种套餐状态显示：

```typescript
// 响应数据结构
interface UserCozePackageResponse {
  packageName: string;      // 套餐名称（如："专业版"）
  remainingDays: number;    // 剩余天数（如：23）
  status: 'active' | 'expired' | 'none'; // 套餐状态
  expireDate?: string;     // 到期日期（ISO格式）
  autoRenew: boolean;     // 是否自动续费
}
```

### 3.4 代码复用策略
通过依赖注入实现最大化代码复用：

```typescript
// WebCozePackageService 中复用现有逻辑
@Injectable()
export class WebCozePackageService {
  constructor(
    private readonly cozePackageService: CozePackageService, // 复用核心业务
  ) {}

  async getCurrentUserPackage(userId: string) {
    // 直接调用现有服务方法，无需重新实现
    return await this.cozePackageService.getUserActivePackage(userId);
  }
}
```

**复用优势**：
- 代码复用率：**95%以上**
- 业务规则一致性：100%保持
- 开发效率提升：后端开发时间从2天缩短至**0.5天**

### 3.5 **注册新模块WebCozePackageModule**
在 `apps\server\src\modules\app.module.ts` 中注册WebCozePackageModule模块
模块注册方式：
```typescript

@Module({
  imports: [WebCozePackageModule],
})
export class AppModule {}
```

### 3.6 **复用现有代码，仅需增加一个方法**

**重要说明**：经过详细分析，**不需要新建任何后端文件**，只需要在现有的`CozePackageOrderService`中增加一个查询方法：

```typescript
// 在 apps/server/src/modules/console/coze-package/services/coze-package-order.service.ts 中增加

async getUserActivePackage(userId: string): Promise<UserActivePackageDto | null> {
  const activePackage = await this.orderRepository.findOne({
    where: {
      userId,
      orderStatus: 'paid',
      paymentStatus: 'paid',
      expiredAt: MoreThan(new Date())
    },
    order: { expiredAt: 'DESC' },
    relations: ['packageConfig']
  });

  if (!activePackage) return null;

  const daysLeft = Math.ceil((activePackage.expiredAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    packageName: activePackage.packageName,
    daysLeft: Math.max(0, daysLeft),
    expireAt: activePackage.expiredAt,
    isExpiringSoon: daysLeft <= 3
  };
}
```

## 4. 国际化文件开发计划

### 4.1 中文国际化文件

| 文件路径 | 开发状态 | 功能描述 |
|---------|---------|---------|
| `packages/constants/src/locales/zh/console-common.json` | ✅ 待更新 | 新增Coze套餐相关中文文案 |

新增文案键值：
```json
{
  "profile.cozePackageLabel": "Coze 套餐",
  "profile.cozePackageNotActive": "未开通",
  "profile.cozePackageRemainDays": "剩余 {days} 天",
  "profile.cozeActionOpen": "开通",
  "profile.cozeActionRenew": "续费",
  "profile.cozeExpiringSoon": "即将到期",
  "profile.cozeExpired": "已到期",
  "profile.cozeFetchError": "未获取到套餐信息"
}
```

### 4.2 英文国际化文件

| 文件路径 | 开发状态 | 功能描述 |
|---------|---------|---------|
| `packages/constants/src/locales/en/console-common.json` | ✅ 待更新 | 新增Coze套餐相关英文文案 |

新增文案键值：
```json
{
  "profile.cozePackageLabel": "Coze Package",
  "profile.cozePackageNotActive": "Inactive",
  "profile.cozePackageRemainDays": "Remaining {days} days",
  "profile.cozeActionOpen": "Open",
  "profile.cozeActionRenew": "Renew",
  "profile.cozeExpiringSoon": "Expiring soon",
  "profile.cozeExpired": "Expired",
  "profile.cozeFetchError": "Failed to fetch package info"
}
```

### 4.3 日文国际化文件

| 文件路径 | 开发状态 | 功能描述 |
|---------|---------|---------|
| `packages/constants/src/locales/jp/console-common.json` | ✅ 待更新 | 新增Coze套餐相关日文文案 |

新增文案键值：
```json
{
  "profile.cozePackageLabel": "Cozeパッケージ",
  "profile.cozePackageNotActive": "未開通",
  "profile.cozePackageRemainDays": "残り {days} 日",
  "profile.cozeActionOpen": "開通",
  "profile.cozeActionRenew": "更新",
  "profile.cozeExpiringSoon": "まもなく期限切れ",
  "profile.cozeExpired": "期限切れ",
  "profile.cozeFetchError": "パッケージ情報の取得に失敗しました"
}
```
## 5. 详细开发计划

### 5.1 开发时间计划

#### 第1天：后端基础开发
**时间安排**：4小时（上午2小时 + 下午2小时）
**主要任务**：
- **上午（2小时）**：
  - 修改文件：`apps/server/src/modules/console/coze-package/services/coze-package-order.service.ts`
    - 新增getUserActivePackage方法
    - 实现查询用户当前激活套餐的逻辑
    - 复用现有数据库查询方法，确保数据一致性
  - 创建DTO文件：`apps/server/src/web-coze-package/dto/user-coze-package.dto.ts`
    - 定义用户Coze套餐响应数据结构
    - 实现数据验证和序列化逻辑
    - 复用现有类型定义，确保数据一致性
  - 创建WebCozePackageService：`apps/server/src/web-coze-package/web-coze-package.service.ts`
    - 实现getCurrentUserPackage核心业务方法
    - 通过依赖注入复用CozePackageOrderService现有逻辑
    - 处理用户套餐状态计算和格式化
- **下午（2小时）**：
  - 创建WebCozePackageController：`apps/server/src/web-coze-package/web-coze-package.controller.ts`
    - 实现GET /api/coze-package/user-current接口
    - 配置权限验证和用户身份获取
    - 处理异常情况和错误响应
  - 创建WebCozePackageModule模块：`apps/server/src/web-coze-package/web-coze-package.module.ts`
    - 定义模块结构和依赖注入配置
    - 配置与现有CozePackageModule的依赖关系
    - 实现模块导出和提供者注册    
  - 注册模块：更新`apps/server/src/modules/app.module.ts`
    - 导入WebCozePackageModule到主模块
    - 验证模块依赖关系正确性
    - 确保接口路由正常注册
  - 注册模块：更新`apps/server/src/modules/web/user/user.module.ts`
    - 导入WebCozePackageModule到UserModule
    - 验证模块依赖关系正确性
    - 确保接口路由正常注册
  - 触发数据获取：更新`apps/server/src/modules/web/user/user.controller.ts`
    前端会调用现有的 /api/web/user/info 接口获取用户信息，这个接口会自动包含Coze套餐数据。
    ```typescript
    // 获取用户Coze套餐信息
   let cozePackage = null;
   try {
      cozePackage = await this.webCozePackageService.getUserCurrentPackage(user.id);
    } catch (error) {
      // 静默处理套餐查询失败的情况
      Logger.warn(`获取用户Coze套餐信息失败: ${error.message}`, UserController.name);
    }

    return {
        ...userInfo,
        permissions: hasPermissions,
    cozePackage,  // 合并到用户详情响应中
};

  - 接口基础测试：验证API端点可正常访问

**交付物**：后端WebCozePackage模块完成，接口可正常调用
**风险评估**：低风险，主要复用现有代码

#### 第2天：前端组件开发
**时间安排**：6小时（上午3小时 + 下午3小时）
**主要任务**：
- **上午（3小时）**：
  - 创建TypeScript类型定义：`apps/web/types/coze-package.ts`
    - 定义CozePackageInfo接口和数据结构
    - 实现类型安全和IDE智能提示
    - 确保前后端数据类型一致性
  - 创建组合式函数：`apps/web/composables/useCozePackage.ts`
    - 实现useCozePackage数据获取逻辑
    - 处理加载状态、错误处理和缓存机制
    - 实现响应式数据管理和状态更新
  - 修改用户信息框组件：`apps/web/components/layout/UserProfile.vue`
    - 在现有"算力值"信息下方新增Coze套餐展示行
    - 实现套餐状态判断和样式切换
    - 集成useCozePackage组合式函数
- **下午（3小时）**：
  - 完善用户信息框样式：`apps/web/assets/styles/components/_user-profile.scss`
    - 定义Coze套餐信息展示样式
    - 实现不同状态的颜色主题（正常/即将到期/已到期）
    - 确保响应式布局和移动端适配
  - 国际化文件更新：
    - 更新`packages/constants/src/locales/zh/console-common.json`
    - 更新`packages/constants/src/locales/en/console-common.json`
    - 更新`packages/constants/src/locales/jp/console-common.json`
    - 新增8个Coze套餐相关文案键值
    - 更新`apps/web/core/i18n/zh/common.json`
    - 更新`apps/web/core/i18n/en/common.json`
    - 更新`apps/web/core/i18n/jp/common.json`   
  - 组件集成测试：验证前端组件功能完整性

**交付物**：前端组件开发完成，国际化配置生效
**风险评估**：中等风险，需要确保样式兼容性

#### 第2天下午：集成测试和优化
**时间安排**：2小时
**主要任务**：
- **接口联调（1小时）**：
  - 前后端API集成测试
  - 数据流验证和错误处理
  - 权限验证功能测试
- **性能优化（1小时）**：
  - 组件加载性能优化
  - 接口响应时间优化
  - 内存泄漏检查和修复

**交付物**：集成测试完成，性能达标
**风险评估**：低风险，主要优化工作

### 5.2 里程碑时间节点

#### 里程碑1：后端接口完成（第1天结束）
- **时间**：第1个工作日 18:00
- **验收标准**：
  - WebCozePackageModule模块创建完成
  - GET /api/coze-package/user-current接口可正常访问
  - 模块在主应用中正确注册
  - 接口返回数据格式正确
- **风险评估**：低风险
- **应急预案**：如有延期，可简化部分验证逻辑

#### 里程碑2：前端组件完成（第2天中午）
- **时间**：第2个工作日 12:00
- **验收标准**：
  - 用户信息框新增Coze套餐信息展示
  - 组合式函数功能正常
  - TypeScript类型定义完整
  - 基础样式生效
- **风险评估**：中等风险
- **应急预案**：如有延期，可简化样式优化

#### 里程碑3：国际化和样式完成（第2天下午）
- **时间**：第2个工作日 15:00
- **验收标准**：
  - 中英日三语国际化生效
  - 用户profile样式文件更新完成
  - 不同状态样式切换正常
  - 移动端适配良好
- **风险评估**：低风险
- **应急预案**：如有延期，优先保证中文文案

#### 里程碑4：集成测试通过（第2天结束）
- **时间**：第2个工作日 18:00
- **验收标准**：
  - 前后端完全集成
  - 主要功能测试通过
  - 性能指标达标
  - 多语言切换正常
- **风险评估**：中等风险
- **应急预案**：如有问题，优先修复核心功能Bug

### 5.3 开发效率优势

#### 代码复用优势
- **后端复用率**：95%以上，通过依赖注入复用现有CozePackageOrderService
- **前端复用率**：80%以上，复用现有UI组件和样式系统
- **数据库复用**：100%，完全复用现有coze_package_orders表结构
- **国际化复用**：基于现有console-common.json机制，无需新框架

#### 开发时间优化
- **总开发时间**：1.5天（12小时）
- **后端开发时间**：从传统2天缩短至0.5天，效率提升75%
- **前端开发时间**：1天，专注于用户体验优化
- **集成测试时间**：0.5天，前后端并行开发减少等待时间

#### 质量保障措施
- **类型安全**：全程TypeScript，编译时错误检查
- **代码规范**：遵循现有ESLint和Prettier配置
- **测试覆盖**：核心功能100%测试覆盖
- **性能保证**：接口响应时间≤500ms，组件渲染时间≤100ms

### 5.4 风险缓冲和应急预案

#### 每日风险缓冲
- **缓冲时间**：每天预留1小时处理突发问题
- **技术支持**：现有CozePackage模块技术团队支持
- **代码回滚**：基于Git版本控制，支持快速回滚

#### 技术风险应对
- **接口兼容性**：严格遵循现有API设计规范
- **样式兼容性**：基于现有UI组件库，确保视觉一致性
- **数据兼容性**：复用现有数据模型，无数据结构变更风险

#### 业务连续性保障
- **零侵入性**：不影响现有Coze套餐管理功能
- **可禁用性**：新增功能可通过配置快速禁用
- **灰度发布**：支持按用户或环境逐步发布新功能

**总结**：本开发计划通过**深度代码复用**和**架构优化**，将开发周期压缩至1.5天，同时确保高质量交付。核心策略是**复用现有业务逻辑**，**专注前端用户体验**，实现**快速上线**和**低风险部署**的目标。

## 6. 开发完成标准

### 6.1 功能完成标准
- ✅ 所有13个文件开发完成
- ✅ 后端WebCozePackage模块正常运行
- ✅ 前端用户信息框新增Coze套餐展示
- ✅ 中英日三语国际化生效
- ✅ 接口响应时间≤500ms

### 6.2 质量完成标准
- ✅ 代码审查通过
- ✅ TypeScript类型检查通过
- ✅ 单元测试覆盖率≥80%
- ✅ 集成测试通过
- ✅ 性能测试达标

### 6.3 部署完成标准
- ✅ 开发环境部署成功
- ✅ 测试环境验证通过
- ✅ 零侵入性，不影响现有功能
- ✅ 支持快速回滚

---

**开发团队**：前端开发工程师、后端开发工程师
**预计工期**：1.5天（12小时）
**风险等级**：低风险（基于现有成熟架构）

**备注**：本计划基于BuildingAI现有技术架构，通过深度复用Coze套餐管理模块的核心代码，实现了**最小化开发、最大化复用、最快速交付**的目标。