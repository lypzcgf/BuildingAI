import { DictModule } from "@common/modules/dict/dict.module";
import { User } from "@common/modules/auth/entities/user.entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CozePackageConfigController } from "./controllers/coze-package-config.controller";
import { CozePackageOrderController } from "./controllers/coze-package-order.controller";
import { CozePackageConfig } from "./entities/coze-package-config.entity";
import { CozePackageOrder } from "./entities/coze-package-order.entity";
import { CozePackageConfigService } from "./services/coze-package-config.service";
import { CozePackageOrderService } from "./services/coze-package-order.service";

/**
 * Coze套餐管理模块
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([CozePackageConfig, CozePackageOrder, User]),
        DictModule,
    ],
    controllers: [CozePackageConfigController, CozePackageOrderController],
    providers: [CozePackageConfigService, CozePackageOrderService],
    exports: [CozePackageConfigService, CozePackageOrderService],
})
export class CozePackageModule {}