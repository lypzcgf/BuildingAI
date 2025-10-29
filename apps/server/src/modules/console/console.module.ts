import { Module } from "@nestjs/common";

import { AiConsoleModule } from "./ai/ai.module";
import { AiAgentModule } from "./ai-agent/agent.module";
import { AiDatasetsModule } from "./ai-datasets/datasets.module";
import { CozePackageModule } from "./coze-package/coze-package.module";
import { DecorateModule } from "./decorate/decorate.module";
import { FinanceModule } from "./finance/finance.module";
import { HealthModule } from "./health/health.module";
import { KeyManagerModule } from "./key-manager/key-manager.module";
import { MenuModule } from "./menu/menu.module";
import { PermissionModule } from "./permission/permission.module";
import { PluginModule } from "./plugin/plugin.module";
import { RechargeModule } from "./recharge/recharge.module";
import { RoleModule } from "./role/role.module";
import { SystemModule } from "./system/system.module";
import { UserModule } from "./user/user.module";

@Module({
    imports: [
        HealthModule,
        UserModule,
        RoleModule,
        PermissionModule,
        PluginModule,
        MenuModule,
        DecorateModule,
        SystemModule,
        KeyManagerModule,
        AiConsoleModule,
        RechargeModule,
        AiAgentModule,
        AiDatasetsModule,
        FinanceModule,
        CozePackageModule,
    ],
    exports: [
        HealthModule,
        UserModule,
        RoleModule,
        PermissionModule,
        PluginModule,
        MenuModule,
        SystemModule,
        KeyManagerModule,
        AiConsoleModule,
        RechargeModule,
        AiAgentModule,
        AiDatasetsModule,
        FinanceModule,
        CozePackageModule,
    ],
})
export class ConsoleModule {}
