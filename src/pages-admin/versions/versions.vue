<template>
  <view class="admin-page">
    <admin-navbar title="图谱版本" :subtitle="`已发布 ${publishedCount}`" />

    <view v-if="loading && !items.length" class="admin-loading">加载中…</view>

    <view v-if="items.length" class="list">
      <view role="button" tabindex="0"
        v-for="item in items"
        :key="item.id"
        class="ver-item"
        @tap="openDetail(item.id)"
       @keydown.enter.prevent.stop="openDetail(item.id)" @keydown.space.prevent.stop="openDetail(item.id)">
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
          <text class="ver-meta">帖 {{ item.postingCount }}　源 {{ item.sourceCount }}　证据 {{ item.evidenceCount }}</text>
          <AppIcon class="ver-arrow" name="chevron-right" />
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
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */

/* Hallmark · v2.0.0 · redesign: full · shape: app screen · theme: project teal · scope: app */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V; retained familiar mobile list navigation, removed gradient cards. */
.admin-page { min-height: 100vh; background: var(--color-surface); padding-bottom: calc(140rpx + env(safe-area-inset-bottom)); box-sizing: border-box; }

.list { padding: 0; background: var(--color-paper); }

.ver-item { background: var(--color-paper); border-radius: 0; padding: 32rpx; margin: 0; border-bottom: 12rpx solid var(--color-surface); box-shadow: none; }

.ver-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ver-role {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--color-ink);
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

.st-published { background: var(--color-surface); color: var(--color-success); }
.st-approved { background: var(--color-surface); color: var(--color-warning); }
.st-withdrawn { background: var(--color-surface); color: var(--color-primary); }
.st-draft { background: var(--color-surface); color: var(--color-primary); }

.ver-title {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: var(--color-secondary);
}

.ver-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 14rpx;
}

.ver-chip { font-size: 24rpx; padding: 6rpx 12rpx; border-radius: 4rpx; background: var(--color-surface); color: var(--color-secondary); }

.ver-chip-more {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.ver-foot {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ver-meta {
  font-size: 22rpx;
  color: var(--color-muted);
}

.ver-arrow {
  color: var(--color-rule);
  font-size: 34rpx;
}

.admin-loading {
  text-align: center;
  color: var(--color-muted);
  padding: 80rpx 0;
  font-size: 26rpx;
}

.empty {
  text-align: center;
  color: var(--color-muted);
  font-size: 27rpx;
  padding: 120rpx 0;
}
</style>
