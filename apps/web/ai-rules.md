1.本项目使用技术栈： Nuxt3 + Typescript + Nuxt-UI + TailwindCss
4.0版本 2.编写代码根据代码风格进行编写 3.项目 app 为入口目录， plugins 为应用插件目录,是会被 app 导入为路由的 4.新增页面均要使用国际化，使用 i18n 写法，文件在/plugins/插件/i18n/zh,多语言文件你只需要新增 zh 的其他的不需要新增，如果是 插件目录下面新增则使用封装方法 const
{ pt } =
usePluginI18n();， 使用 pt('key') 5.本项目有许多通用组件，方法，需要用到的时候先查询 packages/ui/src/components 或者composables 6.项目不使用 枚举 enum, 请使用常量。7.
