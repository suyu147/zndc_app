<template>
  <view class="admin-page">
    <admin-navbar :title="review?.roleName || '复核详情'" back />

    <view v-if="loading && !review" class="admin-loading">加载中…</view>

    <template v-if="review">
      <!-- 头部 -->
      <view class="hero">
        <view class="hero-row">
          <text class="hero-role">{{ review.roleName }}</text>
          <text class="hero-status" :class="statusClass(review.status)">{{ statusText(review.status) }}</text>
        </view>
        <view class="hero-tags">
          <text class="hero-type">{{ typeText(review.candidateType) }}</text>
          <text class="hero-evidence" :class="evidenceClass(review.evidenceClass)">{{ review.evidenceLabel }}</text>
        </view>
      </view>

      <!-- 关键指标 -->
      <view class="card">
        <view class="pill-row">
          <view class="pill"><text class="pill-value">{{ def.posting_count || 0 }}</text><text class="pill-label">招聘帖</text></view>
          <view class="pill"><text class="pill-value">{{ def.source_count || 0 }}</text><text class="pill-label">来源</text></view>
          <view class="pill"><text class="pill-value">{{ def.evidence_record_count || 0 }}</text><text class="pill-label">证据</text></view>
          <view class="pill"><text class="pill-value">{{ def.signal_score || 0 }}</text><text class="pill-label">信号分</text></view>
        </view>
        <view class="mini-meta">发现周期：{{ def.first_seen || '—' }} ~ {{ def.latest_seen || '—' }}</view>
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
            <text v-if="s.evidence_count" class="chip-sub">{{ s.evidence_count }} 证据</text>
          </view>
        </view>
      </view>

      <!-- 加分技能 -->
      <view v-if="(def.bonus_skills || []).length" class="card">
        <view class="sec-title"><text class="sec-main">加分技能</text></view>
        <view class="chip-wrap">
          <view v-for="(s, i) in def.bonus_skills" :key="i" class="chip chip-bonus">
            <text class="chip-name">{{ s.skill_name || s.name }}</text>
            <text v-if="s.evidence_count" class="chip-sub">{{ s.evidence_count }} 证据</text>
          </view>
        </view>
      </view>

      <!-- 应用场景 -->
      <view v-if="(def.application_scenarios || []).length" class="card">
        <view class="sec-title"><text class="sec-main">应用场景</text></view>
        <view v-for="(item, i) in def.application_scenarios" :key="i" class="line">{{ i + 1 }}. {{ item }}</view>
      </view>

      <!-- 证据 -->
      <view v-if="(review.evidence || []).length" class="card">
        <view class="sec-title"><text class="sec-main">来源证据</text><text class="sec-more">{{ review.evidence.length }} 条</text></view>
        <view v-for="(ev, i) in review.evidence" :key="i" class="ev-item">
          <view class="ev-head">
            <text class="ev-type">{{ ev.type || '证据' }}</text>
            <text v-if="ev.period" class="ev-period">{{ ev.period }}</text>
          </view>
          <text v-if="ev.excerpt" class="ev-excerpt">{{ ev.excerpt }}</text>
        </view>
      </view>

      <!-- 操作（仅待复核可操作） -->
      <view v-if="review.status === 'pending'" class="op-card">
        <view class="field">
          <text class="field-label">复核意见（可选）</text>
          <input v-model="note" class="input" placeholder="填写备注，将记入审计日志" :maxlength="200" />
        </view>

        <view class="op-actions">
          <button class="op-btn op-reject" :disabled="acting" @tap="onReject">驳回</button>
          <button class="op-btn op-approve" :disabled="acting" @tap="onApprove">{{ acting ? "处理中…" : "通过复核" }}</button>
        </view>

        <view class="adv-toggle" @tap="showEdit = !showEdit">
          <text>高级：编辑完整定义</text>
          <text class="adv-arrow" :class="{ open: showEdit }">›</text>
        </view>
        <view v-if="showEdit" class="adv-panel">
          <textarea v-model="editJson" class="edit-area" :auto-height="true" placeholder="编辑岗位定义 JSON" />
          <button class="adv-save" :disabled="saving" @tap="onSaveEdit">{{ saving ? "保存中…" : "保存草稿更新" }}</button>
        </view>
      </view>

      <view v-else class="done-tip">该候选已「{{ statusText(review.status) }}」，如需再调整可在图谱版本中生成更新草稿</view>
    </template>

    <admin-tabbar active="reviews" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import AdminNavbar from "@/components/admin-navbar.vue";
import AdminTabbar from "@/components/admin-tabbar.vue";
import { getReviews, reviewAction, updateRoleDefinition } from "@/admin/api";
import { adminState, setPendingReviews } from "@/admin/store";
import type { CandidateType, ReviewDefinition, ReviewItem, ReviewStatus } from "@/admin/types";

const id = ref("");
const review = ref<ReviewItem | null>(null);
const loading = ref(false);
const acting = ref(false);
const saving = ref(false);
const note = ref("");
const showEdit = ref(false);
const editJson = ref("");

const def = computed<ReviewDefinition>(() => review.value?.definition || {});

function statusText(s: ReviewStatus): string {
  return ({ pending: "待复核", approved: "已批准", rejected: "已驳回" } as Record<string, string>)[s] || s;
}
function statusClass(s: ReviewStatus): string {
  return ({ pending: "st-pending", approved: "st-approved", rejected: "st-rejected" } as Record<string, string>)[s] || "";
}
function typeText(t: CandidateType): string {
  return ({ new_role: "新岗位发现", skill_change: "岗位能力变化", definition_update: "岗位定义更新" } as Record<string, string>)[t] || t;
}
function evidenceClass(c: string): string {
  return ({ data_backed: "ev-backed", curated: "ev-curated", aggregated: "ev-aggregated" } as Record<string, string>)[c] || "";
}

async function load() {
  loading.value = true;
  try {
    const list = await getReviews("all");
    review.value = list.find((item) => item.id === id.value) || null;
    if (review.value) editJson.value = JSON.stringify(review.value.definition, null, 2);
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function onApprove() {
  acting.value = true;
  try {
    await reviewAction(id.value, { action: "approve", note: note.value.trim() });
    if (review.value?.status === "pending") setPendingReviews(Math.max(0, adminState.pendingReviews - 1));
    uni.showToast({ title: "已通过复核", icon: "success" });
    setTimeout(() => uni.navigateBack(), 500);
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "操作失败", icon: "none" });
  } finally {
    acting.value = false;
  }
}

async function onReject() {
  acting.value = true;
  try {
    await reviewAction(id.value, { action: "reject", note: note.value.trim() });
    if (review.value?.status === "pending") setPendingReviews(Math.max(0, adminState.pendingReviews - 1));
    uni.showToast({ title: "已驳回", icon: "success" });
    setTimeout(() => uni.navigateBack(), 500);
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "操作失败", icon: "none" });
  } finally {
    acting.value = false;
  }
}

async function onSaveEdit() {
  let parsed: ReviewDefinition;
  try {
    parsed = JSON.parse(editJson.value) as ReviewDefinition;
  } catch {
    uni.showToast({ title: "JSON 格式不正确", icon: "none" });
    return;
  }
  saving.value = true;
  try {
    await updateRoleDefinition(id.value, parsed);
    uni.showToast({ title: "已保存草稿更新", icon: "success" });
    await load();
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "保存失败", icon: "none" });
  } finally {
    saving.value = false;
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

.st-pending { background: #f59e0b; color: #fff; }
.st-approved { background: #2da44e; color: #fff; }
.st-rejected { background: #e5484d; color: #fff; }

.hero-tags {
  display: flex;
  gap: 14rpx;
  margin-top: 16rpx;
}

.hero-type {
  font-size: 21rpx;
  padding: 4rpx 14rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
}

.hero-evidence {
  font-size: 21rpx;
  padding: 4rpx 14rpx;
  border-radius: 16rpx;
}

.ev-backed { background: #2da44e; color: #fff; }
.ev-curated { background: #8b5cf6; color: #fff; }
.ev-aggregated { background: #3b82f6; color: #fff; }

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
  display: flex;
  flex-direction: column;
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

.chip-sub {
  font-size: 19rpx;
  color: #6b7280;
  margin-top: 2rpx;
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

/* 操作区 */
.op-card {
  margin: 20rpx 20rpx 0;
  background: #ffffff;
  border-radius: 18rpx;
  padding: 26rpx;
  box-shadow: 0 2rpx 12rpx rgba(15, 40, 45, 0.04);
}

.field {
  margin-bottom: 18rpx;
}

.field-label {
  display: block;
  font-size: 24rpx;
  color: #374151;
  margin-bottom: 10rpx;
}

.input {
  background: #f5f6f8;
  border-radius: 12rpx;
  height: 84rpx;
  padding: 0 24rpx;
  font-size: 27rpx;
}

.op-actions {
  display: flex;
  gap: 16rpx;
}

.op-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 14rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.op-approve {
  background: #2da44e;
  color: #ffffff;
}

.op-reject {
  background: #fff;
  color: #e5484d;
  border: 1rpx solid #f3c9cb;
}

.op-btn[disabled] {
  opacity: 0.6;
}

.adv-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 22rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.adv-arrow {
  font-size: 32rpx;
  color: #c2c9d6;
  transition: transform 0.2s ease;
}

.adv-arrow.open {
  transform: rotate(90deg);
}

.adv-panel {
  margin-top: 16rpx;
}

.edit-area {
  width: 100%;
  box-sizing: border-box;
  min-height: 320rpx;
  background: #f5f6f8;
  border-radius: 12rpx;
  padding: 18rpx;
  font-size: 23rpx;
  font-family: monospace;
  line-height: 1.5;
}

.adv-save {
  margin-top: 16rpx;
  width: 100%;
  background: #2b6cb0;
  color: #fff;
  font-size: 27rpx;
  border-radius: 12rpx;
  height: 84rpx;
  line-height: 84rpx;
}

.adv-save[disabled] { opacity: 0.6; }

.done-tip {
  margin: 20rpx 20rpx 0;
  background: #f1f5f9;
  color: #64748b;
  font-size: 24rpx;
  border-radius: 14rpx;
  padding: 24rpx;
  text-align: center;
}
</style>
