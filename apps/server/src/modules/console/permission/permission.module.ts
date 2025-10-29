import { Permission } from "@common/modules/auth/entities/permission.entity";
import { Role } from "@common/modules/auth/entities/role.entity";
import { User } from "@common/modules/auth/entities/user.entity";
import { Module } from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PermissionController } from "./permission.controller";
import { PermissionService } from "./permission.service";

/**
 * 权限管理模块
 *
 * 提供权限的管理功能，包括权限扫描、权限列表查询等
 */
@Module({
    imports: [TypeOrmModule.forFeature([Permission, Role, User]), DiscoveryModule],
    controllers: [PermissionController],
    providers: [PermissionService],
    exports: [PermissionService],
})
export class PermissionModule {}
