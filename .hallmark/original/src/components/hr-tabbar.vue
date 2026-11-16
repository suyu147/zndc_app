<template>
  <view class="hr-tabbar">
    <view class="hr-tabbar-inner">
      <view
        v-for="tab in TABS"
        :key="tab.key"
        class="hr-tab"
        :class="{ 'hr-tab--active': active === tab.key }"
        @tap="onTap(tab)"
      >
        <view class="hr-tab-icon">
          <!-- 工作台：九宫格 -->
          <svg
            v-if="tab.key === 'workbench'"
            viewBox="0 0 24 24"
            class="ico"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="3" width="7.6" height="7.6" rx="1.9" />
            <rect x="13.4" y="3" width="7.6" height="7.6" rx="1.9" />
            <rect x="3" y="13.4" width="7.6" height="7.6" rx="1.9" />
            <rect x="13.4" y="13.4" width="7.6" height="7.6" rx="1.9" />
          </svg>

          <!-- 职位：公文包 -->
          <svg
            v-else-if="tab.key === 'positions'"
            viewBox="0 0 24 24"
            class="ico"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="2.5" y="7" width="19" height="13.5" rx="2.6" />
            <path d="M8.5 7V5.4A1.9 1.9 0 0 1 10.4 3.5h3.2A1.9 1.9 0 0 1 15.5 5.4V7" />
            <path d="M2.5 12.6h19" />
          </svg>

          <!-- 候选人：多人 -->
          <svg
            v-else-if="tab.key === 'candidates'"
            viewBox="0 0 24 24"
            class="ico"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M15.4 20.5v-1.6a3.9 3.9 0 0 0-3.9-3.9H6.4a3.9 3.9 0 0 0-3.9 3.9v1.6" />
            <circle cx="8.95" cy="7.4" r="3.6" />
            <path d="M21.5 20.5v-1.6a3.9 3.9 0 0 0-2.9-3.77" />
            <path d="M16.4 3.9a3.6 3.6 0 0 1 0 6.98" />
          </svg>

          <!-- 洞察：柱状图 -->
          <svg
            v-else-if="tab.key === 'insight'"
            viewBox="0 0 24 24"
            class="ico"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 20.8h18" />
            <rect x="4.6" y="11.5" width="3.6" height="6.4" rx="1.3" />
            <rect x="10.2" y="6.5" width="3.6" height="11.4" rx="1.3" />
            <rect x="15.8" y="14.4" width="3.6" height="3.5" rx="1.3" />
          </svg>

          <!-- 我的：个人 -->
          <svg
            v-else
            viewBox="0 0 24 24"
            class="ico"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="8.2" r="3.9" />
            <path d="M4.6 20.4a7.4 7.4 0 0 1 14.8 0" />
          </svg>

          <view v-if="badgeOf(tab.key)" class="hr-tab-badge">{{ badgeOf(tab.key) }}</view>
        </view>
        <text class="hr-tab-label">{{ tab.label }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * HR 端自建底部导航
 *
 * HR 页面不在 pages.json 的全局 tabBar 中（全局 tabBar 属于求职端），
 * 因此这里自建一套 5 Tab 导航，切换使用 reLaunch 以保证页面栈干净。
 */
import { computed } from "vue";
import { hrState } from "@/hr/store";

export type HrTabKey = "workbench" | "positions" | "candidates" | "insight" | "mine";

interface HrTab {
  key: HrTabKey;
  label: string;
  path: string;
}

const TABS: HrTab[] = [
  { key: "workbench", label: "工作台", path: "/pages-hr/workbench/workbench" },
  { key: "positions", label: "职位", path: "/pages-hr/positions/positions" },
  { key: "candidates", label: "候选人", path: "/pages-hr/candidates/candidates" },
  { key: "insight", label: "洞察", path: "/pages-hr/insight/insight" },
  { key: "mine", label: "我的", path: "/pages-hr/mine/mine" },
];

const props = defineProps<{ active: HrTabKey }>();

/** 候选人 Tab 上显示待处理简历数 */
const pendingResumes = computed(() => hrState.candidates.filter((item) => item.stage === "new").length);

const badges = computed<Record<string, number>>(() => ({ candidates: pendingResumes.value }));

function badgeOf(key: HrTabKey): number {
  return badges.value[key] || 0;
}

function onTap(tab: HrTab) {
  if (tab.key === props.active) return;
  uni.reLaunch({ url: tab.path });
}
</script>

<style scoped>
.hr-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 900;
  background: #ffffff;
  border-top: 1rpx solid #eef1f5;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -4rpx 20rpx rgba(15, 40, 45, 0.05);
}

.hr-tabbar-inner {
  display: flex;
  height: 108rpx;
}

.hr-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.hr-tab-icon {
  position: relative;
  width: 44rpx;
  height: 44rpx;
  color: #b3bcc7;
  transition: color 0.18s ease;
}

.hr-tab--active .hr-tab-icon {
  color: #00a6a5;
}

.ico {
  width: 44rpx;
  height: 44rpx;
  display: block;
}

.hr-tab-label {
  margin-top: 4rpx;
  font-size: 20rpx;
  color: #8a94a6;
  line-height: 1;
}

.hr-tab--active .hr-tab-label {
  color: #00a6a5;
  font-weight: 600;
}

.hr-tab-badge {
  position: absolute;
  top: -6rpx;
  left: 30rpx;
  min-width: 30rpx;
  height: 30rpx;
  padding: 0 7rpx;
  box-sizing: border-box;
  border-radius: 15rpx;
  background: #f5484d;
  color: #ffffff;
  font-size: 19rpx;
  line-height: 30rpx;
  text-align: center;
  font-weight: 600;
  border: 2rpx solid #ffffff;
}
</style>
