import { CozePackageOrder } from "@modules/console/coze-package/entities/coze-package-order.entity";
import { CozePackageConfig } from "@modules/console/coze-package/entities/coze-package-config.entity";
import { User } from "@common/modules/auth/entities/user.entity";
import { Menu, MenuType, MenuSourceType } from "@modules/console/menu/entities/menu.entity";
import { Permission, PermissionType } from "@common/modules/auth/entities/permission.entity";
import { Logger } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

import { PermissionService } from "@/modules/console/permission/permission.service";

/**
 * 版本 1.0.0-beta.10 升级逻辑
 *
 * 主要功能：
 * 1. 创建 Coze 套餐订单表
 * 2. 初始化示例订单数据
 * 3. 添加订单相关权限
 * 4. 更新菜单结构
 */
export class Upgrade {
    private readonly logger = new Logger(Upgrade.name);

    /**
     * Coze套餐订单Dao
     */
    private readonly cozePackageOrderRepository: Repository<CozePackageOrder>;

    /**
     * Coze套餐配置Dao
     */
    private readonly cozePackageConfigRepository: Repository<CozePackageConfig>;

    /**
     * 用户Dao
     */
    private readonly userRepository: Repository<User>;

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
        this.cozePackageOrderRepository = dataSource.getRepository(CozePackageOrder);
        this.cozePackageConfigRepository = dataSource.getRepository(CozePackageConfig);
        this.userRepository = dataSource.getRepository(User);
        this.menuRepository = dataSource.getRepository(Menu);
        this.permissionRepository = dataSource.getRepository(Permission);
    }

    /**
     * 执行升级逻辑
     */
    async execute(): Promise<void> {
        this.logger.debug("开始执行 1.0.0-beta.10 版本升级逻辑");

        try {
            // 1. 同步 Coze 套餐订单表结构
            await this.syncCozePackageOrderTable();

            // 2. 初始化示例订单数据
            await this.initializeExampleOrderData();

            // 3. 添加订单相关权限
            await this.addOrderPermissions();

            // 4. 更新菜单结构
            await this.upgradeMenus();

            this.logger.debug("✅ 1.0.0-beta.10 版本升级逻辑执行完成");
        } catch (error) {
            this.logger.error(`❌ 1.0.0-beta.10 版本升级逻辑执行失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 同步 Coze 套餐订单表结构
     *
     * 通过 TypeORM 实体自动同步表结构
     */
    private async syncCozePackageOrderTable(): Promise<void> {
        this.logger.log("开始同步 Coze 套餐订单表结构");

        try {
            // 获取 CozePackageOrder 实体的元数据
            const metadata = this.dataSource.getMetadata(CozePackageOrder);
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
            this.logger.error(`❌ 同步 Coze 套餐订单表结构失败: ${error.message}`);
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
                "orderNo",
                "userId",
                "packageConfigId",
                "packageName",
                "packageType",
                "packageDescription",
                "packageOriginalPrice",
                "packageCurrentPrice",
                "packageDuration",
                "quantity",
                "totalAmount",
                "discountAmount",
                "paidAmount",
                "paymentMethod",
                "orderStatus",
                "paymentStatus",
                "refundStatus",
                "transactionId",
                "prepayId",
                "payId",
                "orderSource",
                "orderType",
                "paidAt",
                "expiredAt",
                "refundAmount",
                "refundReason",
                "refundAt",
                "remark",
                "metadata",
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
     * 初始化示例订单数据
     */
    private async initializeExampleOrderData(): Promise<void> {
        this.logger.log("开始初始化 Coze 套餐订单示例数据");

        try {
            // 检查是否已有订单数据
            const existingOrderCount = await this.cozePackageOrderRepository.count();

            if (existingOrderCount > 0) {
                this.logger.log(`已存在 ${existingOrderCount} 条订单数据，跳过初始化`);
                return;
            }

            // 获取第一个用户和第一个套餐配置
            const firstUser = await this.userRepository.findOne({
                where: {},
                order: { createdAt: "ASC" },
            });

            const firstPackageConfig = await this.cozePackageConfigRepository.findOne({
                where: {},
                order: { createdAt: "ASC" },
            });

            if (!firstUser || !firstPackageConfig) {
                this.logger.warn("未找到用户或套餐配置，跳过示例订单数据初始化");
                return;
            }

            // 准备示例订单数据
            const exampleOrders = [
                {
                    orderNo: `ORD${Date.now()}001`,
                    userId: firstUser.id,
                    packageConfigId: firstPackageConfig.id,
                    packageName: firstPackageConfig.name,
                    packageType: "basic",
                    packageDescription: firstPackageConfig.description || "基础套餐",
                    packageOriginalPrice: firstPackageConfig.originalPrice,
                    packageCurrentPrice: firstPackageConfig.currentPrice,
                    packageDuration: firstPackageConfig.duration,
                    quantity: 1,
                    totalAmount: firstPackageConfig.currentPrice,
                    discountAmount: 0,
                    paidAmount: firstPackageConfig.currentPrice,
                    paymentMethod: "wechat",
                    orderStatus: "completed",
                    paymentStatus: "paid",
                    refundStatus: "none",
                    transactionId: `TXN${Date.now()}001`,
                    orderSource: "web",
                    orderType: "coze-package",
                    paidAt: new Date(),
                    expiredAt: new Date(Date.now() + firstPackageConfig.duration * 24 * 60 * 60 * 1000),
                    refundAmount: 0,
                    remark: "示例订单数据",
                    metadata: {
                        source: "system_init",
                        version: "1.0.0-beta.10",
                    },
                },
                {
                    orderNo: `ORD${Date.now()}002`,
                    userId: firstUser.id,
                    packageConfigId: firstPackageConfig.id,
                    packageName: firstPackageConfig.name,
                    packageType: "basic",
                    packageDescription: firstPackageConfig.description || "基础套餐",
                    packageOriginalPrice: firstPackageConfig.originalPrice,
                    packageCurrentPrice: firstPackageConfig.currentPrice,
                    packageDuration: firstPackageConfig.duration,
                    quantity: 1,
                    totalAmount: firstPackageConfig.currentPrice,
                    discountAmount: 0,
                    paidAmount: firstPackageConfig.currentPrice,
                    paymentMethod: "alipay",
                    orderStatus: "pending",
                    paymentStatus: "unpaid",
                    refundStatus: "none",
                    orderSource: "web",
                    orderType: "coze-package",
                    expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后过期
                    refundAmount: 0,
                    remark: "待支付示例订单",
                    metadata: {
                        source: "system_init",
                        version: "1.0.0-beta.10",
                    },
                },
            ];

            // 批量插入示例数据
            const savedOrders = await this.cozePackageOrderRepository.save(exampleOrders);

            this.logger.log(`✅ 成功初始化 ${savedOrders.length} 条示例订单数据`);

            // 记录每个订单的详细信息
            savedOrders.forEach((order) => {
                this.logger.log(
                    `  - 订单号: ${order.orderNo}, 状态: ${order.orderStatus}, 金额: ¥${order.paidAmount}`,
                );
            });
        } catch (error) {
            this.logger.error(`❌ 初始化示例订单数据失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 添加订单相关权限
     */
    private async addOrderPermissions(): Promise<void> {
        this.logger.log("开始添加 Coze 套餐订单相关权限");

        try {
            // 定义订单相关权限
            const orderPermissions = [
                {
                    code: "coze-package-order:list",
                    name: "查询订单列表",
                    description: "查看Coze套餐订单列表",
                },
                {
                    code: "coze-package-order:detail",
                    name: "查看订单详情",
                    description: "查看Coze套餐订单详细信息",
                },
                {
                    code: "coze-package-order:statistics",
                    name: "查看订单统计",
                    description: "查看Coze套餐订单统计数据",
                },
                {
                    code: "coze-package-order:refund",
                    name: "申请订单退款",
                    description: "申请Coze套餐订单退款",
                },
                {
                    code: "coze-package-order:export",
                    name: "导出订单数据",
                    description: "导出Coze套餐订单数据",
                },
            ];

            // 逐个创建权限
            for (const permission of orderPermissions) {
                await this.ensurePermissionExists(
                    permission.code,
                    permission.name,
                    permission.description,
                );
            }

            this.logger.log(`✅ 成功添加 ${orderPermissions.length} 个订单相关权限`);
        } catch (error) {
            this.logger.error(`❌ 添加订单相关权限失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 更新菜单结构
     *
     * 添加订单管理菜单项
     */
    private async upgradeMenus(): Promise<void> {
        this.logger.log("开始升级菜单结构 - 添加 Coze 套餐订单菜单");

        try {
            // 查找用户管理菜单
            const userMenu = await this.menuRepository.findOne({
                where: { code: "user" },
            });

            if (!userMenu) {
                this.logger.error("未找到用户管理菜单，无法添加 Coze 套餐订单菜单");
                return;
            }

            // 检查订单管理菜单是否已存在
            const existingOrderMenu = await this.menuRepository.findOne({
                where: { code: "order-management" },
            });

            if (existingOrderMenu) {
                this.logger.log("订单管理菜单已存在，跳过创建");
                
                // 检查 Coze 套餐订单子菜单是否存在
                const existingCozeOrderMenu = await this.menuRepository.findOne({
                    where: { code: "coze-package-order" },
                });

                if (!existingCozeOrderMenu) {
                    // 创建 Coze 套餐订单子菜单
                const cozeOrderMenu = this.menuRepository.create({
                    code: "coze-package-order",
                    name: "Coze套餐订单",
                    path: "/console/order-management/coze-package-order",
                    icon: "i-lucide-shopping-cart",
                    sort: 1,
                    parentId: existingOrderMenu.id,
                    isHidden: 0,
                    type: MenuType.MENU,
                    sourceType: MenuSourceType.SYSTEM,
                    component: "order-management/coze-package-order/index",
                });

                    await this.menuRepository.save(cozeOrderMenu);
                    this.logger.log("✅ 创建 Coze 套餐订单子菜单成功");
                }
                return;
            }

            // 创建订单管理主菜单
            const orderManagementMenu = this.menuRepository.create({
                code: "order-management",
                name: "订单管理",
                path: "/console/order-management",
                icon: "i-lucide-shopping-bag",
                sort: 5,
                parentId: userMenu.id,
                isHidden: 0,
                type: MenuType.DIRECTORY,
                sourceType: MenuSourceType.SYSTEM,
                component: null,
            });

            const savedOrderMenu = await this.menuRepository.save(orderManagementMenu);
            this.logger.log("✅ 创建订单管理主菜单成功");

            // 创建 Coze 套餐订单子菜单
            const cozeOrderMenu = this.menuRepository.create({
                code: "coze-package-order",
                name: "Coze套餐订单",
                path: "/console/order-management/coze-package-order",
                icon: "i-lucide-shopping-cart",
                sort: 1,
                parentId: savedOrderMenu.id,
                isHidden: 0,
                type: MenuType.MENU,
                sourceType: MenuSourceType.SYSTEM,
                component: "order-management/coze-package-order/index",
            });

            await this.menuRepository.save(cozeOrderMenu);
            this.logger.log("✅ 创建 Coze 套餐订单子菜单成功");

        } catch (error) {
            this.logger.error(`❌ 升级菜单结构失败: ${error.message}`);
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
        this.logger.warn("⚠️ 开始执行 1.0.0-beta.10 版本回滚操作");

        try {
            // 删除 Coze 套餐订单表中的所有数据
            await this.cozePackageOrderRepository.clear();
            this.logger.log("✅ 已清空 Coze 套餐订单数据");

            // 删除订单相关权限
            const orderPermissionCodes = [
                "coze-package-order:list",
                "coze-package-order:detail",
                "coze-package-order:statistics",
                "coze-package-order:refund",
                "coze-package-order:export",
            ];

            for (const code of orderPermissionCodes) {
                await this.permissionRepository.delete({ code });
                this.logger.log(`✅ 已删除权限: ${code}`);
            }

            // 删除菜单项
            await this.menuRepository.delete({ code: "coze-package-order" });
            await this.menuRepository.delete({ code: "order-management" });
            this.logger.log("✅ 已删除相关菜单项");

            // 注意：在生产环境中，通常不建议删除表结构
            // 这里仅作为测试用途
            const metadata = this.dataSource.getMetadata(CozePackageOrder);
            const tableName = metadata.tableName;

            await this.dataSource.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
            this.logger.log(`✅ 已删除表 ${tableName}`);

            this.logger.warn("✅ 1.0.0-beta.10 版本回滚操作完成");
        } catch (error) {
            this.logger.error(`❌ 1.0.0-beta.10 版本回滚操作失败: ${error.message}`);
            throw error;
        }
    }
}