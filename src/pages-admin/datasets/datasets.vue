<template>
  <view class="admin-page">
    <admin-navbar title="数据资产">
      <template #right>
        <view role="button" tabindex="0" class="nav-add" @tap="showCreate = !showCreate" @keydown.enter.prevent.stop="showCreate = !showCreate" @keydown.space.prevent.stop="showCreate = !showCreate">
          <AppIcon  class="nav-add-ico" name="plus" />
          <text class="nav-add-text">上传</text>
        </view>
      </template>
    </admin-navbar>

    <!-- 上传资产表单 -->
    <view v-if="showCreate" class="create-card">
      <view class="create-title">登记新数据资产</view>
      <view class="field">
        <text class="field-label">资产名称 *</text>
        <input aria-label="资产名称" v-model="form.name" class="input" placeholder="如：2026Q3_岗位招聘帖" :maxlength="60" />
      </view>
      <view class="field">
        <text class="field-label">分类</text>
        <input aria-label="分类" v-model="form.category" class="input" placeholder="如：01_招聘帖" :maxlength="60" />
      </view>
      <view class="field">
        <text class="field-label">版本号</text>
        <input aria-label="版本号" v-model="form.version" class="input" placeholder="留空自动生成" :maxlength="40" />
      </view>
      <view class="field">
        <text class="field-label">使用边界</text>
        <view class="seg">
          <view role="button" tabindex="0" class="seg-item" :class="{ active: form.boundary === 'formal' }" @tap="form.boundary = 'formal'" @keydown.enter.prevent.stop="form.boundary = 'formal'" @keydown.space.prevent.stop="form.boundary = 'formal'">正式</view>
          <view role="button" tabindex="0" class="seg-item" :class="{ active: form.boundary === 'review' }" @tap="form.boundary = 'review'" @keydown.enter.prevent.stop="form.boundary = 'review'" @keydown.space.prevent.stop="form.boundary = 'review'">复核</view>
        </view>
      </view>
      <view class="field">
        <text class="field-label">数据文件 *</text>
        <view role="button" tabindex="0" class="file-box" @tap="chooseFile" @keydown.enter.prevent.stop="chooseFile" @keydown.space.prevent.stop="chooseFile">
          <text v-if="form.fileName" class="file-name">{{ form.fileName }}</text>
          <text v-else class="file-placeholder">点击选择 CSV / JSON / Excel / TXT</text>
          <text class="file-pick">选择</text>
        </view>
      </view>
      <view class="create-actions">
        <button class="btn-ghost" @tap="showCreate = false">取消</button>
        <button class="btn-primary" :disabled="uploading" @tap="submitCreate">{{ uploading ? "上传中…" : "上传并登记" }}</button>
      </view>
    </view>

    <!-- 边界筛选 -->
    <view class="filter-row">
      <view role="button" tabindex="0"
        v-for="opt in FILTERS"
        :key="opt.value"
        class="filter-item"
        :class="{ active: filter === opt.value }"
        @tap="changeFilter(opt.value)"
       @keydown.enter.prevent.stop="changeFilter(opt.value)" @keydown.space.prevent.stop="changeFilter(opt.value)">{{ opt.label }}</view>
    </view>

    <view v-if="loading && !items.length" class="admin-loading">加载中…</view>

    <view v-if="items.length" class="list">
      <view role="button" tabindex="0"
        v-for="item in items"
        :key="item.id"
        class="ds-item"
        @tap="openDetail(item.id)"
       @keydown.enter.prevent.stop="openDetail(item.id)" @keydown.space.prevent.stop="openDetail(item.id)">
        <view class="ds-top">
          <view class="ds-name-wrap">
            <text class="ds-name">{{ item.name }}</text>
            <view class="ds-badge" :class="item.boundary === 'formal' ? 'bd-formal' : 'bd-review'">{{ item.boundary === 'formal' ? '正式' : '复核' }}</view>
          </view>
          <text class="ds-sync" :class="syncClass(item.syncStatus)">{{ syncText(item.syncStatus) }}</text>
        </view>
        <view class="ds-meta">
          <text class="ds-cat">{{ item.category }}</text>
          
          <text>{{ item.records.toLocaleString('en-US') }} 条</text>
          
          <text>{{ item.version }}</text>
        </view>
        <view class="ds-foot">
          <text class="ds-path">{{ item.path }}</text>
          <text class="ds-time">{{ formatTime(item.updatedAt) }}</text>
        </view>
      </view>

      <view role="button" tabindex="0" v-if="hasMore" class="load-more" @tap="loadMore" @keydown.enter.prevent.stop="loadMore" @keydown.space.prevent.stop="loadMore">加载更多</view>
      <view v-else class="list-end">已显示全部 {{ total }} 项资产</view>
    </view>

    <view v-else-if="!loading" class="empty">暂无数据资产</view>

    <admin-tabbar active="datasets" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import AdminNavbar from "@/components/admin-navbar.vue";
import AdminTabbar from "@/components/admin-tabbar.vue";
import { createDataset, getDatasets } from "@/admin/api";
import type { DatasetBoundary, DatasetItem } from "@/admin/types";

const items = ref<DatasetItem[]>([]);
const loading = ref(false);
const page = ref(1);
const pageSize = 20;
const total = ref(0);
const filter = ref<"all" | DatasetBoundary>("all");

const FILTERS = [
  { label: "全部", value: "all" as const },
  { label: "正式", value: "formal" as const },
  { label: "复核", value: "review" as const },
];

const hasMore = computed(() => items.value.length < total.value);

const showCreate = ref(false);
const uploading = ref(false);
const form = ref({ name: "", category: "", version: "", boundary: "formal" as DatasetBoundary, filePath: "", fileName: "" });

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
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function load(reset = false) {
  if (reset) page.value = 1;
  loading.value = true;
  try {
    const result = await getDatasets(page.value, pageSize);
    total.value = result.total;
    const list = result.items.filter((item) => filter.value === "all" || item.boundary === filter.value);
    items.value = reset ? list : [...items.value, ...list];
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function changeFilter(value: "all" | DatasetBoundary) {
  if (filter.value === value) return;
  filter.value = value;
  load(true);
}

function loadMore() {
  if (!hasMore.value || loading.value) return;
  page.value += 1;
  load(false);
}

function openDetail(id: string) {
  uni.navigateTo({ url: `/pages-admin/datasets/dataset-detail?id=${encodeURIComponent(id)}` });
}

function chooseFile() {
  uni.chooseFile({
    count: 1,
    type: "all",
    extension: ["csv", "json", "xlsx", "xls", "txt"],
    success: (res) => {
      const path = res.tempFilePaths?.[0] || "";
      if (!path) return;
      form.value.filePath = path;
      form.value.fileName = path.split("/").pop() || "未命名文件";
    },
    fail: () => uni.showToast({ title: "未选择文件", icon: "none" }),
  });
}

async function submitCreate() {
  const f = form.value;
  if (!f.name.trim()) {
    uni.showToast({ title: "请填写资产名称", icon: "none" });
    return;
  }
  if (!f.filePath) {
    uni.showToast({ title: "请选择数据文件", icon: "none" });
    return;
  }
  uploading.value = true;
  try {
    await createDataset({
      name: f.name.trim(),
      category: f.category.trim() || "上传资产",
      version: f.version.trim(),
      boundary: f.boundary,
      filePath: f.filePath,
    });
    uni.showToast({ title: "已上传并登记", icon: "success" });
    showCreate.value = false;
    form.value = { name: "", category: "", version: "", boundary: "formal", filePath: "", fileName: "" };
    await load(true);
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "上传失败", icon: "none" });
  } finally {
    uploading.value = false;
  }
}

onShow(() => {
  load(true);
});

onPullDownRefresh(async () => {
  await load(true);
  uni.stopPullDownRefresh();
});
</script>

<style scoped>
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */

/* Hallmark · v2.0.0 · redesign: full · shape: app screen · theme: project teal · scope: app */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V; retained familiar mobile list navigation, removed gradient cards. */
.admin-page { min-height: 100vh; background: var(--color-surface); padding-bottom: calc(140rpx + env(safe-area-inset-bottom)); box-sizing: border-box; }

.nav-add { display: flex; align-items: center; min-height: 88rpx; color: var(--color-primary); }

.nav-add-ico {
  width: 34rpx;
  height: 34rpx;
}

.nav-add-text {
  margin-left: 6rpx;
  font-size: 26rpx;
}

/* 创建卡片 */
.create-card { margin: 0; padding: 32rpx; background: var(--color-paper); border-radius: 0; box-shadow: none; border-bottom: 16rpx solid var(--color-surface); }

.create-title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--color-ink);
  margin-bottom: 18rpx;
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

.file-box {
  display: flex;
  align-items: center;
  background: var(--color-surface);
  border-radius: 12rpx;
  height: 84rpx;
  padding: 0 20rpx;
}

.file-name {
  flex: 1;
  min-width: 0;
  font-size: 25rpx;
  color: var(--color-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-placeholder {
  flex: 1;
  font-size: 25rpx;
  color: var(--color-muted);
}

.file-pick {
  flex-shrink: 0;
  font-size: 24rpx;
  color: var(--color-primary);
  padding-left: 16rpx;
}

.create-actions {
  display: flex;
  gap: 18rpx;
  margin-top: 6rpx;
}

.btn-ghost { flex: 1; background: var(--color-paper); border: 1rpx solid var(--color-rule); color: var(--color-secondary); font-size: 30rpx; border-radius: 8rpx; height: 88rpx; line-height: 88rpx; }

.btn-primary { flex: 2; background: var(--color-primary); color: var(--color-paper); border: 0; font-size: 30rpx; border-radius: 8rpx; height: 88rpx; line-height: 88rpx; box-shadow: none; }

.btn-primary[disabled] {
  opacity: 0.6;
 cursor: not-allowed;}

/* 筛选 */
.filter-row { display: flex; align-items: center; gap: 40rpx; padding: 0 32rpx; background: var(--color-paper); border-bottom: 1rpx solid var(--color-rule); overflow-x: auto; }

.filter-item { padding: 24rpx 0; min-height: 44rpx; background: transparent; border-radius: 0; border-bottom: 4rpx solid transparent; font-size: 28rpx; color: var(--color-secondary); white-space: nowrap; box-shadow: none; }

.filter-item.active { background: transparent; color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }

/* 列表 */
.list { padding: 0; background: var(--color-paper); }

.ds-item { background: var(--color-paper); border-radius: 0; padding: 32rpx; margin: 0; border-bottom: 12rpx solid var(--color-surface); box-shadow: none; }

.ds-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ds-name-wrap {
  display: flex;
  align-items: center;
  min-width: 0;
}

.ds-name {
  font-size: 29rpx;
  font-weight: 700;
  color: var(--color-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 380rpx;
}

.ds-badge {
  margin-left: 12rpx;
  font-size: 19rpx;
  padding: 3rpx 12rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
}

.bd-formal {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.bd-review {
  background: var(--color-surface);
  color: var(--color-warning);
}

.ds-sync {
  font-size: 22rpx;
  flex-shrink: 0;
  margin-left: 12rpx;
}

.st-ok { color: var(--color-success) !important; }
.st-bad { color: var(--color-danger) !important; }
.st-pending { color: var(--color-warning); }
.st-idle { color: var(--color-muted) !important; }

.ds-meta {
  margin-top: 12rpx;
  font-size: 23rpx;
  color: var(--color-secondary);
  display: flex;
  align-items: center;
}

.ds-cat {
  color: var(--color-ink);
}

.ds-dot {
  margin: 0 10rpx;
  color: var(--color-rule);
}

.ds-foot {
  margin-top: 10rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ds-path {
  flex: 1;
  min-width: 0;
  font-size: 20rpx;
  color: var(--color-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 12rpx;
}

.ds-time {
  font-size: 20rpx;
  color: var(--color-muted);
  flex-shrink: 0;
}

.load-more {
  text-align: center;
  color: var(--color-primary);
  font-size: 25rpx;
  padding: 24rpx 0;
}

.list-end {
  text-align: center;
  color: var(--color-muted);
  font-size: 22rpx;
  padding: 24rpx 0;
}

.admin-loading {
  text-align: center;
  color: var(--color-muted);
  padding: 80rpx 0;
  font-size: 26rpx;
}

.empty {
  text-align: center;
  color: var(--color-muted);
  font-size: 26rpx;
  padding: 120rpx 0;
}
</style>
