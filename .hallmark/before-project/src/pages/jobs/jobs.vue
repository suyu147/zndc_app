<template>
  <view class="page">
    <!-- BOSS 风格搜索栏 -->
    <view class="search-header">
      <view class="search-bar">
        <text class="search-icon">🔍</text>
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索岗位名称 / 领域 / 技能"
          confirm-type="search"
          @confirm="reload"
        />
        <view v-if="keyword" class="search-clear" @tap="keyword = ''; reload()">✕</view>
      </view>
      <view class="search-action" @tap="reload">搜索</view>
    </view>

    <view v-if="jobs.length === 0 && !loading" class="empty-text">暂无岗位数据</view>

    <view
      v-for="job in jobs"
      :key="job.id"
      class="card job-card"
      @tap="openDetail(job)"
    >
      <view class="job-main">
        <view class="job-head">
          <view class="job-logo">{{ logoText(job.name) }}</view>
          <view class="job-title-wrap">
            <view class="job-name">{{ job.name }}</view>
            <view class="job-field">{{ job.field || "—" }}</view>
          </view>
          <view class="job-trend" :class="trendClass(job)">{{ job.trendLabel || "平稳" }}</view>
        </view>

        <view class="job-tags">
          <text v-for="skill in job.skills.slice(0, 4)" :key="skill.id || skill.name" class="tag">{{ skill.name }}</text>
        </view>

        <view class="job-footer">
          <view class="job-meta">
            <text>招聘 {{ job.postingCount }} 条</text>
            <text v-if="job.lastSeen"> · {{ job.lastSeen }}</text>
            <text v-if="job.trendChangePp != null" :class="trendClass(job)">
              {{ formatTrendPp(job.trendChangePp) }}
            </text>
          </view>
          <view class="job-action">查看 ›</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading-text">加载中…</view>
    <view v-else-if="hasMore && jobs.length > 0" class="loading-text">上拉加载更多</view>
    <view v-else-if="jobs.length > 0" class="loading-text">— 共 {{ total }} 个岗位 —</view>
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
.page {
  padding-bottom: 40rpx;
}

.search-header {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #ffffff;
  border-bottom: 1rpx solid #f2f4f7;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f5f6f8;
  border-radius: 40rpx;
  height: 74rpx;
  padding: 0 24rpx;
}

.search-icon {
  font-size: 26rpx;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 27rpx;
  color: #22262e;
}

.search-clear {
  color: #8a94a6;
  font-size: 24rpx;
  padding: 6rpx 4rpx;
}

.search-action {
  margin-left: 20rpx;
  color: #00bebd;
  font-size: 29rpx;
  font-weight: 600;
}

.job-card {
  padding: 26rpx 24rpx;
}

.job-head {
  display: flex;
  align-items: center;
}

.job-logo {
  width: 90rpx;
  height: 90rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #00bebd 0%, #00a6a5 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 38rpx;
  font-weight: 700;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.job-title-wrap {
  flex: 1;
  min-width: 0;
}

.job-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #22262e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.job-field {
  margin-top: 8rpx;
  color: #6b6f74;
  font-size: 24rpx;
}

.job-trend {
  font-size: 22rpx;
  padding: 5rpx 14rpx;
  border-radius: 20rpx;
  margin-left: 12rpx;
  flex-shrink: 0;
}

.trend-up {
  color: #e5484d;
  background: rgba(229, 72, 77, 0.08);
}

.trend-down {
  color: #2da44e;
  background: rgba(45, 164, 78, 0.08);
}

.trend-flat {
  color: #8a94a6;
  background: #f5f6f8;
}

.job-tags {
  display: flex;
  flex-wrap: wrap;
  margin-top: 16rpx;
}

.tag {
  font-size: 22rpx;
  color: #6b6f74;
  background: #f5f6f8;
  border-radius: 8rpx;
  padding: 6rpx 14rpx;
  margin: 0 12rpx 10rpx 0;
}

.job-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 18rpx;
}

.job-meta {
  color: #8a94a6;
  font-size: 23rpx;
}

.job-action {
  color: #00bebd;
  font-size: 26rpx;
  font-weight: 600;
}
</style>
