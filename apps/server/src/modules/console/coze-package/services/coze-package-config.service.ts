import { BaseService } from "@common/base/services/base.service";
import { BusinessCode } from "@common/constants/business-code.constant";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { DictService } from "@common/modules/dict/services/dict.service";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import {
    CozePackageConfigResponseDto,
    CozePackageRuleDto,
    UpdateCozePackageConfigDto,
} from "../dto/coze-package-config.dto";
import { CozePackageConfig } from "../entities/coze-package-config.entity";

/**
 * Coze套餐配置服务
 *
 * 提供Coze套餐配置的业务逻辑处理，包括：
 * 1. 获取和设置套餐配置
 * 2. 管理套餐规则
 * 3. 数据验证和业务规则处理
 */
@Injectable()
export class CozePackageConfigService extends BaseService<CozePackageConfig> {
    constructor(
        @InjectRepository(CozePackageConfig)
        private readonly cozePackageRepository: Repository<CozePackageConfig>,
        private readonly dictService: DictService,
    ) {
        super(cozePackageRepository);
    }

    /**
     * 获取Coze套餐配置
     *
     * @returns Coze套餐配置数据
     */
    async getConfig(): Promise<CozePackageConfigResponseDto> {
        try {
            // 从字典服务获取配置状态和说明
            const cozePackageStatus = await this.dictService.get<boolean>(
                "coze_package_status",
                false,
                "coze_package_config",
            );

            const cozePackageExplain = await this.dictService.get<string>(
                "coze_package_explain",
                "",
                "coze_package_config",
            );

            // 获取套餐规则
            const packageRules = await this.cozePackageRepository.find({
                order: { createdAt: "ASC" },
            });

            const cozePackageRule: CozePackageRuleDto[] = packageRules.map((rule) => ({
                id: rule.id,
                name: rule.name,
                duration: rule.duration,
                originalPrice: Number(rule.originalPrice),
                currentPrice: Number(rule.currentPrice),
                description: rule.description,
            }));

            return {
                cozePackageStatus,
                cozePackageExplain,
                cozePackageRule,
            };
        } catch (error) {
            this.logger.error("获取Coze套餐配置失败", error);
            throw HttpExceptionFactory.internal("获取配置失败");
        }
    }

    /**
     * 设置Coze套餐配置
     *
     * @param updateDto 更新配置DTO
     * @returns 更新后的配置数据
     */
    async setConfig(updateDto: UpdateCozePackageConfigDto): Promise<CozePackageConfigResponseDto> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 验证套餐规则
            this.validatePackageRules(updateDto.cozePackageRule);

            // 更新字典配置
            await this.dictService.set(
                "coze_package_status",
                updateDto.cozePackageStatus,
                {
                    group: "coze_package_config",
                    description: "Coze套餐功能开启状态",
                },
            );

            if (updateDto.cozePackageExplain !== undefined) {
                await this.dictService.set(
                    "coze_package_explain",
                    updateDto.cozePackageExplain,
                    {
                        group: "coze_package_config",
                        description: "Coze套餐说明文案",
                    },
                );
            }

            // 更新套餐规则
            await this.updatePackageRules(updateDto.cozePackageRule, queryRunner.manager);

            await queryRunner.commitTransaction();

            // 返回更新后的配置
            return await this.getConfig();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error("设置Coze套餐配置失败", error);
            
            if (error instanceof HttpExceptionFactory) {
                throw error;
            }
            
            throw HttpExceptionFactory.internal("设置配置失败");
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * 验证套餐规则
     *
     * @param rules 套餐规则列表
     */
    private validatePackageRules(rules: CozePackageRuleDto[]): void {
        for (const rule of rules) {
            // 验证现价不能大于原价
            if (rule.currentPrice > rule.originalPrice) {
                throw HttpExceptionFactory.business(
                    `套餐"${rule.name}"的现价不能大于原价`,
                    BusinessCode.PARAM_INVALID,
                );
            }

            // 验证价格不能为负数
            if (rule.originalPrice < 0 || rule.currentPrice < 0) {
                throw HttpExceptionFactory.business(
                    `套餐"${rule.name}"的价格不能为负数`,
                    BusinessCode.PARAM_INVALID,
                );
            }

            // 验证时长必须大于0
            if (rule.duration <= 0) {
                throw HttpExceptionFactory.business(
                    `套餐"${rule.name}"的时长必须大于0天`,
                    BusinessCode.PARAM_INVALID,
                );
            }

            // 验证套餐名称不能为空
            if (!rule.name || rule.name.trim() === "") {
                throw HttpExceptionFactory.business(
                    "套餐名称不能为空",
                    BusinessCode.PARAM_INVALID,
                );
            }
        }

        // 验证套餐名称不能重复
        const names = rules.map((rule) => rule.name.trim());
        const uniqueNames = new Set(names);
        if (names.length !== uniqueNames.size) {
            throw HttpExceptionFactory.business(
                "套餐名称不能重复",
                BusinessCode.PARAM_INVALID,
            );
        }
    }

    /**
     * 更新套餐规则
     *
     * @param rules 套餐规则列表
     * @param entityManager 实体管理器
     */
    private async updatePackageRules(
        rules: CozePackageRuleDto[],
        entityManager: any,
    ): Promise<void> {
        const repository = entityManager.getRepository(CozePackageConfig);

        // 获取现有的所有套餐规则
        const existingRules = await repository.find();
        const existingIds = existingRules.map((rule) => rule.id);

        // 处理新增和更新的规则
        const rulesToSave: Partial<CozePackageConfig>[] = [];
        const updatedIds: string[] = [];

        for (const rule of rules) {
            if (rule.id && existingIds.includes(rule.id)) {
                // 更新现有规则
                rulesToSave.push({
                    id: rule.id,
                    name: rule.name.trim(),
                    duration: rule.duration,
                    originalPrice: rule.originalPrice,
                    currentPrice: rule.currentPrice,
                    description: rule.description?.trim() || "",
                });
                updatedIds.push(rule.id);
            } else {
                // 新增规则
                rulesToSave.push({
                    name: rule.name.trim(),
                    duration: rule.duration,
                    originalPrice: rule.originalPrice,
                    currentPrice: rule.currentPrice,
                    description: rule.description?.trim() || "",
                });
            }
        }

        // 保存新增和更新的规则
        if (rulesToSave.length > 0) {
            await repository.save(rulesToSave);
        }

        // 删除不再需要的规则
        const idsToDelete = existingIds.filter((id) => !updatedIds.includes(id));
        if (idsToDelete.length > 0) {
            await repository.delete(idsToDelete);
        }
    }

    /**
     * 获取所有套餐规则
     *
     * @returns 套餐规则列表
     */
    async getAllPackages(): Promise<CozePackageConfig[]> {
        try {
            return await this.cozePackageRepository.find({
                order: { createdAt: "ASC" },
            });
        } catch (error) {
            this.logger.error("获取所有套餐规则失败", error);
            throw HttpExceptionFactory.internal("获取套餐规则失败");
        }
    }

    /**
     * 根据ID获取套餐规则
     *
     * @param id 套餐ID
     * @returns 套餐规则
     */
    async getPackageById(id: string): Promise<CozePackageConfig> {
        try {
            const packageRule = await this.cozePackageRepository.findOne({
                where: { id },
            });

            if (!packageRule) {
                throw HttpExceptionFactory.notFound(`套餐规则不存在: ${id}`);
            }

            return packageRule;
        } catch (error) {
            this.logger.error(`获取套餐规则失败: ${id}`, error);
            
            if (error instanceof HttpExceptionFactory) {
                throw error;
            }
            
            throw HttpExceptionFactory.internal("获取套餐规则失败");
        }
    }
}