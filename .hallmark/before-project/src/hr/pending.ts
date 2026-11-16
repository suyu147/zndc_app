/**
 * HR 端 Tab 页参数暂存
 *
 * Tab 页之间用 reLaunch 切换，无法直接传 query，
 * 因此把「期望的筛选条件」暂存到 storage，目标页在 onShow 中消费一次。
 */

const CANDIDATE_FILTER_KEY = "zndc_hr_pending_candidate_filter";

export interface PendingCandidateFilter {
  stage?: string;
  keyword?: string;
}

export function setPendingCandidateFilter(filter: PendingCandidateFilter): void {
  try {
    uni.setStorageSync(CANDIDATE_FILTER_KEY, JSON.stringify(filter));
  } catch {
    /* ignore */
  }
}

/** 读取并清除，保证只消费一次 */
export function takePendingCandidateFilter(): PendingCandidateFilter | null {
  try {
    const raw = uni.getStorageSync(CANDIDATE_FILTER_KEY) as string;
    if (!raw) return null;
    uni.removeStorageSync(CANDIDATE_FILTER_KEY);
    return JSON.parse(raw) as PendingCandidateFilter;
  } catch {
    return null;
  }
}
