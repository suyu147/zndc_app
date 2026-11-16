<template>
  <view class="admin-page">
    <admin-navbar title="治理概览" :subtitle="subtitle" />

    <view v-if="loading && !data" class="admin-loading">加载中…</view>

    <template v-if="data">
      <!-- 风险项 -->
      <view class="card">
        <view class="sec-title"><text class="sec-main">风险关注</text></view>
        <view v-if="(data.risks || []).length" class="risk-list">
          <view role="button" tabindex="0"
            v-for="risk in data.risks"
            :key="risk.key"
            class="risk-item"
            :class="{ 'risk-item--ok': risk.count === 0 }"
            @tap="goRisk(risk)"
           @keydown.enter.prevent.stop="goRisk(risk)" @keydown.space.prevent.stop="goRisk(risk)">
            <view class="risk-icon" :class="risk.count ? 'system-bad' : 'system-ok'">
              <AppIcon v-if="risk.count" class="risk-ico" name="info" />
              <AppIcon v-else class="risk-ico" name="check" />
            </view>
            <view class="risk-body">
              <text class="risk-label">{{ risk.label }}</text>
              <text class="risk-sub">{{ risk.count ? "需要您处理" : "暂无异常" }}</text>
            </view>
            <text class="risk-count" :style="{ color: risk.count ? 'var(--color-danger)' : 'var(--color-success)' }">{{ risk.count }}</text>
          </view>
        </view>
        <view v-else class="empty">暂无风险项</view>
      </view>

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
          <AppIcon :name="qualityClass === 'ok' ? 'check' : 'info'" />
          <text class="hero-meta-text">{{ qualityText }}</text>
          <text class="hero-meta-time">更新于 {{ formatTime(data.generatedAt) }}</text>
        </view>
      </view>

      <!-- 核心指标 -->
      <view class="kpi-grid">
        <view role="button" tabindex="0" class="kpi-cell" @tap="goReviews" @keydown.enter.prevent.stop="goReviews" @keydown.space.prevent.stop="goReviews">
          <text class="kpi-value">{{ data.graph.jobCount }}</text>
          <text class="kpi-label">岗位数</text>
        </view>
        <view class="kpi-cell">
          <text class="kpi-value">{{ formatNum(data.graph.postingCount) }}</text>
          <text class="kpi-label">招聘帖</text>
        </view>
        <view class="kpi-cell">
          <text class="kpi-value">{{ data.graph.skillCount }}</text>
          <text class="kpi-label">技能数</text>
        </view>
        <view class="kpi-cell">
          <text class="kpi-value">{{ formatNum(data.graph.nodeCount) }}</text>
          <text class="kpi-label">图谱节点</text>
        </view>
        <view role="button" tabindex="0" class="kpi-cell" @tap="goDatasets" @keydown.enter.prevent.stop="goDatasets" @keydown.space.prevent.stop="goDatasets">
          <text class="kpi-value">{{ data.dataAssets.datasetCount }}</text>
          <text class="kpi-label">数据资产</text>
        </view>
        <view class="kpi-cell">
          <text class="kpi-value">{{ formatNum(data.dataAssets.totalRecords) }}</text>
          <text class="kpi-label">总记录数</text>
        </view>
        <view role="button" tabindex="0" class="kpi-cell" @tap="goReviews" @keydown.enter.prevent.stop="goReviews" @keydown.space.prevent.stop="goReviews">
          <text class="kpi-value">{{ pendingReviews }}</text>
          <text class="kpi-label">待复核</text>
        </view>
        <view role="button" tabindex="0" class="kpi-cell" @tap="goVersions" @keydown.enter.prevent.stop="goVersions" @keydown.space.prevent.stop="goVersions">
          <text class="kpi-value">{{ publishedVersions }}</text>
          <text class="kpi-label">已发布版本</text>
        </view>
      </view>

      <!-- 治理漏斗 -->
      <view class="card">
        <view class="sec-title"><text class="sec-main">治理闭环</text><text class="sec-more">候选 → 复核 → 发布</text></view>
        <view role="button" tabindex="0"
          v-for="item in (data.governance.funnel || [])"
          :key="item.key"
          class="funnel-item"
          @tap="item.route ? goFunnel(item) : null"
         @keydown.enter.prevent.stop="item.route ? goFunnel(item) : null" @keydown.space.prevent.stop="item.route ? goFunnel(item) : null">
          <view class="funnel-head">
            <text class="funnel-label">{{ item.label }}</text>
            <text class="funnel-count">{{ item.count }}</text>
          </view>
          <view class="funnel-track">
            <view class="funnel-bar" :style="{ width: funnelWidth(item.count) + '%', background: funnelColor(item.key) }"></view>
          </view>
        </view>
      </view>

      <!-- 数据资产状态 -->
      <view class="card">
        <view class="sec-title">
          <text class="sec-main">数据资产</text>
          <text role="button" tabindex="0" class="sec-more" @tap="goDatasets" @keydown.enter.prevent.stop="goDatasets" @keydown.space.prevent.stop="goDatasets">管理 <AppIcon name="chevron-right" /></text>
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
            <AppIcon class="act-icon" name="clock" />
            <view class="act-body">
              <text class="act-title">{{ act.action }}</text>
              <text class="act-sub">{{ act.targetType }}　{{ shortId(act.targetId) }}　{{ formatTime(act.createdAt) }}</text>
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
            <AppIcon :name="data.system.api ? 'check' : 'close'" :class="data.system.api ? 'system-ok' : 'system-bad'" />
            <text class="sys-text">API 服务</text>
          </view>
          <view class="sys-item">
            <AppIcon :name="data.system.neo4j ? 'check' : 'close'" :class="data.system.neo4j ? 'system-ok' : 'system-bad'" />
            <text class="sys-text">Neo4j 图谱</text>
          </view>
          <view class="sys-item">
            <AppIcon :name="data.system.mysql ? 'check' : 'close'" :class="data.system.mysql ? 'system-ok' : 'system-bad'" />
            <text class="sys-text">MySQL 库</text>
          </view>
          <view class="sys-item">
            <AppIcon :name="data.system.agentConfigured ? 'check' : 'close'" :class="data.system.agentConfigured ? 'system-ok' : 'system-bad'" />
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
  return `候选 ${sumObj(t)}　已批准 ${t.approved || 0}　已驳回 ${t.rejected || 0}`;
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
    { candidates: "var(--color-primary)", pending: "var(--color-warning)", approved: "var(--color-primary)", published: "var(--color-success)", withdrawn: "var(--color-primary)" } as Record<string, string>
  )[key] || "var(--color-primary)";
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
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */

/* Hallmark · v2.0.0 · redesign: full · shape: app screen · theme: project teal · scope: app */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V; retained familiar mobile list navigation, removed gradient cards. */
.admin-page { min-height: 100vh; background: var(--color-surface); padding-bottom: calc(140rpx + env(safe-area-inset-bottom)); box-sizing: border-box; }

.admin-loading {
  text-align: center;
  color: var(--color-muted);
  padding: 80rpx 0;
  font-size: 26rpx;
}

/* Hero */
.hero { padding: 32rpx; margin-top: 16rpx; background: var(--color-paper); border-radius: 0; }

.hero-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero-score-value { font-size: 60rpx; font-weight: 600; color: var(--color-ink); line-height: 1.15; font-variant-numeric: tabular-nums; }

.hero-score-label { display: block; margin-top: 8rpx; font-size: 24rpx; color: var(--color-secondary); }

.hero-versions {
  text-align: right;
}

.hero-ver {
  margin-bottom: 14rpx;
}

.hero-ver-value { display: block; font-size: 26rpx; font-weight: 500; color: var(--color-ink); }

.hero-ver-label { font-size: 22rpx; color: var(--color-muted); }

.hero-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8rpx; margin-top: 24rpx; color: var(--color-secondary); }

.hero-meta-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: var(--color-success);
  margin-right: 12rpx;
}

.hero-meta-dot.bad {
  background: var(--color-warning);
}

.hero-meta-text { font-size: 24rpx; color: var(--color-secondary); }

.hero-meta-time { width: 100%; margin-top: 8rpx; font-size: 22rpx; color: var(--color-muted); }

/* KPI 栅格 */
.kpi-grid { display: flex; flex-wrap: wrap; margin: 0; background: var(--color-paper); border-radius: 0; padding: 8rpx 16rpx 24rpx; box-shadow: none; }

.kpi-cell {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
}

.kpi-value { font-size: 34rpx; font-weight: 600; line-height: 1.2; color: var(--color-ink); font-variant-numeric: tabular-nums; }

.kpi-label { margin-top: 12rpx; font-size: 24rpx; color: var(--color-secondary); }

/* 卡片 */
.card { margin: 16rpx 0 0; padding: 32rpx; background: var(--color-paper); border-radius: 0; box-shadow: none; }

.sec-title { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; margin-bottom: 24rpx; }

.sec-main { font-size: 32rpx; font-weight: 600; color: var(--color-ink); }

.sec-more { font-size: 24rpx; color: var(--color-secondary); display: inline-flex; align-items: center; gap: 8rpx; }

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
  color: var(--color-ink);
}

.funnel-count { font-size: 30rpx; font-weight: 600; color: var(--color-ink); }

.funnel-track { height: 8rpx; border-radius: 0; background: var(--color-surface); overflow: hidden; }

.funnel-bar { height: 100%; border-radius: 0; min-width: 10rpx; }

/* 风险 */
.risk-list {
  padding-bottom: 14rpx;
}

.risk-item {
  display: flex;
  align-items: center;
  padding: 18rpx 0;
  border-bottom: 1rpx solid var(--color-surface);
}

.risk-item:last-child {
  border-bottom: none;
}

.risk-item--ok {
  opacity: 0.85;
}

.risk-icon { width: 36rpx; height: 44rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: transparent; }

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
  color: var(--color-ink);
}

.risk-sub {
  display: block;
  margin-top: 4rpx;
  font-size: 21rpx;
  color: var(--color-muted);
}

.risk-count { font-size: 36rpx; font-weight: 600; }

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

.pill-value { font-size: 36rpx; font-weight: 600; color: var(--color-ink); font-variant-numeric: tabular-nums; }

.pill-label { margin-top: 8rpx; font-size: 24rpx; color: var(--color-secondary); }

.mini-meta {
  font-size: 21rpx;
  color: var(--color-muted);
  padding: 6rpx 0 18rpx;
}

/* 最近操作 */
.act-item {
  display: flex;
  align-items: flex-start;
  padding: 16rpx 0;
  border-bottom: 1rpx solid var(--color-surface);
}

.act-item:last-child {
  border-bottom: none;
}

.act-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: var(--color-primary);
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
  color: var(--color-ink);
  word-break: break-all;
}

.act-sub {
  display: block;
  margin-top: 4rpx;
  font-size: 20rpx;
  color: var(--color-muted);
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
  background: var(--color-success);
}

.sys-dot.bad {
  background: var(--color-danger);
}

.sys-text {
  font-size: 24rpx;
  color: var(--color-ink);
}

.empty {
  text-align: center;
  color: var(--color-muted);
  font-size: 24rpx;
  padding: 40rpx 0;
}

.system-ok { color: var(--color-success); }
.system-bad { color: var(--color-danger); }
.act-icon { margin-right: 16rpx; color: var(--color-muted); }
.sys-item { gap: 12rpx; }
</style>
