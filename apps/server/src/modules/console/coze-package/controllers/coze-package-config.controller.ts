import { ConsoleController } from "@common/decorators/controller.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
import { Body, Get, Post } from "@nestjs/common";

import {
    CozePackageConfigResponseDto,
    UpdateCozePackageConfigDto,
} from "../dto/coze-package-config.dto";
import { CozePackageConfigService } from "../services/coze-package-config.service";

/**
 * Coze套餐配置控制器
 *
 * 提供Coze套餐配置的API接口，包括：
 * 1. 获取套餐配置
 * 2. 设置套餐配置
 */
@ConsoleController("coze-package-config", "Coze套餐配置")
export class CozePackageConfigController {
    constructor(private readonly cozePackageConfigService: CozePackageConfigService) {}

    /**
     * 获取Coze套餐配置
     *
     * @returns Coze套餐配置数据
     */
    @Get()
    @Permissions({
        code: "coze-package:getConfig",
        name: "查看Coze套餐配置",
        description: "获取Coze套餐的配置信息，包括功能状态、说明和套餐规则",
    })
    async getConfig(): Promise<CozePackageConfigResponseDto> {
        return await this.cozePackageConfigService.getConfig();
    }

    /**
     * 设置Coze套餐配置
     *
     * @param updateDto 更新配置DTO
     * @returns 更新后的配置数据
     */
    @Post()
    @Permissions({
        code: "coze-package:setConfig",
        name: "设置Coze套餐配置",
        description: "更新Coze套餐的配置信息，包括功能状态、说明和套餐规则",
    })
    async setConfig(
        @Body() updateDto: UpdateCozePackageConfigDto,
    ): Promise<CozePackageConfigResponseDto> {
        return await this.cozePackageConfigService.setConfig(updateDto);
    }
}