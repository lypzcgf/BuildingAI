import { CozePackageConfig } from "@modules/console/coze-package/entities/coze-package-config.entity";
import { Menu } from "@modules/console/menu/entities/menu.entity";
import { Permission, PermissionType } from "@common/modules/auth/entities/permission.entity";
import { Logger } from "@nestjs/common";
import fse from "fs-extra";
import * as path from "path";
import { DataSource, Repository } from "typeorm";

import { PermissionService } from "@/modules/console/permission/permission.service";

/**
 * 版本 1.0.0-beta.9 升级逻辑
 *
 * 主要功能：
 * 1. 创建 Coze 套餐配置表
 * 2. 初始化默认套餐数据
 * 3. 插入示例套餐配置
 */
export class Upgrade {
    private readonly logger = new Logger(Upgrade.name);

    /**
     * Coze套餐配置Dao
     */
    private readonly cozePackageConfigRepository: Repository<CozePackageConfig>;

    /**
     * 菜单Dao
     */
    private readonly menuRepository: Repository<Menu>;

    /**
     * 权限Dao
     */
    private readonly permissionRepository: Repository<Permission>;

    constructor(
        private readonly dataSource: DataSource,
        private readonly permissionService: PermissionService,
    ) {
        this.cozePackageConfigRepository = dataSource.getRepository(CozePackageConfig);
        this.menuRepository = dataSource.getRepository(Menu);
        this.permissionRepository = dataSource.getRepository(Permission);
    }

    /**
     * 执行升级逻辑
     */
    async execute(): Promise<void> {
        this.logger.debug("开始执行 1.0.0-beta.9 版本升级逻辑");

        try {
            // 1. 同步 Coze 套餐配置表结构
            await this.syncCozePackageConfigTable();

            // 2. 初始化默认套餐数据
            await this.initializeDefaultPackageConfigs();

            // 3. 升级菜单结构
            await this.upgradeMenus();

            this.logger.debug("✅ 1.0.0-beta.9 版本升级逻辑执行完成");
        } catch (error) {
            this.logger.error(`❌ 1.0.0-beta.9 版本升级逻辑执行失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 同步 Coze 套餐配置表结构
     *
     * 通过 TypeORM 实体自动同步表结构
     */
    private async syncCozePackageConfigTable(): Promise<void> {
        this.logger.log("开始同步 Coze 套餐配置表结构");

        try {
            // 获取 CozePackageConfig 实体的元数据
            const metadata = this.dataSource.getMetadata(CozePackageConfig);
            const tableName = metadata.tableName;

            this.logger.log(`检查表 ${tableName} 是否存在`);

            // 检查表是否存在
            const tableExists = await this.dataSource.query(
                `
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                );
            `,
                [tableName],
            );

            if (!tableExists[0].exists) {
                this.logger.log(`表 ${tableName} 不存在，开始创建`);

                // 使用 TypeORM 的同步功能创建表
                await this.dataSource.synchronize();

                this.logger.log(`✅ 表 ${tableName} 创建成功`);
            } else {
                this.logger.log(`表 ${tableName} 已存在，检查是否需要更新结构`);

                // 如果表已存在，检查是否需要添加新字段或修改结构
                await this.updateTableStructureIfNeeded(tableName);
            }
        } catch (error) {
            this.logger.error(`❌ 同步 Coze 套餐配置表结构失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 更新表结构（如果需要）
     */
    private async updateTableStructureIfNeeded(tableName: string): Promise<void> {
        try {
            // 获取当前表的列信息
            const columns = await this.dataSource.query(
                `
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = $1
                ORDER BY ordinal_position;
            `,
                [tableName],
            );

            this.logger.log(`当前表 ${tableName} 有 ${columns.length} 个字段`);

            // 检查必需的字段是否存在
            const requiredColumns = [
                "id",
                "name",
                "duration",
                "originalPrice",
                "currentPrice",
                "description",
                "createdAt",
                "updatedAt",
            ];

            const existingColumns = columns.map((col) => col.column_name);
            const missingColumns = requiredColumns.filter((col) => !existingColumns.includes(col));

            if (missingColumns.length > 0) {
                this.logger.log(`发现缺失字段: ${missingColumns.join(", ")}`);

                // 使用 TypeORM 的同步功能更新表结构
                await this.dataSource.synchronize();

                this.logger.log(`✅ 表结构更新完成`);
            } else {
                this.logger.log(`表结构已是最新，无需更新`);
            }
        } catch (error) {
            this.logger.error(`❌ 更新表结构失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 初始化默认套餐数据
     */
    private async initializeDefaultPackageConfigs(): Promise<void> {
        this.logger.log("开始初始化 Coze 套餐默认数据");

        try {
            // 检查是否已有数据
            const existingCount = await this.cozePackageConfigRepository.count();

            if (existingCount > 0) {
                this.logger.log(`已存在 ${existingCount} 条套餐配置，跳过初始化`);
                return;
            }

            // 准备默认套餐数据
            const defaultConfigs = [
                {
                    name: "Coze基础套餐",
                    duration: 30,
                    originalPrice: 99.99,
                    currentPrice: 79.99,
                    description:
                        "适合个人用户和小团队的基础套餐，包含基本的AI对话功能和有限的API调用次数。",
                },
                {
                    name: "Coze专业套餐",
                    duration: 30,
                    originalPrice: 199.99,
                    currentPrice: 159.99,
                    description:
                        "适合中小企业的专业套餐，提供更多API调用次数、高级功能和优先技术支持。",
                },
                {
                    name: "Coze企业套餐",
                    duration: 30,
                    originalPrice: 499.99,
                    currentPrice: 399.99,
                    description:
                        "适合大型企业的高级套餐，包含无限API调用、定制化服务和专属客户经理。",
                },
                {
                    name: "Coze年度套餐",
                    duration: 365,
                    originalPrice: 1999.99,
                    currentPrice: 1599.99,
                    description: "年度订阅套餐，享受最大折扣优惠，包含所有高级功能和全年技术支持。",
                },
            ];

            // 批量插入默认数据
            const savedConfigs = await this.cozePackageConfigRepository.save(defaultConfigs);

            this.logger.log(`✅ 成功初始化 ${savedConfigs.length} 条默认套餐配置`);

            // 记录每个套餐的详细信息
            savedConfigs.forEach((config) => {
                this.logger.log(
                    `  - ${config.name}: ${config.duration}天, ¥${config.currentPrice}`,
                );
            });
        } catch (error) {
            this.logger.error(`❌ 初始化默认套餐数据失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 升级菜单结构
     *
     * 只添加新增的 Coze 套餐菜单，不重新处理整个菜单结构
     */
    private async upgradeMenus(): Promise<void> {
        this.logger.log("开始升级菜单结构 - 添加 Coze 套餐菜单");

        try {
            // 查找用户管理菜单
            const userMenu = await this.menuRepository.findOne({
                where: { code: "user" },
            });

            if (!userMenu) {
                this.logger.error("未找到用户管理菜单，无法添加 Coze 套餐菜单");
                return;
            }

            this.logger.log(`找到用户管理菜单: ${userMenu.name} (ID: ${userMenu.id})`);

            // 定义新增的 Coze 套餐菜单结构
            const newCozeMenus = [
                {
                    name: "console-menu.userManagement.cozePackage",
                    code: "user-coze-package",
                    path: "coze-package",
                    component: "/console/user/coze-package/index",
                    icon: "",
                    sort: 150,
                    type: 2,
                    permissionCode: "coze-package:getConfig",
                    pluginPackName: null,
                    parentId: userMenu.id,
                    isHidden: 0,
                    sourceType: 1,
                },
                {
                    name: "console-menu.userManagement.cozePackage.save",
                    code: "user-coze-package-save",
                    path: "",
                    component: "",
                    icon: "",
                    sort: 1,
                    type: 2,
                    permissionCode: "coze-package:setConfig",
                    pluginPackName: null,
                    parentId: null, // 将在创建主菜单后设置
                    isHidden: 1,
                    sourceType: 1,
                },
            ];

            // 先确保权限存在
            this.logger.log("开始创建 Coze 套餐相关权限");
            await this.ensurePermissionExists(
                "coze-package:getConfig",
                "Coze套餐管理权限",
                "菜单 Coze套餐管理 的访问权限",
            );
            await this.ensurePermissionExists(
                "coze-package:setConfig",
                "Coze套餐保存权限",
                "菜单 Coze套餐保存 的访问权限",
            );
            this.logger.log("✅ Coze 套餐权限创建完成");

            // 处理主菜单
            const mainMenuData = newCozeMenus[0];
            let cozePackageMenu = await this.menuRepository.findOne({
                where: { code: mainMenuData.code },
            });

            if (cozePackageMenu) {
                // 更新现有菜单，确保正确的父菜单关系
                await this.menuRepository.update(cozePackageMenu.id, {
                    ...mainMenuData,
                    parentId: userMenu.id,
                });
                this.logger.log(`✅ 更新 Coze 套餐主菜单: ${mainMenuData.name}`);
            } else {
                // 创建新菜单
                cozePackageMenu = await this.menuRepository.save(mainMenuData);
                this.logger.log(
                    `✅ 创建 Coze 套餐主菜单: ${mainMenuData.name} (ID: ${cozePackageMenu.id})`,
                );
            }

            // 处理子菜单（权限菜单）
            const subMenuData = newCozeMenus[1];
            subMenuData.parentId = cozePackageMenu.id;

            let cozePackageSaveMenu = await this.menuRepository.findOne({
                where: { code: subMenuData.code },
            });

            if (cozePackageSaveMenu) {
                // 更新现有菜单，确保正确的父菜单关系
                await this.menuRepository.update(cozePackageSaveMenu.id, {
                    ...subMenuData,
                    parentId: cozePackageMenu.id,
                });
                this.logger.log(`✅ 更新 Coze 套餐权限菜单: ${subMenuData.name}`);
            } else {
                // 创建新菜单
                cozePackageSaveMenu = await this.menuRepository.save(subMenuData);
                this.logger.log(
                    `✅ 创建 Coze 套餐权限菜单: ${subMenuData.name} (ID: ${cozePackageSaveMenu.id})`,
                );
            }

            this.logger.log("✅ Coze 套餐菜单升级完成");
        } catch (error) {
            this.logger.error(`❌ 菜单结构升级失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 确保权限存在，如果不存在则创建
     * @param code 权限编码
     * @param name 权限名称
     * @param description 权限描述
     */
    private async ensurePermissionExists(
        code: string,
        name: string,
        description: string,
    ): Promise<void> {
        // 查找权限是否存在
        const permission = await this.permissionRepository.findOne({
            where: { code },
        });

        // 如果权限不存在，则创建
        if (!permission) {
            this.logger.log(`创建权限: ${code}`);
            const newPermission = new Permission();
            newPermission.code = code;
            newPermission.name = name;
            newPermission.description = description;
            newPermission.type = PermissionType.PLUGIN; // 插件权限
            newPermission.pluginPackName = null;

            // 保存新权限
            await this.permissionRepository.save(newPermission);
            this.logger.log(`✅ 权限创建成功: ${code}`);
        } else {
            this.logger.log(`权限已存在: ${code}`);
        }
    }

    /**
     * 回滚升级（用于测试）
     *
     * 注意：此方法仅用于开发和测试环境
     */
    async rollback(): Promise<void> {
        this.logger.warn("⚠️ 开始执行 1.0.0-beta.9 版本回滚操作");

        try {
            // 删除 Coze 套餐配置表中的所有数据
            await this.cozePackageConfigRepository.clear();
            this.logger.log("✅ 已清空 Coze 套餐配置数据");

            // 注意：在生产环境中，通常不建议删除表结构
            // 这里仅作为测试用途
            const metadata = this.dataSource.getMetadata(CozePackageConfig);
            const tableName = metadata.tableName;

            await this.dataSource.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
            this.logger.log(`✅ 已删除表 ${tableName}`);

            this.logger.warn("✅ 1.0.0-beta.9 版本回滚操作完成");
        } catch (error) {
            this.logger.error(`❌ 1.0.0-beta.9 版本回滚操作失败: ${error.message}`);
            throw error;
        }
    }
}
