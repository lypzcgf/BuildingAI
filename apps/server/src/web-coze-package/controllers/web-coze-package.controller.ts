import { Controller, Get, UseGuards, Logger, Req } from '@nestjs/common';
// import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
// import { AuthGuard } from '@nestjs/passport';
import { WebCozePackageService } from '../services/web-coze-package.service';
import { UserCozePackageResponseDto } from '../dto/user-coze-package.dto';
import { HttpExceptionFactory } from '@common/exceptions/http-exception.factory';

/**
 * Web端Coze套餐控制器
 * 提供用户套餐查询接口
 */
// // @ApiTags('Web端Coze套餐')
// @ApiBearerAuth()
@Controller('api/web-coze-package')
// @UseGuards(AuthGuard('jwt'))
export class WebCozePackageController {
    private readonly logger = new Logger(WebCozePackageController.name);

    constructor(
        private readonly webCozePackageService: WebCozePackageService,
    ) {}

    /**
     * 获取用户当前有效套餐
     * 查询当前登录用户的有效Coze套餐信息
     */
    @Get('user/current-package')
    // @ApiOperation({
    //     summary: '获取用户当前有效套餐',
    //     description: '查询当前登录用户的有效Coze套餐信息，包括套餐名称、剩余天数等'
    // })
    // @ApiResponse({
    //     status: 200,
    //     description: '获取成功',
    //     type: UserCozePackageResponseDto,
    // })
    // @ApiResponse({
    //     status: 401,
    //     description: '未授权'
    // })
    // @ApiResponse({
    //     status: 500,
    //     description: '服务器内部错误'
    // })
    async getUserCurrentPackage(@Req() req: any): Promise<UserCozePackageResponseDto | null> {
        const userId = req.user?.id;

        if (!userId) {
            this.logger.error('[!] 无法获取用户ID');
            throw HttpExceptionFactory.unauthorized('用户未登录');
        }

        this.logger.log(`[+] 开始获取用户 ${userId} 的当前有效套餐`);

        const currentPackage = await this.webCozePackageService.getUserCurrentPackage(userId);

        if (!currentPackage) {
            this.logger.log(`[+] 用户 ${userId} 没有有效套餐`);
            return null;
        }

        this.logger.log(`[+] 用户 ${userId} 当前有效套餐获取成功: ${currentPackage.packageName}`);
        return currentPackage;
    }

    /**
     * 检查用户是否有有效套餐
     * 快速检查当前用户是否有有效的Coze套餐
     */
    @Get('user/has-active-package')
    // @UseGuards(AuthGuard('jwt'))
    // @ApiBearerAuth()
    // @ApiOperation({ summary: '检查用户是否有有效套餐' })
    // @ApiResponse({ status: 200, description: '成功检查用户套餐状态', type: Boolean })
    // @ApiResponse({ status: 401, description: '未授权' })
    async hasActivePackage(@Req() req: any): Promise<{ hasActivePackage: boolean }> {
        try {
            const userId = req.user?.id;
            
            if (!userId) {
                this.logger.error('[!] 无法获取用户ID');
                return { hasActivePackage: false };
            }

            const hasActive = await this.webCozePackageService.hasActivePackage(userId);
            
            this.logger.log(`[+] 用户 ${userId} 有效套餐检查结果: ${hasActive}`);
            return { hasActivePackage: hasActive };
        } catch (error) {
            this.logger.error(`[!] 检查用户有效套餐失败: ${error.message}`, error.stack);
            return { hasActivePackage: false };
        }
    }

    /**
     * 获取用户套餐剩余天数
     * 获取当前用户套餐的剩余天数
     */
    @Get('user/remaining-days')
    // @UseGuards(AuthGuard('jwt'))
    // @ApiBearerAuth()
    // @ApiOperation({ summary: '获取用户套餐剩余天数' })
    // @ApiResponse({ status: 200, description: '成功获取剩余天数', type: Number })
    // @ApiResponse({ status: 401, description: '未授权' })
    // @ApiResponse({ status: 404, description: '用户无有效套餐' })
    async getRemainingDays(@Req() req: any): Promise<{ remainingDays: number }> {
        try {
            const userId = req.user?.id;
            
            if (!userId) {
                this.logger.error('[!] 无法获取用户ID');
                return { remainingDays: 0 };
            }

            const remainingDays = await this.webCozePackageService.getRemainingDays(userId);
            
            this.logger.log(`[+] 用户 ${userId} 套餐剩余天数: ${remainingDays}`);
            return { remainingDays };
        } catch (error) {
            this.logger.error(`[!] 获取用户套餐剩余天数失败: ${error.message}`, error.stack);
            return { remainingDays: 0 };
        }
    }
}