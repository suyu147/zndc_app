<template>
  <view class="page">
    <view class="search-header"><view class="search-bar"><AppIcon name="search" :size="34" /><input v-model="keyword" class="search-input" placeholder="搜索岗位名称 / 领域 / 技能" aria-label="搜索岗位" confirm-type="search" @confirm="reload" /><view v-if="keyword" class="search-clear" role="button" tabindex="0" aria-label="清空搜索" @tap="keyword = ''; reload()" @keydown.enter.prevent.stop="keyword = ''; reload()" @keydown.space.prevent.stop="keyword = ''; reload()"><AppIcon name="close" :size="30" /></view></view><view class="search-action" role="button" tabindex="0" @tap="reload" @keydown.enter.prevent.stop="reload" @keydown.space.prevent.stop="reload">搜索</view></view>
    <view class="list-heading"><text>岗位探索</text><text v-if="jobs.length" class="list-count">{{ total }} 个岗位</text></view>
    <view v-if="jobs.length === 0 && !loading" class="empty-text">暂无岗位数据</view>
    <view v-for="job in jobs" :key="job.id" class="job-card" role="button" tabindex="0" @tap="openDetail(job)" @keydown.enter.prevent.stop="openDetail(job)" @keydown.space.prevent.stop="openDetail(job)">
      <view class="job-head"><view class="job-name">{{ job.name }}</view><view class="job-count">{{ job.postingCount }}<text> 条招聘</text></view></view>
      <view class="job-field">{{ job.field || "—" }}</view>
      <view class="job-tags"><text v-for="skill in job.skills.slice(0, 4)" :key="skill.id || skill.name" class="tag">{{ skill.name }}</text></view>
      <view class="job-footer"><view class="job-identity"><view class="job-logo">{{ logoText(job.name) }}</view><view class="job-meta"><text>{{ job.trendLabel || "平稳" }}</text><text v-if="job.lastSeen">{{ job.lastSeen }}</text></view></view><view class="job-trend" :class="trendClass(job)"><text v-if="job.trendChangePp != null">{{ formatTrendPp(job.trendChangePp) }}</text><AppIcon name="chevron-right" :size="28" /></view></view>
    </view>
    <view v-if="loading" class="loading-text">加载中…</view><view v-else-if="hasMore && jobs.length > 0" class="loading-text">上拉加载更多</view><view v-else-if="jobs.length > 0" class="loading-text">共 {{ total }} 个岗位</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onLoad, onShow, onReachBottom, onPullDownRefresh } from "@dcloudio/uni-app";
import { api } from "@/api/api";
import { requireLogin } from "@/api/request";
import type { JobSummary } from "@/api/types";
import { formatTrendPp } from "@/utils/format";

const keyword = ref("");
const jobs = ref<JobSummary[]>([]);
const page = ref(1);
const pageSize = 15;
const total = ref(0);
const loading = ref(false);
const hasMore = ref(true);

onLoad(() => {
  if (requireLogin()) return;
  loadJobs();
});

onShow(() => {
  requireLogin();
});

onReachBottom(() => {
  if (hasMore.value && !loading.value) loadJobs();
});

onPullDownRefresh(() => {
  reload().finally(() => uni.stopPullDownRefresh());
});

async function loadJobs() {
  if (loading.value) return;
  loading.value = true;
  try {
    const result = await api.getJobs({
      keyword: keyword.value.trim(),
      page: page.value,
      pageSize,
    });
    jobs.value = page.value === 1 ? result.items : jobs.value.concat(result.items);
    total.value = result.total;
    hasMore.value = jobs.value.length < result.total;
    page.value += 1;
  } catch (error) {
    uni.showToast({ title: (error as Error).message, icon: "none" });
  } finally {
    loading.value = false;
  }
}

function reload() {
  page.value = 1;
  hasMore.value = true;
  return loadJobs();
}

function openDetail(job: JobSummary) {
  uni.navigateTo({ url: `/pages/job-detail/job-detail?id=${encodeURIComponent(job.id)}` });
}

function logoText(name: string) {
  return (name || "—").slice(0, 1);
}

function trendClass(job: JobSummary) {
  if (job.trendDirection === "up") return "trend-up";
  if (job.trendDirection === "down") return "trend-down";
  return "trend-flat";
}
</script>

<style scoped>
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */

/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: role list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared shell keeps task-specific screen layouts */

.page { padding-bottom: 32rpx; }.search-header { display: flex; align-items: center; gap: 24rpx; background: var(--color-paper); padding: 20rpx 32rpx; }.search-bar { display: flex; align-items: center; gap: 12rpx; flex: 1; min-width: 0; height: 76rpx; padding: 0 20rpx; background: var(--color-surface); color: var(--color-muted); border-radius: 8rpx; }.search-input { flex: 1; min-width: 0; font-size: 26rpx; color: var(--color-ink); }.search-clear { display: flex; align-items: center; min-height: 64rpx; }.search-action { color: var(--color-primary); font-size: 28rpx; padding: 16rpx 0; }.list-heading { display: flex; justify-content: space-between; align-items: center; background: var(--color-paper); padding: 16rpx 32rpx 24rpx; font-size: 32rpx; font-weight: 600; }.list-count { font-size: 23rpx; color: var(--color-muted); font-weight: 400; }
.job-card { background: var(--color-paper); margin-top: 8rpx; padding: 28rpx 32rpx; }.job-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16rpx; }.job-name { font-size: 34rpx; font-weight: 600; min-width: 0; overflow-wrap: break-word; }.job-count { color: var(--color-primary); font-size: 32rpx; font-weight: 600; flex-shrink: 0; }.job-count text { font-size: 22rpx; font-weight: 400; }.job-field { color: var(--color-secondary); font-size: 24rpx; margin-top: 12rpx; }.job-tags { display: flex; flex-wrap: wrap; gap: 8rpx; margin-top: 16rpx; }.tag { background: var(--color-surface); color: var(--color-secondary); font-size: 22rpx; border-radius: 4rpx; padding: 4rpx 12rpx; }.job-footer { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--color-rule); padding-top: 16rpx; margin-top: 24rpx; gap: 12rpx; }.job-identity { display: flex; align-items: center; gap: 12rpx; min-width: 0; }.job-logo { display: flex; align-items: center; justify-content: center; width: 40rpx; height: 40rpx; border-radius: 6rpx; background: var(--color-primary-soft); color: var(--color-primary); font-size: 24rpx; flex-shrink: 0; }.job-meta { display: flex; flex-wrap: wrap; gap: 12rpx; font-size: 23rpx; color: var(--color-secondary); }.job-trend { display: flex; align-items: center; gap: 8rpx; font-size: 23rpx; color: var(--color-muted); }.trend-up { color: var(--color-danger); }.trend-down { color: var(--color-success); }

</style>
