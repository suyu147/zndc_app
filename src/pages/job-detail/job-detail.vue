<template>
  <view class="page" v-if="job">
    <!-- 顶部岗位卡 -->
    <view class="card head-card">
      <view class="head-main">
        <view class="job-logo">{{ logoText(job.name) }}</view>
        <view class="job-info">
          <view class="name">{{ job.name }}</view>
          <view class="field">{{ job.field }}</view>
          <view class="meta">
            <text>招聘 {{ job.postingCount }} 条</text>
            <text v-if="job.marketScope"> {{ job.marketScope }}</text>
            <text v-if="job.sourceCount"> 来源 {{ job.sourceCount }}</text>
            <text v-if="job.lastSeen"> {{ job.lastSeen }}</text>
          </view>
        </view>
      </view>
      <view class="trend-line">
        <text class="trend" :class="trendClass">{{ job.trendLabel || "平稳" }}</text>
        <text v-if="job.trendChangePp != null" :class="trendClass + '-text'">
          {{ formatTrendPp(job.trendChangePp) }}
          <text v-if="job.trendWindow">（{{ job.trendWindow }}）</text>
        </text>
      </view>
    </view>

    <!-- 岗位 AI 服务（携带当前岗位上下文） -->
    <view class="card ai-service-card">
      <view class="section-title">求职准备</view>
      <view class="ai-row">
        <view class="ai-item" @tap="aiAction('diagnosis')" role="button" tabindex="0" @keydown.enter.prevent.stop="aiAction('diagnosis')" @keydown.space.prevent.stop="aiAction('diagnosis')">
          <AppIcon class="ai-icon" name="target" :size="40" />
          <text class="ai-name">能力诊断</text>
          <text class="ai-desc">人岗匹配评估</text>
        </view>
        <view class="ai-item" @tap="aiAction('assistant')" role="button" tabindex="0" @keydown.enter.prevent.stop="aiAction('assistant')" @keydown.space.prevent.stop="aiAction('assistant')">
          <AppIcon class="ai-icon" name="message" :size="40" />
          <text class="ai-name">职业助手</text>
          <text class="ai-desc">咨询此岗位</text>
        </view>
        <view class="ai-item" @tap="aiAction('interview')" role="button" tabindex="0" @keydown.enter.prevent.stop="aiAction('interview')" @keydown.space.prevent.stop="aiAction('interview')">
          <AppIcon class="ai-icon" name="mic" :size="40" />
          <text class="ai-name">AI 面试</text>
          <text class="ai-desc">模拟面试</text>
        </view>
      </view>
    </view>

    <!-- 当前正在招聘该岗位的公司 -->
    <view class="card" v-if="hiringCompanies.length">
      <view class="section-title">当前正在招聘该岗位的公司</view>
      <view v-for="company in visibleCompanies" :key="company.name" class="company-row" @tap="openCompany(company)" role="button" tabindex="0" @keydown.enter.prevent.stop="openCompany(company)" @keydown.space.prevent.stop="openCompany(company)">
        <view class="company-logo">{{ company.name.slice(0, 1) }}</view>
        <view class="company-main">
          <view class="company-name">{{ company.name }}</view>
          <view class="company-meta">{{ company.cities }} {{ company.postingCount }} 条在招</view>
        </view>
        <text class="company-arrow">›</text>
      </view>
      <view v-if="hiringCompanies.length > COMPANY_COLLAPSE" class="company-more" @tap="companyExpanded = !companyExpanded" role="button" tabindex="0" @keydown.enter.prevent.stop="companyExpanded = !companyExpanded" @keydown.space.prevent.stop="companyExpanded = !companyExpanded">
        <text>{{ companyExpanded ? "收起" : `点击查看更多招聘公司（共 ${hiringCompanies.length} 家）` }}</text>
        <text class="company-more-icon">{{ companyExpanded ? "▲" : "▼" }}</text>
      </view>
    </view>

    <view class="card">
      <view class="section-title">核心技能（按权重）</view>
      <view v-for="skill in job.skills" :key="skill.id || skill.name" class="skill-line">
        <view class="skill-name">{{ skill.name }}</view>
        <view class="skill-bar">
          <view class="skill-bar-inner" :style="{ width: `${Math.max(4, Math.round(skill.weight * 100))}%` }" />
        </view>
        <view class="skill-weight">{{ (skill.weight * 100).toFixed(0) }}%</view>
      </view>
    </view>

    <view class="card" v-if="topCities.length">
      <view class="section-title">城市分布（招聘量 / 薪资中位）</view>
      <view v-for="city in topCities" :key="city.city" class="city-row">
        <view class="city-name">{{ city.city }}</view>
        <view class="city-posting">{{ city.postingCount }} 条</view>
        <view class="city-salary">{{ formatSalary(city.salaryMedian) }}</view>
      </view>
    </view>

    <view class="card" v-if="salaryBuckets.length">
      <view class="section-title">薪资分布</view>
      <view v-for="bucket in salaryBuckets" :key="bucket.label" class="city-row">
        <view class="city-name">{{ bucket.label }}</view>
        <view class="bucket-bar">
          <view class="bucket-inner" :style="{ width: `${Math.max(3, Math.round(bucket.share * 100))}%` }" />
        </view>
        <view class="city-salary">{{ (bucket.share * 100).toFixed(0) }}%</view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <view class="fav-action" :class="{ favored: isFavorite }" @tap="toggleFavorite" role="button" tabindex="0" @keydown.enter.prevent.stop="toggleFavorite" @keydown.space.prevent.stop="toggleFavorite">
        <text class="fav-star">{{ isFavorite ? "★" : "☆" }}</text>
        <text>{{ isFavorite ? "已收藏" : "收藏岗位" }}</text>
      </view>
    </view>
  </view>

  <view v-else class="loading-text">{{ errorText || "加载中…" }}</view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { api } from "@/api/api";
import { requireLogin } from "@/api/request";
import type { JobDetail } from "@/api/types";
import { formatSalary, formatTrendPp } from "@/utils/format";
import { setPendingCtx } from "@/utils/tabCtx";

const job = ref<JobDetail | null>(null);
const errorText = ref("");
const isFavorite = ref(false);
const favoriteIds = ref<Set<string>>(new Set());
const roleId = ref("");

const COMPANY_COLLAPSE = 3;
const companyExpanded = ref(false);

const topCities = computed(() => (job.value?.cityMetrics || job.value?.topCities || []).slice(0, 10));
const salaryBuckets = computed(() => job.value?.salaryBuckets || []);

interface HiringCompany {
  name: string;
  cities: string;
  postingCount: number;
  firstUrl?: string;
}

/** 从 JD(postings) 聚合出去重后的在招公司列表 */
const hiringCompanies = computed<HiringCompany[]>(() => {
  const map = new Map<string, HiringCompany>();
  for (const posting of job.value?.postings || []) {
    const name = (posting.company || "").trim();
    if (!name) continue;
    const found = map.get(name);
    if (found) {
      found.postingCount += 1;
      if (posting.city && !found.cities.includes(posting.city)) found.cities += `、${posting.city}`;
      if (!found.firstUrl && posting.url) found.firstUrl = posting.url;
    } else {
      map.set(name, {
        name,
        cities: posting.city || "—",
        postingCount: 1,
        firstUrl: posting.url,
      });
    }
  }
  return Array.from(map.values());
});

const visibleCompanies = computed<HiringCompany[]>(() =>
  companyExpanded.value ? hiringCompanies.value : hiringCompanies.value.slice(0, COMPANY_COLLAPSE)
);
const trendClass = computed(() => {
  if (job.value?.trendDirection === "up") return "trend-up";
  if (job.value?.trendDirection === "down") return "trend-down";
  return "trend-flat";
});

onLoad(async (options) => {
  if (requireLogin()) return;
  roleId.value = String(options?.id || "");
  if (!roleId.value) {
    errorText.value = "缺少岗位参数";
    return;
  }
  try {
    const [detail, favorites] = await Promise.all([api.getJob(roleId.value), api.getFavorites()]);
    job.value = detail;
    favoriteIds.value = new Set(favorites.items.map((item) => item.roleId));
    isFavorite.value = favoriteIds.value.has(roleId.value);
  } catch (error) {
    errorText.value = (error as Error).message;
  }
});

async function toggleFavorite() {
  if (!roleId.value) return;
  try {
    if (isFavorite.value) {
      await api.removeFavorite(roleId.value);
      isFavorite.value = false;
      uni.showToast({ title: "已取消收藏", icon: "none" });
    } else {
      await api.addFavorite(roleId.value);
      isFavorite.value = true;
      uni.showToast({ title: "已加入收藏", icon: "success" });
    }
  } catch (error) {
    uni.showToast({ title: (error as Error).message, icon: "none" });
  }
}

function logoText(name: string) {
  return (name || "—").slice(0, 1);
}

/** 跳转 AI 功能并携带当前岗位上下文（诊断/助手已改为 tab 页，通过 storage 暂存参数 + switchTab） */
function aiAction(kind: "diagnosis" | "assistant" | "interview") {
  const roleName = job.value?.name || "该岗位";
  if (kind === "interview") {
    uni.navigateTo({
      url: `/pages/interview/interview?roleId=${encodeURIComponent(roleId.value)}&roleName=${encodeURIComponent(roleName)}`,
    });
    return;
  }
  setPendingCtx({
    target: kind,
    mode: kind === "assistant" ? "career_planning" : undefined,
    roleId: roleId.value,
    roleName,
  });
  uni.switchTab({ url: kind === "diagnosis" ? "/pages/diagnosis/diagnosis" : "/pages/assistant/assistant" });
}

/** 打开该公司在招 JD 原文 */
function openCompany(company: HiringCompany) {
  const url = company.firstUrl;
  if (!url || !/^https?:\/\//i.test(url)) {
    uni.showToast({ title: "该招聘暂无原文链接", icon: "none" });
    return;
  }
  // #ifdef H5
  window.open(url, "_blank");
  // #endif
  // #ifndef H5
  uni.navigateTo({ url: `/pages/webview/webview?url=${encodeURIComponent(url)}` });
  // #endif
}
</script>

<style scoped>
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */
.page {
  padding-bottom: 180rpx;
}

.head-card {
  padding: 28rpx 24rpx;
}

.head-main {
  display: flex;
  align-items: flex-start;
}

.job-logo {
  width: 110rpx;
  height: 110rpx;
  border-radius: 24rpx;
  background: var(--color-primary);
  color: var(--color-paper);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  font-weight: 700;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.job-info {
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 38rpx;
  font-weight: 700;
  color: var(--color-ink);
  line-height: 1.3;
}

.field {
  margin-top: 10rpx;
  color: var(--color-secondary);
  font-size: 26rpx;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 12rpx;
  color: var(--color-muted);
  font-size: 23rpx;
}

.trend-line {
  margin-top: 22rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.trend {
  font-size: 22rpx;
  padding: 5rpx 16rpx;
  border-radius: 20rpx;
}

.trend-up {
  color: var(--color-danger);
  background: var(--color-primary-soft);
}

.trend-up-text {
  color: var(--color-danger);
  font-size: 24rpx;
}

.trend-down {
  color: var(--color-success);
  background: var(--color-primary-soft);
}

.trend-down-text {
  color: var(--color-success);
  font-size: 24rpx;
}

.trend-flat {
  color: var(--color-muted);
  background: var(--color-surface);
}

.trend-flat-text {
  color: var(--color-muted);
  font-size: 24rpx;
}

.tag-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag {
  font-size: 24rpx;
  color: var(--color-secondary);
  background: var(--color-surface);
  border-radius: 8rpx;
  padding: 8rpx 20rpx;
}

.skill-line {
  display: flex;
  align-items: center;
  margin-bottom: 22rpx;
}

.skill-name {
  width: 200rpx;
  font-size: 26rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-bar {
  flex: 1;
  height: 18rpx;
  background: var(--color-surface);
  border-radius: 12rpx;
  overflow: hidden;
  margin: 0 20rpx;
}

.skill-bar-inner {
  height: 100%;
  border-radius: 12rpx;
  background: var(--color-primary);
}

.skill-weight {
  width: 76rpx;
  text-align: right;
  color: var(--color-muted);
  font-size: 24rpx;
}

.city-row {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid var(--color-surface);
}

.city-row:last-child {
  border-bottom: none;
}

.city-name {
  width: 150rpx;
  font-size: 27rpx;
}

.city-posting {
  color: var(--color-muted);
  font-size: 24rpx;
  margin-right: 20rpx;
}

.city-salary {
  margin-left: auto;
  color: var(--color-danger);
  font-weight: 600;
}

.bucket-bar {
  flex: 1;
  height: 18rpx;
  background: var(--color-surface);
  border-radius: 12rpx;
  overflow: hidden;
  margin: 0 20rpx;
}

.bucket-inner {
  height: 100%;
  background: var(--color-primary);
  border-radius: 12rpx;
}

/* 岗位 AI 服务 */
.ai-row {
  display: flex;
  justify-content: space-between;
}

.ai-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8rpx 0;
}

.ai-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-bottom: 10rpx;
}

.ai-diagnosis {
  background: var(--color-surface);
}

.ai-assistant {
  background: var(--color-surface);
}

.ai-interview {
  background: var(--color-surface);
}

.ai-name {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-ink);
}

.ai-desc {
  font-size: 20rpx;
  color: var(--color-muted);
  margin-top: 2rpx;
}

/* 在招公司 */
.company-row {
  display: flex;
  align-items: center;
  padding: 18rpx 0;
  border-bottom: 1rpx solid var(--color-surface);
}

.company-row:last-child {
  border-bottom: none;
}

.company-logo {
  width: 72rpx;
  height: 72rpx;
  border-radius: 14rpx;
  background: var(--color-primary);
  color: var(--color-paper);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 700;
  margin-right: 18rpx;
  flex-shrink: 0;
}

.company-main {
  flex: 1;
  min-width: 0;
}

.company-name {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.company-meta {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--color-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.company-arrow {
  color: var(--color-rule);
  font-size: 32rpx;
  margin-left: 12rpx;
  flex-shrink: 0;
}

.company-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 22rpx 0 4rpx;
  color: var(--color-primary);
  font-size: 26rpx;
  font-weight: 600;
}

.company-more-icon {
  margin-left: 8rpx;
  font-size: 20rpx;
}

.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-paper);
  border-top: 1rpx solid var(--color-surface);
  padding: 16rpx 32rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  box-shadow: none;
  z-index: 10;
}

.fav-action {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: 48rpx;
  border: 1rpx solid var(--color-primary);
  color: var(--color-primary);
  font-size: 30rpx;
  font-weight: 600;
}

.fav-action.favored {
  background: var(--color-primary);
  color: var(--color-paper);
  border-color: var(--color-primary);
}

.fav-star {
  margin-right: 10rpx;
  font-size: 32rpx;
}

.head-card { margin-top: 0; padding: 40rpx 32rpx 28rpx; }.job-logo { width: 80rpx; height: 80rpx; background: var(--color-primary-soft); color: var(--color-primary); border-radius: 8rpx; font-size: 36rpx; }.name { font-size: 42rpx; font-weight: 600; }.trend { padding: 0; border-radius: 0; background: none; }.trend-line { padding-top: 16rpx; border-top: 1px solid var(--color-rule); }.meta { gap: 12rpx; }.ai-row { display: flex; flex-direction: column; }.ai-item { display: grid; grid-template-columns: 48rpx minmax(0,1fr) auto; gap: 16rpx; align-items: center; padding: 24rpx 0; border-bottom: 1px solid var(--color-rule); }.ai-item:last-child { border: 0; }.ai-icon { margin: 0; color: var(--color-primary); background: none; border-radius: 0; }.ai-name { font-size: 28rpx; font-weight: 500; }.ai-desc { font-size: 23rpx; }.company-logo { background: var(--color-surface); color: var(--color-secondary); border-radius: 8rpx; }.skill-bar, .bucket-bar { height: 10rpx; }.skill-bar-inner, .bucket-inner { background: var(--color-primary); }.action-bar { box-shadow: none; }.fav-action { border-radius: 8rpx; height: 84rpx; background: var(--color-primary); color: var(--color-paper); font-weight: 500; }.fav-action.favored { background: var(--color-primary-soft); color: var(--color-primary); border-color: var(--color-primary-soft); }
</style>
