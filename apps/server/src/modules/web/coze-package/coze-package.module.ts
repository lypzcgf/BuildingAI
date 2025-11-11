import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WxPayService } from "@common/modules/pay/services/wxpay.service";
import { PayModule as CommonPayModule } from "@common/modules/pay/pay.module";
import { CozePackageController } from "./controllers/coze-package.controller";
import { CozePackageService } from "./services/coze-package.service";
import { CozePackageOrder } from "@modules/console/coze-package/entities/coze-package-order.entity";
import { CozePackageConfig } from "@modules/console/coze-package/entities/coze-package-config.entity";
import { DictModule } from "@common/modules/dict/dict.module";
import { Payconfig } from "@modules/console/system/entities/payconfig.entity";
import { WebCozePackageModule } from "../../../web-coze-package/web-coze-package.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([CozePackageOrder, CozePackageConfig, Payconfig]),
    CommonPayModule,
    DictModule,
    // 导入导出 WebCozePackageService 的模块，确保依赖可注入
    WebCozePackageModule,
  ],
  controllers: [CozePackageController],
  providers: [CozePackageService],
})
export class CozePackageModule {}