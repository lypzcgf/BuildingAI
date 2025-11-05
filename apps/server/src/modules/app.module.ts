import { BaseModule } from "@common/base/base.module";
import { AuthGuard } from "@common/guards/auth.guard";
import { PermissionsGuard } from "@common/guards/permissions.guard";
// import { PluginGuard } from "@common/guards/plugin.guard";
import { CacheModule } from "@core/cache/cache.module";
import { DatabaseModule } from "@core/database/database.module";
// import { getPluginList, PluginsCoreModule } from "@core/plugins/plugins.module";
import { RedisModule } from "@core/redis/redis.module";
import { ChannelModule } from "@modules/console/channel/channel.module";
import { ConsoleModule } from "@modules/console/console.module";
import { WebModule } from "@modules/web/web.module";
import { WebCozePackageModule } from "../web-coze-package/web-coze-package.module";
import { DynamicModule, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ServeStaticModule } from "@nestjs/serve-static";
import { existsSync } from "fs";
import { join } from "path";

@Module({})
export class AppModule {
    static async register(plugins?: DynamicModule[]): Promise<DynamicModule> {
        // const pluginsList = getPluginList();

        /**
         * 检查web目录和index.html文件是否存在
         * 如果web不存在或者web为空或者web缺失index.html，则使用public作为根目录
         */
        const publicPath = join(__dirname, "..", "..", "..", "..", "public");
        const webPath = join(publicPath, "web");
        const webIndexPath = join(webPath, "index.html");

        // 检查web目录是否存在，web目录是否有内容，以及index.html是否存在
        const shouldUseWebPath = existsSync(webPath) && existsSync(webIndexPath);
        const rootPath = shouldUseWebPath ? webPath : publicPath;

        return {
            module: AppModule,
            imports: [
                ServeStaticModule.forRoot({
                    rootPath,
                    exclude: [
                        // ...pluginsList.map((plugin) => `/${plugin.name}`),
                        `${process.env.VITE_APP_WEB_API_PREFIX}`,
                        `${process.env.VITE_APP_CONSOLE_API_PREFIX}`,
                    ],
                }),
                ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: `../../.env.${process.env.NODE_ENV || "development"}.local`,
                }),
                DatabaseModule,
                RedisModule,
                CacheModule,
                WebModule,
                ConsoleModule,
                ChannelModule,
                BaseModule,
                WebCozePackageModule,
                // PluginsCoreModule.register(plugins),
            ],
            controllers: [],
            providers: [
                {
                    provide: APP_GUARD,
                    useClass: AuthGuard,
                },
                // {
                //     provide: APP_GUARD,
                //     useClass: PluginGuard,
                // },
                {
                    provide: APP_GUARD,
                    useClass: PermissionsGuard,
                },
            ],
        };
    }
}
