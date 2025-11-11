import { Module } from "@nestjs/common";

import { AiModule } from "./ai/ai.module";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "./config/config.module";
import { CozePackageModule } from "./coze-package/coze-package.module";
import { DecorateModule } from "./decorate/decorate.module";
import { PayModule } from "./pay/pay.module";
import { RechargeModule } from "./recharge/recharge.modeule";
import { UploadModule } from "./upload/upload.module";
import { UserModule } from "./user/user.module";

@Module({
    imports: [
        AuthModule,
        UploadModule,
        AiModule,
        DecorateModule,
        UserModule,
        ConfigModule,
        RechargeModule,
        PayModule,
        CozePackageModule,
    ],
    exports: [
        AuthModule,
        UploadModule,
        AiModule,
        DecorateModule,
        UserModule,
        ConfigModule,
        RechargeModule,
        PayModule,
        CozePackageModule,
    ],
})
export class WebModule {}
