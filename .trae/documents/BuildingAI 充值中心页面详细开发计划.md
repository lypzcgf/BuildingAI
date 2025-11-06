# BuildingAI 充值中心页面详细开发计划

## 1. 项目背景与目标
基于《BuildingAI 充值中心页面技术架构.md》实现充值中心完整功能，确保 14 天内交付可上线版本。

## 2. 需求范围
与 PRD 一致，不再新增功能；所有文件路径、国际化 key、方法名 100% 与技术架构对齐。

## 3. 技术实现要点（源码级）
- 页面路径：`apps/web/app/console/profile/personal-rights/recharge-center/recharge-center.vue`
- 布局复用：`apps/web/core/layouts/setting.vue` 硬编码菜单，key：
  - 分组标题 `common.label.personalRights`
  - 子菜单 `common.personalRights.rechargeCenter`
- 数据模型：`apps/web/models/recharge-center.d.ts`
- 接口封装：`apps/web/services/recharge-center.ts`
- 国际化：
  - `common.json` 新增上述菜单 key
  - `menu.json` 页面标题 `menu.rechargeCenter`
  - `web-personal-rights.json` 页面静态文案前缀 `rechargeCenter.*`
- 后端：
  - 控制器 `apps/server/src/recharge/recharge.controller.ts`
  - 服务 `apps/server/src/recharge/recharge.service.ts`
  - 模块 `apps/server/src/recharge/recharge.module.ts` 已导入 `WebModule`
- 支付时序：下单→预支付→轮询→成功刷新算力
- 异常码：充值关闭 400、支付方式非法 400、订单幂等

## 4. 开发时间计划（14 天 × 8h = 112 人时）

### Day1 页面骨架与路由
上午 4h
- 新建 `recharge-center.vue` 1-80 行：`<template>` 空壳 + `<script setup>` 定义 `definePageMeta({layout:'setting',title:'menu.rechargeCenter',inSystem:true,inLinkSelector:true})`
- 确认 Nuxt3 自动路由 `/profile/personal-rights/recharge-center` 可访问

下午 4h
- 新建 `models/recharge-center.d.ts` 1-60 行：导出 `RechargeCenterInfo / RechargeRule / PayWayList / User / OrderParams / OrderInfo / PrepaidParams / PrepaidInfo / QrCode / PayResult` 接口，与后端字段 100% 对齐
- 新建 `services/recharge-center.ts` 1-40 行：封装 `getRechargeCenterInfo / recharge / prepaid / getPayResult` 四个函数，使用 `useWebGet / useWebPost`

验收：页面 200 渲染无报错；接口文件编译通过

### Day2 UI 组件与状态
上午 4h
- `recharge-center.vue` 80-200 行：用户信息卡片（头像、昵称、剩余算力）+ 套餐选择 `URadioGroup` 绑定 `selectedRuleId`
- 引入 `useUserStore` 并在支付成功后主动 `getUser()` 刷新算力

下午 4h
- `recharge-center.vue` 200-320 行：支付方式列表 `v-for payWayList` 绑定 `selectedPayType`；充值说明 `v-html rechargeExplain`
- 样式纯 Tailwind，无 scoped

验收：套餐/支付方式切换交互正常；说明富文本渲染正确

### Day3 支付流程与弹窗
上午 4h
- `recharge-center.vue` 320-400 行：「立即购买」按钮禁用逻辑 `!selectedRuleId || !selectedPayType`；点击调用 `recharge()` 得到 `OrderInfo` 后 `showQrDialog = true`

下午 4h
- `recharge-center.vue` 400-520 行：`ProModal` 二维码弹窗，展示 `qrCode.code_url`；提供「刷新二维码」按钮重新调用 `prepaid()`
- 轮询函数 `startPolling()` 3s 间隔调用 `getPayResult()`，成功即 `clearInterval` 并 `handlePaySuccess()`

验收：下单→弹窗→轮询→支付成功流程跑通；120s 超时自动停止并允许刷新

### Day4 国际化与错误（含 setting.vue 硬编码菜单）

**时间**：8 人时（上午 4h + 下午 4h）

#### 上午（4h）
1. 硬编码菜单（apps/web/core/layouts/setting.vue）
   - 在 `items` 计算属性追加「个人权益」分组：
     - 分组标题 key：`common.label.personalRights` → common.json
     - 子菜单 key：`common.personalRights.rechargeCenter` → common.json
     - 路由路径：`/profile/personal-rights/recharge-center`
     - 图标：`i-lucide-badge-dollar-sign`
     - 高亮逻辑：`:variant="soft" :color="primary"` 当 `category.to === route.path`
   - 追加「个人中心」分组（已存在，仅核对 key）
     - 分组标题 key：`common.label.profile`
   - 提交代码并跑通 `/profile/personal-rights/recharge-center` 访问

2. 国际化 key 补录（apps/web/core/i18n/zh/common.json）
   - 确认已存在：
     ```json
     "label": { "profile": "个人中心", "personalRights": "个人权益" },
     "personalRights": { "rechargeCenter": "充值中心" }
     ```
   - 同步到 en、jp 文件，保持 key 一致

#### 下午（4h）
3. 全局错误处理
   - 统一用 `useMessage()` toast 提示
   - 接口 4xx/5xx：catch 后直接展示后端返回的 `message` 字段
   - 二维码 120s 超时：前端硬编码提示「二维码已过期，请刷新重试」
   - 网络断开：提示「网络异常，请检查网络后重试」

4. 单元测试与验收
   - 左侧导航分组标题多语言切换正常（zh/en/jp）
   - 路由切换时对应按钮高亮状态正确（soft + primary）
   - 所有异常场景 toast 文案正确出现
   - 覆盖率 ≥ 80%（国际化、高亮、错误分支）

**交付物**
- setting.vue（含硬编码菜单及高亮逻辑）
- common.json（zh/en/jp 三语 key 完整）
- 错误处理工具函数（useMessage 封装）

**验收标准**
- 通过 `/profile/personal-rights/recharge-center` 访问无 404
- 切换语言左侧菜单文案即时更新
- 二维码超时 toast 文案与需求一致

- `core/i18n/zh/common.json` 追加：
  ```json
  "label": { "personalRights": "个人权益" },
  "personalRights": { "rechargeCenter": "充值中心" }
  ```
- common.json（zh/en/jp 三语 key 完整） 
 
- `core/i18n/zh/menu.json` 追加：
  ```json
  "rechargeCenter": "充值中心"
  ```
- menu.json（zh/en/jp 三语 key 完整）

- `core/i18n/zh/web-personal-rights.json` 追加 `rechargeCenter.*` 层级全部文案（套餐、支付、弹窗、成功提示）
- web-personal-rights.json（zh/en/jp 三语 key 完整）  

下午 4h
- 全局异常捕获：接口 catch → `useMessage()` toast；充值关闭 400、支付方式非法 400 直接提示后端返回 message
- 二维码 120s 过期前端硬编码倒计时，超时文案 `rechargeCenter.qrExpired`

验收：三语切换无缺失 key；所有异常有 toast 提示

### Day5 布局菜单与链接选择器
上午 4h
- `core/layouts/setting.vue` 已存在硬编码 `items` 计算属性，确认子菜单 `to: '/profile/personal-rights/recharge-center'` 路由高亮逻辑 `:variant="soft" :color="primary"` 正常

下午 4h
- `common/components/console/link-picker/providers/system-page-provider.vue` 扫描逻辑不变，确认 `meta.inLinkSelector && meta.inSystem` 后列表可见，搜索与高亮正常

验收：左侧导航分组标题与文案多语言切换正常；路由切换时按钮高亮正确

### Day6 后端控制器与接口
上午 4h
- `apps/server/src/recharge/recharge.controller.ts`：
  - `GET /recharge/center` → `this.rechargeService.center(user)`
  - `POST /recharge/submitRecharge` 接收 `OrderParams` → `this.rechargeService.submitRecharge(user, dto)`

下午 4h
- 统一使用 `@Playground()` 注入当前用户；`@BuildFileUrl()` 自动拼接文件域名；异常直接抛 `HttpExceptionFactory`

验收：两接口 Swagger 200 返回结构与前端模型一致

### Day7 后端服务与事务
上午 4h
- `apps/server/src/recharge/recharge.service.ts`：
  - `center()` 读取字典 `recharge_status / recharge_explain`，组装 `RechargeCenterInfo`
  - 复用现有 `RechargeOrder / Recharge / Payconfig / Dict` 实体，不新增表

下午 4h
- `submitRecharge()` 幂等：订单号 `generateNo()` 全局唯一；校验支付方式仅开启微信；事务内写入订单并返回 `OrderInfo`

验收：事务回滚场景验证；订单号唯一索引生效

### Day8 模块注册与依赖
上午 4h
- `apps/server/src/recharge/recharge.module.ts`：`TypeOrmModule.forFeature([Dict, RechargeOrder, Recharge, User, Payconfig])` + 导出 `RechargeService`

下午 4h
- `apps/server/src/modules/web/web.module.ts`：`imports: [RechargeModule]` 确保前端路由能注入控制器

验收：后端启动无缺失依赖；控制器路由注册成功

### Day9 支付网关联调（预支付）
上午 4h
- 对接现有 `/pay/prepay` 接口，传入 `orderId / payType / from='recharge'` 获取 `qrCode.code_url`

下午 4h
- 二维码 base64 与 url 兼容处理；失败时前端弹窗提示「支付通道繁忙」

验收：测试环境可拿到真实二维码；失败重试正常

### Day10 支付结果轮询与通知
上午 4h
- 复用 `/pay/getPayResult` 轮询，返回 `payStatus=1` 即成功；后端幂等读

下午 4h
- 120s 超时前端自动停止；支付成功即刷新 `user.power` 并弹出成功 Modal，提供「继续充值 / 查看记录」按钮

验收：成功到账后用户算力实时更新；超时文案正确

### Day11 多语言补全与校验
上午 4h
- 英/日翻译补全，确保 `common / menu / web-personal-rights` 三文件 key 完全一致

下午 4h
- 运行 `pnpm run lint:i18n` 校验无缺失 key；CI 自动检测通过

验收：三语切换无空白；lint 0 错误

### Day12 权限与异常场景
上午 4h
- 充值开关关闭场景：后端抛 400，前端弹窗「充值已关闭」
- 支付方式非法：同上，直接提示后端 message

下午 4h
- 未登录访问 `/profile/personal-rights/recharge-center` 被全局中间件重定向 `/login`

验收：所有异常码均测试通过；未登录重定向正常

### Day13 性能与埋点
上午 4h
- `/recharge/center` 接口加 60s Edge Functions 缓存；LCP < 2.5s

下午 4h
- 关键事件埋点：进入页面、选择套餐、下单、支付成功、超时刷新，统一上报 PostHog

验收：缓存生效；埋点控制台可实时查看

### Day14 回归与交付
上午 4h
- 全链路回归：套餐→下单→扫码→轮询→到账→算力刷新→记录列表

下午 4h
- 文档归档：更新《BuildingAI 充值中心页面详细开发计划.md》与《BuildingAI 充值中心页面技术架构.md》版本号 v1.0；输出 Swagger 链接、测试报告、上线 checklist

验收：零阻塞 bug；所有验收要点通过

## 5. 风险与应对
| 风险 | 级别 | 应对 |
|----|----|----|
| 支付通道不稳定 | 高 | 预留支付宝备用通道，配置开关 1 天完成 |
| 二维码 120s 过期用户体验差 | 中 | 已提供刷新按钮，文案提示明确 |
| 多语言 key 遗漏 | 低 | CI lint 强制检测，MR 阻塞 |

## 6. 交付清单
- 源码：上述 11 个文件已全量提交 MR
- 文档：本计划 + 技术架构 v1.0
- 测试：Swagger 用例 6 个、端到端用例 10 个
- 上线：配置端已开启充值开关，运营文案已配置

---
版本：v1.0 | 作者：技术团队 | 日期：2025-06