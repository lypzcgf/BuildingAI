<p align="center">
<img src="https://user-images.githubusercontent.com/11247099/140462375-7b7ac4db-35b7-453c-8a05-13d8d20282c4.png" width="600"/>
</p>

<h2 align="center">
<a href="https://github.com/antfu/vitesse">Vitesse</a> for Nuxt 3
</h2><br>

<p align="center">
<br>
<a href="https://vitesse-nuxt3.netlify.app/">🖥 Online Preview</a>
<br><br>
<a href="https://stackblitz.com/github/antfu/vitesse-nuxt"><img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt=""></a>
</p>

# FastBuildAI Web Console

基于 Nuxt 3 构建的现代化 AI 管理控制台，提供完整的 AI 代理、对话、数据集管理等功能。

## ✨ 主要特性

- 🚀 **Nuxt 3** - 现代化的 Vue 3 全栈框架，支持 SSR、ESR、文件路由、组件自动导入等
- 🎨 **Nuxt UI** - 基于 Tailwind CSS 的现代化 UI 组件库
- 🔥 **Vue 3 Composition API** - 使用 `<script setup>` 语法，更好的 TypeScript 支持
- 📱 **响应式设计** - 支持移动端和桌面端的完美适配
- 🌍 **国际化支持** - 内置多语言支持，基于 @nuxtjs/i18n
- 🎯 **TypeScript** - 完整的类型安全支持
- 🎨 **Tailwind CSS** - 原子化 CSS 框架，快速构建现代化界面
- 📊 **数据可视化** - 集成 ECharts 图表库
- 🔐 **权限管理** - 完整的 RBAC 权限控制系统
- 🤖 **AI 管理** - AI 代理、对话、数据集等核心功能管理

## 🛠️ 技术栈

### 核心框架

- [Nuxt 3](https://nuxt.com/) - Vue 3 全栈框架
- [Vue 3](https://vuejs.org/) - 渐进式 JavaScript 框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的 JavaScript

### UI 框架

- [Nuxt UI](https://ui.nuxt.com/) - 现代化 UI 组件库
- [Tailwind CSS](https://tailwindcss.com/) - 原子化 CSS 框架
- [Tailwind CSS Vite](https://github.com/tailwindlabs/tailwindcss-vite) - Tailwind CSS Vite 插件

### 状态管理

- [Pinia](https://pinia.vuejs.org/) - Vue 3 状态管理库
- [@pinia/nuxt](https://github.com/vuejs/pinia/tree/main/packages/nuxt) - Pinia Nuxt 集成

### 工具库

- [VueUse](https://vueuse.org/) - Vue Composition API 工具集
- [@vueuse/core](https://github.com/vueuse/vueuse) - VueUse 核心功能
- [@vueuse/motion](https://motion.vueuse.org/) - Vue 动画库
- [@vueuse/nuxt](https://github.com/vueuse/nuxt) - VueUse Nuxt 集成

### 图标系统

- [@iconify-json/heroicons](https://icon-sets.iconify.design/heroicons/) - Heroicons 图标集
- [@iconify-json/lucide](https://icon-sets.iconify.design/lucide/) - Lucide 图标集
- [@iconify-json/tabler](https://icon-sets.iconify.design/tabler/) - Tabler 图标集

### 数据可视化

- [ECharts](https://echarts.apache.org/) - 强大的图表库
- [@lottiefiles/dotlottie-vue](https://github.com/LottieFiles/dotlottie-vue) - Lottie 动画支持

### 表单验证

- [Yup](https://github.com/jquense/yup) - JavaScript 对象模式验证器

### 开发工具

- [ESLint](https://eslint.org/) - 代码质量检查
- [Prettier](https://prettier.io/) - 代码格式化
- [Vue TSC](https://github.com/vuejs/vue-tsc) - Vue TypeScript 编译器

## 📁 项目结构

```
apps/web/
├── .nuxt/              # Nuxt 构建缓存
├── .output/            # 构建输出
├── app/                # 页面组件
├── assets/             # 静态资源（CSS、图片等）
├── common/             # 通用模块（组件，hooks，通用数据等）
│   ├── components/         # 组件
│   ├── composables/        # 根模块
│   ├── config/             # 公共配置文件
│   ├── constants/          # 项目常量定义
│   ├── utils/              # 工具函数
│   ├── stores              # Pinia存储
├── core/               # 核心功能模块（nuxt vue 核心模块）
│   ├── directives/         # vue 指令
│   ├── i18n/               # 国际化相关
│   ├── layouts/            # nuxt 布局
│   ├── middleware          # nuxt 中间件
│   ├── modules             # nuxt 模块
│   ├── plugins             # nuxt 插件
├── libs/               # 共享库
├── models/             # 数据模型定义
├── plugins/            # 插件系统
├── public/             # 前端公共静态资源
├── server/             # nuxt 服务端应用
├── services/           # API 服务层
├── types/              # TypeScript 类型定义
├── app.vue             # 根组件
├── app.config.ts       # 应用配置
├── nuxt.config.ts      # Nuxt 配置
└── package.json        # 依赖配置
```

## 🚀 快速开始

### 环境要求

- Node.js >= 22.14.0
- pnpm >= 10.0.0

### 安装依赖

```bash
pnpm install
```

### 开发环境

```bash
# 开发模式
pnpm dev

# PWA 开发模式
pnpm dev:pwa
```

### 构建部署

```bash
# 构建生产版本
pnpm build

# 生成静态站点
pnpm generate

# 启动生产服务
pnpm start

# 启动静态站点服务
pnpm start:generate
```

### 代码质量

```bash
# 代码检查
pnpm lint

# 自动修复
pnpm lint:fix

# 类型检查
pnpm typecheck

# 代码格式化
pnpm format
```

### 国际化

```bash
# 翻译国际化文件
pnpm i18n:translate
```

## 🔧 配置说明

### 环境变量

项目使用 `.env` 文件进行环境配置：

- `.env.development.local` - 开发环境配置
- `.env.production.local` - 生产环境配置

### 构建配置

- `NUXT_BUILD_SSR` - 是否启用 SSR
- `NUXT_BUILD_ENV` - 构建环境
- `VITE_PLUGIN_PWA` - 是否启用 PWA 插件

## 📚 相关文档

- [Nuxt 3 文档](https://nuxt.com/docs)
- [Nuxt UI 文档](https://ui.nuxt.com/)
- [Vue 3 文档](https://vuejs.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Pinia 文档](https://pinia.vuejs.org/)

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目基于 [MIT](LICENSE) 许可证开源。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和开源社区。
