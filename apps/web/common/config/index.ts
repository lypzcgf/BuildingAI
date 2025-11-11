/**
 * 应用全局配置
 */
const AppConfig = {
    // 应用名称
    APP_NAME: "FreeBuildAI",

    // 应用版本
    VERSION: "1.0.0",

    // 请求基础路径
    // 如果未配置，回退为相对路径，确保不会出现 `undefined/...` 导致 Invalid URL
    BASE_API: import.meta.env.VITE_APP_BASE_URL || "",

    // 前台接口基础前缀
    // 回退默认前缀为 /api，保证生产未配置也可用同源接口
    WEB_API_PREFIX: import.meta.env.VITE_APP_WEB_API_PREFIX || "/api",

    // 后台接口基础前缀
    // 回退默认前缀为 /consoleapi
    CONSOLE_API_PREFIX: import.meta.env.VITE_APP_CONSOLE_API_PREFIX || "/consoleapi",

    // 请求超时时间（毫秒）
    TIMEOUT: 60 * 1000,
};

export default AppConfig;
