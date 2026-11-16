<template>
  <view class="admin-page">
    <admin-navbar :title="dataset?.name || '资产详情'" back />

    <view v-if="loading && !dataset" class="admin-loading">加载中…</view>

    <template v-if="dataset">
      <!-- 概要 -->
      <view class="hero">
        <view class="hero-name-row">
          <text class="hero-name">{{ dataset.name }}</text>
          <view class="hero-badge" :class="dataset.boundary === 'formal' ? 'bd-formal' : 'bd-review'">{{ dataset.boundary === 'formal' ? '正式' : '复核' }}</view>
        </view>
        <view class="hero-meta">
          <text>{{ dataset.category }}</text>
          
          <text>{{ dataset.records.toLocaleString('en-US') }} 条记录</text>
          
          <text>{{ dataset.version }}</text>
        </view>
        <view class="hero-sync">
          <text class="hero-sync-label">同步状态</text>
          <text class="hero-sync-value" :class="syncClass(dataset.syncStatus)">{{ syncText(dataset.syncStatus) }}</text>
        </view>
      </view>

      <!-- 操作 -->
      <view class="action-row">
        <button class="act-btn act-sync" :disabled="syncing" @tap="onSync">
          <AppIcon  class="act-ico" name="refresh" />
          {{ syncing ? "同步中…" : "同步图谱" }}
        </button>
        <button class="act-btn act-edit" @tap="showEdit = true">更新信息</button>
      </view>

      <!-- 同步结果 -->
      <view v-if="dataset.syncResult && Object.keys(dataset.syncResult).length" class="card">
        <view class="sec-title"><text class="sec-main">最近同步结果</text></view>
        <view v-if="typeof dataset.syncResult.message === 'string'" class="sync-msg">{{ dataset.syncResult.message }}</view>
        <view class="kv-row"><text class="kv-key">模式</text><text class="kv-val">{{ dataset.syncResult.mode || '—' }}</text></view>
        <view class="kv-row"><text class="kv-key">解析行</text><text class="kv-val">{{ dataset.syncResult.rowsRead ?? '—' }}</text></view>
        <view class="kv-row"><text class="kv-key">合并节点</text><text class="kv-val">{{ dataset.syncResult.nodesMerged ?? '—' }}</text></view>
        <view class="kv-row"><text class="kv-key">合并关系</text><text class="kv-val">{{ dataset.syncResult.relationsMerged ?? '—' }}</text></view>
      </view>

      <!-- 文件信息 -->
      <view class="card">
        <view class="sec-title"><text class="sec-main">文件信息</text></view>
        <view class="kv-row"><text class="kv-key">路径</text><text class="kv-val break">{{ dataset.path }}</text></view>
        <view class="kv-row"><text class="kv-key">SHA256</text><text class="kv-val break mono">{{ dataset.sha256 }}</text></view>
        <view class="kv-row"><text class="kv-key">更新时间</text><text class="kv-val">{{ formatTime(dataset.updatedAt) }}</text></view>
      </view>

      <!-- 修订历史 -->
      <view class="card">
        <view class="sec-title"><text class="sec-main">修订历史</text><text class="sec-more">{{ revisions.length }} 条</text></view>
        <view v-if="revisions.length" class="rev-list">
          <view v-for="rev in revisions" :key="rev.id" class="rev-item">
            <view class="rev-head">
              <text class="rev-name">{{ rev.fileName }}</text>
              <text class="rev-sync" :class="syncClass(rev.syncStatus)">{{ syncText(rev.syncStatus) }}</text>
            </view>
            <view class="rev-meta">
              <text>{{ rev.version }}</text>
              
              <text>{{ (rev.records || 0).toLocaleString('en-US') }} 条</text>
              
              <text>{{ formatTime(rev.createdAt) }}</text>
            </view>
          </view>
        </view>
        <view v-else class="empty">暂无修订记录</view>
      </view>
    </template>

    <!-- 编辑弹层 -->
    <view v-if="showEdit" class="mask" @tap.self="showEdit = false" role="button" tabindex="0" @keydown.enter.prevent.stop="showEdit = false" @keydown.space.prevent.stop="showEdit = false">
      <view class="sheet">
        <view class="sheet-title">更新资产信息</view>
        <view class="field">
          <text class="field-label">资产名称</text>
          <input aria-label="资产名称" v-model="edit.name" class="input" :maxlength="60" />
        </view>
        <view class="field">
          <text class="field-label">分类</text>
          <input aria-label="分类" v-model="edit.category" class="input" :maxlength="60" />
        </view>
        <view class="field">
          <text class="field-label">版本号</text>
          <input aria-label="版本号" v-model="edit.version" class="input" :maxlength="40" />
        </view>
        <view class="field">
          <text class="field-label">使用边界</text>
          <view class="seg">
            <view role="button" tabindex="0" class="seg-item" :class="{ active: edit.boundary === 'formal' }" @tap="edit.boundary = 'formal'" @keydown.enter.prevent.stop="edit.boundary = 'formal'" @keydown.space.prevent.stop="edit.boundary = 'formal'">正式</view>
            <view role="button" tabindex="0" class="seg-item" :class="{ active: edit.boundary === 'review' }" @tap="edit.boundary = 'review'" @keydown.enter.prevent.stop="edit.boundary = 'review'" @keydown.space.prevent.stop="edit.boundary = 'review'">复核</view>
          </view>
        </view>
        <view class="sheet-actions">
          <button class="btn-ghost" @tap="showEdit = false">取消</button>
          <button class="btn-primary" :disabled="saving" @tap="submitEdit">{{ saving ? "保存中…" : "保存" }}</button>
        </view>
      </view>
    </view>

    <admin-tabbar active="datasets" />
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import AdminNavbar from "@/components/admin-navbar.vue";
import AdminTabbar from "@/components/admin-tabbar.vue";
import { getDatasetRevisions, getDatasets, syncDataset, updateDataset } from "@/admin/api";
import type { DatasetBoundary, DatasetItem, DatasetRevision } from "@/admin/types";

const id = ref("");
const dataset = ref<DatasetItem | null>(null);
const revisions = ref<DatasetRevision[]>([]);
const loading = ref(false);
const syncing = ref(false);
const saving = ref(false);
const showEdit = ref(false);
const edit = reactive({ name: "", category: "", version: "", boundary: "formal" as DatasetBoundary });

function syncText(status: string): string {
  return (
    { registered: "已登记", pending: "同步中", synced: "已同步", failed: "同步失败", not_requested: "未请求" } as Record<string, string>
  )[status] || status;
}
function syncClass(status: string): string {
  return (
    { registered: "st-idle", pending: "st-pending", synced: "st-ok", failed: "st-bad", not_requested: "st-idle" } as Record<string, string>
  )[status] || "st-idle";
}
function formatTime(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function load() {
  loading.value = true;
  try {
    const [page, revs] = await Promise.all([
      getDatasets(1, 200),
      getDatasetRevisions(id.value),
    ]);
    dataset.value = page.items.find((item) => item.id === id.value) || null;
    revisions.value = revs;
    if (dataset.value) {
      edit.name = dataset.value.name;
      edit.category = dataset.value.category;
      edit.version = dataset.value.version;
      edit.boundary = dataset.value.boundary;
    }
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function onSync() {
  syncing.value = true;
  try {
    dataset.value = await syncDataset(id.value);
    const revs = await getDatasetRevisions(id.value);
    revisions.value = revs;
    uni.showToast({ title: "同步完成", icon: "success" });
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "同步失败", icon: "none" });
  } finally {
    syncing.value = false;
  }
}

async function submitEdit() {
  saving.value = true;
  try {
    dataset.value = await updateDataset(id.value, {
      name: edit.name.trim() || undefined,
      category: edit.category.trim() || undefined,
      version: edit.version.trim() || undefined,
      boundary: edit.boundary,
    });
    showEdit.value = false;
    uni.showToast({ title: "已更新", icon: "success" });
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

onPullDownRefresh(async () => {
  if (id.value) await load();
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

.hero { padding: 32rpx; background: var(--color-paper); border-radius: 0; border-bottom: 1rpx solid var(--color-rule); }

.hero-name-row {
  display: flex;
  align-items: center;
}

.hero-name { font-size: 38rpx; font-weight: 600; color: var(--color-ink); min-width: 0; overflow-wrap: break-word; flex: 1; }

.hero-badge {
  margin-left: 14rpx;
  font-size: 20rpx;
  padding: 4rpx 14rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
}

.bd-formal { background: var(--color-rule); color: var(--color-paper); }
.bd-review { background: var(--color-warning); color: var(--color-paper); }

.hero-meta { margin-top: 16rpx; font-size: 24rpx; color: var(--color-secondary); display: flex; align-items: center; flex-wrap: wrap; gap: 16rpx; }

.dot { margin: 0 10rpx; color: var(--color-rule); }

.hero-sync {
  display: flex;
  align-items: center;
  margin-top: 18rpx;
}

.hero-sync-label { font-size: 24rpx; color: var(--color-secondary); margin-right: 16rpx; }

.hero-sync-value { font-size: 26rpx; font-weight: 500; color: var(--color-primary); }

.st-ok { color: var(--color-success) !important; }
.st-bad { color: var(--color-danger) !important; }
.st-pending { color: var(--color-warning) !important; }
.st-idle { color: var(--color-muted) !important; }

.action-row {
  display: flex;
  gap: 16rpx;
  margin: 20rpx 20rpx 0;
}

.act-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 14rpx;
  font-size: 27rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.act-sync {
  background: var(--color-primary);
  color: var(--color-paper);
}

.act-edit {
  background: var(--color-paper);
  color: var(--color-primary);
  border: 1rpx solid var(--color-rule);
}

.act-ico {
  width: 30rpx;
  height: 30rpx;
  margin-right: 8rpx;
}

.act-btn[disabled] {
  opacity: 0.6;
 cursor: not-allowed;}

.card { margin: 16rpx 0 0; padding: 32rpx; background: var(--color-paper); border-radius: 0; box-shadow: none; }

.sec-title { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; margin-bottom: 24rpx; }

.sec-main { font-size: 32rpx; font-weight: 600; color: var(--color-ink); }

.sec-more { font-size: 24rpx; color: var(--color-secondary); display: inline-flex; align-items: center; gap: 8rpx; }

.sync-msg {
  font-size: 24rpx;
  color: var(--color-ink);
  background: var(--color-surface);
  border-radius: 10rpx;
  padding: 16rpx;
  margin-bottom: 14rpx;
}

.kv-row {
  display: flex;
  align-items: baseline;
  padding: 12rpx 0;
  border-bottom: 1rpx solid var(--color-surface);
  font-size: 24rpx;
}

.kv-row:last-child { border-bottom: none; }

.kv-key {
  width: 150rpx;
  flex-shrink: 0;
  color: var(--color-muted);
}

.kv-val {
  flex: 1;
  color: var(--color-ink);
}

.kv-val.break {
  word-break: break-all;
}

.kv-val.mono {
  font-family: var(--font-body);
  font-size: 20rpx;
  color: var(--color-secondary);
}

.rev-list {
  padding-bottom: 6rpx;
}

.rev-item {
  padding: 16rpx 0;
  border-bottom: 1rpx solid var(--color-surface);
}

.rev-item:last-child { border-bottom: none; }

.rev-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rev-name {
  font-size: 25rpx;
  color: var(--color-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.rev-sync {
  font-size: 21rpx;
  flex-shrink: 0;
  margin-left: 12rpx;
}

.rev-meta {
  margin-top: 6rpx;
  font-size: 21rpx;
  color: var(--color-muted);
  display: flex;
  align-items: center;
}

.empty {
  text-align: center;
  color: var(--color-muted);
  font-size: 24rpx;
  padding: 30rpx 0;
}

/* 编辑弹层 */
.mask {
  position: fixed;
  inset: 0;
  background: var(--color-mask);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.sheet { width: 100%; max-height: 85vh; box-sizing: border-box; overflow-y: auto; padding: 40rpx 32rpx calc(32rpx + env(safe-area-inset-bottom)); background: var(--color-paper); border-radius: 24rpx 24rpx 0 0; }

.sheet-title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--color-ink);
  margin-bottom: 22rpx;
}

.field {
  margin-bottom: 20rpx;
}

.field-label { display: block; font-size: 26rpx; color: var(--color-secondary); margin-bottom: 16rpx; }

.input { background: var(--color-surface); border: 1rpx solid var(--color-rule); border-radius: 8rpx; height: 88rpx; padding: 0 24rpx; font-size: 30rpx; color: var(--color-ink); box-sizing: border-box; }

.seg {
  display: flex;
  background: var(--color-surface);
  border-radius: 12rpx;
  padding: 6rpx;
}

.seg-item {
  flex: 1;
  text-align: center;
  font-size: 26rpx;
  color: var(--color-secondary);
  padding: 14rpx 0;
  border-radius: 8rpx;
}

.seg-item.active { background: var(--color-primary-soft); color: var(--color-primary); font-weight: 500; box-shadow: none; }

.sheet-actions {
  display: flex;
  gap: 18rpx;
  margin-top: 10rpx;
}

.btn-ghost { flex: 1; background: var(--color-paper); border: 1rpx solid var(--color-rule); color: var(--color-secondary); font-size: 30rpx; border-radius: 8rpx; height: 88rpx; line-height: 88rpx; }

.btn-primary { flex: 2; background: var(--color-primary); color: var(--color-paper); border: 0; font-size: 30rpx; border-radius: 8rpx; height: 88rpx; line-height: 88rpx; box-shadow: none; }

.btn-primary[disabled] {
  opacity: 0.6;
 cursor: not-allowed;}
</style>
