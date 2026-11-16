<template>
  <view class="admin-page">
    <admin-navbar title="治理概览" :subtitle="subtitle" />

    <view v-if="loading && !data" class="admin-loading">加载中…</view>

    <template v-if="data">
      <!-- 治理健康概要 -->
      <view class="hero">
        <view class="hero-row">
          <view class="hero-score">
            <text class="hero-score-value">{{ qualityScore }}</text>
            <text class="hero-score-label">质量得分 / 100</text>
          </view>
          <view class="hero-versions">
            <view class="hero-ver">
              <text class="hero-ver-value">{{ data.governanceVersion }}</text>
              <text class="hero-ver-label">治理版本</text>
            </view>
            <view class="hero-ver">
              <text class="hero-ver-value">{{ data.graphVersion }}</text>
              <text class="hero-ver-label">图谱版本</text>
            </view>
          </view>
        </view>
        <view class="hero-meta">
          <text class="hero-meta-dot" :class="qualityClass"></text>
          <text class="hero-meta-text">{{ qualityText }}</text>
          <text class="hero-meta-time">更新于 {{ formatTime(data.generatedAt) }}</text>
        </view>
      </view>

      <!-- 核心指标 -->
      <view class="kpi-grid">
        <view class="kpi-cell" @tap="goReviews">
          <text class="kpi-value" style="color: #2b6cb0">{{ data.graph.jobCount }}</text>
          <text class="kpi-label">岗位数</text>
        </view>
        <view class="kpi-cell">
          <text class="kpi-value" style="color: #3b82f6">{{ formatNum(data.graph.postingCount) }}</text>
          <text class="kpi-label">招聘帖</text>
        </view>
        <view class="kpi-cell">
          <text class="kpi-value" style="color: #8b5cf6">{{ data.graph.skillCount }}</text>
          <text class="kpi-label">技能数</text>
        </view>
        <view class="kpi-cell">
          <text class="kpi-value" style="color: #0ea5a4">{{ formatNum(data.graph.nodeCount) }}</text>
          <text class="kpi-label">图谱节点</text>
        </view>
        <view class="kpi-cell" @tap="goDatasets">
          <text class="kpi-value" style="color: #f59e0b">{{ data.dataAssets.datasetCount }}</text>
          <text class="kpi-label">数据资产</text>
        </view>
        <view class="kpi-cell">
          <text class="kpi-value" style="color: #2da44e">{{ formatNum(data.dataAssets.totalRecords) }}</text>
          <text class="kpi-label">总记录数</text>
        </view>
        <view class="kpi-cell" @tap="goReviews">
          <text class="kpi-value" style="color: #e5484d">{{ pendingReviews }}</text>
          <text class="kpi-label">待复核</text>
        </view>
        <view class="kpi-cell" @tap="goVersions">
          <text class="kpi-value" style="color: #2b6cb0">{{ publishedVersions }}</text>
          <text class="kpi-label">已发布版本</text>
        </view>
      </view>

      <!-- 治理漏斗 -->
      <view class="card">
        <view class="sec-title"><text class="sec-main">治理闭环</text><text class="sec-more">候选 → 复核 → 发布</text></view>
        <view
          v-for="item in (data.governance.funnel || [])"
          :key="item.key"
          class="funnel-item"
          @tap="item.route ? goFunnel(item) : null"
        >
          <view class="funnel-head">
            <text class="funnel-label">{{ item.label }}</text>
            <text class="funnel-count">{{ item.count }}</text>
          </view>
          <view class="funnel-track">
            <view class="funnel-bar" :style="{ width: funnelWidth(item.count) + '%', background: funnelColor(item.key) }"></view>
          </view>
        </view>
      </view>

      <!-- 风险项 -->
      <view class="card">
        <view class="sec-title"><text class="sec-main">风险关注</text></view>
        <view v-if="(data.risks || []).length" class="risk-list">
          <view
            v-for="risk in data.risks"
            :key="risk.key"
            class="risk-item"
            :class="{ 'risk-item--ok': risk.count === 0 }"
            @tap="goRisk(risk)"
          >
            <view class="risk-icon" :style="{ background: risk.count ? '#fdeaea' : '#e8f6ee', color: risk.count ? '#e5484d' : '#2da44e' }">
              <svg v-if="risk.count" viewBox="0 0 24 24" class="risk-ico" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
              <svg v-else viewBox="0 0 24 24" class="risk-ico" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </view>
            <view class="risk-body">
              <text class="risk-label">{{ risk.label }}</text>
              <text class="risk-sub">{{ risk.count ? "需要您处理" : "暂无异常" }}</text>
            </view>
            <text class="risk-count" :style="{ color: risk.count ? '#e5484d' : '#2da44e' }">{{ risk.count }}</text>
          </view>
        </view>
        <view v-else class="empty">暂无风险项</view>
      </view>

      <!-- 数据资产状态 -->
      <view class="card">
        <view class="sec-title">
          <text class="sec-main">数据资产</text>
          <text class="sec-more" @tap="goDatasets">管理 ›</text>
        </view>
        <view class="pill-row">
          <view class="pill">
            <text class="pill-value">{{ data.dataAssets.boundaries.formal || 0 }}</text>
            <text class="pill-label">正式边界</text>
          </view>
          <view class="pill">
            <text class="pill-value">{{ data.dataAssets.boundaries.review || 0 }}</text>
            <text class="pill-label">复核边界</text>
          </view>
          <view class="pill">
            <text class="pill-value">{{ syncCount }}</text>
            <text class="pill-label">已同步修订</text>
          </view>
          <view class="pill">
            <text class="pill-value">{{ failCount }}</text>
            <text class="pill-label">同步失败</text>
          </view>
        </view>
        <view class="mini-meta">最近更新：{{ formatTime(data.dataAssets.latestUpdatedAt) || "—" }}</view>
      </view>

      <!-- 最近操作 -->
      <view class="card">
        <view class="sec-title"><text class="sec-main">最近操作</text></view>
        <view v-if="(data.recentActions || []).length">
          <view v-for="act in data.recentActions.slice(0, 8)" :key="act.id" class="act-item">
            <view class="act-dot"></view>
            <view class="act-body">
              <text class="act-title">{{ act.action }}</text>
              <text class="act-sub">{{ act.targetType }} · {{ shortId(act.targetId) }} · {{ formatTime(act.createdAt) }}</text>
            </view>
          </view>
        </view>
        <view v-else class="empty">暂无操作记录</view>
      </view>

      <!-- 系统状态 -->
      <view class="card">
        <view class="sec-title"><text class="sec-main">系统状态</text></view>
        <view class="sys-row">
          <view class="sys-item">
            <text class="sys-dot" :class="data.system.api ? 'ok' : 'bad'"></text>
            <text class="sys-text">API 服务</text>
          </view>
          <view class="sys-item">
            <text class="sys-dot" :class="data.system.neo4j ? 'ok' : 'bad'"></text>
            <text class="sys-text">Neo4j 图谱</text>
          </view>
          <view class="sys-item">
            <text class="sys-dot" :class="data.system.mysql ? 'ok' : 'bad'"></text>
            <text class="sys-text">MySQL 库</text>
          </view>
          <view class="sys-item">
            <text class="sys-dot" :class="data.system.agentConfigured ? 'ok' : 'bad'"></text>
            <text class="sys-text">智能体 {{ data.system.agentProvider }}</text>
          </view>
        </view>
      </view>
    </template>

    <admin-tabbar active="dashboard" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import AdminNavbar from "@/components/admin-navbar.vue";
import AdminTabbar from "@/components/admin-tabbar.vue";
import { getGovernanceDashboard } from "@/admin/api";
import { adminState, setPendingReviews, setDashboardAt } from "@/admin/store";
import type { DashboardData } from "@/admin/types";

const data = ref<DashboardData | null>(null);
const loading = ref(false);

const qualityScore = computed(() => data.value?.quality?.score ?? 0);
const pendingReviews = computed(() => data.value?.governance.draftStatuses.pending || 0);
const publishedVersions = computed(() => data.value?.governance.versionStatuses.published || 0);
const syncCount = computed(() => data.value?.dataAssets.revisionStatuses.synced || 0);
const failCount = computed(() => data.value?.dataAssets.revisionStatuses.failed || 0);

const subtitle = computed(() => {
  const EMPTY: Record<string, number> = {};
  const t = data.value?.governance?.draftStatuses || EMPTY;
  return `候选 ${sumObj(t)} · 已批准 ${t.approved || 0} · 已驳回 ${t.rejected || 0}`;
});

const qualityClass = computed(() => {
  const s = data.value?.quality?.status || "";
  if (s === "pass" || s === "pass_with_reviews") return "ok";
  return "bad";
});
const qualityText = computed(() => {
  const s = data.value?.quality?.status || "";
  if (s === "pass") return "全部质检通过";
  if (s === "pass_with_reviews") return "质检通过，存在待复核项";
  return "质检未完全通过";
});

const funnelMax = computed(() => {
  const f = data.value?.governance.funnel || [];
  return Math.max(1, ...f.map((item) => item.count));
});

function sumObj(obj: Record<string, number>): number {
  return Object.values(obj).reduce((a, b) => a + (b || 0), 0);
}

function funnelWidth(count: number): number {
  return Math.min(Math.max((count / funnelMax.value) * 100, 6), 100);
}

function funnelColor(key: string): string {
  return (
    { candidates: "#2b6cb0", pending: "#f59e0b", approved: "#3b82f6", published: "#2da44e", withdrawn: "#94a3b8" } as Record<string, string>
  )[key] || "#2b6cb0";
}

function formatNum(value: number): string {
  return (value || 0).toLocaleString("en-US");
}

function shortId(id: string): string {
  if (!id) return "—";
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}

function formatTime(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function goReviews() {
  uni.reLaunch({ url: "/pages-admin/reviews/reviews" });
}
function goDatasets() {
  uni.reLaunch({ url: "/pages-admin/datasets/datasets" });
}
function goVersions() {
  uni.reLaunch({ url: "/pages-admin/versions/versions" });
}
function goFunnel(item: { route: string }) {
  if (item.route) uni.reLaunch({ url: "/pages-admin/reviews/reviews" });
}
function goRisk(risk: { key: string }) {
  if (risk.key === "pendingReviews") uni.reLaunch({ url: "/pages-admin/reviews/reviews" });
  else uni.reLaunch({ url: "/pages-admin/datasets/datasets" });
}

async function load() {
  loading.value = true;
  try {
    const result = await getGovernanceDashboard();
    data.value = result;
    setPendingReviews(result.governance.draftStatuses.pending || 0);
    setDashboardAt(Date.now());
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

.admin-loading {
  text-align: center;
  color: #8a94a6;
  padding: 80rpx 0;
  font-size: 26rpx;
}

/* Hero */
.hero {
  padding: 30rpx 24rpx 36rpx;
  background: linear-gradient(180deg, #15324f 0%, #1e4d75 100%);
  border-bottom-left-radius: 32rpx;
  border-bottom-right-radius: 32rpx;
}

.hero-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero-score-value {
  font-size: 76rpx;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
}

.hero-score-label {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
}

.hero-versions {
  text-align: right;
}

.hero-ver {
  margin-bottom: 14rpx;
}

.hero-ver-value {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #ffffff;
}

.hero-ver-label {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.6);
}

.hero-meta {
  display: flex;
  align-items: center;
  margin-top: 24rpx;
}

.hero-meta-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #2da44e;
  margin-right: 12rpx;
}

.hero-meta-dot.bad {
  background: #f59e0b;
}

.hero-meta-text {
  font-size: 23rpx;
  color: rgba(255, 255, 255, 0.9);
}

.hero-meta-time {
  margin-left: auto;
  font-size: 21rpx;
  color: rgba(255, 255, 255, 0.55);
}

/* KPI 栅格 */
.kpi-grid {
  display: flex;
  flex-wrap: wrap;
  margin: -28rpx 20rpx 0;
  background: #ffffff;
  border-radius: 18rpx;
  padding: 16rpx 0;
  box-shadow: 0 2rpx 12rpx rgba(15, 40, 45, 0.06);
}

.kpi-cell {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
}

.kpi-value {
  font-size: 38rpx;
  font-weight: 800;
  line-height: 1;
}

.kpi-label {
  margin-top: 10rpx;
  font-size: 21rpx;
  color: #6b7280;
}

/* 卡片 */
.card {
  margin: 20rpx 20rpx 0;
  background: #ffffff;
  border-radius: 18rpx;
  padding: 26rpx 26rpx 12rpx;
  box-shadow: 0 2rpx 12rpx rgba(15, 40, 45, 0.04);
}

.sec-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.sec-main {
  font-size: 29rpx;
  font-weight: 700;
  color: #1a1d24;
}

.sec-more {
  font-size: 22rpx;
  color: #2b6cb0;
}

/* 漏斗 */
.funnel-item {
  padding: 14rpx 0;
}

.funnel-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10rpx;
}

.funnel-label {
  font-size: 25rpx;
  color: #374151;
}

.funnel-count {
  font-size: 30rpx;
  font-weight: 800;
  color: #1a1d24;
}

.funnel-track {
  height: 16rpx;
  border-radius: 8rpx;
  background: #f1f4f7;
  overflow: hidden;
}

.funnel-bar {
  height: 100%;
  border-radius: 8rpx;
  transition: width 0.5s ease;
  min-width: 10rpx;
}

/* 风险 */
.risk-list {
  padding-bottom: 14rpx;
}

.risk-item {
  display: flex;
  align-items: center;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #f1f4f7;
}

.risk-item:last-child {
  border-bottom: none;
}

.risk-item--ok {
  opacity: 0.85;
}

.risk-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.risk-ico {
  width: 32rpx;
  height: 32rpx;
}

.risk-body {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
}

.risk-label {
  display: block;
  font-size: 27rpx;
  color: #1a1d24;
}

.risk-sub {
  display: block;
  margin-top: 4rpx;
  font-size: 21rpx;
  color: #9ca3af;
}

.risk-count {
  font-size: 34rpx;
  font-weight: 800;
}

/* 数据资产 pill */
.pill-row {
  display: flex;
  flex-wrap: wrap;
}

.pill {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14rpx 0 18rpx;
}

.pill-value {
  font-size: 36rpx;
  font-weight: 800;
  color: #2b6cb0;
}

.pill-label {
  margin-top: 8rpx;
  font-size: 20rpx;
  color: #6b7280;
}

.mini-meta {
  font-size: 21rpx;
  color: #9ca3af;
  padding: 6rpx 0 18rpx;
}

/* 最近操作 */
.act-item {
  display: flex;
  align-items: flex-start;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f1f4f7;
}

.act-item:last-child {
  border-bottom: none;
}

.act-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #2b6cb0;
  margin-top: 12rpx;
  margin-right: 18rpx;
  flex-shrink: 0;
}

.act-body {
  flex: 1;
  min-width: 0;
}

.act-title {
  display: block;
  font-size: 25rpx;
  color: #1a1d24;
  word-break: break-all;
}

.act-sub {
  display: block;
  margin-top: 4rpx;
  font-size: 20rpx;
  color: #9ca3af;
}

/* 系统状态 */
.sys-row {
  display: flex;
  flex-wrap: wrap;
  padding-bottom: 14rpx;
}

.sys-item {
  width: 50%;
  display: flex;
  align-items: center;
  padding: 12rpx 0;
}

.sys-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  margin-right: 14rpx;
}

.sys-dot.ok {
  background: #2da44e;
}

.sys-dot.bad {
  background: #e5484d;
}

.sys-text {
  font-size: 24rpx;
  color: #374151;
}

.empty {
  text-align: center;
  color: #9ca3af;
  font-size: 24rpx;
  padding: 40rpx 0;
}
</style>
