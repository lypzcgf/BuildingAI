import { AppEntity } from "@common/decorators/app-entity.decorator";
import {
    Column,
    CreateDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

/**
 * Coze套餐配置实体
 *
 * 用于存储Coze套餐的配置信息，包括套餐名称、时长、价格等
 */
@AppEntity({ name: "coze_package_config", comment: "Coze套餐配置" })
export class CozePackageConfig {
    /**
     * 套餐ID
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 套餐名称
     */
    @Column({
        type: "varchar",
        length: 100,
        comment: "套餐名称",
    })
    name: string;

    /**
     * 套餐时长（天）
     */
    @Column({
        type: "integer",
        comment: "套餐时长（天）",
    })
    duration: number;

    /**
     * 原价
     */
    @Column({
        type: "decimal",
        precision: 10,
        scale: 2,
        comment: "原价",
    })
    originalPrice: number;

    /**
     * 现价
     */
    @Column({
        type: "decimal",
        precision: 10,
        scale: 2,
        comment: "现价",
    })
    currentPrice: number;

    /**
     * 套餐说明
     */
    @Column({
        type: "text",
        nullable: true,
        comment: "套餐说明",
    })
    description?: string;

    /**
     * 创建时间
     */
    @CreateDateColumn({
        type: "timestamp with time zone",
        comment: "创建时间",
    })
    createdAt: Date;

    /**
     * 更新时间
     */
    @UpdateDateColumn({
        type: "timestamp with time zone",
        comment: "更新时间",
    })
    updatedAt: Date;
}