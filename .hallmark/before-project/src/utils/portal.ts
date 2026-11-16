/**
 * 端（Portal）路由助手
 *
 * 登录页支持「个人用户 / 企业 HR / 治理管理员」三端入口：
 * - personal   → 求职端首页 pages/overview/overview（pages.json 中的全局 tabBar）
 * - enterprise → HR 端工作台 pages-hr/workbench/workbench（自建底部导航）
 * - admin      → 治理管理员端首页 pages-admin/dashboard/dashboard（自建底部导航）
 */

import type { Portal } from "@/api/api";

const PORTAL_KEY = "zndc_portal_v1";

/** 各端首页 */
const PORTAL_HOME: Record<Portal, string> = {
  personal: "/pages/overview/overview",
  enterprise: "/pages-hr/workbench/workbench",
  admin: "/pages-admin/dashboard/dashboard",
};

export function getPortal(): Portal {
  try {
    const saved = uni.getStorageSync(PORTAL_KEY) as Portal;
    if (saved === "personal" || saved === "enterprise" || saved === "admin") return saved;
  } catch {
    /* ignore */
  }
  return "personal";
}

export function setPortal(portal: Portal): void {
  try {
    uni.setStorageSync(PORTAL_KEY, portal);
  } catch {
    /* ignore */
  }
}

/** 跳转到指定端的首页（清空页面栈，等价于切换主 Tab） */
export function goPortalHome(portal: Portal): void {
  setPortal(portal);
  uni.reLaunch({ url: PORTAL_HOME[portal] });
}

/** 切换到另一端 */
export function switchPortal(): void {
  goPortalHome(getPortal() === "enterprise" ? "personal" : "enterprise");
}
