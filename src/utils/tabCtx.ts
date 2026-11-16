import type { AgentMode } from "@/api/types";

export type TabCtxTarget = "diagnosis" | "assistant";

export interface TabCtxPayload {
  target: TabCtxTarget;
  mode?: AgentMode;
  roleId?: string;
  roleName?: string;
  reportId?: string;
}

const KEY = "zndc:pendingTabCtx";

export function setPendingCtx(ctx: TabCtxPayload): void {
  try {
    uni.setStorageSync(KEY, JSON.stringify(ctx));
  } catch {
    /* ignore */
  }
}

export function takePendingCtx(target?: TabCtxTarget): TabCtxPayload | null {
  try {
    const raw = uni.getStorageSync(KEY) as string;
    if (!raw) return null;
    uni.removeStorageSync(KEY);
    const ctx = JSON.parse(raw) as TabCtxPayload;
    if (target && ctx.target !== target) {
      // 不是给当前页面的，原样塞回去
      uni.setStorageSync(KEY, raw);
      return null;
    }
    return ctx;
  } catch {
    return null;
  }
}
