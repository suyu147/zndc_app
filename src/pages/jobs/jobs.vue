<template>
  <view class="page">
    <view class="explore-intro"><text class="explore-title">发现你的职业可能</text><text class="explore-description">看招聘趋势，了解岗位所需技能</text></view>
    <view class="search-header"><view class="search-bar"><AppIcon name="search" :size="34" /><input v-model="keyword" class="search-input" placeholder="搜索岗位名称 / 领域 / 技能" aria-label="搜索岗位" confirm-type="search" @confirm="reload" /><view v-if="keyword" class="search-clear" role="button" tabindex="0" aria-label="清空搜索" @tap="keyword = ''; reload()" @keydown.enter.prevent.stop="keyword = ''; reload()" @keydown.space.prevent.stop="keyword = ''; reload()"><AppIcon name="close" :size="30" /></view></view><view class="search-action" role="button" tabindex="0" @tap="reload" @keydown.enter.prevent.stop="reload" @keydown.space.prevent.stop="reload">搜索</view></view>
    <view class="list-heading"><view class="list-tabs"><text class="list-current">岗位探索</text><text class="saved-link" role="button" tabindex="0" @tap="goFavorites" @keydown.enter.prevent.stop="goFavorites" @keydown.space.prevent.stop="goFavorites">我的收藏</text></view><text v-if="jobs.length" class="list-count">{{ total }} 个岗位</text></view>
    <view v-if="jobs.length === 0 && !loading" class="empty-text"><AppIcon name="search" :size="64" /><text>暂无岗位数据</text></view>
    <view v-for="job in jobs" :key="job.id" class="job-card" :class="'tone-' + (jobs.indexOf(job) % 3)" role="button" tabindex="0" @tap="openDetail(job)" @keydown.enter.prevent.stop="openDetail(job)" @keydown.space.prevent.stop="openDetail(job)">
      <view class="job-head"><view class="job-name">{{ job.name }}</view><view class="job-count">{{ job.postingCount }}<text> 条招聘</text></view></view>
      <view class="job-field"><AppIcon name="briefcase" :size="26" /><text>{{ job.field || "—" }}</text></view>
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

function goFavorites() {
  uni.navigateTo({ url: "/pages/favorites/favorites" });
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
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: recruitment role list and career tools · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: preserve task density; mint search header and inset role rows establish hierarchy without decorative art */

.page { padding-bottom: 32rpx; }
.explore-intro { display: flex; flex-direction: column; gap: 8rpx; padding: 28rpx 32rpx 8rpx; background: var(--color-brand-wash); }
.explore-title { color: var(--color-ink); font-size: 38rpx; font-weight: 600; min-width: 0; overflow-wrap: break-word; }
.explore-description { color: var(--color-secondary); font-size: 24rpx; }
.search-header { display: flex; align-items: center; gap: 20rpx; background: var(--color-brand-wash); padding: 20rpx 32rpx 28rpx; }
.search-bar { display: flex; align-items: center; gap: 12rpx; flex: 1; min-width: 0; height: max(84rpx, 44px); padding: 0 20rpx; background: var(--color-paper); color: var(--color-secondary); border-radius: 10rpx; border: 1px solid var(--color-field-border); }
.search-input { flex: 1; min-width: 0; height: max(80rpx, 42px); font-size: 25rpx; color: var(--color-ink); }
.search-clear { display: flex; align-items: center; justify-content: center; min-height: 44px; min-width: 48rpx; }
.search-action { min-width: 44px; display: flex; align-items: center; justify-content: center; min-height: 84rpx; padding: 0 20rpx; background: var(--color-primary); color: var(--color-paper); border-radius: 10rpx; font-size: 27rpx; font-weight: 500; }
.list-heading { display: flex; justify-content: space-between; align-items: center; background: var(--color-paper); padding: 0 32rpx; min-height: max(108rpx, 44px); }
.list-tabs { display: flex; align-items: stretch; gap: 32rpx; min-height: 108rpx; }
.list-current { display: flex; align-items: center; position: relative; font-size: 33rpx; font-weight: 600; }
.list-current::after { content: ""; position: absolute; bottom: 14rpx; left: 0; width: 40rpx; height: 5rpx; border-radius: 4rpx; background: var(--color-primary); }
.saved-link { display: flex; align-items: center; color: var(--color-secondary); font-size: 27rpx; }
.list-count { font-size: max(22rpx, 11px); color: var(--color-muted); }
.job-card { background: var(--color-paper); margin: 20rpx 24rpx 0; border-radius: var(--radius-card); padding: 28rpx; }
.job-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16rpx; }
.job-name { font-size: 33rpx; font-weight: 600; min-width: 0; overflow-wrap: break-word; }
.job-count { color: var(--color-primary); font-size: 34rpx; font-weight: 600; flex-shrink: 0; }
.job-count text { font-size: max(21rpx, 11px); font-weight: 400; }
.job-field { display: flex; align-items: center; gap: 10rpx; color: var(--color-secondary); font-size: 24rpx; margin-top: 14rpx; }
.job-tags { display: flex; flex-wrap: wrap; gap: 8rpx; margin-top: 20rpx; }
.tag { background: var(--color-surface); color: var(--color-secondary); font-size: max(22rpx, 11px); border-radius: 5rpx; padding: 5rpx 12rpx; }
.job-footer { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--color-rule); padding-top: 18rpx; margin-top: 24rpx; gap: 12rpx; }
.job-identity { display: flex; align-items: center; gap: 12rpx; min-width: 0; }
.job-logo { display: flex; align-items: center; justify-content: center; width: 48rpx; height: 48rpx; border-radius: 8rpx; background: var(--color-primary-soft); color: var(--color-primary); font-size: 24rpx; font-weight: 500; flex-shrink: 0; }
.tone-1 .job-logo { background: var(--color-cool-soft); color: var(--color-cool-ink); }
.tone-2 .job-logo { background: var(--color-warm-soft); color: var(--color-warm-ink); }
.job-meta { display: flex; flex-wrap: wrap; gap: 10rpx; font-size: max(22rpx, 11px); color: var(--color-secondary); }
.job-trend { display: flex; align-items: center; gap: 8rpx; flex-shrink: 0; font-size: 23rpx; color: var(--color-muted); }
.trend-up { color: var(--color-danger); }
.trend-down { color: var(--color-success); }
.empty-text { display: flex; flex-direction: column; align-items: center; gap: 24rpx; padding: 96rpx 32rpx; }
@media (hover: hover) { .job-card:hover { background: var(--color-primary-soft); } .saved-link:hover { color: var(--color-primary); } }
</style>
