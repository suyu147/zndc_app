<template>
  <view class="admin-tabbar">
    <view class="admin-tabbar-inner">
      <view role="button" tabindex="0"
        v-for="tab in TABS"
        :key="tab.key"
        class="admin-tab"
        :class="{ 'admin-tab--active': active === tab.key }"
        @tap="onTap(tab)"
       @keydown.enter.prevent.stop="onTap(tab)" @keydown.space.prevent.stop="onTap(tab)">
        <view class="admin-tab-icon">
          <!-- 概览：仪表盘 -->
          <AppIcon v-if="tab.key === 'dashboard'" class="ico" name="chart" />

          <!-- 数据资产：数据库 -->
          <AppIcon v-else-if="tab.key === 'datasets'" class="ico" name="file" />

          <!-- 复核：盾牌勾选 -->
          <AppIcon v-else-if="tab.key === 'reviews'" class="ico" name="shield" />

          <!-- 版本：图层 -->
          <AppIcon v-else-if="tab.key === 'versions'" class="ico" name="layers" />

          <!-- 我的：个人 -->
          <AppIcon v-else class="ico" name="user" />

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
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */

/* Hallmark · v2.0.0 · redesign: full · shape: app screen · theme: project teal · scope: app */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V; retained familiar mobile list navigation, removed gradient cards. */
.admin-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 900;
  background: var(--color-paper);
  border-top: 1rpx solid var(--color-surface);
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: none;
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
  color: var(--color-rule);
  transition: color 0.18s ease;
}

.admin-tab--active .admin-tab-icon {
  color: var(--color-primary);
}

.ico {
  width: 44rpx;
  height: 44rpx;
  display: block;
}

.admin-tab-label { margin-top: 8rpx; font-size: 22rpx; color: var(--color-secondary); line-height: 1.2; }

.admin-tab--active .admin-tab-label { color: var(--color-primary); font-weight: 500; }

.admin-tab-badge {
  position: absolute;
  top: -6rpx;
  left: 30rpx;
  min-width: 30rpx;
  height: 30rpx;
  padding: 0 7rpx;
  box-sizing: border-box;
  border-radius: 15rpx;
  background: var(--color-danger);
  color: var(--color-paper);
  font-size: 19rpx;
  line-height: 30rpx;
  text-align: center;
  font-weight: 600;
  border: 2rpx solid var(--color-paper);
}

.admin-tab--active .ico { color: var(--color-primary); }
</style>
