import { CozePackageConfig } from "@modules/console/coze-package/entities/coze-package-config.entity";
import { Menu } from "@modules/console/menu/entities/menu.entity";
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

    constructor(
        private readonly dataSource: DataSource,
        private readonly permissionService: PermissionService,
    ) {
        this.cozePackageConfigRepository = dataSource.getRepository(CozePackageConfig);
        this.menuRepository = dataSource.getRepository(Menu);
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
     * 获取配置文件路径
     *
     * 检查多个可能的路径，返回第一个存在的文件路径
     *
     * @param fileName 配置文件名
     * @returns 文件路径，如果找不到则返回 null
     */
    private getConfigFilePath(fileName: string): string | null {
        const possiblePaths = [
            path.join(process.cwd(), `src/core/database/install/${fileName}`), // 在 apps/server 目录下运行
            path.join(process.cwd(), `apps/server/src/core/database/install/${fileName}`), // 在项目根目录下运行
            path.join(__dirname, `../install/${fileName}`), // 相对于当前升级目录
        ];

        for (const possiblePath of possiblePaths) {
            if (fse.pathExistsSync(possiblePath)) {
                return possiblePath;
            }
        }

        return null;
    }

    /**
     * 升级菜单结构
     *
     * 将新增的 Coze 套餐菜单正确关联到用户管理菜单下
     */
    private async upgradeMenus(): Promise<void> {
        this.logger.log("开始升级菜单结构");

        try {
            // 获取菜单配置文件路径
            const menuFilePath = this.getConfigFilePath("menu.json");
            if (!menuFilePath) {
                this.logger.warn("未找到菜单配置文件，跳过菜单升级");
                return;
            }

            // 读取菜单配置
            const menuConfig = await fse.readJson(menuFilePath);
            if (!Array.isArray(menuConfig) || menuConfig.length === 0) {
                this.logger.warn("菜单配置文件为空或格式不正确，跳过菜单升级");
                return;
            }

            // 查找用户管理菜单
            const userManagementMenu = await this.menuRepository.findOne({
                where: { code: "user" },
            });

            if (!userManagementMenu) {
                this.logger.error("未找到用户管理菜单，无法关联 Coze 套餐菜单");
                return;
            }

            // 处理菜单升级
            await this.upgradeMenuTree(menuConfig, userManagementMenu.id);

            this.logger.log("✅ 菜单结构升级完成");
        } catch (error) {
            this.logger.error(`❌ 菜单结构升级失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 递归升级菜单树
     *
     * @param menuItems 菜单项数组
     * @param parentId 父菜单ID
     */
    private async upgradeMenuTree(menuItems: any[], parentId: string | null = null): Promise<void> {
        for (const menuItem of menuItems) {
            // 提取子菜单
            const { children, ...menuData } = menuItem;

            // 设置父级ID
            menuData.parentId = parentId;

            // 处理权限编码：空字符串转换为null
            if (menuData.permissionCode === "" || menuData.permissionCode === undefined) {
                menuData.permissionCode = null;
            }

            // 检查权限编码是否存在
            if (menuData.permissionCode) {
                try {
                    const permissionExists = await this.permissionService.findByCodeSafe(
                        menuData.permissionCode,
                    );

                    if (!permissionExists) {
                        this.logger.warn(
                            `权限编码 ${menuData.permissionCode} 不存在，已设置为 null`,
                        );
                        menuData.permissionCode = null;
                    }
                } catch (error) {
                    this.logger.error(`检查权限编码失败: ${error.message}`);
                    menuData.permissionCode = null;
                }
            }

            // 处理插件标识：空字符串转换为null
            if (menuData.pluginPackName === "" || menuData.pluginPackName === undefined) {
                menuData.pluginPackName = null;
            }

            let savedMenu;

            // 通过 code 判断菜单是否已存在
            if (menuData.code) {
                const existingMenu = await this.menuRepository.findOne({
                    where: { code: menuData.code },
                });

                if (existingMenu) {
                    // 更新现有菜单，确保正确设置父菜单ID
                    await this.menuRepository.update(existingMenu.id, {
                        ...menuData,
                        parentId: parentId, // 确保父菜单ID正确设置
                    });
                    savedMenu = await this.menuRepository.findOne({
                        where: { id: existingMenu.id },
                    });
                    this.logger.log(`更新菜单: ${menuData.name} (code: ${menuData.code}) -> 父菜单ID: ${parentId}`);
                } else {
                    // 创建新菜单
                    savedMenu = await this.menuRepository.save(menuData);
                    this.logger.log(`创建菜单: ${menuData.name} (code: ${menuData.code}) -> 父菜单ID: ${parentId}`);
                }
            } else {
                // 没有 code 的菜单直接创建（可能是旧数据）
                savedMenu = await this.menuRepository.save(menuData);
                this.logger.log(`创建菜单: ${menuData.name} (无code) -> 父菜单ID: ${parentId}`);
            }

            // 如果有子菜单，递归处理
            if (children && children.length > 0) {
                await this.upgradeMenuTree(children, savedMenu.id);
            }
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