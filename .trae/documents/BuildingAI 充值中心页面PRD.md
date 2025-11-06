# BuildingAI 充值中心页面 PRD

## 概述
- 页面路径：`/profile/personal-rights/recharge-center`
- 入口组件：`apps/web/app/profile/personal-rights/recharge-center.vue`
- 通过 `definePageMeta({ layout: 'setting', title: 'menu.rechargeCenter', inSystem: true, inLinkSelector: true })` 自动挂载到“个人权益”分组，并被 `system-page-provider.vue` 实时收录到链接选择器。
- 提供用户侧算力（Power）充值闭环：套餐选择 → 下单 → 扫码支付 → 轮询结果 → 到账反馈；后台可开关与动态配置。

## 用户角色与权限
| 角色 | 权限 |
|----|------|
| 登录用户 | 可见可买；功能关闭时展示“暂未开放”锁屏 |
| 游客 | 需登录后使用 |

## 导航与入口
- 左侧菜单硬编码在 `core/layouts/setting.vue` 数组 `items`，国际化 key：
  - 分组：`common.label.personalRights`
  - 子项：`common.personalRights.rechargeCenter`
- 路由： `/profile/personal-rights/recharge-center`
- 链接选择器：由 `system-page-provider.vue` 扫描 `meta.inLinkSelector && meta.inSystem` 自动收录，无需手动注册。

## 页面结构
1. 用户信息卡片：头像、昵称、算力余额（`user.power`）
2. 套餐选择：
   - 数据源 `RechargeCenterInfo.rechargeRule`（`id/power/givePrice/sellPrice/label`）
   - 默认选中首项；无数据展示“暂无充值选项”
3. 支付方式：
   - 数据源 `RechargeCenterInfo.payWayList`（`payType/name/logo`）
   - 单选卡片，默认 `payType = 1`（微信支付）
4. 充值说明：
   - 读取后台字典 `recharge_explain`；为空用国际化兜底
5. 结算栏：合计金额、立即购买按钮
6. 支付弹窗：
   - 展示二维码 `PrepaidInfo.qrCode.code_url`
   - 120 s 超时失效，支持“刷新二维码”重新调用 `prepaid` 并重启轮询
   - 服务条款跳转 `/agreement?type=agreement&item=payment`
7. 成功反馈弹窗：充值成功、继续充值/查看记录

## 核心流程
1. 进入页调用 `getRechargeCenterInfo()`：
   - 服务端读取字典 `recharge_status` 控制开关；`recharge_explain` 填充说明
2. 立即购买：
   - `recharge({id,payType}) → OrderInfo`
   - `prepaid({from:"recharge",orderId,payType}) → PrepaidInfo` 并弹窗
3. 轮询：每 3 s `getPayResult({orderId,from:"recharge"})`
   - `payStatus===1` 停止轮询，刷新用户算力，展示成功弹窗
   - 120 s 超时显示失效层，可刷新二维码重启流程
4. 取消/关闭：清除定时器，toast 提示“取消支付”

## 数据模型
```typescript
interface RechargeCenterInfo {
  payWayList: {logo,name,payType}[]
  rechargeExplain: string
  rechargeRule:  {id,power,givePower,sellPrice,label}[]
  rechargeStatus: boolean
  user: {avatar,id,power,username}
}
interface OrderInfo   {orderAmount,orderId,orderNo}
interface PrepaidInfo {payType,qrCode:{code_url}}
interface PayResult   {id,orderNo,payStatus}  // 0未付 1已付
```

## 接口规范
- `GET  /recharge/center`              → RechargeCenterInfo
- `POST /recharge/submitRecharge`      → OrderInfo
- `POST /pay/prepay`                   → PrepaidInfo
- `GET  /pay/getPayResult`             → PayResult

服务端复用 console 实体：
- `RechargeOrder` / `Recharge` / `Payconfig` / `User` / `Dict`
- Web 模块注册链：`apps/server/src/modules/web/recharge/recharge.modeule.ts` → `web.module.ts`

## 文案与多语言
key 速查（zh 示例，同 key 存在于 en/jp）：
- `common.label.personalRights`            → “个人权益”
- `common.personalRights.rechargeCenter`   → “充值中心”
- `menu.rechargeCenter`                    → “充值中心”
- `web-personal-rights.rechargeCenter.*`   → 页面内所有操作文案

## 验收标准
- [ ] 正确展示用户信息、套餐、支付方式；无套餐时禁用购买
- [ ] 下单并弹出二维码；120 s 超时可刷新重试
- [ ] 支付成功 3 s 内识别，算力余额与明细同步更新
- [ ] 功能关闭时显示“暂未开放”锁屏，菜单仍可见
- [ ] 国际化 key 与三语文件保持一致，服务条款链接可访问
- [ ] 埋点事件（进入页/下单/二维码加载/成功/超时/刷新/取消）均已上报

## 国际化 key 速查表
| key | 文件 | 示例值 |
|---|---|---|
| common.label.personalRights | common.json | 个人权益 |
| common.personalRights.rechargeCenter | common.json | 充值中心 |
| menu.rechargeCenter | menu.json | 充值中心 |
| web-personal-rights.rechargeCenter.selectRechargePackage | web-personal-rights.json | 选择充值套餐 |
| web-personal-rights.rechargeCenter.paymentMethod | web-personal-rights.json | 支付方式 |
| web-personal-rights.rechargeCenter.rechargeInstructions.title | web-personal-rights.json | 充值说明 |
| web-personal-rights.rechargeCenter.immediatelyPurchase | web-personal-rights.json | 立即购买 |
| web-personal-rights.rechargeCenter.qrCodeExpired | web-personal-rights.json | 二维码失效，请刷新 |
| web-personal-rights.rechargeCenter.rechargeSuccess | web-personal-rights.json | 充值成功 |

## 核心文件索引
- 页面：`apps/web/app/profile/personal-rights/recharge-center.vue`
- 布局：`apps/web/core/layouts/setting.vue`
- 链接选择器：`apps/web/common/components/console/link-picker/providers/system-page-provider.vue`
- 数据模型：`apps/web/models/recharge-center.d.ts`
- Web 接口：`apps/web/services/web/recharge-center.ts`
- 服务端：
  - Controller：`apps/server/src/modules/web/recharge/controllers/recharge.controller.ts`
  - Service：`apps/server/src/modules/web/recharge/services/recharge.service.ts`
  - Module：`apps/server/src/modules/web/recharge/recharge.modeule.ts`