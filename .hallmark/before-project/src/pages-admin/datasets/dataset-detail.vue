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
          <text class="dot">·</text>
          <text>{{ dataset.records.toLocaleString('en-US') }} 条记录</text>
          <text class="dot">·</text>
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
          <svg viewBox="0 0 24 24" class="act-ico" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>
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
              <text class="dot">·</text>
              <text>{{ (rev.records || 0).toLocaleString('en-US') }} 条</text>
              <text class="dot">·</text>
              <text>{{ formatTime(rev.createdAt) }}</text>
            </view>
          </view>
        </view>
        <view v-else class="empty">暂无修订记录</view>
      </view>
    </template>

    <!-- 编辑弹层 -->
    <view v-if="showEdit" class="mask" @tap.self="showEdit = false">
      <view class="sheet">
        <view class="sheet-title">更新资产信息</view>
        <view class="field">
          <text class="field-label">资产名称</text>
          <input v-model="edit.name" class="input" :maxlength="60" />
        </view>
        <view class="field">
          <text class="field-label">分类</text>
          <input v-model="edit.category" class="input" :maxlength="60" />
        </view>
        <view class="field">
          <text class="field-label">版本号</text>
          <input v-model="edit.version" class="input" :maxlength="40" />
        </view>
        <view class="field">
          <text class="field-label">使用边界</text>
          <view class="seg">
            <view class="seg-item" :class="{ active: edit.boundary === 'formal' }" @tap="edit.boundary = 'formal'">正式</view>
            <view class="seg-item" :class="{ active: edit.boundary === 'review' }" @tap="edit.boundary = 'review'">复核</view>
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

.hero {
  padding: 30rpx 24rpx 32rpx;
  background: linear-gradient(180deg, #15324f 0%, #1e4d75 100%);
  border-bottom-left-radius: 32rpx;
  border-bottom-right-radius: 32rpx;
}

.hero-name-row {
  display: flex;
  align-items: center;
}

.hero-name {
  font-size: 36rpx;
  font-weight: 800;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 520rpx;
}

.hero-badge {
  margin-left: 14rpx;
  font-size: 20rpx;
  padding: 4rpx 14rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
}

.bd-formal { background: rgba(255, 255, 255, 0.18); color: #ffffff; }
.bd-review { background: #f59e0b; color: #ffffff; }

.hero-meta {
  margin-top: 14rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
}

.dot { margin: 0 10rpx; color: rgba(255, 255, 255, 0.5); }

.hero-sync {
  display: flex;
  align-items: center;
  margin-top: 18rpx;
}

.hero-sync-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.65);
  margin-right: 14rpx;
}

.hero-sync-value {
  font-size: 26rpx;
  font-weight: 700;
  color: #ffffff;
}

.st-ok { color: #7ee2a8 !important; }
.st-bad { color: #ffb4b4 !important; }
.st-pending { color: #ffd98a !important; }
.st-idle { color: rgba(255, 255, 255, 0.7) !important; }

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
  background: #2b6cb0;
  color: #ffffff;
}

.act-edit {
  background: #ffffff;
  color: #2b6cb0;
  border: 1rpx solid #d6e2f0;
}

.act-ico {
  width: 30rpx;
  height: 30rpx;
  margin-right: 8rpx;
}

.act-btn[disabled] {
  opacity: 0.6;
}

.card {
  margin: 20rpx 20rpx 0;
  background: #ffffff;
  border-radius: 18rpx;
  padding: 26rpx;
  box-shadow: 0 2rpx 12rpx rgba(15, 40, 45, 0.04);
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

.sync-msg {
  font-size: 24rpx;
  color: #374151;
  background: #f5f6f8;
  border-radius: 10rpx;
  padding: 16rpx;
  margin-bottom: 14rpx;
}

.kv-row {
  display: flex;
  align-items: baseline;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f1f4f7;
  font-size: 24rpx;
}

.kv-row:last-child { border-bottom: none; }

.kv-key {
  width: 150rpx;
  flex-shrink: 0;
  color: #9ca3af;
}

.kv-val {
  flex: 1;
  color: #1a1d24;
}

.kv-val.break {
  word-break: break-all;
}

.kv-val.mono {
  font-family: monospace;
  font-size: 20rpx;
  color: #6b7280;
}

.rev-list {
  padding-bottom: 6rpx;
}

.rev-item {
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f1f4f7;
}

.rev-item:last-child { border-bottom: none; }

.rev-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rev-name {
  font-size: 25rpx;
  color: #1a1d24;
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
  color: #9ca3af;
  display: flex;
  align-items: center;
}

.empty {
  text-align: center;
  color: #9ca3af;
  font-size: 24rpx;
  padding: 30rpx 0;
}

/* 编辑弹层 */
.mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  background: #ffffff;
  border-top-left-radius: 28rpx;
  border-top-right-radius: 28rpx;
  padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
}

.sheet-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1a1d24;
  margin-bottom: 22rpx;
}

.field {
  margin-bottom: 20rpx;
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
  font-size: 28rpx;
}

.seg {
  display: flex;
  background: #f5f6f8;
  border-radius: 12rpx;
  padding: 6rpx;
}

.seg-item {
  flex: 1;
  text-align: center;
  font-size: 26rpx;
  color: #6b7280;
  padding: 14rpx 0;
  border-radius: 8rpx;
}

.seg-item.active {
  background: #ffffff;
  color: #2b6cb0;
  font-weight: 700;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.sheet-actions {
  display: flex;
  gap: 18rpx;
  margin-top: 10rpx;
}

.btn-ghost {
  flex: 1;
  background: #f1f4f7;
  color: #374151;
  font-size: 28rpx;
  border-radius: 12rpx;
  height: 88rpx;
  line-height: 88rpx;
}

.btn-primary {
  flex: 2;
  background: #2b6cb0;
  color: #ffffff;
  font-size: 28rpx;
  border-radius: 12rpx;
  height: 88rpx;
  line-height: 88rpx;
}

.btn-primary[disabled] {
  opacity: 0.6;
}
</style>
