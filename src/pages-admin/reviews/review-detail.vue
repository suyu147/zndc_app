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
          <input aria-label="复核意见（可选）" v-model="note" class="input" placeholder="填写备注，将记入审计日志" :maxlength="200" />
        </view>

        <view class="op-actions">
          <button class="op-btn op-reject" :disabled="acting" @tap="onReject">驳回</button>
          <button class="op-btn op-approve" :disabled="acting" @tap="onApprove">{{ acting ? "处理中…" : "通过复核" }}</button>
        </view>

        <view role="button" tabindex="0" class="adv-toggle" @tap="showEdit = !showEdit" @keydown.enter.prevent.stop="showEdit = !showEdit" @keydown.space.prevent.stop="showEdit = !showEdit">
          <text>高级：编辑完整定义</text>
          <text class="adv-arrow" :class="{ open: showEdit }">›</text>
        </view>
        <view v-if="showEdit" class="adv-panel">
          <textarea aria-label="岗位定义 JSON" v-model="editJson" class="edit-area" :auto-height="true" placeholder="编辑岗位定义 JSON" />
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

.st-pending { background: var(--color-warning); color: var(--color-paper); }
.st-approved { background: var(--color-success); color: var(--color-paper); }
.st-rejected { background: var(--color-danger); color: var(--color-paper); }

.hero-tags {
  display: flex;
  gap: 14rpx;
  margin-top: 16rpx;
}

.hero-type { font-size: 24rpx; padding: 6rpx 12rpx; border-radius: 4rpx; background: var(--color-surface); color: var(--color-secondary); }

.hero-evidence {
  font-size: 21rpx;
  padding: 4rpx 14rpx;
  border-radius: 16rpx;
}

.ev-backed { background: var(--color-success); color: var(--color-paper); }
.ev-curated { background: var(--color-primary); color: var(--color-paper); }
.ev-aggregated { background: var(--color-primary); color: var(--color-paper); }

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

.chip-sub {
  font-size: 19rpx;
  color: var(--color-secondary);
  margin-top: 2rpx;
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

/* 操作区 */
.op-card { margin: 16rpx 0 0; padding: 32rpx; background: var(--color-paper); border-radius: 0; box-shadow: none; }

.field {
  margin-bottom: 18rpx;
}

.field-label { display: block; font-size: 26rpx; color: var(--color-secondary); margin-bottom: 16rpx; }

.input { background: var(--color-surface); border: 1rpx solid var(--color-rule); border-radius: 8rpx; height: 88rpx; padding: 0 24rpx; font-size: 30rpx; color: var(--color-ink); box-sizing: border-box; }

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
  background: var(--color-success);
  color: var(--color-paper);
}

.op-reject {
  background: var(--color-paper);
  color: var(--color-danger);
  border: 1rpx solid var(--color-primary-soft);
}

.op-btn[disabled] {
  opacity: 0.6;
 cursor: not-allowed;}

.adv-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 22rpx;
  font-size: 24rpx;
  color: var(--color-secondary);
}

.adv-arrow {
  font-size: 32rpx;
  color: var(--color-rule);
  transition: transform 0.2s ease;
}

.adv-arrow.open {
  transform: rotate(90deg);
}

.adv-panel { margin-top: 16rpx; padding-top: 24rpx; border-top: 1rpx solid var(--color-rule); background: transparent; border-radius: 0; }

.edit-area {
  width: 100%;
  box-sizing: border-box;
  min-height: 320rpx;
  background: var(--color-surface);
  border-radius: 12rpx;
  padding: 18rpx;
  font-size: 23rpx;
  font-family: var(--font-body);
  line-height: 1.5;
}

.adv-save {
  margin-top: 16rpx;
  width: 100%;
  background: var(--color-primary);
  color: var(--color-paper);
  font-size: 27rpx;
  border-radius: 12rpx;
  height: 84rpx;
  line-height: 84rpx;
}

.adv-save[disabled] { opacity: 0.6;  cursor: not-allowed;}

.done-tip {
  margin: 20rpx 20rpx 0;
  background: var(--color-surface);
  color: var(--color-primary);
  font-size: 24rpx;
  border-radius: 14rpx;
  padding: 24rpx;
  text-align: center;
}
</style>
