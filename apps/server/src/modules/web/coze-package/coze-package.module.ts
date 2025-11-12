import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WxPayService } from "@common/modules/pay/services/wxpay.service";
import { PayModule as CommonPayModule } from "@common/modules/pay/pay.module";
import { CozePackageController } from "./controllers/coze-package.controller";
// 保留单次导入，移除重复导入
import { CozePackageOrder } from "@modules/console/coze-package/entities/coze-package-order.entity";
import { CozePackageConfig } from "@modules/console/coze-package/entities/coze-package-config.entity";
import { DictModule } from "@common/modules/dict/dict.module";
import { Payconfig } from "@modules/console/system/entities/payconfig.entity";
import { CozePackageModule as ConsoleCozePackageModule } from "@modules/console/coze-package/coze-package.module";
import { CozePackageService } from "./services/coze-package.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([CozePackageOrder, CozePackageConfig, Payconfig]),
        CommonPayModule,
        DictModule,
        // 引入控制台端 CozePackageModule，以注入 CozePackageOrderService
        ConsoleCozePackageModule,
    ],
    controllers: [CozePackageController],
    providers: [CozePackageService],
    exports: [CozePackageService],
})
export class CozePackageModule {}
