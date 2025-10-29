import { DictModule } from "@common/modules/dict/dict.module";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CozePackageConfigController } from "./controllers/coze-package-config.controller";
import { CozePackageConfig } from "./entities/coze-package-config.entity";
import { CozePackageConfigService } from "./services/coze-package-config.service";

/**
 * Coze套餐管理模块
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([CozePackageConfig]),
        DictModule,
    ],
    controllers: [CozePackageConfigController],
    providers: [CozePackageConfigService],
    exports: [CozePackageConfigService],
})
export class CozePackageModule {}