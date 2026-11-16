<template>
  <view class="admin-page">
    <admin-navbar title="我的" />

    <!-- 用户信息 -->
    <view class="user-card">
      <view class="user-avatar">{{ avatarText }}</view>
      <view class="user-info">
        <text class="user-name">{{ user?.displayName || "治理管理员" }}</text>
        <view class="user-role">
          <AppIcon  class="user-role-ico" name="shield" />
          <text class="user-role-text">治理管理员</text>
        </view>
        <text class="user-sub">账号：{{ user?.username || "—" }}</text>
      </view>
    </view>

    <!-- 治理概览快捷 -->
    <view class="card">
      <view class="sec-title"><text class="sec-main">治理工具</text></view>
      <view role="button" tabindex="0" class="cell" @tap="goQuality" @keydown.enter.prevent.stop="goQuality" @keydown.space.prevent.stop="goQuality">
        <view class="cell-icon" >
          <AppIcon  class="cell-ico" name="file" />
        </view>
        <view class="cell-main"><text class="cell-label">数据质量与验收</text></view>
        <AppIcon class="cell-arrow" name="chevron-right" />
      </view>
      <view role="button" tabindex="0" class="cell" @tap="goReviews" @keydown.enter.prevent.stop="goReviews" @keydown.space.prevent.stop="goReviews">
        <view class="cell-icon" >
          <AppIcon  class="cell-ico" name="shield" />
        </view>
        <view class="cell-main"><text class="cell-label">候选复核</text></view>
        <text v-if="pendingReviews" class="cell-badge">{{ pendingReviews }}</text>
        <AppIcon class="cell-arrow" name="chevron-right" />
      </view>
      <view role="button" tabindex="0" class="cell cell--last" @tap="goDatasets" @keydown.enter.prevent.stop="goDatasets" @keydown.space.prevent.stop="goDatasets">
        <view class="cell-icon" >
          <AppIcon  class="cell-ico" name="layers" />
        </view>
        <view class="cell-main"><text class="cell-label">数据资产管理</text></view>
        <AppIcon class="cell-arrow" name="chevron-right" />
      </view>
    </view>

    <!-- 会话 -->
    <view class="card">
      <view role="button" tabindex="0" class="cell" @tap="switchTo('personal')" @keydown.enter.prevent.stop="switchTo('personal')" @keydown.space.prevent.stop="switchTo('personal')">
        <view class="cell-icon" >
          <AppIcon  class="cell-ico" name="user" />
        </view>
        <view class="cell-main"><text class="cell-label">切换到求职端</text></view>
        <AppIcon class="cell-arrow" name="chevron-right" />
      </view>
      <view role="button" tabindex="0" class="cell cell--last" @tap="switchTo('enterprise')" @keydown.enter.prevent.stop="switchTo('enterprise')" @keydown.space.prevent.stop="switchTo('enterprise')">
        <view class="cell-icon" >
          <AppIcon  class="cell-ico" name="briefcase" />
        </view>
        <view class="cell-main"><text class="cell-label">切换到企业 HR 端</text></view>
        <AppIcon class="cell-arrow" name="chevron-right" />
      </view>
    </view>

    <view class="card">
      <view role="button" tabindex="0" class="cell cell--last" @tap="onLogout" @keydown.enter.prevent.stop="onLogout" @keydown.space.prevent.stop="onLogout">
        <view class="cell-icon" style="background: var(--color-primary-soft); color: var(--color-danger)">
          <AppIcon  class="cell-ico" name="logout" />
        </view>
        <view class="cell-main"><text class="cell-label cell-label--danger">退出登录</text></view>
        <AppIcon class="cell-arrow" name="chevron-right" />
      </view>
    </view>

    <view class="version">职能洞察　治理管理员端 v1.0.0</view>

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
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */

/* Hallmark · v2.0.0 · redesign: full · shape: app screen · theme: project teal · scope: app */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V; retained familiar mobile list navigation, removed gradient cards. */
.admin-page { min-height: 100vh; background: var(--color-surface); padding-bottom: calc(140rpx + env(safe-area-inset-bottom)); box-sizing: border-box; }

.user-card { display: flex; align-items: center; padding: 40rpx 32rpx; background: var(--color-paper); }

.user-avatar { width: 104rpx; height: 104rpx; line-height: 104rpx; border-radius: 12rpx; background: var(--color-primary-soft); color: var(--color-primary); text-align: center; font-size: 42rpx; font-weight: 600; flex-shrink: 0; box-shadow: none; }

.user-info {
  flex: 1;
  min-width: 0;
  margin-left: 24rpx;
}

.user-name { display: block; font-size: 40rpx; font-weight: 600; color: var(--color-ink); }

.user-role {
  display: inline-flex;
  align-items: center;
  margin-top: 10rpx;
  background: var(--color-rule);
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
  color: var(--color-paper);
}

.user-sub {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: var(--color-paper);
}

.card { margin: 16rpx 0 0; padding: 32rpx; background: var(--color-paper); border-radius: 0; box-shadow: none; }

.sec-title { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; margin-bottom: 24rpx; }

.sec-main { font-size: 32rpx; font-weight: 600; color: var(--color-ink); }

.cell {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--color-surface);
}

.cell--last,
.cell:last-child {
  border-bottom: none;
}

.cell-icon { width: 48rpx; height: 48rpx; display: flex; align-items: center; justify-content: center; border-radius: 0; background: transparent; color: var(--color-secondary); flex-shrink: 0; }

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
  color: var(--color-ink);
}

.cell-label--danger {
  color: var(--color-danger);
}

.cell-badge {
  min-width: 34rpx;
  height: 34rpx;
  padding: 0 9rpx;
  box-sizing: border-box;
  border-radius: 17rpx;
  background: var(--color-danger);
  color: var(--color-paper);
  font-size: 20rpx;
  line-height: 34rpx;
  text-align: center;
  font-weight: 600;
  margin-right: 14rpx;
}

.cell-arrow {
  color: var(--color-rule);
  font-size: 34rpx;
  line-height: 1;
}

.version {
  margin-top: 40rpx;
  text-align: center;
  font-size: 21rpx;
  color: var(--color-rule);
}
</style>
