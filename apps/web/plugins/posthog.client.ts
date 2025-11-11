import posthog from 'posthog-js'

export default defineNuxtPlugin(() => {
  const runtime = useRuntimeConfig()
  const key = runtime.public.posthogKey || ''
  const host = runtime.public.posthogHost || 'https://us.i.posthog.com'

  if (!key) {
    console.warn('[PostHog] 缺少 public.posthogKey，埋点未开启')
    return
  }

  posthog.init(key, {
    api_host: host,
    capture_pageview: false, // 手动控制页面事件
    autocapture: false,      // 关闭自动采集
    persistence: 'localStorage',
  })

  // 全局注入
  return {
    provide: {
      posthog
    }
  }
})