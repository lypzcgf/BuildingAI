# BuildingAI算力套餐管理页面PRD

## 1. 产品概述

BuildingAI算力套餐管理页面是面向平台管理员的后台管理功能，基于Vue3 + Nuxt3 + TypeScript技术栈开发，使用@fastbuildai/ui组件库构建现代化管理界面。该页面用于配置和管理用户充值套餐的相关参数，通过Dict字典表和Recharge实体表实现数据存储，支持中文、英文、日文多语言环境。

管理员可以通过该页面控制充值功能的开启状态、设置充值说明文案，以及管理不同算力套餐的充值数量、赠送数量、售价和标签等核心参数。系统采用NestJS + TypeORM后端架构，提供完整的权限控制和数据验证机制。

该功能旨在为平台提供灵活的充值套餐配置能力，支持根据业务需求动态调整套餐规则，通过事务性操作确保数据一致性，提升用户充值体验和平台运营效率。

## 2. 核心功能

### 2.1 用户角色
| 角色 | 权限代码 | 权限说明 | 核心权限 |
|------|----------|----------|----------|
| 系统管理员 | recharge-config:getConfig | 查看充值配置权限 | 获取充值配置、查看套餐规则 |
| 系统管理员 | recharge-config:setConfig | 设置充值配置权限 | 保存配置、新增套餐、编辑套餐、删除套餐 |

### 2.2 功能模块
算力套餐管理页面包含以下核心模块：
1. **功能状态控制**：基于Dict字典表的充值功能全局开关控制
2. **充值说明配置**：基于Dict字典表的充值相关用户说明文案设置
3. **套餐规则管理**：基于Recharge数据表的算力套餐增删改查操作
4. **数据变更检测**：实时监控配置变更状态，智能启用保存按钮
5. **事务安全保障**：使用数据库事务确保配置保存的原子性

### 2.3 页面详情

| 页面名称 | 模块名称 | 功能描述 |
|----------|----------|----------|
| 算力套餐管理页面 | 功能状态控制 | 使用USwitch组件控制充值功能启用状态，数据存储在Dict表(key: recharge_status, group: recharge_config) |
| 算力套餐管理页面 | 充值说明配置 | 使用UTextarea组件设置充值说明文案，支持6行多行文本输入，数据存储在Dict表(key: recharge_explain, group: recharge_config) |
| 算力套餐管理页面 | 套餐规则表格 | 使用UTable组件展示套餐规则，包含序号、充值数量、赠送数量、售价(元)、标签、操作列 |
| 算力套餐管理页面 | 套餐新增功能 | 点击"新增套餐"按钮添加新规则，使用Tabler图标库的plus图标，支持实时编辑 |
| 算力套餐管理页面 | 套餐编辑功能 | 表格内嵌UInput组件直接编辑，支持数字类型验证和小数点后2位价格设置 |
| 算力套餐管理页面 | 套餐删除功能 | 使用trash图标的删除按钮，支持实时移除套餐规则 |
| 算力套餐管理页面 | 智能保存功能 | 实时检测数据变更(watch监听)，变更时启用保存按钮，支持事务性批量保存 |

## 3. 核心流程

管理员操作流程：
1. 管理员登录后台系统
2. 进入算力套餐管理页面
3. 根据需要开启/关闭充值功能
4. 设置充值说明文案
5. 配置套餐规则（新增、编辑、删除）
6. 保存配置
7. 用户端即可看到更新后的套餐选项

```mermaid
graph TD
    A[管理员登录] --> B[进入套餐管理页面]
    B --> C[配置功能状态]
    C --> D[设置充值说明]
    D --> E[管理套餐规则]
    E --> F[新增套餐]
    E --> G[编辑套餐]
    E --> H[删除套餐]
    F --> I[保存配置]
    G --> I
    H --> I
    I --> J[配置生效]
```

## 4. 用户界面设计

### 4.1 设计风格
- **主色调**：蓝色系（primary color）作为主色，灰色系作为辅助色
- **按钮样式**：圆角按钮，主要操作使用实心按钮（color="primary"），次要操作使用轮廓按钮（variant="outline"）
- **字体**：系统默认字体，标题使用font-bold，正文使用常规字重
- **布局风格**：基于@fastbuildai/ui组件库的现代化设计，使用flex布局和gap间距
- **图标风格**：使用Tabler图标库（tabler:plus、tabler:trash），简洁线性风格
- **组件库**：基于@fastbuildai/ui统一组件库，确保设计一致性

### 4.2 页面设计概览

| 页面名称 | 模块名称 | UI元素 |
|----------|----------|--------|
| 算力套餐管理页面 | 功能状态控制 | USwitch组件，标题"功能状态"(text-md font-bold)，描述文字"启用后用户可以访问充值功能"(text-xs text-muted-foreground) |
| 算力套餐管理页面 | 充值说明配置 | UTextarea组件(6行)，标题"充值说明"，占位符"请输入套餐充值说明..."，仅在充值状态开启时显示 |
| 算力套餐管理页面 | 套餐规则管理 | UTable组件，固定表格布局(table-fixed)，包含序号、充值数量、赠送数量、售价(带"元"后缀)、标签、操作列 |
| 算力套餐管理页面 | 表格内编辑 | UInput组件，支持type="number"，售价支持min="0" step="0.01"，实时双向绑定 |
| 算力套餐管理页面 | 操作按钮区 | 新增按钮（蓝色轮廓，tabler:plus图标）、保存按钮（蓝色实心，智能启用/禁用状态） |

### 4.3 响应式设计
- 桌面优先设计，基于Tailwind CSS响应式类
- 表格使用border-separate border-spacing-0样式，支持横向滚动
- 按钮使用固定宽度(w-16)和居中对齐，移动端友好
- 使用AccessControl组件进行权限控制显示

## 5. 功能需求

### 5.1 功能状态管理
- **需求描述**：管理员可以通过USwitch组件控制充值功能的全局启用状态
- **技术实现**：
  - 数据存储：Dict表，key="recharge_status"，group="recharge_config"
  - 组件绑定：v-model="rechargeStatus"，支持双向数据绑定
  - 状态监听：watch监听状态变更，实时更新changeValue标识
- **业务规则**：
  - 关闭状态下，用户端充值功能不可访问，隐藏充值说明配置区域
  - 开启状态下，显示充值说明配置和套餐规则管理
- **验证规则**：@IsBoolean装饰器验证，状态变更需要保存后生效

### 5.2 充值说明配置
- **需求描述**：设置向用户展示的充值说明文案
- **技术实现**：
  - 数据存储：Dict表，key="recharge_explain"，group="recharge_config"
  - 组件实现：UTextarea组件，rows="6"，支持多行文本输入
  - 条件渲染：v-if="rechargeStatus"，仅在充值功能开启时显示
- **业务规则**：
  - 支持多行文本输入，占位符"请输入套餐充值说明..."
  - 文案内容在用户充值页面展示
  - 可以为空，但建议填写完整的充值规则说明
- **验证规则**：@IsOptional + @IsString装饰器验证

### 5.3 套餐规则管理
- **需求描述**：管理算力充值套餐的各项参数
- **技术实现**：
  - 数据存储：Recharge表，包含id、power、givePower、sellPrice、label字段
  - 组件实现：UTable + UInput组件，支持表格内直接编辑
  - 数据类型：power(integer)、givePower(integer)、sellPrice(decimal 10,2)、label(varchar 64)
- **业务规则**：
  - 充值数量(power)：必须大于0的整数
  - 赠送数量(givePower)：不能小于0的整数
  - 售价(sellPrice)：必须大于0的数值，支持小数点后2位，带"元"单位显示
  - 标签(label)：套餐显示名称，不能为空
- **验证规则**：
  - 前端：type="number"、min="0"、step="0.01"验证
  - 后端：RechargeRuleDto数据传输对象验证
  - 实时数据变更检测：deep watch监听数组变化

### 5.4 数据持久化
- **需求描述**：配置数据的保存和加载
- **技术实现**：
  - 变更检测：watch监听rechargeStatus、rechargeExplain、rechargeRules三个数据源
  - 保存逻辑：使用数据库事务(entityManager.transaction)确保原子性操作
  - 成功提示：使用useMessage().success()显示保存成功消息
- **业务规则**：
  - 智能检测数据变更，变更时启用保存按钮(:disabled="!changeValue")
  - 保存成功后显示成功提示，重新获取最新配置
  - 页面加载时自动获取当前配置(onMounted)
- **验证规则**：
  - 保存前进行完整的数据验证，包含数值范围和必填项检查
  - 支持批量操作：新增、更新、删除套餐规则的事务性处理

## 6. API设计

### 6.1 获取充值配置
```
GET /api/console/recharge-config
```

**权限要求**：@Permissions('getConfig')
**技术实现**：
- 查询Dict表获取recharge_status和recharge_explain
- 查询Recharge表获取所有套餐规则，按id排序
- 数据转换：Dict.value转换为对应类型

**响应数据**：
```json
{
  "rechargeStatus": true,
  "rechargeExplain": "充值说明文案",
  "rechargeRule": [
    {
      "id": 1,
      "power": 1000,
      "givePower": 100,
      "sellPrice": 10.00,
      "label": "初级套餐"
    }
  ]
}
```

### 6.2 保存充值配置
```
POST /api/console/recharge-config
```

**权限要求**：@Permissions('setConfig')
**技术实现**：
- 使用UpdateRechargeConfigDto进行数据验证
- 数据库事务操作：先更新Dict表，再批量处理Recharge表
- 支持新增、更新、删除套餐规则的原子性操作

**请求参数**：
```json
{
  "rechargeStatus": true,
  "rechargeExplain": "充值说明文案",
  "rechargeRule": [
    {
      "id": 1,
      "power": 1000,
      "givePower": 100,
      "sellPrice": 10.00,
      "label": "初级套餐"
    }
  ]
}
```

**UpdateRechargeConfigDto验证规则**：
| 字段名 | 类型 | 验证规则 | 说明 |
|--------|------|----------|------|
| rechargeStatus | boolean | @IsBoolean | 充值功能开关状态 |
| rechargeExplain | string | @IsOptional @IsString | 充值说明，可选 |
| rechargeRule | RechargeRuleDto[] | @IsArray @ValidateNested | 套餐规则数组 |

**RechargeRuleDto验证规则**：
| 字段名 | 类型 | 验证规则 | 说明 |
|--------|------|----------|------|
| id | number | @IsOptional @IsNumber | 套餐ID，新增时不传 |
| power | number | @IsNumber @Min(1) | 充值数量，必须大于0 |
| givePower | number | @IsNumber @Min(0) | 赠送数量，不能小于0 |
| sellPrice | number | @IsNumber @Min(0.01) | 售价，必须大于0，支持2位小数 |
| label | string | @IsString @IsNotEmpty | 套餐标签，不能为空 |

## 7. 验收标准

### 7.1 功能验收
- [ ] 充值状态开关(USwitch)正常工作，能够控制功能模块显示/隐藏
- [ ] 充值说明配置(UTextarea)保存和显示正确，支持多行文本
- [ ] 套餐规则的增删改查功能完整，支持表格内直接编辑
- [ ] 数据验证规则生效：power>0、givePower>=0、sellPrice>0、label非空
- [ ] 保存功能正常，数据持久化成功，支持事务回滚
- [ ] 实时变更检测正常，changeValue状态准确反映数据变化
- [ ] 权限控制：getConfig和setConfig权限验证有效

### 7.2 界面验收
- [ ] 页面布局符合@fastbuildai/ui设计规范
- [ ] USwitch、UTextarea、UTable、UInput组件样式一致
- [ ] 响应式设计在不同设备上正常显示，使用Tailwind CSS
- [ ] 交互反馈及时：保存按钮状态、成功提示、加载状态
- [ ] 多语言显示正确：中文、英文、日文通过vue-i18n切换
- [ ] Tabler图标显示正确：ti-plus、ti-trash等

### 7.3 权限验收
- [ ] 只有具备getConfig权限的用户可以查看配置
- [ ] 只有具备setConfig权限的用户可以修改配置
- [ ] AccessControl组件正确控制按钮和操作的显示
- [ ] 权限控制粒度正确，功能隔离有效

### 7.4 性能验收
- [ ] 页面加载时间在可接受范围内(<2秒)
- [ ] 数据保存响应及时(<1秒)，使用数据库事务确保一致性
- [ ] 大量套餐规则时性能稳定(>100条记录)
- [ ] 实时数据监听不影响页面性能

### 7.5 兼容性验收
- [ ] 主流浏览器兼容性良好(Chrome、Firefox、Safari、Edge)
- [ ] 移动端适配正确，触摸操作友好
- [ ] 不同分辨率下显示正常(1920x1080、1366x768、移动端)
- [ ] Vue3 + Nuxt3 + TypeScript技术栈稳定运行

### 7.6 数据验证验收
- [ ] 前端验证：input type="number"、min、step属性生效
- [ ] 后端验证：UpdateRechargeConfigDto和RechargeRuleDto验证规则生效
- [ ] 数据类型验证：integer、decimal(10,2)、varchar(64)约束有效
- [ ] 边界值测试：最小值、最大值、空值、特殊字符处理正确