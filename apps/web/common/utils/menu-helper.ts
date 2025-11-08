export interface BreadcrumbItem {
    label: string;
    to?: string;
    active?: boolean;
}

export interface NavigationMenuItem {
    label: string;
    icon?: string;
    to?: string;
    active?: boolean;
    defaultOpen?: boolean;
    children?: NavigationMenuItem[];
}
import type { Component } from "vue";
import type { Composer } from "vue-i18n";
import type { RouteRecordRaw } from "vue-router";

import { MENU_TYPE, ROUTES } from "@/common/constants";
import type { MenuFormData } from "@/models/menu";

export interface SearchMenuItem {
    id: string;
    name: string;
    icon: string;
    iconClass: string;
    type: string;
    path: string;
    parentName: string;
}

export interface TransformedMenuItem extends NavigationMenuItem {
    matchPath: string;
    children?: TransformedMenuItem[];
}

interface TransformOptions {
    directoryToEmpty?: boolean;
    currentPath?: string;
}

// -------------------- 基础工具 --------------------

function normalizePath(parent: string, child?: string): string {
    return parent + (child?.startsWith("/") ? child : `/${child || ""}`);
}

function filterVisibleMenus(menus: MenuFormData[], visible: boolean): MenuFormData[] {
    return menus
        .filter((m) => m.type !== MENU_TYPE.BUTTON && (visible || !m.isHidden))
        .sort((a, b) => (a.sort || 0) - (b.sort || 0));
}

function getMatchPath(menu: MenuFormData, parentPath = ""): string {
    const currentPath = menu.path ? `/${menu.path}` : "";
    const basePath = `${parentPath}${currentPath}`;
    return `${ROUTES.CONSOLE}${basePath}`.replace(/\/+/g, "/").replace(/\/$/, "");
}

function getToPath(menu: MenuFormData, parentPath = ""): string {
    const currentPath = normalizePath(parentPath, menu.path);

    if (menu.type === MENU_TYPE.MENU && !menu.isHidden && menu.component) {
        return `${ROUTES.CONSOLE}${currentPath}`.replace(/\/+/g, "/");
    }

    if (menu.children?.length) {
        const validChild = menu.children.find(
            (child) => !child.isHidden && (child.component || child.children?.length),
        );
        if (validChild) {
            return getToPath(validChild, currentPath);
        }
    }
    return `${ROUTES.CONSOLE}${currentPath}`.replace(/\/+/g, "/");
}

export function transformMenus(
    menus: MenuFormData[],
    parentPath = "",
    options: TransformOptions = {},
): TransformedMenuItem[] {
    const { $i18n } = useNuxtApp();
    const { t, locale } = $i18n as Composer;

    // 处理结果数组
    let result: TransformedMenuItem[] = [];

    // 处理每个菜单项
    filterVisibleMenus(menus, false).forEach((menu) => {
        // 如果是插件菜单且有pluginPackName，使用pluginPackName作为路径前缀
        const isPluginMenu = menu.sourceType === 2 && menu.pluginPackName;
        let basePath: string;

        if (isPluginMenu) {
            // 插件菜单直接使用 pluginPackName 作为前缀
            basePath = `/${menu.pluginPackName}`;
        } else {
            // 系统菜单使用父级路径
            basePath = parentPath;
        }

        const matchPath = getMatchPath(menu, basePath);
        const fullPath = normalizePath(basePath, menu.path);
        const to =
            (options.directoryToEmpty && menu.type === MENU_TYPE.DIRECTORY) ||
            menu.type === MENU_TYPE.GROUP
                ? undefined
                : getToPath(menu, basePath);

        const children = menu.children?.length
            ? transformMenus(menu.children, fullPath, options)
            : [];

        const isCurrentPathMatch = options.currentPath
            ? options.currentPath.startsWith(matchPath)
            : false;
        const hasExpandedChildren = children.some((child) => child.defaultOpen || child.active);
        const defaultOpen = isCurrentPathMatch || hasExpandedChildren;

        // 特殊处理 GROUP 类型的菜单
        if (menu.type === MENU_TYPE.GROUP) {
            // 1. 添加标签项
            result.push({
                label: t(menu.name) || menu.name,
                type: "label",
                matchPath,
                children: [],
            } as TransformedMenuItem);

            // 2. 将子项添加到同级
            if (menu.children?.length) {
                result = result.concat(children);
            }
        } else {
            // 正常处理其他类型的菜单
            result.push({
                label: t(menu.name) || menu.name,
                icon: menu.icon || "",
                to,
                matchPath,
                active: !!to && isCurrentPathMatch,
                defaultOpen,
                children,
            });
        }
    });

    return result;
}

// -------------------- 功能模块 --------------------

export function buildRoutes(
    isRoot = false,
    componentLoader: Record<string, any>,
): RouteRecordRaw[] {
    const { $i18n } = useNuxtApp();
    const { t } = $i18n as Composer;

    // 收集所有路由
    const allRoutes = walkFlat(usePermissionStore().menus, (menu, path) => {
        const allowed =
            isRoot ||
            !menu.permissionCode ||
            usePermissionStore().hasPermission(menu.permissionCode);

        if (menu.type === MENU_TYPE.MENU && menu.component && allowed) {
            const layout = (useNuxtApp() as any).$getConsoleLayout(menu.component);

            // 确保路径格式正确，避免多个斜杠连在一起
            const normalizedPath = path.replace(/\/+/g, "/");

            return {
                name: `menu-${menu.id}`,
                path: normalizedPath,
                component: loadComponent(menu.component, componentLoader),
                meta: {
                    title: t(menu.name),
                    permissionCode: menu.permissionCode,
                    isPlugin: menu.component.startsWith("@plugins/"),
                    pluginId: menu.component.startsWith("@plugins/")
                        ? menu.component.split("/")[1]
                        : undefined,
                    layout,
                },
            };
        }

        return [];
    });

    // 处理三层嵌套结构：console -> [id] -> 页面
    return processNestedStructure(allRoutes, componentLoader, t);
}

export function buildTopNavItems(): TransformedMenuItem[] {
    const menus = usePermissionStore().menus;
    return transformMenus(menus, "", { directoryToEmpty: false });
}

export function buildSidebarItems(path: string): TransformedMenuItem[] {
    const menus = usePermissionStore().menus;
    return transformMenus(menus, "", { directoryToEmpty: true, currentPath: path });
}

export function buildSearchItems(): SearchMenuItem[] {
    return walkFlat(usePermissionStore().menus, (menu, path, parent) => {
        if (menu.type === MENU_TYPE.MENU) {
            return {
                id: String(menu.id),
                name: menu.name,
                icon: menu.icon || "i-heroicons-squares-2x2-20-solid",
                iconClass: "bg-blue-100",
                type: "menu",
                path,
                parentName: parent,
            };
        }
        return [];
    });
}

export function buildBreadcrumbs(
    currentPath = useRoute().path,
    homePath = "/",
    homeLabel = "后台管理",
): BreadcrumbItem[] {
    if (!currentPath || currentPath === homePath) {
        return [{ label: homeLabel, to: homePath, active: true }];
    }

    const { $i18n } = useNuxtApp();
    const { t } = $i18n as Composer;

    const trail: { name: string; path: string }[] = [];

    walkFlat(usePermissionStore().menus, (menu, path) => {
        if (currentPath === path || currentPath.startsWith(path + "/")) {
            if (menu.type === 1) {
                trail.push({ name: menu.name, path: "" });
                return;
            }
            trail.push({ name: menu.name, path });
        }
        return [];
    });

    trail.sort((a, b) => a.path.length - b.path.length);

    // if (trail.length > 1) {
    //     trail[0].path = "";
    // }

    return [
        { label: homeLabel, to: homePath },
        ...trail.map((item, i, arr) => ({
            label: t(item.name),
            to: item.path,
            active: i === arr.length - 1,
        })),
    ];
}

/**
 * 处理三层嵌套路由结构：console -> [id] -> 页面
 * 将 /console/ai-datasets/:id/documents 转换为嵌套路由
 */
function processNestedStructure(
    routes: RouteRecordRaw[],
    componentLoader: Record<string, any>,
    t: (key: string) => string,
): RouteRecordRaw[] {
    // 仅匹配严格的三段路径：/console/{module}/:{param}/{subpage}
    const NESTED_MATCH_RE = /^\/console\/([^/]+)\/(::?[^/]+)\/(.+)$/; // 兼容可能重复":"的脏数据

    const groupedByLayout = new Map<string, RouteRecordRaw[]>();
    const flatRoutes: RouteRecordRaw[] = [];

    for (const route of routes) {
        const path = route.path as string;
        const match = path.match(NESTED_MATCH_RE);

        if (!match) {
            flatRoutes.push(route);
            continue;
        }

        const moduleName = match[1] || "";
        let idParam = match[2] || "";
        const subpageRaw = match[3] || "";

        // 规范化 idParam，确保以":"开头且无重复"::"
        if (!idParam.startsWith(":")) idParam = ":" + idParam.replace(/^:+/, "");
        else idParam = ":" + idParam.replace(/^:+/, "");

        // 规范化子路径，移除开头斜杠
        const subpage = subpageRaw.replace(/^\/+/, "");

        const layoutPath = `/console/${moduleName}/${idParam}`;
        const group = groupedByLayout.get(layoutPath) || [];

        // 子路由：保留原始 name/meta/component，仅更改 path 为相对路径
        group.push({
            ...route,
            path: subpage,
        });

        groupedByLayout.set(layoutPath, group);
    }

    // 若无任何嵌套，直接返回原 routes
    if (groupedByLayout.size === 0) return routes;

    // 构建父布局 + 子路由
    const nestedRoutes: RouteRecordRaw[] = [];

    for (const [layoutPath, children] of groupedByLayout.entries()) {
        const moduleName = (layoutPath.match(/^\/console\/([^/]+)\//)?.[1] || "").trim();
        const layoutComponent = moduleName
            ? loadComponent(`${moduleName}/[id]`, componentLoader)
            : undefined;

        if (layoutComponent) {
            nestedRoutes.push({
                name: `layout-${moduleName}-detail`,
                path: layoutPath,
                component: layoutComponent,
                meta: {
                    // 父布局仅负责布局，不绑定权限码
                    layout: "console",
                },
                children: children,
            });
        } else {
            // 找不到父布局组件，则回退为扁平路由
            for (const child of children) {
                nestedRoutes.push({
                    ...child,
                    path: `${layoutPath}/${(child.path as string).replace(/^\/+/, "")}`,
                });
            }
        }
    }

    return flatRoutes.concat(nestedRoutes);
}

// -------------------- 辅助函数 --------------------

function walkFlat<T>(
    menus: MenuFormData[],
    visitor: (menu: MenuFormData, path: string, parent: string) => T | T[],
    parent: string = ROUTES.CONSOLE,
): T[] {
    return filterVisibleMenus(menus, true).flatMap((menu) => {
        let path: typeof ROUTES.CONSOLE | string;

        // 如果是插件菜单且有pluginPackName
        if (menu.sourceType === 2 && menu.pluginPackName) {
            // 先将多个斜杠合并为一个
            const consolePath = ROUTES.CONSOLE.replace(/\/+$/, "");
            const pluginPath = menu.pluginPackName.replace(/^\/+|\/+$/g, "");
            path = normalizePath(`${consolePath}/${pluginPath}`, menu.path);
        } else {
            path = normalizePath(parent, menu.path) as typeof ROUTES.CONSOLE;
        }

        // 最终规范化路径，确保不会有多个斜杠连在一起
        path = path.replace(/\/+/g, "/");

        const result = visitor(menu, path, parent);
        const children = menu.children?.length ? walkFlat(menu.children, visitor, path) : [];
        return ([] as T[]).concat(result, children);
    });
}

function loadComponent(component: string, loader: Record<string, any>): Component {
    try {
        // 处理常规组件路径
        let key = Object.keys(loader).find((k) => k.includes(`${component}.vue`));

        // 兼容以目录形式声明的页面：/path/to/page -> /path/to/page/index.vue
        if (!key) {
            const indexForm = component.endsWith(".vue")
                ? component.replace(/\.vue$/, "/index.vue")
                : `${component}/index.vue`;
            key = Object.keys(loader).find((k) => k.includes(indexForm));
        }

        // 插件组件路径 (格式: @plugins/plugin-name/app/console/path)
        if (!key && component.startsWith("@plugins/")) {
            const pluginPath = component.replace("@plugins/", "/plugins/");
            key = Object.keys(loader).find((k) => k.includes(pluginPath));

            // 同样支持插件目录 index.vue
            if (!key) {
                const pluginIndexForm = pluginPath.endsWith(".vue")
                    ? pluginPath.replace(/\.vue$/, "/index.vue")
                    : `${pluginPath}/index.vue`;
                key = Object.keys(loader).find((k) => k.includes(pluginIndexForm));
            }
        }

        if (!key) {
            throw new Error(`未找到组件：${component}`);
        }
        return loader[key];
    } catch (error) {
        console.error(`组件加载失败 ${component}:`, error);
        return () => Promise.resolve({ render: () => null });
    }
}
