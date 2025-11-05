import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebCozePackageController } from './controllers/web-coze-package.controller';
import { WebCozePackageService } from './services/web-coze-package.service';
import { CozePackageOrderService } from '../modules/console/coze-package/services/coze-package-order.service';
import { CozePackageOrder } from '../modules/console/coze-package/entities/coze-package-order.entity';

/**
 * Web端Coze套餐模块
 * 提供用户套餐查询功能，复用现有的CozePackageOrderService
 * 在开发环境中使用模拟服务
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([CozePackageOrder]),
    ],
    controllers: [WebCozePackageController],
    providers: [
        WebCozePackageService,
        CozePackageOrderService,
    ],
    exports: [
        WebCozePackageService,
    ],
})
export class WebCozePackageModule {}