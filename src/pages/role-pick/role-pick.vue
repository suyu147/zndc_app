<template>
  <view class="page">
    <view class="search-bar card"><AppIcon name="search" size="20" />
      <input
        v-model="keyword"
        class="search-input"
        aria-label="输入岗位关键词，如：数据分析师" placeholder="输入岗位关键词，如：数据分析师"
        confirm-type="search"
        @confirm="search"
        @input="onInput"
      />
      <view class="search-btn" @tap="search" role="button" tabindex="0" @keydown.enter.prevent.stop="search" @keydown.space.prevent.stop="search">搜索</view>
    </view>

    <view v-if="keyword && !loading" class="hot card" @tap="search" role="button" tabindex="0" @keydown.enter.prevent.stop="search" @keydown.space.prevent.stop="search">
      <text class="hot-tip">搜索“{{ keyword }}”相关岗位</text>
    </view>

    <view v-if="suggestions.length" class="card">
      <view class="section-title">为你推荐（基于已选技能）</view>
      <view
        v-for="item in suggestions"
        :key="item.roleId"
        class="job-row"
        @tap="pick(item)"
       role="button" tabindex="0" @keydown.enter.prevent.stop="pick(item)" @keydown.space.prevent.stop="pick(item)">
        <view class="job-name">{{ item.roleName }}</view>
        <view class="job-sub">{{ item.score }} 分　差距 {{ (item.topGaps || []).length }} 项</view>
      </view>
    </view>

    <view v-if="loading" class="loading-text">搜索中…</view>
    <view v-else-if="!loading && keyword && jobs.length === 0 && !suggestions.length" class="empty-text">
      没有找到相关岗位，换个关键词试试
    </view>

    <view v-for="item in jobs" :key="item.id" class="card job-row" @tap="pick(item)" role="button" tabindex="0" @keydown.enter.prevent.stop="pick(item)" @keydown.space.prevent.stop="pick(item)">
      <view class="job-name">{{ item.name }}</view>
      <view class="job-sub">
        {{ item.field || "—" }}　招聘帖 {{ item.postingCount || 0 }}
        <text v-if="item.sourceCount">　{{ item.sourceCount }}</text>
      </view>
      <view class="skill-tags" v-if="(item.skills || []).length">
        <text v-for="skill in (item.skills || []).slice(0, 4)" :key="skill.name" class="tag">{{ skill.name }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onLoad, onUnload } from "@dcloudio/uni-app";
import { api } from "@/api/api";
import type { JobSummary, RecommendItem } from "@/api/types";

const PICK_EVENT = "zndc:rolePicked";

const keyword = ref("");
const jobs = ref<JobSummary[]>([]);
const suggestions = ref<RecommendItem[]>([]);
const loading = ref(false);
const skillsHint = ref<string[]>([]);
let picked = false;

onLoad((query) => {
  if (query?.skills) {
    try {
      skillsHint.value = JSON.parse(query.skills as string) as string[];
    } catch {
      skillsHint.value = [];
    }
  }
  if (skillsHint.value.length) loadRecommendations();
});

function onInput() {
  suggestions.value = [];
}

async function loadRecommendations() {
  loading.value = true;
  try {
    const result = await api.recommendRoles(skillsHint.value);
    suggestions.value = result.items;
    keyword.value = "";
  } catch {
    suggestions.value = [];
  } finally {
    loading.value = false;
  }
}

async function search() {
  const kw = keyword.value.trim();
  if (!kw) {
    uni.showToast({ title: "请输入关键词", icon: "none" });
    return;
  }
  loading.value = true;
  try {
    const result = await api.getJobs({ keyword: kw, page: 1, pageSize: 20 });
    jobs.value = result.items;
  } catch (error) {
    uni.showToast({ title: (error as Error).message, icon: "none" });
    jobs.value = [];
  } finally {
    loading.value = false;
  }
}

function pick(item: JobSummary | RecommendItem) {
  picked = true;
  const role = {
    roleId: (item as JobSummary).id || (item as RecommendItem).roleId,
    roleName: (item as JobSummary).name || (item as RecommendItem).roleName,
    field: (item as JobSummary).field || "",
    postingCount: (item as JobSummary).postingCount || 0,
    skills: ((item as JobSummary).skills || []).slice(0, 6),
  };
  uni.$emit(PICK_EVENT, role);
  uni.navigateBack();
}

onUnload(() => {
  // 未选中直接返回时，通知上一页拿到 null
  if (!picked) uni.$emit(PICK_EVENT, null);
});
</script>

<style scoped>
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */

/* Hallmark · theme: project teal · shape: app screen · redesign: full · scope: app */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V; flattened repeated panels into task sections. */
.page {
  padding-bottom: 60rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 16rpx 16rpx 28rpx;
}

.search-input {
  flex: 1;
  height: 72rpx;
  font-size: 28rpx;
}

.search-btn {
  color: var(--color-primary);
  font-size: 28rpx;
  padding: 12rpx 20rpx;
}

.hot {
  padding: 22rpx 28rpx;
}

.hot-tip {
  color: var(--color-primary);
  font-size: 28rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.job-row {
  border-bottom: 1rpx solid var(--color-rule);
  padding: 22rpx 4rpx;
}

.job-row:last-child {
  border-bottom: none;
}

.job-name {
  font-size: 30rpx;
  font-weight: 600;
}

.job-sub {
  margin-top: 8rpx;
  color: var(--color-muted);
  font-size: 24rpx;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  margin-top: 12rpx;
}

.tag {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  margin: 0 12rpx 8rpx 0;
}

.page { background:var(--color-surface); }
.card { margin: 0 0 12rpx; border-radius:0; padding: 28rpx 32rpx; box-shadow:none; }
.search-bar { position:sticky; top:0; z-index:5; gap: 16rpx; border-bottom:1rpx solid var(--color-rule); margin-bottom: 0; padding: 12rpx 24rpx; background:var(--color-paper); }
.search-input { min-width:0; background:var(--color-surface); border-radius:8rpx; padding: 0 16rpx; font-size:28rpx; }
.search-btn { font-size:27rpx; padding: 16rpx 8rpx; }
.hot { margin-bottom: 12rpx; }
.hot-tip { font-size:26rpx; }
.section-title { font-size:28rpx; color:var(--color-secondary); line-height:1.5; }
.section-title::before { display:none; }
.job-row { padding: 28rpx 0; }
.card.job-row { padding: 32rpx; }
.job-name { font-size:33rpx; font-weight:600; line-height:1.5; }
.job-sub { line-height:1.7; font-size:25rpx; color:var(--color-muted); }
.tag { border-radius:6rpx; background:var(--color-surface); color:var(--color-secondary); font-size:24rpx; padding: 8rpx 12rpx; }
input:focus-visible, [tabindex]:focus-visible { outline:2px solid var(--color-primary); outline-offset:2px; }
@media (prefers-reduced-motion:reduce) { * { transition:none !important; } }
</style>
