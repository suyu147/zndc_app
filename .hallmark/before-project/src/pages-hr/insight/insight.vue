<template>
  <view class="hr-page">
    <hr-navbar title="招聘洞察" :subtitle="`数据更新于 ${data?.updatedAt || '—'}`" />

    <view v-if="!data" class="hr-loading">加载中…</view>

    <template v-if="data">
      <!-- 总览指标 -->
      <view class="overview">
        <view class="ov-cell">
          <text class="ov-value">{{ data.supplyIndex.toFixed(2) }}</text>
          <text class="ov-label">人才供需指数</text>
          <text class="ov-hint">&gt;1 表示供不应求</text>
        </view>
        <view class="ov-divider"></view>
        <view class="ov-cell">
          <text class="ov-value">{{ data.avgCycleDays }}<text class="ov-unit">天</text></text>
          <text class="ov-label">平均招聘周期</text>
          <text class="ov-hint">全行业均值</text>
        </view>
        <view class="ov-divider"></view>
        <view class="ov-cell">
          <text class="ov-value">{{ data.hotRoles.length }}</text>
          <text class="ov-label">热门岗位监测</text>
          <text class="ov-hint">本月 TOP 榜</text>
        </view>
      </view>

      <!-- 招聘需求趋势 -->
      <view class="hr-card">
        <view class="hr-sec-title">
          <text class="hr-sec-title-main">招聘需求趋势</text>
          <text class="hr-sec-more">近 6 个月</text>
        </view>
        <view class="chart-box">
          <svg viewBox="0 0 320 130" class="line-svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#00bebd" stop-opacity="0.28" />
                <stop offset="100%" stop-color="#00bebd" stop-opacity="0" />
              </linearGradient>
            </defs>
            <line
              v-for="grid in GRID_LINES"
              :key="grid"
              :x1="0"
              :x2="320"
              :y1="grid"
              :y2="grid"
              stroke="#f1f4f7"
              stroke-width="1"
            />
            <path :d="areaPath" fill="url(#areaFill)" />
            <polyline :points="linePoints" fill="none" stroke="#00a6a5" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" />
            <circle
              v-for="(point, index) in points"
              :key="index"
              :cx="point.x"
              :cy="point.y"
              :r="index === points.length - 1 ? 4.5 : 3"
              :fill="index === points.length - 1 ? '#ffffff' : '#00a6a5'"
              :stroke="'#00a6a5'"
              stroke-width="2"
            />
          </svg>
          <view class="chart-labels">
            <text v-for="item in data.trend" :key="item.month" class="chart-label">
              {{ item.month }}
              <text class="chart-value">{{ (item.value / 1000).toFixed(1) }}k</text>
            </text>
          </view>
        </view>
      </view>

      <!-- 岗位热度榜 -->
      <view class="hr-card">
        <view class="hr-sec-title">
          <text class="hr-sec-title-main">岗位热度榜</text>
          <text class="hr-sec-more">TOP {{ data.hotRoles.length }}</text>
        </view>
        <view v-for="role in data.hotRoles" :key="role.rank" class="hot-item">
          <view class="hot-head">
            <view class="hot-rank" :class="{ 'hot-rank--top': role.rank <= 3 }">{{ role.rank }}</view>
            <view class="hot-title-wrap">
              <text class="hot-name">{{ role.name }}</text>
              <text class="hot-field">{{ role.field }}</text>
            </view>
            <text class="hot-trend" :class="role.trendPp >= 0 ? 'hot-trend--up' : 'hot-trend--down'">
              {{ role.trendPp >= 0 ? "↑" : "↓" }}{{ Math.abs(role.trendPp).toFixed(1) }}pp
            </text>
          </view>
          <view class="hot-track">
            <view class="hot-bar" :style="{ width: role.heat + '%' }"></view>
          </view>
          <view class="hot-foot">
            <text>热度 {{ role.heat }}</text>
            <text>中位薪资 {{ role.salaryMedian }}K</text>
            <text>{{ role.postingCount }} 帖在招</text>
          </view>
        </view>
      </view>

      <!-- 薪资分布 -->
      <view class="hr-card">
        <view class="hr-sec-title">
          <text class="hr-sec-title-main">薪资分布</text>
          <text class="hr-sec-more">全站样本</text>
        </view>
        <view class="bar-chart">
          <view v-for="bucket in data.salaryBuckets" :key="bucket.label" class="bar-col">
            <text class="bar-value">{{ bucket.count }}</text>
            <view class="bar-track">
              <view class="bar-fill" :style="{ height: salaryHeight(bucket.count) + '%' }"></view>
            </view>
            <text class="bar-label">{{ bucket.label }}</text>
          </view>
        </view>
      </view>

      <!-- 城市分布 -->
      <view class="hr-card">
        <view class="hr-sec-title">
          <text class="hr-sec-title-main">城市分布</text>
          <text class="hr-sec-more">按在招量排序</text>
        </view>
        <view v-for="city in data.cities" :key="city.city" class="city-item">
          <view class="city-head">
            <text class="city-name">{{ city.city }}</text>
            <text class="city-meta">{{ city.count }} 帖 · 中位 {{ city.salary }}K</text>
          </view>
          <view class="city-track">
            <view class="city-bar" :style="{ width: cityWidth(city.count) + '%' }"></view>
          </view>
        </view>
      </view>

      <!-- 技能需求 -->
      <view class="hr-card">
        <view class="hr-sec-title">
          <text class="hr-sec-title-main">技能需求热度</text>
          <text class="hr-sec-more">按需求占比排序</text>
        </view>
        <view v-for="skill in data.skills" :key="skill.name" class="skill-item">
          <view class="skill-head">
            <text class="skill-name">{{ skill.name }}</text>
            <text class="skill-growth" :class="skill.growth >= 0 ? 'skill-growth--up' : 'skill-growth--down'">
              {{ skill.growth >= 0 ? "+" : "" }}{{ skill.growth }}%
            </text>
          </view>
          <view class="skill-track">
            <view class="skill-bar" :style="{ width: skill.demand + '%' }"></view>
          </view>
          <view class="skill-foot">需求占比 {{ skill.demand }}%</view>
        </view>
      </view>

      <view class="source-note">数据来源：职能洞察职业数据平台 · 样本覆盖 6 城 12 行业</view>
    </template>

    <hr-tabbar active="insight" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import HrNavbar from "@/components/hr-navbar.vue";
import HrTabbar from "@/components/hr-tabbar.vue";
import { getInsight } from "@/hr/api";
import type { InsightData } from "@/hr/types";

const data = ref<InsightData | null>(null);

const GRID_LINES = [10, 40, 70, 100, 121];

onShow(() => {
  if (!data.value) load();
});

async function load() {
  data.value = await getInsight();
}

/** 折线图点集：按极值归一化后映射到 viewBox 坐标 */
const points = computed(() => {
  const trend = data.value?.trend || [];
  if (!trend.length) return [];
  const values = trend.map((item) => item.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const top = 16;
  const bottom = 112;
  return trend.map((item, index) => ({
    x: 12 + (index / Math.max(trend.length - 1, 1)) * 296,
    y: top + (1 - (item.value - min) / range) * (bottom - top),
    value: item.value,
  }));
});

const linePoints = computed(() => points.value.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "));

const areaPath = computed(() => {
  const list = points.value;
  if (!list.length) return "";
  const head = `M ${list[0].x.toFixed(1)} 121`;
  const body = list.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  return `${head} ${body} L ${list[list.length - 1].x.toFixed(1)} 121 Z`;
});

const maxSalary = computed(() => Math.max(...(data.value?.salaryBuckets || []).map((item) => item.count), 1));
const maxCity = computed(() => Math.max(...(data.value?.cities || []).map((item) => item.count), 1));

function salaryHeight(count: number): number {
  return Math.max((count / maxSalary.value) * 100, 4);
}

function cityWidth(count: number): number {
  return Math.max((count / maxCity.value) * 100, 4);
}
</script>

<style scoped>
/* ---------- 总览 ---------- */
.overview {
  display: flex;
  align-items: center;
  margin: 20rpx 20rpx 0;
  padding: 28rpx 0;
  background: linear-gradient(135deg, #0a444c 0%, #00a6a5 100%);
  border-radius: 18rpx;
  box-shadow: 0 6rpx 20rpx rgba(10, 68, 76, 0.18);
}

.ov-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ov-value {
  font-size: 46rpx;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
}

.ov-unit {
  font-size: 24rpx;
  font-weight: 600;
  margin-left: 2rpx;
}

.ov-label {
  margin-top: 12rpx;
  font-size: 23rpx;
  color: rgba(255, 255, 255, 0.92);
}

.ov-hint {
  margin-top: 6rpx;
  font-size: 19rpx;
  color: rgba(255, 255, 255, 0.6);
}

.ov-divider {
  width: 1rpx;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.22);
}

/* ---------- 折线图 ---------- */
.chart-box {
  padding-top: 8rpx;
}

.line-svg {
  width: 100%;
  height: 240rpx;
  display: block;
}

.chart-labels {
  display: flex;
  margin-top: 12rpx;
}

.chart-label {
  flex: 1;
  text-align: center;
  font-size: 20rpx;
  color: #9ca3af;
  display: block;
}

.chart-value {
  display: block;
  margin-top: 4rpx;
  font-size: 21rpx;
  color: #00a6a5;
  font-weight: 600;
}

/* ---------- 岗位热度榜 ---------- */
.hot-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f1f4f7;
}

.hot-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.hot-head {
  display: flex;
  align-items: center;
}

.hot-rank {
  width: 40rpx;
  height: 40rpx;
  border-radius: 10rpx;
  background: #f1f4f7;
  color: #9ca3af;
  font-size: 22rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hot-rank--top {
  background: linear-gradient(135deg, #ffb35c 0%, #ff7a45 100%);
  color: #ffffff;
}

.hot-title-wrap {
  flex: 1;
  min-width: 0;
  margin-left: 18rpx;
  display: flex;
  align-items: baseline;
}

.hot-name {
  font-size: 27rpx;
  font-weight: 600;
  color: #1a1d24;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 260rpx;
}

.hot-field {
  margin-left: 14rpx;
  font-size: 20rpx;
  color: #9ca3af;
}

.hot-trend {
  flex-shrink: 0;
  padding-left: 14rpx;
  font-size: 21rpx;
  font-weight: 600;
}

.hot-trend--up {
  color: #e5484d;
}

.hot-trend--down {
  color: #2da44e;
}

.hot-track {
  margin-top: 14rpx;
  height: 14rpx;
  border-radius: 7rpx;
  background: #f1f4f7;
  overflow: hidden;
}

.hot-bar {
  height: 100%;
  border-radius: 7rpx;
  background: linear-gradient(90deg, #00bebd 0%, #38bdf8 100%);
  min-width: 10rpx;
}

.hot-foot {
  margin-top: 10rpx;
  display: flex;
  justify-content: space-between;
  font-size: 20rpx;
  color: #9ca3af;
}

/* ---------- 薪资柱状图 ---------- */
.bar-chart {
  display: flex;
  align-items: flex-end;
  height: 300rpx;
  padding-top: 30rpx;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}

.bar-value {
  font-size: 19rpx;
  color: #6b7280;
  margin-bottom: 8rpx;
}

.bar-track {
  width: 40rpx;
  height: 190rpx;
  display: flex;
  align-items: flex-end;
  background: #f7f9fa;
  border-radius: 6rpx;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #00bebd 0%, #00a6a5 100%);
  border-radius: 6rpx;
  min-height: 8rpx;
  transition: height 0.5s ease;
}

.bar-label {
  margin-top: 12rpx;
  font-size: 18rpx;
  color: #9ca3af;
  text-align: center;
}

/* ---------- 城市分布 ---------- */
.city-item {
  padding: 16rpx 0;
}

.city-item:last-child {
  padding-bottom: 0;
}

.city-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.city-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #1a1d24;
}

.city-meta {
  font-size: 21rpx;
  color: #9ca3af;
}

.city-track {
  margin-top: 12rpx;
  height: 14rpx;
  border-radius: 7rpx;
  background: #f1f4f7;
  overflow: hidden;
}

.city-bar {
  height: 100%;
  border-radius: 7rpx;
  background: linear-gradient(90deg, #38bdf8 0%, #3b82f6 100%);
  min-width: 10rpx;
}

/* ---------- 技能需求 ---------- */
.skill-item {
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f1f4f7;
}

.skill-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.skill-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.skill-name {
  font-size: 26rpx;
  color: #1a1d24;
  font-weight: 500;
}

.skill-growth {
  font-size: 21rpx;
  font-weight: 600;
}

.skill-growth--up {
  color: #e5484d;
}

.skill-growth--down {
  color: #2da44e;
}

.skill-track {
  margin-top: 12rpx;
  height: 14rpx;
  border-radius: 7rpx;
  background: #f1f4f7;
  overflow: hidden;
}

.skill-bar {
  height: 100%;
  border-radius: 7rpx;
  background: linear-gradient(90deg, #a78bfa 0%, #8b5cf6 100%);
  min-width: 10rpx;
}

.skill-foot {
  margin-top: 8rpx;
  font-size: 20rpx;
  color: #9ca3af;
  text-align: right;
}

.source-note {
  margin: 28rpx 20rpx 0;
  text-align: center;
  font-size: 20rpx;
  color: #b3bcc7;
}
</style>
