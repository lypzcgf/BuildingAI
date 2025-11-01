import { appConfig } from "@common/config/app.config";
import { PluginPackageJson } from "@common/interfaces/plugin.interface";
import { findStackTargetFile } from "@common/utils/helper.util";
import { TerminalLogger } from "@common/utils/log.util";
import { getPluginList } from "@core/plugins/plugins.module";
import { parsePackageName } from "@fastbuildai/utils";
import { INestApplication } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as fse from "fs-extra";
import { networkInterfaces } from "os";
import * as path from "path";

/**
 * 启动日志
 */
export const startLog = (currentPort?: number, startTime?: number) => {
    const port = currentPort ?? process.env.SERVER_PORT ?? 4090;
    const env = process.env.NODE_ENV;
    const nets = networkInterfaces();
    const ipAddresses = [];

    // 获取所有网络接口的IP地址
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // 只获取IPv4地址，并且排除内部地址127.0.0.1
            if (net.family === "IPv4" && !net.internal) {
                ipAddresses.push(net.address);
            }
        }
    }

    TerminalLogger.log("App Name", appConfig.name);
    TerminalLogger.log("App Version", `v${appConfig.version}`);
    TerminalLogger.log("Env", env);
    TerminalLogger.log("Node Version", process.version);
    TerminalLogger.log("Local", `http://localhost:${port}`, { color: "cyan" });

    // 显示所有网络地址
    if (ipAddresses.length > 0) {
        ipAddresses.forEach((ip) => {
            TerminalLogger.log("Network", `http://${ip}:${port}`, { color: "cyan" });
        });
    }

    // 根据启动时间设置不同的日志级别
    const duration = startTime ? Date.now() - startTime : 0;

    if (duration < 1000) {
        TerminalLogger.success("Startup Time", `${duration} ms`);
    } else if (duration < 5000) {
        TerminalLogger.info("Startup Time", `${duration} ms`);
    } else if (duration < 10000) {
        TerminalLogger.warn("Startup Time", `${duration} ms`);
    } else {
        TerminalLogger.error("Startup Time", `${duration} ms`, { icon: "⚠️" });
    }
};

/**
 * 尝试监听端口，如果被占用则尝试其他端口（仅在开发环境下）
 * @param app NestJS应用实例
 * @param initialPort 初始端口号
 * @param maxRetries 最大重试次数
 * @returns Promise<void>
 */
export const tryListen = async (
    app: INestApplication,
    initialPort: number,
    maxRetries = 10,
    startTime?: number,
): Promise<void> => {
    let currentPort = initialPort;
    let retries = 0;
    const host = process.env.HOST || "0.0.0.0";

    while (retries < maxRetries) {
        try {
            await app.listen(currentPort, host);
            // 如果端口变更，记录到日志
            if (currentPort !== initialPort) {
                TerminalLogger.success(
                    "端口切换",
                    `端口 ${initialPort} 被占用，已切换到端口 ${currentPort}`,
                );
            }
            startLog(currentPort, startTime);
            return;
        } catch (error) {
            if (error.code === "EADDRINUSE" && process.env.NODE_ENV === "development") {
                retries++;
                currentPort = initialPort + retries;
                TerminalLogger.warn(
                    "端口占用",
                    `端口 ${initialPort + retries - 1} 被占用，尝试端口 ${currentPort}...`,
                );
            } else {
                // 非端口占用错误或非开发环境，直接抛出
                throw error;
            }
        }
    }

    throw new Error(`尝试了 ${maxRetries} 个端口后仍无法启动服务`);
};

/**
 * 获取插件名称
 *
 * 通过分析模块文件路径获取插件目录，然后读取package.json中的name字段
 * 如果找不到name字段，则使用插件目录名称作为备选
 * 支持跨平台路径规则（Windows/Unix）
 */
export const getPluginPackName = (): string => {
    try {
        // 使用插件缓存来获取插件列表
        const pluginList = getPluginList();

        // 如果缓存中没有插件列表
        if (!pluginList || pluginList.length === 0) {
            throw new Error("插件列表为空");
        }

        // 使用findStackTargetFile函数获取调用者文件路径
        const callerFile = findStackTargetFile([".controller.js"]) || [];

        // 对每个插件进行检查，看是否在调用文件路径中出现
        for (const plugin of pluginList) {
            // 使用 path.basename 获取插件目录名，适配跨平台路径
            const pluginDir = path.basename(plugin.path);

            if (pluginDir) {
                // 构建跨平台的插件路径模式
                const pluginPathPattern = path.join("plugins", pluginDir);

                // 检查调用文件路径中是否包含该插件目录
                const isPluginMatch = callerFile.some((file) => {
                    // 将文件路径标准化为统一的分隔符进行比较
                    const normalizedFile = path.normalize(file);
                    const normalizedPattern = path.normalize(pluginPathPattern);

                    // 检查路径是否包含插件目录
                    return (
                        normalizedFile.includes(normalizedPattern) ||
                        normalizedFile.includes(pluginDir)
                    );
                });

                if (isPluginMatch) {
                    return plugin.name;
                }
            }
        }

        // 如果只有一个插件，直接返回其name
        if (pluginList.length === 1) {
            return pluginList[0].name;
        }

        throw new Error("无法确定当前控制器所属的插件");
    } catch (error) {
        throw new Error(error.message);
    }
};

/**
 * 异步读取package.json
 * @param dirPath 目录路径
 * @returns package.json内容
 */
export const getPackageJson = async (dirPath: string): Promise<PluginPackageJson | null> => {
    try {
        if (!dirPath.includes("package.json")) {
            dirPath = path.join(dirPath, "package.json");
        }

        if (!(await fse.pathExists(dirPath))) {
            console.error("package.json不存在", dirPath);
            return null;
        }
        const packageJson: PluginPackageJson = await fse.readJson(dirPath);
        packageJson.name = parsePackageName(packageJson.name);
        return packageJson;
    } catch (error) {
        console.error(error);
        return null;
    }
};

/**
 * 同步读取package.json
 * @param dirPath 目录路径
 * @returns package.json内容
 */
export const getPackageJsonSync = (dirPath: string): PluginPackageJson => {
    try {
        if (!dirPath.includes("package.json")) {
            dirPath = path.join(dirPath, "package.json");
        }

        if (!fse.pathExistsSync(dirPath)) {
            console.error("package.json不存在", dirPath);
            return null;
        }
        const packageJson: PluginPackageJson = fse.readJsonSync(dirPath);
        packageJson.name = parsePackageName(packageJson.name);
        return packageJson;
    } catch (error) {
        console.error(error);
        return null;
    }
};

/**
 * 设置静态资源目录
 * @param app NestExpressApplication实例
 */
export const setAssetsDir = async (app: NestExpressApplication) => {
    const dirs = [
        {
            dir: path.join(process.cwd(), "..", "..", "public", "web"),
            prefix: "/",
        },
        {
            dir: path.join(process.cwd(), "storage", "uploads"),
            prefix: "/uploads",
        },
        {
            dir: path.join(process.cwd(), "storage", "static"),
            prefix: "/static",
        },
    ];

    dirs.forEach((dir) => {
        app.useStaticAssets(dir.dir, {
            prefix: dir.prefix,
        });
    });
};

export const printBrandLogo = () => {
    const logo = [
        " ____                 ___       __                      \x1b[38;2;97;95;255m______  ______\x1b[0m",
        "/\\  _`\\           \x1b[38;2;97;95;255m__\x1b[0m /\\_ \\     /\\ \\  \x1b[38;2;97;95;255m__\x1b[0m                \x1b[38;2;97;95;255m/\\  _  \\/\\__  _\\\x1b[0m",
        "\\ \\ \\L\\ \\  __  __\x1b[38;2;97;95;255m/\\_\\\x1b[0m\\//\\ \\    \\_\\ \\\x1b[38;2;97;95;255m/\\_\\\x1b[0m    ___      __\x1b[38;2;97;95;255m\\ \\ \\L\\ \\/_/\\ \\/\x1b[0m",
        " \\ \\  _ <'/\\ \\/\\ \x1b[38;2;97;95;255m\\/\x1b[0m\\ \\ \\ \\ \\   /'_` \x1b[38;2;97;95;255m\\/\x1b[0m\\ \\ /' _ `\\  /'_ `\x1b[38;2;97;95;255m\\ \\  __ \\ \\ \\ \\\x1b[0m",
        "  \\ \\ \\L\\ \\ \\ \\_\\ \\ \\ \\ \\_\\ \\_/\\ \\L\\ \\ \\ \\/\\ \\/\\ \\/\\ \\L\\ \x1b[38;2;97;95;255m\\ \\ \\/\\ \\ \\_\\ \\__\x1b[0m",
        "   \\ \\____/\\ \\____/\\ \\_\\/\\____\\ \\___,_\\ \\_\\ \\_\\ \\_\\ \\____ \x1b[38;2;97;95;255m\\ \\_\\ \\_\\/\\_____\\\x1b[0m",
        "    \\/___/  \\/___/  \\/_/\\/____/\\/__,_ /\\/_/\\/_/\\/_/\\/___L\\ \x1b[38;2;97;95;255m\\/_/\\/_/\\/_____/\x1b[0m",
        "                                                     /\\____/",
        "                                                     \\_/__/",
    ];
    console.log("\n" + logo.join("\n") + "\n");
};
