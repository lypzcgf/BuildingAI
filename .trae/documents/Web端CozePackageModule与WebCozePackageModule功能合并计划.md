# Web端CozePackageModule与WebCozePackageModule功能合并计划

## 1. 项目背景与目标

### 1.1 现状分析
当前系统存在两个独立的Coze套餐管理模块：
- **Web端CozePackageModule** (`apps/server/src/modules/web/coze-package/`)：处理Web端Coze套餐相关功能
- **WebCozePackageModule** (`apps/server/src/web-coze-package/`)：独立的Web Coze套餐模块，提供用户套餐查询功能

这种架构导致：
- 代码重复维护
- 功能分散，增加开发复杂度
- API路径不统一，前端需要维护多套调用逻辑
- 模块职责边界不清晰

### 1.2 合并目标
通过彻底的功能合并，实现：
- **架构简化**：只保留一个增强版CozePackageModule
- **代码复用**：最大化复用控制台端成熟DTO和逻辑
- **路径统一**：所有API统一为 `/api/coze-package/*` 路径
- **零用户感知**：前端用户无感知迁移
- **维护简化**：降低后续开发和维护成本

## 2. 新架构设计

### 2.1 目标架构
```
apps/server/src/modules/web/coze-package/
├── controllers/
│   └── coze-package.controller.ts      # 功能增强，整合原web-coze-package功能
├── services/
│   └── coze-package.service.ts         # 功能增强，整合原web-coze-package功能
├── dto/
│   └── coze-package.dto.ts            # 尽可能复用控制台端成熟DTO
└── coze-package.module.ts              # 统一模块配置
```

### 2.2 核心设计原则
- **单一职责**：一个模块负责所有Coze套餐功能
- **接口兼容**：保持现有API路径和响应格式不变
- **代码复用**：最大化复用控制台端DTO和业务逻辑
- **渐进迁移**：分步骤实施，支持快速回滚

## 3. 详细重构范围

### 3.1 服务端重构清单

#### 3.1.1 增强现有文件
1. **coze-package.controller.ts**
   - 新增用户套餐查询接口：`GET /api/coze-package/user/current-package`
   - 新增用户套餐状态检查：`GET /api/coze-package/user/has-active-package`
   - 新增套餐剩余天数查询：`GET /api/coze-package/user/remaining-days`
   - 保持原有控制台端接口不变

2. **coze-package.service.ts**
   - 新增 `getUserCurrentPackage(userId: string)` 方法
   - 新增 `hasActivePackage(userId: string)` 方法
   - 新增 `getRemainingDays(userId: string)` 方法
   - 复用现有套餐查询和计算逻辑

3. **coze-package.dto.ts**
   - 复用控制台端DTO文件
   - 如需扩展，在现有DTO基础上增加字段
   - 保持接口响应格式兼容性

#### 3.1.2 修改相关文件
1. **user.controller.ts**
   - 删除 `WebCozePackageService` 依赖注入
   - 删除 `getUserInfo` 方法中的套餐信息获取逻辑
   - 保持用户信息接口的纯净性

2. **app.module.ts**
   - 删除 `WebCozePackageModule` 模块导入

#### 3.1.3 删除目标（合并完成后）
- 整个 `apps/server/src/web-coze-package/` 目录
- 所有相关的控制器、服务、DTO文件

### 3.2 文件修改清单及详细方案

#### 前端文件修改详情

**1. `src/api/coze-package.ts` - API路径统一**
```typescript
// 修改前：
export const getUserCozePackage = () => 
  http.get<UserCozePackage>('/web-coze-package/user/current-package')

// 修改后：
export const getUserCozePackage = () => 
  http.get<UserCozePackage>('/coze-package/user/current-package')

// 新增接口：
export const checkUserHasActivePackage = () => 
  http.get<boolean>('/coze-package/user/has-active-package')

export const getUserPackageRemainingDays = () => 
  http.get<number>('/coze-package/user/remaining-days')
```

**2. `src/composables/useCozePackage.ts` - 更新API调用**
```typescript
// 修改前：
const { data } = await getUserCozePackage()

// 修改后：
const { data } = await getUserCozePackage()
// 保持其他逻辑不变，仅确保API路径已更新

// 可选增强：添加新接口支持
const checkHasActivePackage = async () => {
  const { data } = await checkUserHasActivePackage()
  return data
}

const getRemainingDays = async () => {
  const { data } = await getUserPackageRemainingDays()
  return data
}
```

**3. `src/types/coze-package.ts` - 类型定义检查**
```typescript
// 检查是否需要调整以适配统一的DTO结构
export interface UserCozePackage {
  // 确保字段与控制端DTO保持一致
  id: string
  packageName: string
  packageType: string
  startTime: string
  endTime: string
  status: 'active' | 'expired' | 'pending'
  remainingDays: number
  // 其他必要字段...
}
```

**4. `src/components/user/user-profile.vue` - 无需修改**
```vue
<!-- 保持现有使用方式不变 -->
<script setup>
const { packageInfo, loading, error, fetchPackageInfo } = useCozePackage()
// 组合式函数内部已处理API路径更新，此处无需修改
</script>
```

**5. 国际化配置文件**
```json
// 检查是否需要添加新文案
{
  "cozePackage": {
    "active": "有效",
    "expired": "已过期",
    "pending": "待生效",
    "remainingDays": "剩余{{days}}天"
  }
}
```

#### 服务端文件修改详情

**1. `src/user/user.controller.ts` - 删除WebCozePackageService依赖**
```typescript
// 删除前：
import { WebCozePackageService } from '@modules/web-coze-package/services/web-coze-package.service'

@Controller('web/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly webCozePackageService: WebCozePackageService, // 删除此行
  ) {}

  @Get('info')
  async getUserInfo(@Request() req) {
    const user = req.user
    let packageInfo = null
    
    // 删除以下代码块：
    try {
      packageInfo = await this.webCozePackageService.getUserCurrentPackage(user.id)
    } catch (error) {
      // 静默处理，不影响主流程
    }
    
    return {
      user: userInfo,
      // packageInfo, // 删除此行
    }
  }
}
```

**2. `src/user/user.service.ts` - 清理Coze套餐相关业务逻辑**
```typescript
// 检查并删除与Coze套餐相关的业务逻辑（如有）
// 保持用户核心功能不变
```

#### 新增API接口实现

在增强的`coze-package.controller.ts`中添加以下接口：

```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common'
import { AuthGuard } from '@common/guards/auth.guard'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { CozePackageService } from './coze-package.service'

@ApiTags('Coze套餐管理')
@Controller('coze-package')
export class CozePackageController {
  constructor(private readonly cozePackageService: CozePackageService) {}

  @Get('user/current-package')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户当前有效套餐' })
  async getUserCurrentPackage(@Request() req) {
    const userId = req.user.id
    return this.cozePackageService.getUserCurrentPackage(userId)
  }

  @Get('user/has-active-package')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '检查用户是否有有效套餐' })
  async hasActivePackage(@Request() req) {
    const userId = req.user.id
    return this.cozePackageService.hasActivePackage(userId)
  }

  @Get('user/remaining-days')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取套餐剩余天数' })
  async getRemainingDays(@Request() req) {
    const userId = req.user.id
    return this.cozePackageService.getRemainingDays(userId)
  }
}
```

在增强的`coze-package.service.ts`中添加以下方法：
```typescript
/**
 * 获取用户当前有效套餐
 * @param userId 用户ID
 * @returns 用户当前有效套餐信息，如果没有有效套餐则返回null
 */
async getUserCurrentPackage(userId: string): Promise<UserCozePackageResponseDto | null> {
    try {
        // 复用现有的CozePackageOrderService中的getUserActivePackage方法
        const activePackage = await this.cozePackageOrderService.getUserActivePackage(userId);
        return activePackage || null;
    } catch (error) {
        this.logger.error(`获取用户当前有效套餐失败: ${error.message}`, error.stack);
        throw HttpExceptionFactory.internal(`获取用户当前有效套餐失败: ${error.message}`);
    }
}

/**
 * 检查用户是否有有效套餐
 * @param userId 用户ID
 * @returns 是否有有效套餐
 */
async hasActivePackage(userId: string): Promise<boolean> {
    try {
        const activePackage = await this.getUserCurrentPackage(userId);
        return activePackage !== null;
    } catch (error) {
        this.logger.error(`检查用户套餐状态失败: ${error.message}`, error.stack);
        return false;
    }
}

/**
 * 获取用户套餐剩余天数
 * @param userId 用户ID
 * @returns 剩余天数，如果没有有效套餐则返回0
 */
async getRemainingDays(userId: string): Promise<number> {
    try {
        const activePackage = await this.getUserCurrentPackage(userId);
        return activePackage ? activePackage.remainingDays : 0;
    } catch (error) {
        this.logger.error(`获取用户套餐剩余天数失败: ${error.message}`, error.stack);
        return 0;
    }
}
```

同时需要在构造函数中注入CozePackageOrderService，并添加必要的import语句：
```typescript
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CozePackageOrderService } from './coze-package-order.service'
import { UserCozePackageResponseDto } from '../dto/user-coze-package-response.dto'
import { HttpExceptionFactory } from '@common/exceptions/http-exception.factory'

@Injectable()
export class CozePackageService {
    private readonly logger = new Logger(CozePackageService.name)

    constructor(
        @InjectRepository(CozePackageConfig)
        private readonly cozePackageConfigRepository: Repository<CozePackageConfig>,
        private readonly cozePackageOrderService: CozePackageOrderService, // 新增注入
    ) {}

    // 现有方法保持不变...
}
```



#### 3.2.2 国际化配置
- 检查现有国际化配置是否足够
- 如需新增，在对应语言文件中补充

#### 3.2.3 类型定义
- 检查 `coze-package.ts` 类型定义是否与合并后的DTO匹配
- 如有差异，进行相应调整

## 4. 实施步骤与时间安排

#### 第1天：前端API路径统一
**时间安排**：8小时
**主要任务**：
- **上午（4小时）**：
  - 修改前端API文件：`apps/web/services/coze-package.ts`
  - 统一API路径从`/api/web-coze-package/*`到`/api/coze-package/*`
  - 更新`getUserCurrentPackage`、`hasActivePackage`、`getRemainingDays`接口调用
  - 检查并更新所有相关的API调用点
- **下午（4小时）**：
  - 修改类型定义文件：`apps/web/types/coze-package.ts`
  - 更新组合式函数：`apps/web/composables/useCozePackage.ts`
  - 检查用户资料页面：`apps/web/components/user/user-profile.vue`
  - 验证国际化配置文件的API路径引用

**交付物**：前端API路径统一完成
**验收标准**：所有前端API调用指向新路径，无404错误

#### 第2天：后端控制器增强开发
**时间安排**：8小时
**主要任务**：
- **上午（4小时）**：
  - 增强`apps/server/src/modules/web/coze-package/controllers/coze-package.controller.ts`
  - 新增`GET /api/coze-package/user/current-package`接口
  - 新增`GET /api/coze-package/user/has-active-package`接口
  - 新增`GET /api/coze-package/user/remaining-days`接口
  - 复用控制台端DTO文件进行参数验证
- **下午（4小时）**：
  - 实现接口的业务逻辑调用
  - 添加权限装饰器和访问控制
  - 配置Swagger文档注释
  - 编写接口单元测试

**交付物**：后端控制器增强完成
**验收标准**：新API接口可正常访问，返回数据格式正确

#### 第3天：后端服务层增强
**时间安排**：8小时
**主要任务**：
- **上午（4小时）**：
  - 增强`apps/server/src/modules/web/coze-package/services/coze-package.service.ts`
  - 注入`CozePackageOrderService`依赖
  - 实现`getUserCurrentPackage`方法逻辑
  - 实现`hasActivePackage`方法逻辑
  - 添加必要的import语句
- **下午（4小时）**：
  - 实现`getRemainingDays`方法逻辑
  - 添加完整的错误处理和日志记录
  - 编写服务层单元测试
  - 验证与`CozePackageOrderService`的集成

**交付物**：后端服务层增强完成
**验收标准**：服务方法逻辑正确，异常处理完善

#### 第4天：用户控制器清理
**时间安排**：8小时
**主要任务**：
- **上午（4小时）**：
  - 清理`apps/server/src/modules/web/user/controllers/user.controller.ts`
  - 删除`WebCozePackageService`依赖注入
  - 移除所有`WebCozePackageService`相关接口方法
  - 更新控制器构造函数和导入语句
- **下午（4小时）**：
  - 清理`apps/server/src/modules/web/user/services/user.service.ts`
  - 删除Coze套餐相关的业务逻辑
  - 更新服务层方法和依赖关系
  - 验证用户模块的其他功能不受影响

**交付物**：用户控制器清理完成
**验收标准**：用户模块无Coze套餐相关代码，功能正常

#### 第5天：模块依赖清理
**时间安排**：8小时
**主要任务**：
- **上午（4小时）**：
  - 检查并更新`apps/server/src/modules/web/web.module.ts`
  - 验证`CozePackageModule`的注册状态
  - 确保无需在`app.module.ts`中重复注册
  - 检查模块间的依赖关系
- **下午（4小时）**：
  - 清理`WebCozePackageModule`相关的所有导入
  - 更新模块提供商和导出配置
  - 验证模块加载顺序和依赖注入
  - 测试模块启动和初始化

**交付物**：模块依赖清理完成
**验收标准**：模块依赖关系清晰，无循环依赖

#### 第6天：WebCozePackageModule删除准备
**时间安排**：8小时
**主要任务**：
- **上午（4小时）**：
  - 备份`apps/server/src/web-coze-package`目录所有文件
  - 创建删除前的代码快照和文档
  - 验证所有功能已迁移到`CozePackageModule`
  - 检查是否有其他模块依赖`WebCozePackageModule`
- **下午（4小时）**：
  - 准备删除脚本和回滚方案
  - 文档记录删除的文件列表和影响范围
  - 验证数据库结构和数据不受影响
  - 准备删除后的验证测试用例

**交付物**：删除准备工作完成
**验收标准**：备份完整，回滚方案可行，无遗漏依赖

#### 第7天：WebCozePackageModule删除执行
**时间安排**：8小时
**主要任务**：
- **上午（4小时）**：
  - 执行删除`apps/server/src/web-coze-package`目录
  - 删除所有`WebCozePackageModule`相关文件
  - 清理相关的导入语句和引用
  - 更新项目结构和配置文件
- **下午（4小时）**：
  - 验证应用启动和模块加载
  - 运行回归测试确保功能正常
  - 检查日志和错误信息
  - 验证API端点访问正常

**交付物**：WebCozePackageModule删除完成
**验收标准**：应用正常启动，所有API功能正常

#### 第8天：前端功能验证
**时间安排**：8小时
**主要任务**：
- **上午（4小时）**：
  - 测试用户资料页面的Coze套餐信息显示
  - 验证`getUserCurrentPackage`接口调用和数据展示
  - 检查套餐剩余天数的计算和显示
  - 验证用户权限和访问控制
- **下午（4小时）**：
  - 测试不同用户状态的套餐信息显示
  - 验证无套餐用户的界面展示
  - 检查国际化文案的正确性
  - 测试响应式布局和移动端适配

**交付物**：前端功能验证完成
**验收标准**：前端功能正常，用户体验良好

#### 第9天：后端API集成测试
**时间安排**：8小时
**主要任务**：
- **上午（4小时）**：
  - 测试`GET /api/coze-package/user/current-package`接口
  - 测试`GET /api/coze-package/user/has-active-package`接口
  - 测试`GET /api/coze-package/user/remaining-days`接口
  - 验证接口返回数据格式和状态码
- **下午（4小时）**：
  - 测试异常情况的处理和错误响应
  - 验证权限控制和访问限制
  - 检查日志记录和监控告警
  - 进行性能基准测试

**交付物**：后端API集成测试完成
**验收标准**：所有API接口功能正常，性能达标

#### 第10天：数据一致性验证
**时间安排**：8小时
**主要任务**：
- **上午（4小时）**：
  - 验证用户套餐数据的一致性
  - 检查订单状态和套餐信息的同步
  - 测试数据查询的准确性和完整性
  - 验证时间计算和剩余天数的正确性
- **下午（4小时）**：
  - 进行数据回归测试
  - 检查历史数据的兼容性
  - 验证数据迁移的完整性
  - 测试数据备份和恢复机制

**交付物**：数据一致性验证完成
**验收标准**：数据准确无误，历史数据完整

#### 第11天：权限安全测试
**时间安排**：8小时
**主要任务**：
- **上午（4小时）**：
  - 测试未登录用户的访问限制
  - 验证不同角色用户的权限差异
  - 测试越权访问的防护机制
  - 检查敏感数据的访问控制
- **下午（4小时）**：
  - 进行安全漏洞扫描
  - 测试SQL注入和XSS防护
  - 验证数据加密和传输安全
  - 检查审计日志的完整性

**交付物**：权限安全测试完成
**验收标准**：权限控制严格，安全无漏洞

#### 第12天：性能压力测试
**时间安排**：8小时
**主要任务**：
- **上午（4小时）**：
  - 进行并发用户访问测试
  - 测试高负载下的接口响应时间
  - 验证数据库查询性能优化
  - 检查缓存机制的有效性
- **下午（4小时）**：
  - 进行大数据量压力测试
  - 测试内存使用和垃圾回收
  - 验证系统资源消耗
  - 检查异常情况和恢复机制

**交付物**：性能压力测试完成
**验收标准**：系统性能稳定，响应时间达标

#### 第13天：部署配置和环境测试
**时间安排**：8小时
**主要任务**：
- **上午（4小时）**：
  - 配置开发环境部署参数
  - 更新测试环境的配置信息
  - 验证环境变量和配置文件
  - 测试数据库连接和依赖服务
- **下午（4小时）**：
  - 配置生产环境部署
  - 编写部署脚本和自动化流程
  - 进行环境切换测试
  - 验证回滚机制和应急预案

**交付物**：部署配置完成
**验收标准**：各环境部署正常，切换无问题

#### 第14天：最终验收和文档完善
**时间安排**：8小时
**主要任务**：
- **上午（4小时）**：
  - 进行最终功能验收测试
  - 用户验收测试（UAT）
  - 验证所有业务流程的完整性
  - 检查系统稳定性和可靠性
- **下午（3.2小时）**：
  - 完善技术文档和操作手册
  - 更新系统架构图和接口文档
  - 编写部署和维护指南
  - 项目交付准备和总结
- **配置集成（0.8小时）**：
  - 最终配置检查和优化
  - 确认监控告警配置
  - 验证备份和恢复策略

**交付物**：项目最终交付
**验收标准**：所有功能验收通过，文档齐全