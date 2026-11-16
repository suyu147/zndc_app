<template>
  <view class="page">
    <view v-if="!loading && favorites.length === 0" class="empty-text">
      还没有收藏岗位\n去「岗位」页看看吧
    </view>

    <view v-for="item in favorites" :key="item.id" class="card fav-card" @tap="openDetail(item.roleId)">
      <view class="fav-logo">{{ logoText(item.roleName) }}</view>
      <view class="fav-main">
        <view class="fav-name">{{ item.roleName }}</view>
        <view class="fav-time" v-if="item.createdAt">收藏于 {{ String(item.createdAt).slice(0, 10) }}</view>
      </view>
      <view class="fav-arrow">›</view>
      <view class="fav-remove" @tap.stop="remove(item)">删除</view>
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
  background: linear-gradient(135deg, #00bebd 0%, #00a6a5 100%);
  color: #ffffff;
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
  color: #22262e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fav-time {
  margin-top: 8rpx;
  color: #8a94a6;
  font-size: 23rpx;
}

.fav-arrow {
  color: #c2c9d6;
  font-size: 34rpx;
  margin-right: 20rpx;
}

.fav-remove {
  color: #e5484d;
  font-size: 25rpx;
  padding: 10rpx 16rpx;
}
</style>
