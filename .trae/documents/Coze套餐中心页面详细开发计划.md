# Coze 套餐中心页面详细开发计划

> 对应 PRD：`.trae/documents/Coze套餐中心页面PRD.md`  
> 对应技术架构：`.trae/documents/Coze套餐中心页面技术架构.md`

## 1. 项目背景与目标
基于《Coze套餐中心页面技术架构.md》在 10 天内交付「Coze 套餐中心」完整功能，确保与充值中心一致的交互体验，100 % 复用现有支付网关与后端 Console 能力。

## 2. 需求范围
与 PRD 一致，零新增功能；所有文件路径、国际化 key、接口名、字典 key、错误码 100 % 与技术架构对齐。

## 3. 技术实现要点（源码级）
- 页面路径：`apps/web/app/profile/personal-rights/coze-package-center.vue`
- 布局复用：`apps/web/core/layouts/setting.vue` 硬编码菜单，key：
  - 分组标题 `common.label.personalRights`
  - 子菜单 `common.personalRights.cozePackageCenter`
- 数据模型：`apps/web/models/coze-package-center.d.ts`
- 接口封装：`apps/web/services/web/coze-package-center.ts`
- 国际化：
  - `common.json` 新增上述菜单 key
  - `menu.json` 页面标题 `menu.cozePackageCenter`
  - `web-personal-rights.json` 页面静态文案前缀 `cozePackageCenter.*`
- 后端：
  - 控制器 `apps/server/src/modules/web/coze-package/controllers/coze-package.controller.ts`
  - 服务 `apps/server/src/modules/web/coze-package/services/coze-package.service.ts`
  - 模块 `apps/server/src/modules/web/coze-package/coze-package.module.ts` 已导入 `WebModule`
- 支付时序：下单→预支付→轮询→成功刷新权益
- 异常码：套餐下架 400、支付方式非法 400、订单幂等 200 复用单号
- WebModule 注册：`apps/server/src/modules/web/web.module.ts` 需引入 `WebCozePackageModule`，确保后端启动时加载 Coze 套餐相关控制器与服务。

## 4. 开发时间计划（10 天 × 8 h = 80 人时）

| 任务 | 文件路径 | 前端 | 后端 | 联调 | 测试 | 前置依赖 | 验收标准 |
| ---- | ---- | ---- | ---- | ---- | ---- | -------- | -------- |
| **Day1 后端 Controller/Service/Module** | ` apps/server/src/modules/web/coze-package/services/coze-package.service.ts; apps/server/src/modules/web/coze-package/controllers/coze-package.controller.ts; apps/server/src/modules/web/coze-package/coze-package.module.ts;apps/server/src/modules/web/web.module.ts` | 0 | 1 | 0 | 0 | 技术架构接口清单 | Swagger 200；字段与前端模型一致；后端启动无缺失依赖；Swagger文档冻结 |
| **Day1 下午 支付集成修改** | `apps/server/src/common/interfaces/pay.interface.ts; apps/server/src/modules/web/pay/pay.module.ts; apps/server/src/modules/web/pay/services/pay.service.ts` | 0 | 0.5 | 0 | 0 | CozePackageOrder实体已存在 | PayFrom.COZE枚举定义；支付模块注入CozePackageOrder；prepay/getPayResult支持from='coze' |
| **Day2 上午 数据模型定义** | `apps/web/models/coze-package-center.d.ts` | 0.5 | 0 | 0 | 0 | 技术架构评审通过 | 模型编译通过；字段与接口契约一一对应 |
| **Day2 下午 服务契约与调用骨架** | `apps/web/services/web/coze-package-center.ts` | 0 | 0 | 0 | 0.5 | 技术架构评审通过 | 服务函数骨架完成；契约在技术架构文档对齐 |
| **Day3 前端页面骨架/路由/布局菜单** | `apps/web/app/profile/personal-rights/coze-package-center.vue; apps/web/core/layouts/setting.vue` | 1 | 0 | 0 | 0 | WebModule 可插拔 | 路由可访问；菜单高亮；系统链接可见（`meta.inSystem=true`） |
| **Day4 套餐列表/支付区/下单** | `apps/web/services/web/coze-package-center.ts; apps/web/app/profile/personal-rights/coze-package-center.vue; apps/web/core/i18n/{zh,en,jp}/web-personal-rights.json` | 1 | 0 | 0 | 0 | 接口 `/web/coze-package/center` | 列表渲染；支付方式绑定；下单返回 `orderId/orderNo` |
| **Day5 二维码弹窗 & 轮询** | `apps/web/services/web/coze-package-center.ts; apps/web/app/profile/personal-rights/coze-package-center.vue; apps/web/core/i18n/{zh,en,jp}/web-personal-rights.json` | 1 | 0 | 0 | 0 | 接口 `/pay/prepay` 带 `from='coze'` | 二维码展示；3 s 轮询；120 s 超时文案 `cozePackageCenter.qrExpired` |
| **Day6 国际化 & 全局异常处理** | `apps/web/core/i18n/{zh,en,jp}/common.json; apps/web/core/i18n/{zh,en,jp}/menu.json; apps/web/core/i18n/{zh,en,jp}/web-personal-rights.json; apps/web/app/profile/personal-rights/coze-package-center.vue` | 1 | 0 | 0 | 0 | 文案终稿 & 异常码表 | 三语 key 完整；4xx/5xx toast；超时可刷新重试 |
| **Day7 联调 + 支付走通** | `apps/server/src/modules/web/coze-package/services/coze-package.service.ts; apps/web/services/web/coze-package-center.ts; apps/web/app/profile/personal-rights/coze-package-center.vue` | 0 | 0 | 1 | 0 | 测试商户号 | 预支付返回真实二维码；支付成功停止轮询；到账刷新；P95≤600ms；错误率<1% |
| **Day8 多语言回归 + 异常回归** | `apps/web/core/i18n/{zh,en,jp}/common.json; apps/web/core/i18n/{zh,en,jp}/menu.json; apps/web/core/i18n/{zh,en,jp}/web-personal-rights.json; apps/web/app/profile/personal-rights/coze-package-center.vue` | 0.5 | 0 | 0 | 0.5 | 无 | 三语切换无缺失；异常场景提示与码表一致 |
| **Day9 性能优化 & 埋点** | `apps/web/app/profile/personal-rights/coze-package-center.vue; apps/web/services/web/coze-package-center.ts` | 0.5 | 0 | 0 | 0.5 | 埋点方案 | 中心接口 60 s 缓存；LCP < 2.5 s；PostHog 事件 5 个 |
| **Day10 上线 checklist & 回滚演练** | `apps/server/src/modules/web/web.module.ts` | 0.5 | 0 | 0 | 0.5 | 配置端文案已配 | 零阻塞 bug；文档归档；tag 打 `v1.0-coze-package`；数据面验证 |

**工时小计**：前端 10 人日、后端 4.5 人日、联调 2 人日、测试 2 人日，**合计 18.5 人日**（80 人时内完成）。

## 5. 前置依赖总览
1. 设计稿：无 UI 改动，复用充值中心样式。  
2. 文案终稿：`cozePackageCenter.*` 全部 key 已列于 PRD。  
3. 接口契约：技术架构「11. 接口细化」表。  
4. 字典配置：后台录入 `coze_package_status=true`、`coze_package_explain`（支持 HTML）。  
5. 支付商户：测试环境微信/支付宝商户号已配置。  
6. 权限：个人中心登录态中间件已开启。
7. 支付集成：以下支付相关文件需修改以支持Coze套餐支付功能：
   - `apps/server/src/common/interfaces/pay.interface.ts`：新增 `PayFrom.COZE` 枚举
   - `apps/server/src/modules/web/pay/pay.module.ts`：注入 `CozePackageOrder` 实体
   - `apps/server/src/modules/web/pay/services/pay.service.ts`：实现Coze套餐订单预支付和状态查询  

## 6. 验收标准（可量化）
| 维度 | 指标 | 达标值 |
| ---- | ---- | ------ |
| 功能 | 主流程端到端 | 100 % 用例通过（下单→扫码→支付成功→权益到账） |
| 接口 | 成功率 | ≥ 99 %（非第三方原因） |
| 性能 | 中心接口响应 | P95 ≤ 300 ms（缓存命中） |
| 国际化 | key 缺失率 | 0 %（`pnpm lint:i18n`） |
| 异常 | 提示准确率 | 100 %（文案与错误码表一致） |
| 埋点 | 事件上报 | 5 个事件全部到达 PostHog |

## 7. 风险与缓解
| 风险 | 级别 | 缓解方案 | 责任人 |
| ---- | ---- | -------- | ------ |
| 支付通道不稳定 | 高 | 预置支付宝备用通道；配置开关 30 min 内切换 | 后端负责人 |
| 二维码 120 s 过期体验差 | 中 | 已提供刷新按钮；超时文案明确 | 前端负责人 |
| 多语言 key 遗漏阻塞上线 | 低 | CI lint 强制检测；MR 阻塞合并 | 测试负责人 |

## 8. 上线检查清单
- [ ] 配置端 `coze_package_status=true` 已开启  
- [ ] 套餐配置 ≥1 条且 `enabled=true`  
- [ ] 文案 `coze_package_explain` 已录入并审核  
- [ ] 支付集成文件修改完成：`PayFrom.COZE`枚举、`CozePackageOrder`实体注入、支付服务支持`from='coze'`  
- [ ] 测试环境完整走单成功 ≥3 次  
- [ ] 埋点事件在 PostHog 实时可查  
- [ ] 三语切换无空白 key  
- [ ] 性能压测：中心接口 200 QPS 缓存命中 CPU < 30 %  
- [ ] 代码审计：无 SQL 拼接、无硬编码密钥  
- [ ] 版本 tag `v1.0-coze-package` 已打  

## 9. 回滚方案
1. 前端回滚：  
   ```bash
   git revert <coze-package-commit> && git push origin main
   ```  
   Vercel 自动回滚，CDN 缓存 5 min 失效。  
2. 后端回滚：  
   ```bash
   kubectl rollout undo deployment/web-backend
   ```  \   10 s 内完成，旧 Pod 保留 1 份用于排查。  
3. 配置回滚：  
   后台立即设置 `coze_package_status=false`，1 min 内入口隐藏。  

---
版本：v1.0 | 作者：技术团队 | 日期：2025-06