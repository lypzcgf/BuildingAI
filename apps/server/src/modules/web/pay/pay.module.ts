import { AccountLogService } from "@common/modules/account/services/account-log.service";
import { User } from "@common/modules/auth/entities/user.entity";
import { DictModule } from "@common/modules/dict/dict.module";
import { Dict } from "@common/modules/dict/entities/dict.entity";
import { PayModule as CommonPayModule } from "@common/modules/pay/pay.module";
import { WxPayService } from "@common/modules/pay/services/wxpay.service";
import { AccountLog } from "@modules/console/finance/entities/account-log.entity";
import { Recharge } from "@modules/console/recharge/entities/recharge.entity";
import { RechargeOrder } from "@modules/console/recharge/entities/recharge-order.entity";
import { CozePackageOrder } from "@modules/console/coze-package/entities/coze-package-order.entity";
import { Payconfig } from "@modules/console/system/entities/payconfig.entity";
import { PayconfigService } from "@modules/console/system/services/payconfig.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PayController } from "./controllers/pay.controller";
import { PayService } from "./services/pay.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Dict,
            RechargeOrder,
            Recharge,
            User,
            Payconfig,
            AccountLog,
            CozePackageOrder,
        ]),
        DictModule,
        CommonPayModule,
    ],
    controllers: [PayController],
    providers: [PayService, PayconfigService, WxPayService, AccountLogService],
    exports: [PayService, PayconfigService, WxPayService, AccountLogService],
})
export class PayModule {}
