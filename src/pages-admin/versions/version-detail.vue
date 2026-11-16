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
        <view class="hero-meta">{{ version.displayTitle }}　{{ typeText(version.candidateType) }}</view>
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
          <text v-if="version.withdrawnAt">　下架时间：{{ formatTime(version.withdrawnAt) }}</text>
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

.hero { padding: 32rpx; background: var(--color-paper); border-radius: 0; border-bottom: 1rpx solid var(--color-rule); }

.hero-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero-role { font-size: 38rpx; font-weight: 600; color: var(--color-ink); min-width: 0; overflow-wrap: break-word; flex: 1; }

.hero-status {
  font-size: 21rpx;
  padding: 4rpx 14rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
}

.st-published { background: var(--color-success); color: var(--color-paper); }
.st-approved { background: var(--color-warning); color: var(--color-paper); }
.st-withdrawn { background: var(--color-rule); color: var(--color-paper); }
.st-draft { background: var(--color-primary); color: var(--color-paper); }

.hero-meta { margin-top: 16rpx; font-size: 24rpx; color: var(--color-secondary); display: flex; align-items: center; flex-wrap: wrap; gap: 16rpx; }

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

.op-publish { background: var(--color-success); color: var(--color-paper); }
.op-unpublish { background: var(--color-paper); color: var(--color-primary); border: 1rpx solid var(--color-rule); }
.op-draft { background: var(--color-primary); color: var(--color-paper); }

.op-btn[disabled] { opacity: 0.6;  cursor: not-allowed;}

.card { margin: 16rpx 0 0; padding: 32rpx; background: var(--color-paper); border-radius: 0; box-shadow: none; }

.pill-row {
  display: flex;
}

.pill {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pill-value { font-size: 36rpx; font-weight: 600; color: var(--color-ink); font-variant-numeric: tabular-nums; }

.pill-label { margin-top: 8rpx; font-size: 24rpx; color: var(--color-secondary); }

.mini-meta {
  font-size: 21rpx;
  color: var(--color-muted);
  padding: 14rpx 0 0;
}

.sec-title { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; margin-bottom: 24rpx; }

.sec-main { font-size: 32rpx; font-weight: 600; color: var(--color-ink); }

.sec-more { font-size: 24rpx; color: var(--color-secondary); display: inline-flex; align-items: center; gap: 8rpx; }

.line {
  font-size: 25rpx;
  color: var(--color-ink);
  line-height: 1.6;
  padding: 6rpx 0;
}

.chip-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.chip { display: inline-flex; align-items: center; gap: 8rpx; padding: 8rpx 16rpx; border-radius: 4rpx; background: var(--color-surface); color: var(--color-secondary); }

.chip-req { font-size: 24rpx; padding: 6rpx 12rpx; border-radius: 4rpx; background: var(--color-surface); color: var(--color-secondary); }
.chip-bonus { font-size: 24rpx; padding: 6rpx 12rpx; border-radius: 4rpx; background: var(--color-surface); color: var(--color-secondary); }

.chip-name {
  font-size: 25rpx;
  font-weight: 600;
  color: var(--color-ink);
}

.ev-item { padding: 24rpx 0; border-bottom: 1rpx solid var(--color-rule); background: transparent; border-radius: 0; }

.ev-item:last-child { border-bottom: none; }

.ev-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ev-type {
  font-size: 24rpx;
  color: var(--color-primary);
  font-weight: 600;
}

.ev-period {
  font-size: 20rpx;
  color: var(--color-muted);
}

.ev-excerpt {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--color-secondary);
  line-height: 1.6;
}
</style>
