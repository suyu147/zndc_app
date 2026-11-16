/**
 * 治理管理员端运行时状态
 *
 * 治理端以真实后端为准，无需本地 Mock。这里仅缓存跨页面复用的轻量派生状态，
 * 例如底部 Tab 栏「复核」角标所需的「待人工复核」数量，避免每个页面重复拉取。
 */

import { reactive } from "vue";

interface AdminState {
  /** 待人工复核的候选数量（来自治理仪表盘 / 复核列表） */
  pendingReviews: number;
  /** 最近一次刷新仪表盘的时间戳 */
  dashboardAt: number;
}

export const adminState: AdminState = reactive({
  pendingReviews: 0,
  dashboardAt: 0,
});

export function setPendingReviews(count: number): void {
  adminState.pendingReviews = count;
}

export function setDashboardAt(ts: number): void {
  adminState.dashboardAt = ts;
}
