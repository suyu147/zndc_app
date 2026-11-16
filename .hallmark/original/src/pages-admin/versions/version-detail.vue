<template>
  <view class="admin-page">
    <admin-navbar :title="version?.roleName || '版本详情'" back />

    <view v-if="loading && !version" class="admin-loading">加载中…</view>

    <template v-if="version">
      <view class="hero">
        <view class="hero-row">
          <text class="hero-role">{{ version.roleName }}</text>
          <text class="hero-status" :class="statusClass(version.status)">{{ statusText(version.status) }}</text>
        </view>
        <view class="hero-meta">{{ version.displayTitle }} · {{ typeText(version.candidateType) }}</view>
      </view>

      <!-- 操作 -->
      <view class="op-row">
        <button v-if="canPublish" class="op-btn op-publish" :disabled="acting" @tap="onPublish">{{ acting ? "发布中…" : "发布上线" }}</button>
        <button v-if="version.status === 'published'" class="op-btn op-unpublish" :disabled="acting" @tap="onUnpublish">下架</button>
        <button class="op-btn op-draft" :disabled="acting" @tap="onDraft">生成更新草稿</button>
      </view>

      <!-- 指标 -->
      <view class="card">
        <view class="pill-row">
          <view class="pill"><text class="pill-value">{{ version.postingCount }}</text><text class="pill-label">招聘帖</text></view>
          <view class="pill"><text class="pill-value">{{ version.sourceCount }}</text><text class="pill-label">来源</text></view>
          <view class="pill"><text class="pill-value">{{ version.evidenceCount }}</text><text class="pill-label">证据</text></view>
          <view class="pill"><text class="pill-value">{{ (version.coreSkills || []).length }}</text><text class="pill-label">核心技能</text></view>
        </view>
        <view class="mini-meta">
          发布时间：{{ formatTime(version.publishedAt) || "—" }}
          <text v-if="version.withdrawnAt"> · 下架时间：{{ formatTime(version.withdrawnAt) }}</text>
        </view>
      </view>

      <!-- 核心职责 -->
      <view v-if="(def.core_responsibilities || []).length" class="card">
        <view class="sec-title"><text class="sec-main">核心职责</text></view>
        <view v-for="(item, i) in def.core_responsibilities" :key="i" class="line">{{ i + 1 }}. {{ item }}</view>
      </view>

      <!-- 必备技能 -->
      <view v-if="(def.required_skills || []).length" class="card">
        <view class="sec-title"><text class="sec-main">必备技能</text></view>
        <view class="chip-wrap">
          <view v-for="(s, i) in def.required_skills" :key="i" class="chip chip-req">
            <text class="chip-name">{{ s.skill_name || s.name }}</text>
          </view>
        </view>
      </view>

      <!-- 加分技能 -->
      <view v-if="(def.bonus_skills || []).length" class="card">
        <view class="sec-title"><text class="sec-main">加分技能</text></view>
        <view class="chip-wrap">
          <view v-for="(s, i) in def.bonus_skills" :key="i" class="chip chip-bonus">
            <text class="chip-name">{{ s.skill_name || s.name }}</text>
          </view>
        </view>
      </view>

      <!-- 应用场景 -->
      <view v-if="(def.application_scenarios || []).length" class="card">
        <view class="sec-title"><text class="sec-main">应用场景</text></view>
        <view v-for="(item, i) in def.application_scenarios" :key="i" class="line">{{ i + 1 }}. {{ item }}</view>
      </view>

      <!-- 管理证据 -->
      <view v-if="(version?.evidence || []).length" class="card">
        <view class="sec-title"><text class="sec-main">来源证据</text><text class="sec-more">{{ (version?.evidence || []).length }} 条</text></view>
        <view v-for="(ev, i) in (version?.evidence || [])" :key="i" class="ev-item">
          <view class="ev-head">
            <text class="ev-type">{{ ev.type || '证据' }}</text>
            <text v-if="ev.period" class="ev-period">{{ ev.period }}</text>
          </view>
          <text v-if="ev.excerpt" class="ev-excerpt">{{ ev.excerpt }}</text>
        </view>
      </view>
    </template>

    <admin-tabbar active="versions" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import AdminNavbar from "@/components/admin-navbar.vue";
import AdminTabbar from "@/components/admin-tabbar.vue";
import { createVersionDraft, getVersion, publishVersion, unpublishVersion } from "@/admin/api";
import { adminState, setPendingReviews } from "@/admin/store";
import type { CandidateType, GraphVersion, ReviewDefinition, VersionStatus } from "@/admin/types";

const id = ref("");
const version = ref<GraphVersion | null>(null);
const loading = ref(false);
const acting = ref(false);

const def = computed<ReviewDefinition>(() => version.value?.definition || {});
const canPublish = computed(() => version.value?.status === "approved" || version.value?.status === "withdrawn");

function statusText(s: VersionStatus): string {
  return ({ approved: "已批准待发布", published: "已发布", withdrawn: "已下架", draft: "草稿" } as Record<string, string>)[s] || s;
}
function statusClass(s: VersionStatus): string {
  return ({ approved: "st-approved", published: "st-published", withdrawn: "st-withdrawn", draft: "st-draft" } as Record<string, string>)[s] || "";
}
function typeText(t: CandidateType): string {
  return ({ new_role: "新岗位发现", skill_change: "岗位能力变化", definition_update: "岗位定义更新" } as Record<string, string>)[t] || t;
}
function formatTime(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function load() {
  loading.value = true;
  try {
    version.value = await getVersion(id.value);
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function onPublish() {
  acting.value = true;
  try {
    version.value = await publishVersion(id.value);
    uni.showToast({ title: "已发布上线", icon: "success" });
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "发布失败", icon: "none" });
  } finally {
    acting.value = false;
  }
}

async function onUnpublish() {
  acting.value = true;
  try {
    version.value = await unpublishVersion(id.value);
    uni.showToast({ title: "已下架", icon: "success" });
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "下架失败", icon: "none" });
  } finally {
    acting.value = false;
  }
}

async function onDraft() {
  acting.value = true;
  try {
    const result = await createVersionDraft(id.value);
    if (result.created) setPendingReviews(adminState.pendingReviews + 1);
    uni.showToast({ title: result.created ? "已生成更新草稿" : "已打开更新草稿", icon: "success" });
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "操作失败", icon: "none" });
  } finally {
    acting.value = false;
  }
}

onShow(() => {
  const q = (getCurrentPages().pop() as { options?: Record<string, string> } | undefined)?.options || {};
  id.value = decodeURIComponent(q.id || "");
  if (id.value) load();
});
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f5f6f8;
  padding-bottom: 160rpx;
  box-sizing: border-box;
}

.admin-loading {
  text-align: center;
  color: #8a94a6;
  padding: 80rpx 0;
  font-size: 26rpx;
}

.hero {
  padding: 30rpx 24rpx 32rpx;
  background: linear-gradient(180deg, #15324f 0%, #1e4d75 100%);
  border-bottom-left-radius: 32rpx;
  border-bottom-right-radius: 32rpx;
}

.hero-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero-role {
  font-size: 36rpx;
  font-weight: 800;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 480rpx;
}

.hero-status {
  font-size: 21rpx;
  padding: 4rpx 14rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
}

.st-published { background: #2da44e; color: #fff; }
.st-approved { background: #f59e0b; color: #fff; }
.st-withdrawn { background: rgba(255,255,255,0.2); color: #fff; }
.st-draft { background: #3b82f6; color: #fff; }

.hero-meta {
  margin-top: 14rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.op-row {
  display: flex;
  gap: 16rpx;
  margin: 20rpx 20rpx 0;
}

.op-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 14rpx;
  font-size: 27rpx;
  font-weight: 600;
}

.op-publish { background: #2da44e; color: #fff; }
.op-unpublish { background: #fff; color: #64748b; border: 1rpx solid #d8dee6; }
.op-draft { background: #2b6cb0; color: #fff; }

.op-btn[disabled] { opacity: 0.6; }

.card {
  margin: 20rpx 20rpx 0;
  background: #ffffff;
  border-radius: 18rpx;
  padding: 26rpx;
  box-shadow: 0 2rpx 12rpx rgba(15, 40, 45, 0.04);
}

.pill-row {
  display: flex;
}

.pill {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  padding: 14rpx 0 0;
}

.sec-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.sec-main {
  font-size: 28rpx;
  font-weight: 700;
  color: #1a1d24;
}

.sec-more {
  font-size: 22rpx;
  color: #9ca3af;
}

.line {
  font-size: 25rpx;
  color: #374151;
  line-height: 1.6;
  padding: 6rpx 0;
}

.chip-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.chip {
  padding: 12rpx 20rpx;
  border-radius: 12rpx;
}

.chip-req { background: #e8f0fa; }
.chip-bonus { background: #f3ecff; }

.chip-name {
  font-size: 25rpx;
  font-weight: 600;
  color: #1a1d24;
}

.ev-item {
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f1f4f7;
}

.ev-item:last-child { border-bottom: none; }

.ev-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ev-type {
  font-size: 24rpx;
  color: #2b6cb0;
  font-weight: 600;
}

.ev-period {
  font-size: 20rpx;
  color: #9ca3af;
}

.ev-excerpt {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #6b7280;
  line-height: 1.6;
}
</style>
