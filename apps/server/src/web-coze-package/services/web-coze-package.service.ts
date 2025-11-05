import { Injectable, Logger } from '@nestjs/common';
import { HttpExceptionFactory } from '@common/exceptions/http-exception.factory';
import { CozePackageOrderService } from '../../modules/console/coze-package/services/coze-package-order.service';
import { UserCozePackageResponseDto } from '../dto/user-coze-package.dto';

/**
 * Web端Coze套餐服务
 * 提供用户套餐查询功能，复用现有的CozePackageOrderService
 */
@Injectable()
export class WebCozePackageService {
    protected readonly logger = new Logger(WebCozePackageService.name);

    constructor(
        private readonly cozePackageOrderService: CozePackageOrderService,
    ) {}

    /**
     * 获取用户当前有效套餐
     * @param userId 用户ID
     * @returns 用户当前有效套餐信息，如果没有有效套餐则返回null
     */
    async getUserCurrentPackage(userId: string): Promise<UserCozePackageResponseDto | null> {
        try {
            this.logger.log(`[+] 开始查询用户 ${userId} 的当前有效套餐`);
            
            // 复用现有的CozePackageOrderService中的getUserActivePackage方法
            const activePackage = await this.cozePackageOrderService.getUserActivePackage(userId);
            
            if (!activePackage) {
                this.logger.log(`[+] 用户 ${userId} 没有有效套餐`);
                return null;
            }

            this.logger.log(`[+] 用户 ${userId} 当前有效套餐查询成功: ${activePackage.packageName}`);
            return activePackage;
        } catch (error) {
            this.logger.error(`[!] 查询用户当前有效套餐失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.internal(`查询用户当前有效套餐失败: ${error.message}`);
        }
    }

    /**
     * 检查用户是否有有效套餐
     * @param userId 用户ID
     * @returns 是否有有效套餐
     */
    async hasActivePackage(userId: string): Promise<boolean> {
        try {
            const activePackage = await this.getUserCurrentPackage(userId);
            return activePackage !== null;
        } catch (error) {
            this.logger.error(`[!] 检查用户套餐状态失败: ${error.message}`, error.stack);
            return false;
        }
    }

    /**
     * 获取用户套餐剩余天数
     * @param userId 用户ID
     * @returns 剩余天数，如果没有有效套餐则返回0
     */
    async getRemainingDays(userId: string): Promise<number> {
        try {
            const activePackage = await this.getUserCurrentPackage(userId);
            return activePackage ? activePackage.remainingDays : 0;
        } catch (error) {
            this.logger.error(`[!] 获取用户套餐剩余天数失败: ${error.message}`, error.stack);
            return 0;
        }
    }
}