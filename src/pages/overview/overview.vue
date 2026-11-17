<template>
  <view class="page">
    <view class="header">
      <view class="header-top"><view><view class="hello">{{ greeting }}，{{ displayName || "职场人" }}</view><view class="hello-sub">发现适合你的岗位与能力机会</view></view><view class="health-pill" :class="healthClass" role="button" tabindex="0" @tap="checkHealth" @keydown.enter.prevent.stop="checkHealth" @keydown.space.prevent.stop="checkHealth"><AppIcon name="shield" :size="30" /><text>{{ healthText }}</text></view></view>
      <view class="search-pill" role="button" tabindex="0" @tap="goJobs" @keydown.enter.prevent.stop="goJobs" @keydown.space.prevent.stop="goJobs"><AppIcon name="search" :size="34" /><text class="search-text">搜索岗位名称 / 领域 / 技能</text><text class="search-btn">搜索</text></view>
    </view>
    <view class="career-tools" aria-label="职业工具"><view v-for="tool in careerTools" :key="tool.label" class="career-tool" role="button" tabindex="0" @tap="openTool(tool)" @keydown.enter.prevent.stop="openTool(tool)" @keydown.space.prevent.stop="openTool(tool)"><AppIcon :name="tool.icon" :size="44" /><text class="tool-name">{{ tool.label }}</text><text class="tool-description">{{ tool.description }}</text></view></view>
    <view v-if="overview" class="stats-grid"><view v-for="item in statItems" :key="item.label" class="stats-item"><view class="stats-value">{{ item.value }}</view><view class="stats-label">{{ item.label }}</view></view></view>
    <view v-if="recommendJobs.length" class="job-section">
      <view class="section-heading"><text class="section-title">为你推荐</text><text class="section-more" role="button" tabindex="0" @tap="goJobs" @keydown.enter.prevent.stop="goJobs" @keydown.space.prevent.stop="goJobs">查看全部</text></view>
      <view v-for="job in recommendJobs" :key="job.id" class="job-card" :class="'tone-' + (recommendJobs.indexOf(job) % 3)" role="button" tabindex="0" @tap="openJob(job)" @keydown.enter.prevent.stop="openJob(job)" @keydown.space.prevent.stop="openJob(job)">
        <view class="job-head"><view class="job-name">{{ job.name }}</view><view class="job-posting">{{ job.postingCount }}<text> 条招聘</text></view></view>
        <view class="job-meta"><AppIcon name="briefcase" :size="26" /><text>{{ job.field || "—" }}</text><text v-if="job.lastSeen">{{ job.lastSeen }}</text></view>
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

const careerTools = [
  { label: "能力诊断", description: "看看人岗匹配度", icon: "target", url: "/pages/diagnosis/diagnosis", tab: true },
  { label: "模拟面试", description: "提前练习从容应对", icon: "message", url: "/pages/interview/interview", tab: false },
  { label: "我的收藏", description: "好岗位留着慢慢看", icon: "star", url: "/pages/favorites/favorites", tab: false },
];
function openTool(tool: typeof careerTools[number]) {
  if (tool.tab) uni.switchTab({ url: tool.url });
  else uni.navigateTo({ url: tool.url });
}
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
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: recruitment role list and career tools · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: preserve task density; mint search header and inset role rows establish hierarchy without decorative art */

.page { padding-bottom: 40rpx; }
.header { background: var(--color-brand-wash); padding: 36rpx 32rpx 32rpx; }
.header-top { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; }
.hello { color: var(--color-ink); font-size: 40rpx; line-height: 1.4; font-weight: 600; }
.hello-sub { color: var(--color-secondary); font-size: 24rpx; margin-top: 8rpx; }
.health-pill { display: flex; align-items: center; gap: 6rpx; flex-shrink: 0; min-height: 44px; min-width: 44px; color: var(--color-secondary); font-size: max(22rpx, 11px); }
.health-pill.ok { color: var(--color-primary); }
.health-pill.err { color: var(--color-danger); }
.health-pill.warn { color: var(--color-warning); }
.search-pill { display: flex; align-items: center; gap: 14rpx; height: max(92rpx, 44px); padding: 8rpx 8rpx 8rpx 24rpx; margin-top: 28rpx; border-radius: 12rpx; background: var(--color-paper); color: var(--color-secondary); border: 1px solid var(--color-field-border); }
.search-text { flex: 1; min-width: 0; font-size: 25rpx; }
.search-btn { display: flex; align-items: center; justify-content: center; align-self: stretch; min-width: 100rpx; border-radius: 8rpx; background: var(--color-primary); color: var(--color-paper); font-size: 26rpx; font-weight: 500; }
.career-tools { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); background: var(--color-paper); padding: 28rpx 20rpx; }
.career-tool { display: flex; flex-direction: column; align-items: center; gap: 8rpx; padding: 4rpx; color: var(--color-primary); min-width: 0; }
.career-tool + .career-tool { border-left: 1px solid var(--color-rule); }
.career-tool:nth-child(2) { color: var(--color-cool-ink); }
.career-tool:nth-child(3) { color: var(--color-warm-ink); }
.tool-name { font-size: 27rpx; font-weight: 500; color: var(--color-ink); margin-top: 6rpx; }
.tool-description { font-size: max(22rpx, 11px); color: var(--color-muted); text-align: center; }
.stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 20rpx 24rpx 0; padding: 24rpx 8rpx; background: var(--color-paper); border-radius: var(--radius-card); }
.stats-item { text-align: center; }
.stats-item + .stats-item { border-left: 1px solid var(--color-rule); }
.stats-value { font-size: 34rpx; font-weight: 600; color: var(--color-ink); font-variant-numeric: tabular-nums; }
.stats-label { color: var(--color-muted); font-size: max(22rpx, 11px); margin-top: 8rpx; }
.job-section { margin: 12rpx 24rpx 0; }
.section-heading { display: flex; align-items: center; justify-content: space-between; padding: 24rpx 8rpx 20rpx; }
.section-heading .section-title { margin: 0; font-size: 34rpx; }
.section-more { display: flex; align-items: center; min-height: 44px; font-size: 24rpx; color: var(--color-secondary); }
.job-card { background: var(--color-paper); border-radius: var(--radius-card); padding: 28rpx; margin-bottom: 16rpx; }
.job-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16rpx; }
.job-name { color: var(--color-ink); font-size: 33rpx; font-weight: 600; min-width: 0; overflow-wrap: break-word; }
.job-posting { color: var(--color-primary); font-size: 34rpx; font-weight: 600; flex-shrink: 0; }
.job-posting text { font-size: max(21rpx, 11px); font-weight: 400; }
.job-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 12rpx; color: var(--color-secondary); font-size: 23rpx; margin-top: 14rpx; }
.job-meta .app-icon { color: var(--color-muted); }
.job-tags { display: flex; flex-wrap: wrap; gap: 8rpx; margin-top: 20rpx; }
.tag { color: var(--color-secondary); background: var(--color-surface); border-radius: 5rpx; padding: 5rpx 12rpx; font-size: max(22rpx, 11px); }
.job-bottom { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-rule); margin-top: 24rpx; padding-top: 18rpx; }
.job-identity { display: flex; align-items: center; gap: 12rpx; font-size: 23rpx; color: var(--color-secondary); }
.job-logo { width: 48rpx; height: 48rpx; background: var(--color-primary-soft); color: var(--color-primary); border-radius: 8rpx; display: flex; align-items: center; justify-content: center; font-size: 24rpx; font-weight: 500; }
.tone-1 .job-logo { background: var(--color-cool-soft); color: var(--color-cool-ink); }
.tone-2 .job-logo { background: var(--color-warm-soft); color: var(--color-warm-ink); }
.trend-pill { font-size: max(22rpx, 11px); color: var(--color-secondary); }
.trend-up { color: var(--color-danger); }
.trend-down { color: var(--color-success); }
.data-section { margin: 24rpx 24rpx 0; padding: 28rpx; border-radius: var(--radius-card); }
.row { display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-rule); padding: 18rpx 0; font-size: 26rpx; }
.row:last-child { border: 0; }
.row-label { color: var(--color-secondary); }
.row-value { font-variant-numeric: tabular-nums; }
@media (hover: hover) { .job-card:hover { background: var(--color-primary-soft); } .career-tool:hover .tool-name, .section-more:hover { color: var(--color-primary); } }
@media (max-width: 350px) { .hello { font-size: 36rpx; }  .job-head { gap: 10rpx; } .job-name { font-size: 32rpx; } }
</style>
