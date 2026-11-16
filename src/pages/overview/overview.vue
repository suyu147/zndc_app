<template>
  <view class="page">
    <view class="header">
      <view class="header-top"><view><view class="hello">{{ greeting }}，{{ displayName || "职场人" }}</view><view class="hello-sub">发现适合你的岗位与能力机会</view></view><view class="health-pill" :class="healthClass" role="button" tabindex="0" @tap="checkHealth" @keydown.enter.prevent.stop="checkHealth" @keydown.space.prevent.stop="checkHealth"><AppIcon name="shield" :size="30" /><text>{{ healthText }}</text></view></view>
      <view class="search-pill" role="button" tabindex="0" @tap="goJobs" @keydown.enter.prevent.stop="goJobs" @keydown.space.prevent.stop="goJobs"><AppIcon name="search" :size="34" /><text class="search-text">搜索岗位名称 / 领域 / 技能</text><text class="search-btn">搜索</text></view>
    </view>
    <view v-if="overview" class="stats-grid"><view v-for="item in statItems" :key="item.label" class="stats-item"><view class="stats-value">{{ item.value }}</view><view class="stats-label">{{ item.label }}</view></view></view>
    <view v-if="recommendJobs.length" class="job-section">
      <view class="section-heading"><text class="section-title">为你推荐</text><text class="section-more" role="button" tabindex="0" @tap="goJobs" @keydown.enter.prevent.stop="goJobs" @keydown.space.prevent.stop="goJobs">查看全部</text></view>
      <view v-for="job in recommendJobs" :key="job.id" class="job-card" role="button" tabindex="0" @tap="openJob(job)" @keydown.enter.prevent.stop="openJob(job)" @keydown.space.prevent.stop="openJob(job)">
        <view class="job-head"><view class="job-name">{{ job.name }}</view><view class="job-posting">{{ job.postingCount }}<text> 条招聘</text></view></view>
        <view class="job-meta"><text>{{ job.field || "—" }}</text><text v-if="job.lastSeen">{{ job.lastSeen }}</text></view>
        <view class="job-tags"><text v-for="skill in job.skills.slice(0, 3)" :key="skill.id || skill.name" class="tag">{{ skill.name }}</text></view>
        <view class="job-bottom"><view class="job-identity"><view class="job-logo">{{ logoText(job.name) }}</view><text>岗位市场洞察</text></view><text class="trend-pill" :class="trendClass(job)">{{ job.trendLabel || "平稳" }}</text></view>
      </view>
    </view>
    <view v-if="overview" class="card data-section"><view class="section-title">数据规模</view><view class="row"><text class="row-label">图谱节点</text><text class="row-value">{{ formatCount(overview.nodeCount) }}</text></view><view class="row"><text class="row-label">图谱关系</text><text class="row-value">{{ formatCount(overview.relationCount) }}</text></view><view class="row"><text class="row-label">快照样本</text><text class="row-value">{{ formatCount(overview.snapshotCount) }}</text></view><view class="row"><text class="row-label">数据集 / 报告</text><text class="row-value">{{ overview.datasetCount }} / {{ overview.reportCount }}</text></view></view>
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
    { label: "岗位数", value: formatCount(overview.value.jobCount), color: "var(--color-primary)" },
    { label: "招聘帖量", value: formatCount(overview.value.postingCount), color: "var(--color-danger)" },
    { label: "技能数", value: formatCount(overview.value.skillCount), color: "var(--color-primary)" },
    { label: "时间周期", value: formatCount(overview.value.timePeriodCount), color: "var(--color-primary)" },
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
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */

/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: role list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared shell keeps task-specific screen layouts */

.page { padding-bottom: 32rpx; }
.header { background: var(--color-paper); padding: 28rpx 32rpx 24rpx; }
.header-top { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; }
.hello { font-size: 36rpx; font-weight: 600; color: var(--color-ink); }
.hello-sub { margin-top: 8rpx; font-size: 24rpx; color: var(--color-muted); }
.health-pill { display: flex; align-items: center; gap: 6rpx; color: var(--color-secondary); font-size: 22rpx; min-height: 64rpx; }
.health-pill.ok { color: var(--color-primary); } .health-pill.err { color: var(--color-danger); }
.search-pill { display: flex; align-items: center; gap: 16rpx; background: var(--color-surface); border-radius: 8rpx; height: 80rpx; padding: 0 24rpx; margin-top: 28rpx; color: var(--color-muted); }
.search-text { flex: 1; font-size: 26rpx; }.search-btn { color: var(--color-primary); font-size: 26rpx; }
.stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); padding: 24rpx 16rpx; background: var(--color-paper); border-top: 1px solid var(--color-rule); }
.stats-item { text-align: center; border-right: 1px solid var(--color-rule); }.stats-item:last-child { border: 0; }
.stats-value { font-size: 34rpx; font-weight: 600; color: var(--color-ink); font-variant-numeric: tabular-nums; }.stats-label { color: var(--color-muted); font-size: 22rpx; margin-top: 8rpx; }
.job-section { margin-top: 16rpx; }.section-heading { display: flex; align-items: center; justify-content: space-between; background: var(--color-paper); padding: 28rpx 32rpx 8rpx; }.section-heading .section-title { margin: 0; }.section-more { font-size: 24rpx; color: var(--color-muted); padding: 8rpx 0; }
.job-card { background: var(--color-paper); padding: 28rpx 32rpx; margin-bottom: 8rpx; }.job-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16rpx; }.job-name { font-size: 34rpx; font-weight: 600; min-width: 0; overflow-wrap: break-word; }.job-posting { color: var(--color-primary); font-size: 32rpx; font-weight: 600; flex-shrink: 0; }.job-posting text { font-size: 22rpx; font-weight: 400; }
.job-meta { display: flex; flex-wrap: wrap; gap: 16rpx; color: var(--color-secondary); font-size: 24rpx; margin-top: 12rpx; }.job-tags { display: flex; flex-wrap: wrap; gap: 8rpx; margin-top: 16rpx; }.tag { color: var(--color-secondary); background: var(--color-surface); border-radius: 4rpx; padding: 4rpx 12rpx; font-size: 22rpx; }
.job-bottom { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-rule); margin-top: 24rpx; padding-top: 16rpx; }.job-identity { display: flex; align-items: center; gap: 12rpx; font-size: 23rpx; color: var(--color-secondary); }.job-logo { width: 40rpx; height: 40rpx; background: var(--color-primary-soft); color: var(--color-primary); border-radius: 6rpx; display: flex; align-items: center; justify-content: center; font-size: 24rpx; }.trend-pill { font-size: 22rpx; color: var(--color-secondary); }.trend-up { color: var(--color-danger); }.trend-down { color: var(--color-success); }
.row { display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-rule); padding: 16rpx 0; font-size: 26rpx; }.row:last-child { border: 0; }.row-label { color: var(--color-secondary); }.row-value { font-variant-numeric: tabular-nums; }

</style>
