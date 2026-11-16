<template>
  <view class="page">
    <!-- 顶部青绿头部 -->
    <view class="header">
      <view class="header-top">
        <view>
          <view class="hello">{{ greeting }}，{{ displayName || "职场人" }}</view>
          <view class="hello-sub">发现适合你的岗位与能力机会</view>
        </view>
        <view class="health-pill" :class="healthClass" @tap="checkHealth">{{ healthText }}</view>
      </view>

      <!-- 搜索入口 -->
      <view class="search-pill" @tap="goJobs">
        <text class="search-icon">🔍</text>
        <text class="search-text">搜索岗位名称 / 领域 / 技能</text>
        <text class="search-btn">去搜索</text>
      </view>
    </view>

    <!-- 核心数据 -->
    <view v-if="overview" class="stats-grid">
      <view v-for="item in statItems" :key="item.label" class="stats-item">
        <view class="stats-value" :style="{ color: item.color }">{{ item.value }}</view>
        <view class="stats-label">{{ item.label }}</view>
      </view>
    </view>

    <!-- 推荐岗位流 -->
    <view v-if="recommendJobs.length" class="card">
      <view class="section-title">
        <text>为你推荐</text>
        <text class="section-more" @tap="goJobs">查看更多 ›</text>
      </view>
      <view v-for="job in recommendJobs" :key="job.id" class="job-card" @tap="openJob(job)">
        <view class="job-logo">{{ logoText(job.name) }}</view>
        <view class="job-main">
          <view class="job-name">{{ job.name }}</view>
          <view class="job-meta">
            <text>{{ job.field || "—" }}</text>
            <text v-if="job.lastSeen"> · {{ job.lastSeen }}</text>
          </view>
          <view class="job-tags">
            <text v-for="skill in job.skills.slice(0, 3)" :key="skill.id || skill.name" class="tag">{{ skill.name }}</text>
          </view>
        </view>
        <view class="job-side">
          <view class="trend-pill" :class="trendClass(job)">{{ job.trendLabel || "平稳" }}</view>
          <view class="job-posting">{{ job.postingCount }} 条</view>
        </view>
      </view>
    </view>

    <view v-if="overview" class="card">
      <view class="section-title">数据规模</view>
      <view class="row">
        <text class="row-label">图谱节点</text>
        <text class="row-value">{{ formatCount(overview.nodeCount) }}</text>
      </view>
      <view class="row">
        <text class="row-label">图谱关系</text>
        <text class="row-value">{{ formatCount(overview.relationCount) }}</text>
      </view>
      <view class="row">
        <text class="row-label">快照样本</text>
        <text class="row-value">{{ formatCount(overview.snapshotCount) }}</text>
      </view>
      <view class="row">
        <text class="row-label">数据集 / 报告</text>
        <text class="row-value">{{ overview.datasetCount }} / {{ overview.reportCount }}</text>
      </view>
    </view>

    <view v-if="loading && !overview" class="loading-text">加载中…</view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { api } from "@/api/api";
import { requireLogin, readSession } from "@/api/request";
import type { JobSummary, OverviewSummary } from "@/api/types";
import { formatCount } from "@/utils/format";

const overview = ref<OverviewSummary | null>(null);
const recommendJobs = ref<JobSummary[]>([]);
const loading = ref(false);
const healthText = ref("检测");
const healthClass = ref("");

const user = readSession()?.user;
const displayName = user?.displayName || "";


const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return "早上好";
  if (hour < 18) return "下午好";
  return "晚上好";
});

const statItems = computed(() => {
  if (!overview.value) return [];
  return [
    { label: "岗位数", value: formatCount(overview.value.jobCount), color: "#00bebd" },
    { label: "招聘帖量", value: formatCount(overview.value.postingCount), color: "#e5484d" },
    { label: "技能数", value: formatCount(overview.value.skillCount), color: "#0ea5e9" },
    { label: "时间周期", value: formatCount(overview.value.timePeriodCount), color: "#9333ea" },
  ];
});

onShow(() => {
  if (requireLogin()) return;
  if (!overview.value) loadOverview();
  if (!recommendJobs.value.length) loadRecommendJobs();
});

async function loadOverview() {
  loading.value = true;
  try {
    overview.value = await api.getOverview();
  } catch (error) {
    uni.showToast({ title: (error as Error).message, icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function loadRecommendJobs() {
  try {
    const result = await api.getJobs({ page: 1, pageSize: 5 });
    recommendJobs.value = result.items;
  } catch {
    recommendJobs.value = [];
  }
}

async function checkHealth() {
  healthText.value = "检测中";
  healthClass.value = "";
  try {
    const result = await api.health();
    healthText.value = result.status === "healthy" ? "正常" : "降级";
    healthClass.value = result.status === "healthy" ? "ok" : "warn";
  } catch {
    healthText.value = "不可用";
    healthClass.value = "err";
  }
}

function goJobs() {
  uni.switchTab({ url: "/pages/jobs/jobs" });
}

function openJob(job: JobSummary) {
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
  padding-bottom: calc(40rpx + var(--window-bottom, 0px));
}

.header {
  background: linear-gradient(180deg, #00bebd 0%, #00a6a5 100%);
  padding: 32rpx 24rpx 48rpx;
  color: #ffffff;
  border-bottom-left-radius: 32rpx;
  border-bottom-right-radius: 32rpx;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.hello {
  font-size: 38rpx;
  font-weight: 700;
}

.hello-sub {
  margin-top: 8rpx;
  font-size: 24rpx;
  opacity: 0.85;
}

.health-pill {
  font-size: 22rpx;
  padding: 8rpx 18rpx;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 28rpx;
  white-space: nowrap;
}

.health-pill.ok {
  background: rgba(255, 255, 255, 0.22);
}

.health-pill.warn {
  background: rgba(255, 154, 46, 0.2);
}

.health-pill.err {
  background: rgba(229, 72, 77, 0.2);
}

.search-pill {
  display: flex;
  align-items: center;
  margin-top: 28rpx;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 40rpx;
  height: 82rpx;
  padding: 0 28rpx 0 32rpx;
  color: #22262e;
}

.search-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.search-text {
  flex: 1;
  font-size: 27rpx;
  color: #8a94a6;
}

.search-btn {
  font-size: 26rpx;
  color: #00bebd;
  font-weight: 600;
}

.stats-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin: 24rpx 20rpx 16rpx;
}

.stats-item {
  width: calc(50% - 12rpx);
  background: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx 0;
  margin-bottom: 16rpx;
  text-align: center;
}

.stats-value {
  font-size: 50rpx;
  font-weight: 800;
}

.stats-label {
  margin-top: 8rpx;
  color: #6b6f74;
  font-size: 24rpx;
}

.section-more {
  float: right;
  font-size: 24rpx;
  color: #8a94a6;
  font-weight: 400;
}

.job-card {
  display: flex;
  align-items: center;
  padding: 22rpx 0;
  border-bottom: 1rpx solid #f2f4f7;
}

.job-card:last-child {
  border-bottom: none;
}

.job-logo {
  width: 84rpx;
  height: 84rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #00bebd 0%, #00a6a5 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  font-weight: 700;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.job-main {
  flex: 1;
  min-width: 0;
}

.job-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #22262e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.job-meta {
  margin-top: 8rpx;
  font-size: 23rpx;
  color: #6b6f74;
}

.job-tags {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10rpx;
}

.tag {
  font-size: 21rpx;
  color: #6b6f74;
  background: #f5f6f8;
  border-radius: 6rpx;
  padding: 5rpx 12rpx;
  margin: 0 10rpx 8rpx 0;
}

.job-side {
  text-align: right;
  margin-left: 16rpx;
  flex-shrink: 0;
}

.trend-pill {
  font-size: 21rpx;
  padding: 5rpx 14rpx;
  border-radius: 20rpx;
  margin-bottom: 10rpx;
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

.job-posting {
  font-size: 22rpx;
  color: #8a94a6;
}

.row {
  display: flex;
  justify-content: space-between;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #f2f4f7;
}

.row:last-child {
  border-bottom: none;
}

.row-label {
  color: #6b6f74;
  font-size: 28rpx;
}

.row-value {
  font-weight: 600;
  color: #22262e;
}
</style>
