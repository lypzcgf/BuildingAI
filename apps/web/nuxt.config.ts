import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import type { PluginOption } from "vite";

import icons from "./assets/icons/icons.json";
import { pwa } from "./common/config/pwa";
import localesI18n from "./core/modules/locales-i18n";

// 构建环境标识：用于优化 SSR 打包时间
const isProd = process.env.NUXT_BUILD_ENV === "production";
const isSSR = process.env.NUXT_BUILD_SSR === "true";

export default defineNuxtConfig({
    modules: [
        localesI18n,
        "@vueuse/nuxt",
        "@pinia/nuxt",
        "nuxt-svgo",
        "@nuxtjs/color-mode",
        "@nuxt/ui",
        "@nuxtjs/i18n",
        "@vite-pwa/nuxt",
        "@nuxt/eslint",
        "motion-v/nuxt",
    ],

    ssr: import.meta.env.NUXT_BUILD_SSR === "true",

    pages: {
        // 筛选 匹配任意子目录 以及去除 console/下面的所有文件。
        pattern: ["*.vue", "**/*/*.vue", "!**/_***/*.*", "!console/**/*.*"],
    },

    components: {
        dirs: [
            {
                path: "common/components",
                pathPrefix: true,
                global: false,
                watch: false,
            },
        ],
    },

    imports: {
        dirs: ["common/stores", "common/composables", "common/utils"],
        // 性能优化：按需导入
        scan: true,
        // global: false, // 禁用全局导入以提升性能
    },

    devtools: { enabled: false },

    app: {
        head: {
            viewport: "width=device-width,initial-scale=1",
            meta: [
                {
                    name: "viewport",
                    content: "width=device-width, initial-scale=1",
                },
                {
                    name: "apple-mobile-web-app-status-bar-style",
                    content: "black-translucent",
                },
                {
                    name: "theme-color",
                    media: "(prefers-color-scheme: light)",
                    content: "#ffffff",
                },
                {
                    name: "theme-color",
                    media: "(prefers-color-scheme: dark)",
                    content: "#222222",
                },
            ],
        },

        rootAttrs: {
            "data-vaul-drawer-wrapper": "true",
        },
    },

    css: ["assets/styles/globals.css", "assets/styles/ripple.css"],

    unhead: {
        renderSSRHeadOptions: {
            omitLineBreaks: false,
        },
    },

    colorMode: {
        preference: "system",
        fallback: "light",
        hid: "nuxt-color-mode-script",
        globalName: "__NUXT_COLOR_MODE__",
        componentName: "ColorScheme",
        classPrefix: "",
        classSuffix: "",
        storage: "localStorage",
        storageKey: "nuxt-color-mode",
    },

    ui: {
        prefix: "U",
        fonts: false,
        colorMode: true,
        theme: {
            colors: ["primary", "secondary", "success", "info", "warning", "error"],
        },
    },
    spaLoadingTemplate: "./public/spa-loading-template.html",

    dir: {
        plugins: "core/plugins",
        layouts: "core/layouts",
        pages: "app",
        modules: "core/modules",
        middleware: "core/middleware",
    },

    srcDir: ".",

    alias: {
        "@": fileURLToPath(new URL("./", import.meta.url)),
        "~": fileURLToPath(new URL("./", import.meta.url)),
        "@plugins": fileURLToPath(new URL("./plugins", import.meta.url)),
    },

    // 路由懒加载
    routeRules: {
        "/console/**": { prerender: false, ssr: false, swr: true },
        "/profile/**": { prerender: false, ssr: false, swr: true },
    },

    runtimeConfig: {
        public: {
            posthogKey: process.env.NUXT_PUBLIC_POSTHOG_KEY || '',
            posthogHost: process.env.NUXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        },
    },

    sourcemap: false,

    devServer: {
        port: 4091,
        host: "localhost,0.0.0.0",
    },

    experimental: {
        // when using generate, payload js assets included in sw precache manifest
        // but missing on offline, disabling extraction it until fixed
        // 启用原生异步上下文，使其在 Nuxt 和 Nitro 中的嵌套组合式 API 可访问。
        // 这为在异步组合式 API 中使用组合式 API 提供了可能性，并减少了出现 Nuxt instance is unavailable 错误的机会。
        asyncContext: true,
        // 启用为 Vue 打包生成异步入口点，辅助模块联盟支持。
        asyncEntry: false,
        // 允许在块错误或手动 reloadNuxtApp() 调用后重新加载页面时从 sessionStorage 恢复 Nuxt 应用状态。
        // 为了避免水合错误，它只会在 Vue 应用挂载后应用，这意味着初始加载时可能会有闪烁。
        restoreState: false,
        // 使用 defineRouteRules 在页面级别定义路由规则。
        inlineRouteRules: false,
        // 允许渲染 JSON 有效负载，并支持恢复复杂类型
        renderJsonPayloads: true,
        // 启用提取使用 nuxt generate 生成的页面的有效载荷。
        payloadExtraction: true,
        // 如果 SSR 出现错误，则启用实验性 <NuxtClientFallback> 组件以在客户端渲染内容。
        clientFallback: false,
        // 启用使用 Speculation Rules API 的跨源预取。
        crossOriginPrefetch: true,
        // 启用客户端路由与视图过渡 API 的集成。
        viewTransition: true,
        // 在使用 node 服务器时启用早期提示的写入。(通过提前发送资源提示加速页面加载。)
        writeEarlyHints: false,
        // 启用使用 <NuxtIsland> 和 .island.vue 文件进行实验性组件岛屿支持。
        componentIslands: false,
        // 解决位于各层中的 ~ 、 ~~ 、 @ 和 @@ 别名，并参考它们的层源目录和根目录。
        localLayerAliases: false,
        // 启用新的实验性类型化路由，使用 unplugin-vue-router 。
        // 开箱即用，这将启用对 navigateTo 、 <NuxtLink> 、 router.push() 等的带类型使用。
        // 您甚至可以通过使用 const route = useRoute('route-name') 在页面中获取带类型的参数。
        typedPages: true,
        // 设置一个替代的监视器，它将作为 Nuxt 的监视服务使用。
        // Nuxt 默认使用 chokidar-granular ，它将忽略从监视中排除的顶层目录（如 node_modules 和 .git ）。
        // 你可以将其设置为 parcel 以使用 @parcel/watcher ，这可能会在大项目或 Windows 平台上提高性能。
        watcher: "parcel",
        // Nuxt 会自动在预渲染的页面之间共享 payload 数据。当预渲染使用 useAsyncData 或 useFetch 且在不同页面中获取相同数据的网站时，这可以显著提高性能。
        sharedPrerenderData: false,
        // 通过这个功能，Nuxt 将在客户端构建中自动使用 unenv 跨域填充 Node.js 导入。
        clientNodeCompat: false,
        // 启用 CookieStore 支持，以便监听 Cookie 更新（如果浏览器支持）并刷新 useCookie 引用值。
        cookieStore: true,
        // 基于配置和源文件的哈希值缓存 Nuxt 构建工件。
        buildCache: true,
        // Nuxt 会自动更新组件名称，以匹配你用于自动导入组件的完整组件名称。
        normalizeComponentNames: false,
        // 启用浏览器开发者工具中的 Nuxt 钩子性能标记。这会添加可在基于 Chromium 的浏览器的性能标签页中追踪的性能标记，这对于调试和优化性能非常有用。
        browserDevtoolsTiming: true,
        // 记录模块上下文中的 nuxt.options 变化，有助于调试模块在 Nuxt 初始化阶段所做的配置更改。
        // 当 debug 模式启用时，此功能默认开启。如果您需要禁用此功能，可以这样做：
        debugModuleMutation: false,
        // 这为 <Lazy> 组件启用了水合策略，通过延迟组件的水合直到它们被需要来提高性能。
        lazyHydration: true,
        // 控制 Nuxt 模板中导入的解析方式。默认情况下，Nuxt 尝试相对于添加它们的模块来解析模板中的导入。
        // 示例问题：# 构建错误：无法解析模板中的导入
        // [ERROR] [nuxt] Cannot find module '@my-lib/components/Button' from '~/pages/index.vue'
        templateImportResolution: false,
        // 此选项可在整个 Nuxt/Nitro 应用中启用装饰器语法，由 esbuild 提供支持。
        // 很长一段时间以来，TypeScript 通过 compilerOptions.experimentalDecorators 支持装饰器。
        // 这个实现早于 TC39 标准化流程。现在，装饰器已成为阶段 3 提案，在 TS 5.0+中无需特殊配置即可支持（参见 https://github.com/microsoft/TypeScript/pull/52582 和 https://devblogs.microsoft.com/typescript/announcing-typescript-5-0-beta/#decorators）。
        decorators: false,
        // Nuxt 将自动清除 useAsyncData 和 nuxtApp.static.data 的缓存数据。这有助于防止内存泄漏，并确保在需要时加载最新数据，但可以禁用此功能：
        purgeCachedData: true,
        // 是否在刷新 useAsyncData 和 useFetch 的数据时调用并使用 getCachedData 的结果（无论是由 watch 、 refreshNuxtData() 或手动 refresh() 调用）。
        granularCachedData: false,
        // 如果设置为 false ，从 useAsyncData 、 useFetch 、 useLazyAsyncData 和 useLazyFetch 返回的 pending 对象将是一个计算属性，它仅在 status 也为挂起状态时才 true 。
        // 这意味着当传递 immediate: false 时， pending 将会是 false ，直到第一个请求被发出。
        pendingWhenIdle: false,

        defaults: {
            useAsyncData: {
                deep: true,
            },
        },
    },

    compatibilityDate: "2025-07-20",

    nitro: {
        esbuild: {
            options: {
                target: "esnext",
            },
        },
        prerender: {
            crawlLinks: false,
            routes: [],
        },
        compressPublicAssets: false,
        minify: false,
        // 确保静态生成时不包含服务端代码
        experimental: {
            wasm: false,
        },
        // 排除服务端模块
        externals: {
            inline: ["node:process", "node:path", "node:fs", "node:os", "node:crypto"],
        },
    },

    // // 配置 Vite
    vite: {
        plugins: [tailwindcss() as PluginOption],
        optimizeDeps: {
            include:
                import.meta.env.NUXT_BUILD_ENV === "development"
                    ? [
                          "@tanstack/table-core",
                          "@internationalized/date",
                          "reka-ui",
                          "@tiptap/vue-3",
                          "@tiptap/starter-kit",
                          "@tanstack/vue-table",
                          "@iconify-json/lucide",
                          "yup",
                          "@intlify/shared",
                          "@intlify/core-base",
                          "markdown-it-async",
                          "markdown-it-github-alerts",
                          "@shikijs/markdown-it/async",
                          "qrcode.vue",
                          "echarts/charts",
                          "vue-dompurify-html",
                          "echarts/components",
                          "echarts/core",
                          "echarts/features",
                          "echarts/renderers",
                          "tailwindcss/colors",
                          "motion-v",
                          "@lottiefiles/dotlottie-vue",
                          "@fancyapps/ui",
                          "uuid",
                          "vuedraggable",
                          "panzoom",
                          "@shikijs/langs",
                          "libphonenumber-js",
                          "@nuxt/ui/locale",
                          "clsx",
                          "tailwind-merge",
                          "@tiptap/extension-color",
                          "@tiptap/extension-image",
                          "@tiptap/extension-link",
                          "@tiptap/extension-list-item",
                          "@tiptap/extension-placeholder",
                          "@tiptap/extension-text-style",
                          "@tiptap/extension-underline",
                      ]
                    : [],
            exclude: [],
            entries: [],
        },
        // 添加环境变量目录配置，指向项目根目录
        envDir: fileURLToPath(new URL("../../", import.meta.url)),
        build: {
            target: "esnext",
            minify: isProd && !isSSR,
            cssMinify: isProd && !isSSR,
            sourcemap: false,
            cssCodeSplit: true,
        },
    },

    // 关闭 nuxt 数据收集工具
    telemetry: {
        enabled: false,
    },

    eslint: {
        config: {
            standalone: false,
            nuxt: {
                sortConfigKeys: true,
            },
        },
    },

    i18n: {
        strategy: "no_prefix",
        defaultLocale: "en",
        detectBrowserLanguage: {
            useCookie: true,
            cookieKey: "nuxt-ui-language",
            redirectOn: "root",
        },
        bundle: {
            optimizeTranslationDirective: false,
        },
    },

    icon: {
        serverBundle: "local",
        clientBundle: {
            scan: true,
            icons,
            sizeLimitKb: 10 * 1024,
        },
    },

    pwa,
});
