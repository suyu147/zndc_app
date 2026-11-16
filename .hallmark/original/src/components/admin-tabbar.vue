<template>
  <view class="admin-tabbar">
    <view class="admin-tabbar-inner">
      <view
        v-for="tab in TABS"
        :key="tab.key"
        class="admin-tab"
        :class="{ 'admin-tab--active': active === tab.key }"
        @tap="onTap(tab)"
      >
        <view class="admin-tab-icon">
          <!-- 概览：仪表盘 -->
          <svg v-if="tab.key === 'dashboard'" viewBox="0 0 24 24" class="ico" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 13a9 9 0 0 1 18 0" />
            <path d="M12 13l4-3" />
            <circle cx="12" cy="13" r="1.6" />
          </svg>

          <!-- 数据资产：数据库 -->
          <svg v-else-if="tab.key === 'datasets'" viewBox="0 0 24 24" class="ico" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <ellipse cx="12" cy="5.5" rx="7.2" ry="2.8" />
            <path d="M4.8 5.5v6c0 1.55 3.2 2.8 7.2 2.8s7.2-1.25 7.2-2.8v-6" />
            <path d="M4.8 11.5v6c0 1.55 3.2 2.8 7.2 2.8s7.2-1.25 7.2-2.8v-6" />
          </svg>

          <!-- 复核：盾牌勾选 -->
          <svg v-else-if="tab.key === 'reviews'" viewBox="0 0 24 24" class="ico" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3l7 2.6v5.3c0 4.4-3 7.8-7 9.1-4-1.3-7-4.7-7-9.1V5.6L12 3z" />
            <path d="M9 12l2 2 4-4" />
          </svg>

          <!-- 版本：图层 -->
          <svg v-else-if="tab.key === 'versions'" viewBox="0 0 24 24" class="ico" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3l9 5-9 5-9-5 9-5z" />
            <path d="M3 13l9 5 9-5" />
          </svg>

          <!-- 我的：个人 -->
          <svg v-else viewBox="0 0 24 24" class="ico" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="8.2" r="3.9" />
            <path d="M4.6 20.4a7.4 7.4 0 0 1 14.8 0" />
          </svg>

          <view v-if="badgeOf(tab.key)" class="admin-tab-badge">{{ badgeOf(tab.key) }}</view>
        </view>
        <text class="admin-tab-label">{{ tab.label }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 治理管理员端自建底部导航
 * 治理页面不在 pages.json 的全局 tabBar 中（全局 tabBar 属于求职端），
 * 因此自建 5 Tab 导航，切换使用 reLaunch 保证页面栈干净。
 */
import { computed } from "vue";
import { adminState } from "@/admin/store";

export type AdminTabKey = "dashboard" | "datasets" | "reviews" | "versions" | "mine";

interface AdminTab {
  key: AdminTabKey;
  label: string;
  path: string;
}

const TABS: AdminTab[] = [
  { key: "dashboard", label: "概览", path: "/pages-admin/dashboard/dashboard" },
  { key: "datasets", label: "数据资产", path: "/pages-admin/datasets/datasets" },
  { key: "reviews", label: "复核", path: "/pages-admin/reviews/reviews" },
  { key: "versions", label: "版本", path: "/pages-admin/versions/versions" },
  { key: "mine", label: "我的", path: "/pages-admin/mine/mine" },
];

const props = defineProps<{ active: AdminTabKey }>();

const badges = computed<Record<string, number>>(() => ({
  reviews: adminState.pendingReviews,
}));

function badgeOf(key: AdminTabKey): number {
  return badges.value[key] || 0;
}

function onTap(tab: AdminTab) {
  if (tab.key === props.active) return;
  uni.reLaunch({ url: tab.path });
}
</script>

<style scoped>
.admin-tabbar {
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

.admin-tabbar-inner {
  display: flex;
  height: 108rpx;
}

.admin-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.admin-tab-icon {
  position: relative;
  width: 44rpx;
  height: 44rpx;
  color: #b3bcc7;
  transition: color 0.18s ease;
}

.admin-tab--active .admin-tab-icon {
  color: #2b6cb0;
}

.ico {
  width: 44rpx;
  height: 44rpx;
  display: block;
}

.admin-tab-label {
  margin-top: 4rpx;
  font-size: 20rpx;
  color: #8a94a6;
  line-height: 1;
}

.admin-tab--active .admin-tab-label {
  color: #2b6cb0;
  font-weight: 600;
}

.admin-tab-badge {
  position: absolute;
  top: -6rpx;
  left: 30rpx;
  min-width: 30rpx;
  height: 30rpx;
  padding: 0 7rpx;
  box-sizing: border-box;
  border-radius: 15rpx;
  background: #e5484d;
  color: #ffffff;
  font-size: 19rpx;
  line-height: 30rpx;
  text-align: center;
  font-weight: 600;
  border: 2rpx solid #ffffff;
}
</style>
