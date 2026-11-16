<template>
  <view class="admin-page">
    <admin-navbar title="数据质量" back />

    <view v-if="loading && !data" class="admin-loading">加载中…</view>

    <template v-if="data">
      <!-- 质量评分 -->
      <view class="hero">
        <view class="hero-score">
          <text class="hero-score-value">{{ data.score }}</text>
          <text class="hero-score-label">质量得分 / 100</text>
        </view>
        <view class="hero-status" :class="statusClass(data.status)">
          <text class="hero-status-text">{{ statusText(data.status) }}</text>
          <text class="hero-status-sub">质检规则 {{ passedCount }}/{{ data.checks.length }} 通过</text>
        </view>
      </view>

      <!-- 规则清单 -->
      <view class="card">
        <view class="sec-title"><text class="sec-main">质检规则</text><text class="sec-more">共 {{ data.checks.length }} 项</text></view>
        <view v-for="(rule, i) in data.checks" :key="i" class="rule-item">
          <view class="rule-dot" :class="rule.passed ? 'ok' : 'bad'">
            <svg v-if="rule.passed" viewBox="0 0 24 24" class="rule-ico" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            <svg v-else viewBox="0 0 24 24" class="rule-ico" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </view>
          <text class="rule-name">{{ rule.name }}</text>
        </view>
      </view>

      <!-- 图谱规模 -->
      <view class="card">
        <view class="sec-title"><text class="sec-main">图谱规模</text></view>
        <view class="kv-row"><text class="kv-key">岗位</text><text class="kv-val">{{ data.graph.jobCount }}</text></view>
        <view class="kv-row"><text class="kv-key">招聘帖</text><text class="kv-val">{{ data.graph.postingCount.toLocaleString('en-US') }}</text></view>
        <view class="kv-row"><text class="kv-key">技能</text><text class="kv-val">{{ data.graph.skillCount }}</text></view>
        <view class="kv-row"><text class="kv-key">节点</text><text class="kv-val">{{ data.graph.nodeCount.toLocaleString('en-US') }}</text></view>
        <view class="kv-row"><text class="kv-key">关系</text><text class="kv-val">{{ data.graph.relationCount.toLocaleString('en-US') }}</text></view>
        <view class="kv-row"><text class="kv-key">待复核</text><text class="kv-val">{{ data.pendingReviews }}</text></view>
      </view>

      <!-- 评测结果 -->
      <view v-if="data.evaluation" class="card">
        <view class="sec-title"><text class="sec-main">验收评测</text></view>
        <view class="kv-row"><text class="kv-key">套件</text><text class="kv-val break">{{ data.evaluation.suite || '—' }}</text></view>
        <view class="kv-row"><text class="kv-key">结果</text><text class="kv-val" :class="data.evaluation.passed ? 'ok-text' : 'bad-text'">{{ data.evaluation.passed ? '通过' : '未通过' }}</text></view>
      </view>

      <!-- 覆盖率 -->
      <view v-if="data.coverage && data.coverage.coverage != null" class="card">
        <view class="sec-title"><text class="sec-main">测试覆盖率</text></view>
        <view class="kv-row"><text class="kv-key">覆盖率</text><text class="kv-val" :class="data.coverage.passed ? 'ok-text' : 'bad-text'">{{ data.coverage.coverage }}%（门槛 {{ data.coverage.threshold }}%）</text></view>
      </view>

      <button class="export-btn" :disabled="exporting" @tap="exportJson">{{ exporting ? "生成中…" : "导出质量报告 (JSON)" }}</button>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import AdminNavbar from "@/components/admin-navbar.vue";
import AdminTabbar from "@/components/admin-tabbar.vue";
import { getQualitySummary } from "@/admin/api";
import { API_BASE } from "@/api/config";
import { readSession } from "@/api/request";
import type { QualitySummary } from "@/admin/types";

const data = ref<QualitySummary | null>(null);
const loading = ref(false);
const exporting = ref(false);

const passedCount = computed(() => (data.value?.checks || []).filter((item) => item.passed).length);

function statusText(s: string): string {
  return ({ pass: "全部质检通过", pass_with_reviews: "通过·存在待复核", failed: "质检未完全通过" } as Record<string, string>)[s] || s;
}
function statusClass(s: string): string {
  if (s === "pass") return "ok";
  if (s === "pass_with_reviews") return "warn";
  return "bad";
}

async function load() {
  loading.value = true;
  try {
    data.value = await getQualitySummary();
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function exportJson() {
  const session = readSession();
  if (!session?.accessToken) {
    uni.showToast({ title: "请先登录", icon: "none" });
    return;
  }
  exporting.value = true;
  uni.request({
    url: `${API_BASE}/quality/report?format=json`,
    header: { Authorization: `Bearer ${session.accessToken}` },
    responseType: "text",
    success: (res) => {
      try {
        const text = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
        // #ifdef H5
        const blob = new Blob([text], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `quality-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        uni.showToast({ title: "已下载报告", icon: "success" });
        // #endif
        // #ifndef H5
        uni.setClipboardData({ data: text, success: () => uni.showToast({ title: "报告内容已复制", icon: "none" }) });
        // #endif
      } catch {
        uni.showToast({ title: "导出失败", icon: "none" });
      }
    },
    fail: () => uni.showToast({ title: "导出失败，请检查网络", icon: "none" }),
    complete: () => {
      exporting.value = false;
    },
  });
}

onShow(() => {
  load();
});

onPullDownRefresh(async () => {
  await load();
  uni.stopPullDownRefresh();
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
  display: flex;
  align-items: center;
  padding: 36rpx 28rpx;
  background: linear-gradient(180deg, #15324f 0%, #1e4d75 100%);
  border-bottom-left-radius: 32rpx;
  border-bottom-right-radius: 32rpx;
}

.hero-score-value {
  font-size: 80rpx;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
}

.hero-score-label {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
}

.hero-status {
  margin-left: auto;
  text-align: right;
}

.hero-status-text {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
}

.hero-status-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 21rpx;
  color: rgba(255, 255, 255, 0.7);
}

.hero-status.ok .hero-status-text { color: #7ee2a8; }
.hero-status.warn .hero-status-text { color: #ffd98a; }
.hero-status.bad .hero-status-text { color: #ffb4b4; }

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

.rule-item {
  display: flex;
  align-items: center;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #f1f4f7;
}

.rule-item:last-child { border-bottom: none; }

.rule-dot {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rule-dot.ok { background: #e8f6ee; color: #2da44e; }
.rule-dot.bad { background: #fdeaea; color: #e5484d; }

.rule-ico {
  width: 24rpx;
  height: 24rpx;
}

.rule-name {
  margin-left: 18rpx;
  font-size: 26rpx;
  color: #1a1d24;
}

.kv-row {
  display: flex;
  align-items: baseline;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f1f4f7;
  font-size: 25rpx;
}

.kv-row:last-child { border-bottom: none; }

.kv-key {
  width: 160rpx;
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

.ok-text { color: #2da44e; }
.bad-text { color: #e5484d; }

.export-btn {
  margin: 24rpx 20rpx 0;
  background: #2b6cb0;
  color: #ffffff;
  font-size: 28rpx;
  border-radius: 14rpx;
  height: 92rpx;
  line-height: 92rpx;
}

.export-btn[disabled] { opacity: 0.6; }
</style>
