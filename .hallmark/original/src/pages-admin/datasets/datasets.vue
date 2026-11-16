<template>
  <view class="admin-page">
    <admin-navbar title="数据资产">
      <template #right>
        <view class="nav-add" @tap="showCreate = !showCreate">
          <svg viewBox="0 0 24 24" class="nav-add-ico" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          <text class="nav-add-text">上传</text>
        </view>
      </template>
    </admin-navbar>

    <!-- 上传资产表单 -->
    <view v-if="showCreate" class="create-card">
      <view class="create-title">登记新数据资产</view>
      <view class="field">
        <text class="field-label">资产名称 *</text>
        <input v-model="form.name" class="input" placeholder="如：2026Q3_岗位招聘帖" :maxlength="60" />
      </view>
      <view class="field">
        <text class="field-label">分类</text>
        <input v-model="form.category" class="input" placeholder="如：01_招聘帖" :maxlength="60" />
      </view>
      <view class="field">
        <text class="field-label">版本号</text>
        <input v-model="form.version" class="input" placeholder="留空自动生成" :maxlength="40" />
      </view>
      <view class="field">
        <text class="field-label">使用边界</text>
        <view class="seg">
          <view class="seg-item" :class="{ active: form.boundary === 'formal' }" @tap="form.boundary = 'formal'">正式</view>
          <view class="seg-item" :class="{ active: form.boundary === 'review' }" @tap="form.boundary = 'review'">复核</view>
        </view>
      </view>
      <view class="field">
        <text class="field-label">数据文件 *</text>
        <view class="file-box" @tap="chooseFile">
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
      <view
        v-for="opt in FILTERS"
        :key="opt.value"
        class="filter-item"
        :class="{ active: filter === opt.value }"
        @tap="changeFilter(opt.value)"
      >{{ opt.label }}</view>
    </view>

    <view v-if="loading && !items.length" class="admin-loading">加载中…</view>

    <view v-if="items.length" class="list">
      <view
        v-for="item in items"
        :key="item.id"
        class="ds-item"
        @tap="openDetail(item.id)"
      >
        <view class="ds-top">
          <view class="ds-name-wrap">
            <text class="ds-name">{{ item.name }}</text>
            <view class="ds-badge" :class="item.boundary === 'formal' ? 'bd-formal' : 'bd-review'">{{ item.boundary === 'formal' ? '正式' : '复核' }}</view>
          </view>
          <text class="ds-sync" :class="syncClass(item.syncStatus)">{{ syncText(item.syncStatus) }}</text>
        </view>
        <view class="ds-meta">
          <text class="ds-cat">{{ item.category }}</text>
          <text class="ds-dot">·</text>
          <text>{{ item.records.toLocaleString('en-US') }} 条</text>
          <text class="ds-dot">·</text>
          <text>{{ item.version }}</text>
        </view>
        <view class="ds-foot">
          <text class="ds-path">{{ item.path }}</text>
          <text class="ds-time">{{ formatTime(item.updatedAt) }}</text>
        </view>
      </view>

      <view v-if="hasMore" class="load-more" @tap="loadMore">加载更多</view>
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
.admin-page {
  min-height: 100vh;
  background: #f5f6f8;
  padding-bottom: 140rpx;
  box-sizing: border-box;
}

.nav-add {
  display: flex;
  align-items: center;
  color: #ffffff;
}

.nav-add-ico {
  width: 34rpx;
  height: 34rpx;
}

.nav-add-text {
  margin-left: 6rpx;
  font-size: 26rpx;
}

/* 创建卡片 */
.create-card {
  margin: 20rpx;
  background: #ffffff;
  border-radius: 18rpx;
  padding: 26rpx;
  box-shadow: 0 2rpx 12rpx rgba(15, 40, 45, 0.06);
}

.create-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1a1d24;
  margin-bottom: 18rpx;
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

.file-box {
  display: flex;
  align-items: center;
  background: #f5f6f8;
  border-radius: 12rpx;
  height: 84rpx;
  padding: 0 20rpx;
}

.file-name {
  flex: 1;
  min-width: 0;
  font-size: 25rpx;
  color: #1a1d24;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-placeholder {
  flex: 1;
  font-size: 25rpx;
  color: #9ca3af;
}

.file-pick {
  flex-shrink: 0;
  font-size: 24rpx;
  color: #2b6cb0;
  padding-left: 16rpx;
}

.create-actions {
  display: flex;
  gap: 18rpx;
  margin-top: 6rpx;
}

.btn-ghost {
  flex: 1;
  background: #f1f4f7;
  color: #374151;
  font-size: 28rpx;
  border-radius: 12rpx;
  height: 84rpx;
  line-height: 84rpx;
}

.btn-primary {
  flex: 2;
  background: #2b6cb0;
  color: #ffffff;
  font-size: 28rpx;
  border-radius: 12rpx;
  height: 84rpx;
  line-height: 84rpx;
}

.btn-primary[disabled] {
  opacity: 0.6;
}

/* 筛选 */
.filter-row {
  display: flex;
  gap: 16rpx;
  padding: 20rpx 20rpx 0;
}

.filter-item {
  padding: 10rpx 26rpx;
  background: #ffffff;
  border-radius: 28rpx;
  font-size: 24rpx;
  color: #6b7280;
  box-shadow: 0 2rpx 8rpx rgba(15, 40, 45, 0.03);
}

.filter-item.active {
  background: #2b6cb0;
  color: #ffffff;
  font-weight: 600;
}

/* 列表 */
.list {
  padding: 16rpx 20rpx 0;
}

.ds-item {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 10rpx rgba(15, 40, 45, 0.04);
}

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
  color: #1a1d24;
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
  background: #e8f0fa;
  color: #2b6cb0;
}

.bd-review {
  background: #fff3e0;
  color: #d97706;
}

.ds-sync {
  font-size: 22rpx;
  flex-shrink: 0;
  margin-left: 12rpx;
}

.st-ok { color: #2da44e; }
.st-bad { color: #e5484d; }
.st-pending { color: #f59e0b; }
.st-idle { color: #9ca3af; }

.ds-meta {
  margin-top: 12rpx;
  font-size: 23rpx;
  color: #6b7280;
  display: flex;
  align-items: center;
}

.ds-cat {
  color: #374151;
}

.ds-dot {
  margin: 0 10rpx;
  color: #cbd5e1;
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
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 12rpx;
}

.ds-time {
  font-size: 20rpx;
  color: #9ca3af;
  flex-shrink: 0;
}

.load-more {
  text-align: center;
  color: #2b6cb0;
  font-size: 25rpx;
  padding: 24rpx 0;
}

.list-end {
  text-align: center;
  color: #9ca3af;
  font-size: 22rpx;
  padding: 24rpx 0;
}

.admin-loading {
  text-align: center;
  color: #8a94a6;
  padding: 80rpx 0;
  font-size: 26rpx;
}

.empty {
  text-align: center;
  color: #9ca3af;
  font-size: 26rpx;
  padding: 120rpx 0;
}
</style>
