import type { ExtendedBaseQueryParams } from "./global";
import type { UserCozePackage } from "@/types/coze-package";

/** 角色信息 */
export interface RoleInfo {
    id: string;
    name: string;
    description: string;
    isDisabled: boolean;
    createdAt: string;
    updatedAt: string;
}

/** 用户信息 */
export interface UserInfo {
    /** 用户ID */
    id: string;
    /** 用户名 */
    username: string;
    /* openid */
    openid?: string;
    /** 用户编号 */
    userNo?: string;
    /** 密码 */
    password: string;
    /** 昵称 */
    nickname?: string;
    /** 邮箱 */
    email?: string;
    /** 手机号 */
    phone?: string;
    /** 手机号区号 */
    phoneAreaCode?: string;
    /** 头像 */
    avatar?: string;
    /** 角色ID */
    roleId?: string;
    /** 用户状态 (0: 禁用, 1: 启用) */
    status?: number;
    /** 电力值 */
    power?: number;
    /** 是否为超级管理员 (0: 否, 1: 是) */
    isRoot?: number;
    /** 是否有权限 */
    permissions?: number;
    /** 注册来源 (0: 管理员新增, 1: 手机号注册, 2: 微信注册, 3: 邮箱注册, 4: 账号注册) */
    source?: number;
    /** 最后登录时间 */
    lastLoginAt?: string;
    /** 用户关联的角色 */
    role?: RoleInfo;
    /** 创建时间 */
    createdAt: string;
    /** 更新时间 */
    updatedAt: string;
    /** 删除时间 */
    deletedAt?: string;
    /** 真实姓名 */
    realName?: string;
    /** Coze套餐信息 */
    cozePackage?: UserCozePackage | null;
}

// 用户中心
export interface UserCenter {
    user: UserInfo;
    permissions: string[];
    menus: MenuFormData[];
}

/** 登录返回 */
export interface LoginResponse {
    nickname: string;
    sn: number;
    email: null | string;
    mobile: string;
    avatar: string;
    token: string;
    user: UserInfo;
}

// 用户列表请求参数 - 使用扩展的基础查询参数
export interface UserQueryRequest extends ExtendedBaseQueryParams {
    // 所有常用的查询字段（keyword, startDate, endDate, startTime, endTime, status 等）都已在父接口中定义
}

// 用户列表数据 - 用于表格显示
export interface UserTableData extends UserInfo {}

/** 基础用户信息（排除创建/更新时间等字段） */
export type BaseUserInfo = Omit<
    UserInfo,
    "id" | "createdAt" | "updatedAt" | "deletedAt" | "role" | "lastLoginAt" | "isRoot"
>;

/**
 * 用户创建请求接口
 */
export interface UserCreateRequest extends BaseUserInfo {
    /** 角色ID */
    roleId?: string;
}

/**
 * 用户更新请求接口
 */
export interface UserUpdateRequest
    extends Partial<Omit<UserCreateRequest, "username" | "password">> {
    /** 用户ID（更新时必需） */
    id: string;
}

/**
 * 更新用户字段请求参数
 */
export interface UpdateUserFieldRequest {
    /** 要更新的字段名 */
    field: "nickname" | "email" | "phone" | "avatar" | "bio" | "gender";
    /** 字段值 */
    value: any;
}

/**
 * 更新用户字段响应接口
 */
export interface UpdateUserFieldResponse {
    /** 更新后的用户信息 */
    user: UserInfo;
    /** 操作结果消息 */
    message: string;
}

/**
 * 微信登录二维码响应
 */
export interface WechatLoginCode {
    key: string;
    qrcode: string;
    url: string;
}

/**
 * 微信登录票据响应
 */
export interface WechatLoginTicket {
    status: string;
    data?: any;
    is_scan: boolean;
    user: LoginResponse;
}

/**
 * 系统登录参数
 */
export interface SystemLoginAccountParams {
    username: string;
    password: string;
    terminal?: string;
}

/**
 * 系统注册参数
 */
export interface SystemRegisrerAccountParams {
    username: string;
    password: string;
    email?: string;
    phone?: string;
    terminal?: string;
}
