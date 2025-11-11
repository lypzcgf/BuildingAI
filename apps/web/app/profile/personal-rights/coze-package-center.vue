<template>
  <div class="p-6">
    <!-- 用户信息卡片 -->
    <div class="bg-muted mb-6 flex items-center gap-4 rounded-lg p-4">
      <UAvatar :src="userStore.userInfo?.avatar" size="3xl" />
      <div>
        <div class="text-lg font-medium">
          <span>{{ userStore.userInfo?.nickname || t('common.profile.notSet') }}</span>
        </div>
        <div class="text-muted-foreground flex items-center gap-2">
          <UIcon name="i-lucide-package" class="text-sm" />
          <span>
            {{ t('console-common.cozePackage') }}：
            <template v-if="userStore.userInfo?.cozePackage">
              {{ userStore.userInfo!.cozePackage!.packageName }}
              （{{ t('console-common.remainingDaysPrefix') }} {{ userStore.userInfo!.cozePackage!.remainingDays }}{{ t('console-common.dayUnit') }}）
            </template>
            <template v-else>
              {{ t('console-common.noPackage') }}（{{ t('console-common.remainingDaysPrefix') }} 0{{ t('console-common.dayUnit') }}）
            </template>
          </span>
        </div>
      </div>
    </div>

    <!-- 请选择Coze套餐提示（始终显示） -->
    <h2 class="text-lg font-medium mb-4">
      {{ t('web-personal-rights.cozePackage.selectPackagePrompt') }}
    </h2>

    <!-- 套餐卡片列表 -->
    <div v-if="pending" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <!-- 骨架屏：模拟真实卡片结构，提升 LCP 感知 -->
      <div v-for="i in 3" :key="i" class="rounded-xl border bg-card p-4 space-y-4">
        <USkeleton class="h-6 w-1/2" />
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-5/6" />
        <USkeleton class="h-10 w-full mt-4" />
      </div>
    </div>

    <div v-else-if="list.length" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="(item, index) in list"
        :key="item.id"
        class="rounded-xl border bg-card p-4 flex flex-col cursor-pointer transition-all"
        :class="{ 'border-primary ring-2 ring-primary/30': selectedIndex === index }"
        @click="selectedIndex = index"
      >
        <h3 class="font-semibold text-foreground">{{ item.name }}</h3>
        <p v-if="item.description" class="text-sm text-muted-foreground mt-1">{{ item.description }}</p>
        <div class="mt-4 flex items-baseline gap-2">
          <div class="text-2xl font-bold text-foreground">
            ¥<span>{{ Number(item.currentPrice).toFixed(2) }}</span>
          </div>
          <div v-if="Number(item.originalPrice) > Number(item.currentPrice)" class="text-sm text-muted-foreground line-through">
            ¥{{ Number(item.originalPrice).toFixed(2) }}
          </div>
        </div>
        <ul class="mt-4 space-y-1 text-sm text-muted-foreground">
          <li>• 有效期 {{ item.duration }} 天</li>
        </ul>
      </div>
    </div>

    <!-- 空态 -->
    <div v-else class="rounded-xl border bg-card p-6 text-center">
      <UIcon name="i-lucide-inbox" class="mx-auto h-10 w-10 text-muted-foreground" />
      <p class="mt-2 text-sm font-medium text-foreground">
        {{ $t('web-personal-rights.cozePackage.emptyTitle') }}
      </p>
      <p class="text-xs text-muted-foreground">
        {{ $t('web-personal-rights.cozePackage.emptyDesc') }}
      </p>
    </div>

    <!-- 支付方式区 -->
    <div class="mt-8 space-y-4">
      <h2 class="text-lg font-medium">
        {{ t('web-personal-rights.rechargeCenter.paymentMethod') }}
      </h2>
      <URadioGroup
        v-model="selectedPayment"
        orientation="horizontal"
        variant="card"
        color="primary"
        :items="paymentMethods"
      >
        <template #label="{ item }">
          <div class="flex items-center gap-2">
            <UAvatar :src="item.icon" size="2xs" />
            <span>{{ item.label }}</span>
          </div>
        </template>
      </URadioGroup>
    </div>

    <!-- 套餐说明 -->
    <div class="mt-6 space-y-2">
      <h2 class="text-lg font-medium">
        {{ t('web-personal-rights.rechargeCenter.rechargeInstructions.title') }}
      </h2>
      <div v-if="instructions" v-html="instructions" class="text-muted-foreground text-sm whitespace-pre-wrap"></div>
      <div v-else class="text-muted-foreground text-sm">
        {{ t('web-personal-rights.cozePackage.instructions.default') }}
      </div>
    </div>

    <!-- 操作区：同一行显示 服务条款 + 合计金额 + 立即购买 -->
    <div class="flex items-center justify-between border-t pt-4">
      <!-- 左侧：服务条款 -->
      <div class="text-lg">
        <span class="text-muted-foreground text-sm">{{ t('web-personal-rights.rechargeCenter.agreement') }}</span>
        <UButton variant="link" class="p-0" @click="toServiceTerms">
          《{{ appStore.siteConfig?.agreement.paymentTitle || t('web-personal-rights.rechargeCenter.payment') }}》
        </UButton>
      </div>
      <!-- 右侧：合计金额 + 立即购买按钮 -->
      <div class="flex items-center gap-4">
        <div class="text-xl font-bold">¥ {{ totalPrice }}</div>
        <UButton color="primary" class="min-w-36" :disabled="!currentPackage" @click="handleBuy()">
          {{ t('web-personal-rights.rechargeCenter.immediatelyPurchase') }}
        </UButton>
      </div>
    </div>

    <!-- 支付弹窗（与充值中心一致：ProModal + img 二维码） -->
    <ProModal
      :ui="{ content: 'max-w-sm overflow-y-auto h-fit' }"
      :title="$t('web-personal-rights.paymentDialog.title')"
      :model-value="paymentOpen"
      @update:model-value="handleCancel"
    >
      <template #default>
        <div class="flex flex-col items-center justify-center gap-2">
          <div class="relative h-52 w-52">
            <img v-if="qrUrl" class="w-full" :src="qrUrl" alt="支付二维码" />
            <div
              v-if="expired"
              class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm dark:bg-gray-800/60"
            >
            <UIcon name="i-lucide-alert-triangle" class="mb-2 text-5xl text-yellow-500" />
            <p class="mb-2 text-sm text-gray-700 dark:text-gray-300">
              {{ $t('web-personal-rights.cozePackage.qrExpired') }}
            </p>
            <UButton class="cursor-pointer" size="xs" @click="handleRefresh">
              {{ $t('web-personal-rights.paymentDialog.refreshQr') }}
            </UButton>
          </div>
          </div>
          <p v-if="paid" class="text-sm text-green-600">
            {{ $t('web-personal-rights.paymentDialog.paid') }}
          </p>
          <p v-else class="text-sm text-muted-foreground">
            {{ $t('web-personal-rights.paymentDialog.waitPay') }}
          </p>
          <p v-if="!paid && !expired" class="text-xs text-muted-foreground">
            {{ $t('web-personal-rights.paymentDialog.expireIn', { sec: remainSec }) }}
          </p>

        </div>
      </template>
    </ProModal>

    <!-- 支付成功提示，与充值中心一致 -->
    <ProModal
      :ui="{ content: 'max-w-xs overflow-y-auto h-fit' }"
      :title="t('web-personal-rights.rechargeCenter.systemTip')"
      :model-value="rechargeSuccess"
      @update:model-value="close"
    >
      <div class="space-y-4">
        <div class="flex flex-col items-center justify-center gap-2 p-4">
          <div class="flex items-center justify-center gap-2">
            <UIcon name="tabler:circle-check-filled" class="text-2xl text-green-500" />
            <h1 class="text-xl font-bold">
              {{ t('web-personal-rights.rechargeCenter.rechargeSuccess') }}
            </h1>
          </div>
          <p class="text-muted-foreground text-sm">
            {{ t('web-personal-rights.rechargeCenter.rechargeSuccessTip') }}
          </p>
        </div>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="soft" @click="close"> 继续充值 </UButton>
          <UButton color="primary" type="submit" @click="toRechargeRecord"> 查看记录 </UButton>
        </div>
      </div>
    </ProModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, watchEffect, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead, useNuxtApp, definePageMeta, useAsyncData } from '#imports'
import { useRouter } from 'vue-router'
import type { CozePackageItem, CreateOrderResp } from '~/services/web/coze-package-center'
import { apiCozePackageCenter, apiCozePackageCreateOrder, apiPayPrepay, apiPayGetPayResult } from '~/services/web/coze-package-center'
import { ProModal } from '@fastbuildai/ui'

const { t } = useI18n()
const { $posthog } = useNuxtApp() as any
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

// 页面曝光埋点
onMounted(() => {
  $posthog?.capture('recharge_center_view')
})

// 拉取套餐列表（统一异常处理）
const { data, pending } = await useAsyncData('cozePackageCenter', () => apiCozePackageCenter(), {
  onError(err: any) {
    const status = err?.status || err?.response?.status
    if (status >= 400 && status < 500) {
      useSonner.error(t('common.message.networkError'))
    } else if (status >= 500) {
      useSonner.error(t('common.message.serverError'))
    } else {
      useSonner.error(err?.data?.message || t('common.message.networkError'))
    }
  }
})
const list = computed(() => data.value?.list || [])
const payWayList = computed(() => data.value?.payWayList || [])

watchEffect(() => {
  // 调试输出：观察数据加载状态与返回结构
  console.log('=== DEBUG INFO ===')
  console.log('pending:', pending.value)
  console.log('data:', data.value)
  console.log('list:', list.value)
  console.log('list.length:', Array.isArray(list.value) ? list.value.length : 'not-array')
})

// 选择与支付方式
const selectedIndex = ref<number>(0)
const currentPackage = computed<CozePackageItem | undefined>(() => list.value?.[selectedIndex.value])
const totalPrice = computed(() => currentPackage.value ? Number(currentPackage.value.currentPrice).toFixed(2) : '0.00')

interface PaymentMethod { value: 'wechat' | 'alipay'; label: string; icon: string }
const paymentMethods = ref<PaymentMethod[]>([])
const selectedPayment = ref<'wechat' | 'alipay'>('wechat')
const instructions = ref<string>('')

// 下单状态
const paymentOpen = ref(false)
const order = ref<CreateOrderResp | null>(null)

/**
 * 点击购买：先创建订单，再弹出支付二维码（统一异常处理）
 */
async function handleBuy() {
  if (!currentPackage.value) return
  const item = currentPackage.value
  $posthog?.capture('select', { package_id: item.id, package_name: item.name })
  const start = performance.now()
  try {
    // TODO: Day8 回归测试后删除以下 4 种异常注入
    // 1) 404 资源不存在
    // throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    // 2) 500 服务器内部错误
    // throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' })
    // 3) 模拟请求超时（前端 5s 超时）
    // await new Promise(resolve => setTimeout(resolve, 6000))
    // 4) 网络错误（主动断网）
    // await $fetch('/api/network-error')

    const orderResp = await apiCozePackageCreateOrder({
      packageId: (item.id as unknown as string),
      paymentMethod: selectedPayment.value
    })
    const cost = performance.now() - start
    console.debug('[metrics] createOrder cost:', cost.toFixed(2), 'ms')
    order.value = orderResp
    paymentOpen.value = true
    // 下单成功埋点
    $posthog?.capture('create_order', { order_id: orderResp.orderId, package_id: item.id })
    // 二维码展示埋点
    $posthog?.capture('qr_show', { order_id: orderResp.orderId })
  } catch (err: any) {
    const cost = performance.now() - start
    console.debug('[metrics] createOrder error cost:', cost.toFixed(2), 'ms')
    const status = err?.status || err?.response?.status
    if (status >= 400 && status < 500) {
      useSonner.error(t('common.message.networkError'))
    } else if (status >= 500) {
      useSonner.error(t('common.message.serverError'))
    } else {
      useSonner.error(err?.data?.message || t('web-personal-rights.cozePackage.createOrderError'))
    }
  }
}

/**
 * 支付完成回调
 */
function onPaid() {
  paymentOpen.value = false
  rechargeSuccess.value = true
  // 支付成功埋点
  if (order.value) {
    $posthog?.capture('pay_success', { order_id: order.value.orderId })
  }
  // 可扩展：刷新用户权益、跳转订单详情等
}

// SEO
useHead({
  title: () => t('web-personal-rights.cozePackage.title'),
  link: [
    // 预加载关键 CSS（提升 LCP）
    { rel: 'preload', href: '/_nuxt/css/app.css', as: 'style' },
  ]
})

// 页面元信息（与充值中心保持一致的技术架构）
definePageMeta({
  layout: 'setting',
  title: 'menu.cozePackageCenter',
  inSystem: true,
  inLinkSelector: true,
})

// ===== PaymentDialog 逻辑内联 =====
const qrUrl = ref('')
const expireAt = ref(0)   // 秒级时间戳
const paid = ref(false)
const expired = computed(() => expireAt.value && Date.now() / 1000 > expireAt.value)
const remainSec = computed(() => Math.max(0, expireAt.value - Math.floor(Date.now() / 1000)))
const rechargeSuccess = ref<boolean>(false)

let pollTimer: any = 0

async function loadQr() {
  if (!order.value) return
  const start = performance.now()
  try {
    const { codeUrl, expireAt: exp } = await apiPayPrepay({ orderId: order.value.orderId, from: 'coze' })
    const cost = performance.now() - start
    console.debug('[metrics] prepay cost:', cost.toFixed(2), 'ms')
    qrUrl.value = codeUrl
    expireAt.value = exp
    startPoll()
  } catch (e: any) {
    const cost = performance.now() - start
    console.debug('[metrics] prepay error cost:', cost.toFixed(2), 'ms')
    useSonner.error(e?.data?.message || t('web-personal-rights.paymentDialog.loadQrError'))
  }
}

function startPoll() {
  stopPoll()
  pollTimer = setInterval(async () => {
    if (!order.value || expired.value || paid.value) return
    try {
      const start = performance.now()
      const { payStatus } = await apiPayGetPayResult({ orderId: order.value.orderId, from: 'coze' })
      const cost = performance.now() - start
      console.debug('[metrics] queryPayResult cost:', cost.toFixed(2), 'ms')
      if (payStatus === 1) {
        paid.value = true
        stopPoll()
        onPaid()
      }
    } catch {}
  }, 3000)
}

function stopPoll() {
  clearInterval(pollTimer)
  pollTimer = 0
}

function handleCancel() {
  paymentOpen.value = false
}

function handleOk() {
  paymentOpen.value = false
}

function handleRefresh() {
  paid.value = false
  qrUrl.value = ''
  expireAt.value = 0
  loadQr()
}

watch(paymentOpen, (v) => {
  if (v) {
    paid.value = false
    qrUrl.value = ''
    expireAt.value = 0
    nextTick(loadQr)
  } else {
    stopPoll()
  }
})

onUnmounted(() => stopPoll())

// 成功弹窗交互与充值中心一致
function close() {
  rechargeSuccess.value = false
}

function toRechargeRecord() {
  close()
  router.push('/profile/power-detail')
}

function toServiceTerms() {
  window.open('/agreement?type=agreement&item=payment', '_blank')
}

// 将后端返回的支付方式与说明映射到前端状态
watchEffect(() => {
  const ways = payWayList.value
  paymentMethods.value = ways.map((w) => ({
    value: w.value,
    label: w.label,
    icon: w.logo || (w.value === 'wechat' ? 'https://cdn.fastbuildai.com/pay/wechat.svg' : 'https://cdn.fastbuildai.com/pay/alipay.svg')
  }))
  if (paymentMethods.value.length) {
    selectedPayment.value = paymentMethods.value[0].value
  }
  instructions.value = data.value?.explain || ''
})
</script>
