<template>
  <view class="admin-page">
    <admin-navbar title="我的" />

    <!-- 用户信息 -->
    <view class="user-card">
      <view class="user-avatar">{{ avatarText }}</view>
      <view class="user-info">
        <text class="user-name">{{ user?.displayName || "治理管理员" }}</text>
        <view class="user-role">
          <svg viewBox="0 0 24 24" class="user-role-ico" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 2.6v5.3c0 4.4-3 7.8-7 9.1-4-1.3-7-4.7-7-9.1V5.6L12 3z"/><path d="M9 12l2 2 4-4"/></svg>
          <text class="user-role-text">治理管理员</text>
        </view>
        <text class="user-sub">账号：{{ user?.username || "—" }}</text>
      </view>
    </view>

    <!-- 治理概览快捷 -->
    <view class="card">
      <view class="sec-title"><text class="sec-main">治理工具</text></view>
      <view class="cell" @tap="goQuality">
        <view class="cell-icon" style="background: #e8f0fa; color: #2b6cb0">
          <svg viewBox="0 0 24 24" class="cell-ico" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13.5h6M9 17h4"/></svg>
        </view>
        <view class="cell-main"><text class="cell-label">数据质量与验收</text></view>
        <text class="cell-arrow">›</text>
      </view>
      <view class="cell" @tap="goReviews">
        <view class="cell-icon" style="background: #fdeaea; color: #e5484d">
          <svg viewBox="0 0 24 24" class="cell-ico" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 2.6v5.3c0 4.4-3 7.8-7 9.1-4-1.3-7-4.7-7-9.1V5.6L12 3z"/><path d="M9 12l2 2 4-4"/></svg>
        </view>
        <view class="cell-main"><text class="cell-label">候选复核</text></view>
        <text v-if="pendingReviews" class="cell-badge">{{ pendingReviews }}</text>
        <text class="cell-arrow">›</text>
      </view>
      <view class="cell cell--last" @tap="goDatasets">
        <view class="cell-icon" style="background: #eef2f7; color: #2b6cb0">
          <svg viewBox="0 0 24 24" class="cell-ico" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5.5" rx="7.2" ry="2.8"/><path d="M4.8 5.5v6c0 1.55 3.2 2.8 7.2 2.8s7.2-1.25 7.2-2.8v-6"/><path d="M4.8 11.5v6c0 1.55 3.2 2.8 7.2 2.8s7.2-1.25 7.2-2.8v-6"/></svg>
        </view>
        <view class="cell-main"><text class="cell-label">数据资产管理</text></view>
        <text class="cell-arrow">›</text>
      </view>
    </view>

    <!-- 会话 -->
    <view class="card">
      <view class="cell" @tap="switchTo('personal')">
        <view class="cell-icon" style="background: #e8f0fa; color: #2b6cb0">
          <svg viewBox="0 0 24 24" class="cell-ico" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg>
        </view>
        <view class="cell-main"><text class="cell-label">切换到求职端</text></view>
        <text class="cell-arrow">›</text>
      </view>
      <view class="cell cell--last" @tap="switchTo('enterprise')">
        <view class="cell-icon" style="background: #e5f7f7; color: #00a6a5">
          <svg viewBox="0 0 24 24" class="cell-ico" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
        </view>
        <view class="cell-main"><text class="cell-label">切换到企业 HR 端</text></view>
        <text class="cell-arrow">›</text>
      </view>
    </view>

    <view class="card">
      <view class="cell cell--last" @tap="onLogout">
        <view class="cell-icon" style="background: rgba(229, 72, 77, 0.08); color: #e5484d">
          <svg viewBox="0 0 24 24" class="cell-ico" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5M5 12h10"/></svg>
        </view>
        <view class="cell-main"><text class="cell-label cell-label--danger">退出登录</text></view>
        <text class="cell-arrow">›</text>
      </view>
    </view>

    <view class="version">职能洞察 · 治理管理员端 v1.0.0</view>

    <admin-tabbar active="mine" />
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AdminNavbar from "@/components/admin-navbar.vue";
import AdminTabbar from "@/components/admin-tabbar.vue";
import { clearSession, readSession } from "@/api/request";
import { setPortal } from "@/utils/portal";
import { adminState } from "@/admin/store";

const user = computed(() => readSession()?.user || null);
const avatarText = computed(() => (user.value?.displayName || "治").slice(0, 1));
const pendingReviews = computed(() => adminState.pendingReviews);

function goQuality() {
  uni.navigateTo({ url: "/pages-admin/quality/quality" });
}
function goReviews() {
  uni.reLaunch({ url: "/pages-admin/reviews/reviews" });
}
function goDatasets() {
  uni.reLaunch({ url: "/pages-admin/datasets/datasets" });
}

function switchTo(portal: "personal" | "enterprise") {
  uni.showModal({
    title: "切换端",
    content: `将切换到「${portal === "personal" ? "职能洞察求职端" : "企业 HR 端"}」，治理端可随时返回。`,
    success: (res) => {
      if (!res.confirm) return;
      setPortal(portal);
      uni.reLaunch({ url: portal === "personal" ? "/pages/overview/overview" : "/pages-hr/workbench/workbench" });
    },
  });
}

function onLogout() {
  uni.showModal({
    title: "退出登录",
    content: "确认退出当前治理管理员账号？",
    success: (res) => {
      if (!res.confirm) return;
      clearSession();
      uni.reLaunch({ url: "/pages/login/login" });
    },
  });
}
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f5f6f8;
  padding-bottom: 140rpx;
  box-sizing: border-box;
}

.user-card {
  margin: 20rpx 20rpx 0;
  padding: 32rpx 28rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #15324f 0%, #1e4d75 100%);
  display: flex;
  align-items: center;
  box-shadow: 0 6rpx 20rpx rgba(21, 50, 79, 0.18);
}

.user-avatar {
  width: 104rpx;
  height: 104rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-size: 48rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
  margin-left: 24rpx;
}

.user-name {
  font-size: 34rpx;
  font-weight: 700;
  color: #ffffff;
}

.user-role {
  display: inline-flex;
  align-items: center;
  margin-top: 10rpx;
  background: rgba(255, 255, 255, 0.16);
  border-radius: 20rpx;
  padding: 4rpx 14rpx;
}

.user-role-ico {
  width: 22rpx;
  height: 22rpx;
}

.user-role-text {
  margin-left: 6rpx;
  font-size: 21rpx;
  color: #ffffff;
}

.user-sub {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.65);
}

.card {
  margin: 20rpx 20rpx 0;
  background: #ffffff;
  border-radius: 18rpx;
  padding: 8rpx 26rpx;
  box-shadow: 0 2rpx 12rpx rgba(15, 40, 45, 0.04);
}

.sec-title {
  display: flex;
  align-items: center;
  padding: 18rpx 0;
}

.sec-main {
  font-size: 28rpx;
  font-weight: 700;
  color: #1a1d24;
}

.cell {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f1f4f7;
}

.cell--last,
.cell:last-child {
  border-bottom: none;
}

.cell-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cell-ico {
  width: 34rpx;
  height: 34rpx;
}

.cell-main {
  flex: 1;
  min-width: 0;
  margin-left: 22rpx;
}

.cell-label {
  font-size: 28rpx;
  color: #1a1d24;
}

.cell-label--danger {
  color: #e5484d;
}

.cell-badge {
  min-width: 34rpx;
  height: 34rpx;
  padding: 0 9rpx;
  box-sizing: border-box;
  border-radius: 17rpx;
  background: #e5484d;
  color: #ffffff;
  font-size: 20rpx;
  line-height: 34rpx;
  text-align: center;
  font-weight: 600;
  margin-right: 14rpx;
}

.cell-arrow {
  color: #c2c9d6;
  font-size: 34rpx;
  line-height: 1;
}

.version {
  margin-top: 40rpx;
  text-align: center;
  font-size: 21rpx;
  color: #c2c9d6;
}
</style>
