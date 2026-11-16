<template>
  <view class="page">
    <view v-if="!loading && favorites.length === 0" class="empty-text">
      <view class="empty-icon"><AppIcon name="star" size="32" /></view><view>还没有收藏岗位</view><view class="empty-hint">去「岗位」页看看吧</view>
    </view>

    <view v-for="item in favorites" :key="item.id" class="card fav-card" @tap="openDetail(item.roleId)" role="button" tabindex="0" @keydown.enter.prevent.stop="openDetail(item.roleId)" @keydown.space.prevent.stop="openDetail(item.roleId)">
      <view class="fav-logo">{{ logoText(item.roleName) }}</view>
      <view class="fav-main">
        <view class="fav-name">{{ item.roleName }}</view>
        <view class="fav-time" v-if="item.createdAt">收藏于 {{ String(item.createdAt).slice(0, 10) }}</view>
      </view>
      <view class="fav-arrow"><AppIcon name="chevron-right" size="18" /></view>
      <view class="fav-remove" @tap.stop="remove(item)" role="button" tabindex="0" @keydown.enter.prevent.stop="remove(item)" @keydown.space.prevent.stop="remove(item)">删除</view>
    </view>

    <view v-if="loading" class="loading-text">加载中…</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onShow, onPullDownRefresh } from "@dcloudio/uni-app";
import { api } from "@/api/api";
import { requireLogin } from "@/api/request";
import type { FavoriteJob } from "@/api/types";

const favorites = ref<FavoriteJob[]>([]);
const loading = ref(false);

onShow(() => {
  if (requireLogin()) return;
  loadFavorites();
});

onPullDownRefresh(() => {
  loadFavorites().finally(() => uni.stopPullDownRefresh());
});

async function loadFavorites() {
  loading.value = true;
  try {
    const result = await api.getFavorites();
    favorites.value = result.items;
  } catch (error) {
    uni.showToast({ title: (error as Error).message, icon: "none" });
  } finally {
    loading.value = false;
  }
}

function openDetail(roleId: string) {
  uni.navigateTo({ url: `/pages/job-detail/job-detail?id=${encodeURIComponent(roleId)}` });
}

function remove(item: FavoriteJob) {
  uni.showModal({
    title: "取消收藏",
    content: `确定不再收藏「${item.roleName}」吗？`,
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await api.removeFavorite(item.roleId);
        favorites.value = favorites.value.filter((row) => row.id !== item.id);
        uni.showToast({ title: "已删除", icon: "none" });
      } catch (error) {
        uni.showToast({ title: (error as Error).message, icon: "none" });
      }
    },
  });
}

function logoText(name: string) {
  return (name || "—").slice(0, 1);
}
</script>

<style scoped>
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */

/* Hallmark · theme: project teal · shape: app screen · redesign: full · scope: app */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V; flattened repeated panels into task sections. */
.page {
  padding-bottom: 40rpx;
}

.fav-card {
  display: flex;
  align-items: center;
  padding: 24rpx;
}

.fav-logo {
  width: 84rpx;
  height: 84rpx;
  border-radius: 18rpx;
  background: var(--color-primary);
  color: var(--color-paper);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 700;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.fav-main {
  flex: 1;
  min-width: 0;
}

.fav-name {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--color-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fav-time {
  margin-top: 8rpx;
  color: var(--color-muted);
  font-size: 23rpx;
}

.fav-arrow {
  color: var(--color-rule);
  font-size: 34rpx;
  margin-right: 20rpx;
}

.fav-remove {
  color: var(--color-danger);
  font-size: 25rpx;
  padding: 10rpx 16rpx;
}

.page { background:var(--color-surface); }
.fav-card { margin: 0 0 12rpx; border-radius:0; padding: 32rpx; gap: 20rpx; box-shadow:none; }
.fav-logo { width:76rpx; height:76rpx; margin: 0; background:var(--color-surface); color:var(--color-secondary); border-radius:8rpx; font-size:30rpx; font-weight:500; }
.fav-name { font-size:32rpx; font-weight:600; }
.fav-time { font-size:25rpx; color:var(--color-muted); margin-top: 12rpx; }
.fav-arrow { color:var(--color-muted); margin: 0; }
.fav-remove { color:var(--color-secondary); border-left:1rpx solid var(--color-rule); font-size:25rpx; padding: 16rpx 0 16rpx 20rpx; }
.empty-icon { margin-bottom: 24rpx; color:var(--color-muted); }
.empty-hint { font-size:25rpx; margin-top: 16rpx; color:var(--color-muted); }
[tabindex]:focus-visible { outline:2px solid var(--color-primary); outline-offset:2px; }
@media (prefers-reduced-motion:reduce) { * { transition:none !important; } }
</style>
