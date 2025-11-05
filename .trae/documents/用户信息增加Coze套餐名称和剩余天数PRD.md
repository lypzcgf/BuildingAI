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
采用接口合并方案，在现有`/api/web/user/info`接口中增加Coze套餐信息：

**模块依赖配置** (`user.module.ts`):
```typescript
// 引入WebCozePackageModule
import { WebCozePackageModule } from '../../../web-coze-package/web-coze-package.module';

@Module({
  imports: [WebCozePackageModule], // 添加模块依赖
})
export class UserModule {}
```

**控制器实现** (`user.controller.ts`):
```typescript
// 注入WebCozePackageService
constructor(
  private readonly webCozePackageService: WebCozePackageService,
) {}

@Get('info')
async getUserInfo(@Request() req) {
  const userInfo = await this.userService.getUserInfo(req.user.id);
  
  // 获取Coze套餐信息并合并到返回结果
  const cozePackage = await this.webCozePackageService.getUserPackageSummary(req.user.id);
  
  return {
    ...userInfo,
    cozePackage, // 新增Coze套餐信息
  };
}
```

### 7.2 前端实现
**类型定义扩展** (`user.d.ts`):
```typescript
export interface UserCozePackageSummary {
  status: 'active' | 'expired' | 'none';
  packageName?: string;
  remainingDays?: number;
  expireTime?: string;
}

export interface UserInfo {
  // ... 现有字段
  cozePackage?: UserCozePackageSummary; // 新增Coze套餐信息
}
```

**组件实现** (`ProfileInfoRow.vue`):
- 直接读取`userStore.userInfo?.cozePackage`数据
- 根据套餐状态显示不同内容和样式
- 支持国际化文案显示

**状态展示逻辑**:
```vue
<template>
  <div class="coze-package-info">
    <span v-if="userStore.userInfo?.cozePackage?.status === 'active'">
      {{ userStore.userInfo.cozePackage.packageName }}
      <span :class="{ 'text-red-500': remainingDays <= 7 }">
        ({{ $t('profile.remaining_days', { days: remainingDays }) }})
      </span>
    </span>
    <span v-else-if="userStore.userInfo?.cozePackage?.status === 'expired'">
      {{ $t('profile.package_expired') }}
    </span>
    <span v-else>
      {{ $t('profile.no_package') }}
    </span>
  </div>
</template>
```

### 7.3 数据流架构
```
用户请求 → UserController → UserService (获取用户信息)
                ↓
        WebCozePackageService (获取套餐信息)
                ↓
        合并数据返回 → 前端userStore → ProfileInfoRow组件
```

## 8. 术语定义

| 术语 | 定义 |
|------|------|
| Coze套餐 | BuildingAI平台提供的AI算力套餐服务 |
| 剩余天数 | 当前有效套餐距离到期日的天数 |
| 即将到期 | 剩余天数≤7天的状态 |
| 零数据库变更 | 不新增、不修改任何数据库表结构 |
| 深度复用 | 最大化利用现有代码和服务，减少重复开发 |
| 接口合并方案 | 在现有接口中合并多个数据源，减少前端API调用次数 |