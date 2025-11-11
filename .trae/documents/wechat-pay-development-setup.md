# 微信支付开发环境配置指南

## 概述

本文档为开发者提供在本地开发环境中配置和测试微信支付的完整指南。基于项目代码分析，系统已集成微信支付功能，需要正确配置才能使用。

## 系统架构分析

### 支付相关文件结构
```
apps/
├── server/src/modules/pay/          # 支付服务模块
│   ├── services/
│   │   ├── pay.service.ts          # 主支付服务
│   │   ├── wxpay.service.ts        # 微信支付服务
│   │   └── payfactory.service.ts   # 支付工厂服务
│   ├── entities/
│   │   └── payconfig.entity.ts     # 支付配置实体
│   └── controllers/
│       └── pay.controller.ts       # 支付接口控制器
├── web/app/console/system-setting/payConfig/  # 管理后台支付配置
└── web/core/i18n/                   # 国际化配置
```

### 支付流程
1. 用户选择充值套餐并点击"立即购买"
2. 系统调用 `/api/pay/prepay` 接口创建预支付订单
3. 支付服务根据配置创建微信支付订单
4. 返回支付参数给前端，调起微信支付
5. 用户完成支付后，微信发送异步通知
6. 系统处理支付结果，更新订单状态和用户权益

## 开发环境配置

### 1. 基础环境要求

- Node.js 18+
- PostgreSQL 数据库
- Redis（可选，用于缓存）
- 微信开发者账号

### 2. 微信支付账号准备

#### 注册微信商户平台账号
1. 访问 [微信商户平台](https://pay.weixin.qq.com)
2. 完成企业认证（需要营业执照等资质）
3. 开通JSAPI支付产品

#### 注册微信开放平台账号
1. 访问 [微信开放平台](https://open.weixin.qq.com)
2. 创建应用，获取APPID
3. 绑定商户号到应用

### 3. 本地开发配置

#### 数据库初始化
系统启动时会自动创建初始支付配置：
```typescript
// apps/server/src/core/database/database-init.service.ts
await this.payConfigRepository.save([
    {
        name: "微信支付",
        payType: PayConfigPayType.WECHAT,
        isEnable: BooleanNumber.YES,
        isDefault: BooleanNumber.YES,
        logo: "/static/images/wxpay.png",
        sort: 0,
        payVersion: PayVersion.V3,
        merchantType: Merchant.ORDINARY,
    },
]);
```

#### 配置支付参数

访问管理后台：`http://localhost:4090/console/system-setting/payConfig`

需要配置的参数：

| 参数 | 字段名 | 获取方式 |
|------|--------|----------|
| 商户号 | mchId | 微信商户平台 → 账户信息 |
| APPID | appId | 微信开放平台 → 应用管理 |
| API密钥 | apiKey | 微信商户平台 → API安全 → 设置APIv3密钥 |
| 支付证书 | cert | 微信商户平台 → API安全 → 申请证书 |
| 支付密钥 | paySignKey | 同上，apiclient_key.pem内容 |

### 4. 开发环境微信支付测试方案

#### 方案一：使用微信沙箱环境（推荐）

**申请沙箱环境**
1. 登录微信商户平台
2. 进入"产品中心"→"开发配置"
3. 申请开通沙箱环境

**配置沙箱参数**
```typescript
// 在支付配置中使用沙箱参数
{
    mchId: "沙箱商户号",
    apiKey: "沙箱API密钥",
    cert: "沙箱证书内容",
    paySignKey: "沙箱密钥内容"
}
```

**沙箱环境特点**
- 无需真实资金交易
- 支持完整的支付流程测试
- 提供专用的测试接口

#### 方案二：使用内网穿透

**安装ngrok**
```bash
# 下载并安装ngrok
wget https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip
unzip ngrok-stable-linux-amd64.zip
```

**启动穿透服务**
```bash
# 注册ngrok账号并获取authtoken
ngrok authtoken your_token_here

# 启动http穿透
ngrok http 4090
```

**配置回调地址**
将ngrok提供的公网地址配置为支付回调URL。

#### 方案三：模拟支付流程

**创建测试接口**
```typescript
// apps/server/src/modules/pay/controllers/pay.controller.ts
@Post('test-callback')
async testCallback(@Body() callbackData: any) {
    // 模拟微信回调
    return await this.payService.handleWxPayCallback(callbackData);
}
```

**手动触发回调**
```bash
curl -X POST http://localhost:3000/api/pay/test-callback \
  -H "Content-Type: application/json" \
  -d '{
    "out_trade_no": "订单号",
    "result_code": "SUCCESS",
    "total_fee": 1000
  }'
```

### 5. 调试和验证

#### 日志配置
```typescript
// apps/server/src/modules/pay/services/wxpay.service.ts
this.logger.log('微信支付配置:', {
    mchId: this.config.mchId,
    appId: this.config.appId,
    // 注意：不要记录敏感信息如密钥
});
```

#### 数据库验证
```sql
-- 检查支付配置
SELECT * FROM payconfig WHERE pay_type = 1;

-- 检查订单状态
SELECT * FROM recharge_order ORDER BY created_at DESC LIMIT 10;

-- 检查用户权益
SELECT * FROM user_rights WHERE user_id = '用户ID';
```

#### API测试
```bash
# 测试预支付接口
curl -X POST http://localhost:3000/api/pay/prepay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "packageId": "套餐ID",
    "from": "recharge"
  }'
```

## 常见问题解决

### 1. 证书相关问题

**错误：证书格式错误**
```
Error: PEM_read_bio_PrivateKey failed
```
**解决**：
- 确保证书包含完整的BEGIN和END标记
- 检查证书内容是否完整复制
- 验证证书文件格式是否正确

### 2. 网络连接问题

**错误：连接微信支付服务器失败**
```
Error: connect ETIMEDOUT api.mch.weixin.qq.com:443
```
**解决**：
- 检查服务器网络连接
- 确认防火墙允许443端口
- 验证DNS解析是否正常

### 3. 签名验证失败

**错误：签名错误**
```
Error: Signature verification failed
```
**解决**：
- 检查API密钥是否正确
- 确认签名算法实现正确
- 验证时间戳是否在有效范围内

### 4. 回调处理问题

**错误：回调处理失败**
```
Error: Callback processing failed
```
**解决**：
- 检查回调URL是否可访问
- 验证回调数据格式
- 确认业务逻辑处理正确

## 安全最佳实践

### 1. 密钥管理
- 使用环境变量存储敏感信息
- 定期轮换API密钥
- 不要在代码中硬编码密钥

### 2. 输入验证
```typescript
// 验证支付参数
const schema = object({
    packageId: string().uuid().required(),
    from: string().valid('recharge', 'coze').required()
});
```

### 3. 日志脱敏
```typescript
// 记录日志时脱敏处理
this.logger.log('支付请求', {
    ...params,
    apiKey: '[REDACTED]',
    cert: '[REDACTED]'
});
```

### 4. 权限控制
```typescript
// 确保支付配置只能管理员访问
@Permissions({
    code: "update",
    name: "更新支付配置",
    description: "需要管理员权限"
})
```

## 测试用例

### 正常支付流程测试
1. 选择充值套餐
2. 创建预支付订单
3. 调起微信支付
4. 完成支付
5. 验证回调处理
6. 检查用户权益更新

### 异常场景测试
1. 支付超时处理
2. 支付失败处理
3. 重复支付处理
4. 退款处理
5. 网络异常处理

### 边界条件测试
1. 最小支付金额
2. 最大支付金额
3. 并发支付处理
4. 订单状态一致性

## 性能优化

### 1. 缓存策略
```typescript
// 缓存支付配置
@Cacheable('payconfig', 3600)
async getPayconfig(payType: PayConfigType) {
    return await this.repository.findOne({
        where: { isEnable: BooleanNumber.YES, payType }
    });
}
```

### 2. 数据库优化
```sql
-- 添加索引优化查询
CREATE INDEX idx_payconfig_pay_type ON payconfig(pay_type);
CREATE INDEX idx_recharge_order_user_id ON recharge_order(user_id);
CREATE INDEX idx_recharge_order_status ON recharge_order(status);
```

### 3. 异步处理
```typescript
// 异步处理支付结果
@OnEvent('pay.success')
async handlePaySuccess(payload: PaySuccessEvent) {
    // 异步更新用户权益、发送通知等
}
```

## 监控和告警

### 1. 支付成功率监控
```typescript
// 记录支付指标
this.metrics.increment('pay.attempt', 1, { type: 'wxpay' });
this.metrics.increment('pay.success', 1, { type: 'wxpay' });
```

### 2. 异常告警
```typescript
// 支付异常告警
if (errorRate > 0.1) {
    this.alert.send('支付异常告警', {
        errorRate,
        recentErrors: errorLogs
    });
}
```

## 总结

通过以上配置和测试方案，开发者可以在本地环境中安全、高效地开发和测试微信支付功能。建议按照以下顺序进行：

1. 首先使用微信沙箱环境进行基础功能测试
2. 然后使用内网穿透测试真实支付流程
3. 最后在生产环境部署前进行全面的集成测试

记住始终遵循安全最佳实践，保护好敏感信息，确保支付系统的安全性和稳定性。