<template>
  <view class="admin-page">
    <admin-navbar title="图谱版本" :subtitle="`已发布 ${publishedCount}`" />

    <view v-if="loading && !items.length" class="admin-loading">加载中…</view>

    <view v-if="items.length" class="list">
      <view
        v-for="item in items"
        :key="item.id"
        class="ver-item"
        @tap="openDetail(item.id)"
      >
        <view class="ver-top">
          <text class="ver-role">{{ item.roleName }}</text>
          <text class="ver-status" :class="statusClass(item.status)">{{ statusText(item.status) }}</text>
        </view>
        <view class="ver-title">{{ item.displayTitle }}</view>
        <view class="ver-chips">
          <text v-for="(s, i) in item.coreSkills.slice(0, 4)" :key="i" class="ver-chip">{{ s }}</text>
          <text v-if="item.coreSkills.length > 4" class="ver-chip ver-chip-more">+{{ item.coreSkills.length - 4 }}</text>
        </view>
        <view class="ver-foot">
          <text class="ver-meta">帖 {{ item.postingCount }} · 源 {{ item.sourceCount }} · 证据 {{ item.evidenceCount }}</text>
          <text class="ver-arrow">›</text>
        </view>
      </view>
    </view>

    <view v-else-if="!loading" class="empty">暂无岗位定义版本</view>

    <admin-tabbar active="versions" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import AdminNavbar from "@/components/admin-navbar.vue";
import AdminTabbar from "@/components/admin-tabbar.vue";
import { getVersions } from "@/admin/api";
import type { GraphVersion, VersionStatus } from "@/admin/types";

const items = ref<GraphVersion[]>([]);
const loading = ref(false);

const publishedCount = computed(() => items.value.filter((item) => item.status === "published").length);

function statusText(s: VersionStatus): string {
  return ({ approved: "已批准待发布", published: "已发布", withdrawn: "已下架", draft: "草稿" } as Record<string, string>)[s] || s;
}
function statusClass(s: VersionStatus): string {
  return ({ approved: "st-approved", published: "st-published", withdrawn: "st-withdrawn", draft: "st-draft" } as Record<string, string>)[s] || "";
}

function openDetail(id: string) {
  uni.navigateTo({ url: `/pages-admin/versions/version-detail?id=${encodeURIComponent(id)}` });
}

async function load() {
  loading.value = true;
  try {
    const result = await getVersions();
    items.value = result.items;
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

onShow(() => {
  load();
});

onPullDownRefresh(async () => {
  await load();
  uni.stopPullDownRefresh();
});
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f5f6f8;
  padding-bottom: 140rpx;
  box-sizing: border-box;
}

.list {
  padding: 16rpx 20rpx 0;
}

.ver-item {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 10rpx rgba(15, 40, 45, 0.04);
}

.ver-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ver-role {
  font-size: 30rpx;
  font-weight: 700;
  color: #1a1d24;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 420rpx;
}

.ver-status {
  font-size: 21rpx;
  padding: 4rpx 14rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
}

.st-published { background: #e8f6ee; color: #2da44e; }
.st-approved { background: #fff3e0; color: #d97706; }
.st-withdrawn { background: #f1f5f9; color: #64748b; }
.st-draft { background: #eef2f7; color: #2b6cb0; }

.ver-title {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.ver-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 14rpx;
}

.ver-chip {
  font-size: 21rpx;
  padding: 5rpx 16rpx;
  border-radius: 16rpx;
  background: #eef2f7;
  color: #374151;
}

.ver-chip-more {
  background: #e8f0fa;
  color: #2b6cb0;
}

.ver-foot {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ver-meta {
  font-size: 22rpx;
  color: #9ca3af;
}

.ver-arrow {
  color: #c2c9d6;
  font-size: 34rpx;
}

.admin-loading {
  text-align: center;
  color: #8a94a6;
  padding: 80rpx 0;
  font-size: 26rpx;
}

.empty {
  text-align: center;
  color: #9ca3af;
  font-size: 27rpx;
  padding: 120rpx 0;
}
</style>
