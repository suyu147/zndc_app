<template>
  <view class="hr-page">
    <hr-navbar title="我的" />

    <!-- 企业信息头部 -->
    <view class="comp-header">
      <view class="comp-top">
        <hr-avatar :name="company.logoText" :size="104" square />
        <view class="comp-info">
          <view class="comp-name-row">
            <text class="comp-name">{{ company.name }}</text>
            <view v-if="company.verified" class="comp-verified">
              <svg aria-hidden="true" viewBox="0 0 24 24" class="comp-verified-ico" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <text class="comp-verified-text">已认证</text>
            </view>
          </view>
          <text class="comp-tags">{{ company.industry }}　{{ company.scale }}</text>
          <text class="comp-city">{{ company.city }}</text>
        </view>
      </view>
    </view>

    <!-- 数据条 -->
    <view class="stat-strip">
      <view class="stat-cell" @tap="goPositions" role="button" tabindex="0" @keydown.enter.prevent.stop="goPositions" @keydown.space.prevent.stop="goPositions">
        <text class="stat-value">{{ openPositions }}</text>
        <text class="stat-label">在招职位</text>
      </view>
      <view class="stat-cell" @tap="goCandidates" role="button" tabindex="0" @keydown.enter.prevent.stop="goCandidates" @keydown.space.prevent.stop="goCandidates">
        <text class="stat-value">{{ company.talentPool }}</text>
        <text class="stat-label">人才库</text>
      </view>
      <view class="stat-cell" @tap="goInterviews" role="button" tabindex="0" @keydown.enter.prevent.stop="goInterviews" @keydown.space.prevent.stop="goInterviews">
        <text class="stat-value">{{ interviewTotal }}</text>
        <text class="stat-label">累计面试</text>
      </view>
    </view>

    <!-- 招聘管理 -->
    <view class="hr-card">
      <view class="hr-sec-title"><text class="hr-sec-title-main">招聘管理</text></view>
      <view v-for="item in MANAGE_ITEMS" :key="item.key" class="cell" @tap="item.action()" role="button" tabindex="0" @keydown.enter.prevent.stop="item.action()" @keydown.space.prevent.stop="item.action()">
        <view class="cell-icon">
          <svg aria-hidden="true"
            v-if="item.key === 'interview'"
            viewBox="0 0 24 24"
            class="cell-ico"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="5" width="18" height="16" rx="2.6" />
            <path d="M3 10h18M8 3v4M16 3v4" />
            <path d="M8.6 14.4l2 2 4-4" />
          </svg>
          <svg aria-hidden="true"
            v-if="item.key === 'message'"
            viewBox="0 0 24 24"
            class="cell-ico"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 11.6a7.8 7.8 0 0 1-7.8 7.8H8.4L4 22l1.3-4.2A7.8 7.8 0 1 1 21 11.6z" />
          </svg>
          <svg aria-hidden="true"
            v-if="item.key === 'report'"
            viewBox="0 0 24 24"
            class="cell-ico"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
            <path d="M9 13.5h6M9 17h4" />
          </svg>
        </view>
        <view class="cell-main">
          <text class="cell-label">{{ item.label }}</text>
        </view>
        <view v-if="item.key === 'message' && unreadTotal" class="cell-badge">{{ unreadTotal }}</view>
        <text class="cell-arrow">›</text>
      </view>
    </view>

    <!-- 企业与团队 -->
    <view class="hr-card">
      <view class="hr-sec-title"><text class="hr-sec-title-main">企业与团队</text></view>

      <view class="cell" @tap="expandedInfo = !expandedInfo" role="button" tabindex="0" @keydown.enter.prevent.stop="expandedInfo = !expandedInfo" @keydown.space.prevent.stop="expandedInfo = !expandedInfo">
        <view class="cell-icon">
          <svg aria-hidden="true" viewBox="0 0 24 24" class="cell-ico" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path d="M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-4h4v4" />
          </svg>
        </view>
        <view class="cell-main"><text class="cell-label">公司信息</text></view>
        <text class="cell-arrow" :class="{ 'cell-arrow--open': expandedInfo }">›</text>
      </view>
      <view v-if="expandedInfo" class="panel">
        <view class="panel-intro">{{ company.intro }}</view>
        <view class="hr-row">
          <text class="hr-row-label">所属行业</text>
          <text class="hr-row-value">{{ company.industry }}</text>
        </view>
        <view class="hr-row">
          <text class="hr-row-label">企业规模</text>
          <text class="hr-row-value">{{ company.scale }}</text>
        </view>
        <view class="hr-row">
          <text class="hr-row-label">所在城市</text>
          <text class="hr-row-value">{{ company.city }}</text>
        </view>
        <view class="hr-row">
          <text class="hr-row-label">认证状态</text>
          <text class="hr-row-value">{{ company.verified ? "已完成企业认证" : "未认证" }}</text>
        </view>
      </view>

      <view class="cell" @tap="expandedTeam = !expandedTeam" role="button" tabindex="0" @keydown.enter.prevent.stop="expandedTeam = !expandedTeam" @keydown.space.prevent.stop="expandedTeam = !expandedTeam">
        <view class="cell-icon">
          <svg aria-hidden="true" viewBox="0 0 24 24" class="cell-ico" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15.4 20.5v-1.6a3.9 3.9 0 0 0-3.9-3.9H6.4a3.9 3.9 0 0 0-3.9 3.9v1.6" />
            <circle cx="8.95" cy="7.4" r="3.6" />
            <path d="M21.5 20.5v-1.6a3.9 3.9 0 0 0-2.9-3.77" />
            <path d="M16.4 3.9a3.6 3.6 0 0 1 0 6.98" />
          </svg>
        </view>
        <view class="cell-main"><text class="cell-label">团队成员</text></view>
        <text class="cell-arrow" :class="{ 'cell-arrow--open': expandedTeam }">›</text>
      </view>
      <view v-if="expandedTeam" class="panel">
        <view v-for="member in team" :key="member.id" class="member">
          <hr-avatar :name="member.name" :size="64" />
          <view class="member-info">
            <view class="member-name-row">
              <text class="member-name">{{ member.name }}</text>
              <view v-if="member.active" class="member-dot"></view>
            </view>
            <text class="member-role">{{ member.role }}　在办 {{ member.handling }} 个职位</text>
          </view>
        </view>
      </view>

      <view class="cell" @tap="comingSoon('招聘设置')" role="button" tabindex="0" @keydown.enter.prevent.stop="comingSoon('招聘设置')" @keydown.space.prevent.stop="comingSoon('招聘设置')">
        <view class="cell-icon">
          <svg aria-hidden="true" viewBox="0 0 24 24" class="cell-ico" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 7h9M18 7h2M4 17h2M10 17h10" />
            <circle cx="15.5" cy="7" r="2.3" />
            <circle cx="8.5" cy="17" r="2.3" />
          </svg>
        </view>
        <view class="cell-main"><text class="cell-label">招聘设置</text></view>
        <text class="cell-hint">演示版</text>
        <text class="cell-arrow">›</text>
      </view>
    </view>

    <!-- 其他 -->
    <view class="hr-card">
      <view class="cell" @tap="onSwitchPortal" role="button" tabindex="0" @keydown.enter.prevent.stop="onSwitchPortal" @keydown.space.prevent.stop="onSwitchPortal">
        <view class="cell-icon">
          <svg aria-hidden="true" viewBox="0 0 24 24" class="cell-ico" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 8h13l-3-3M20 16H7l3 3" />
          </svg>
        </view>
        <view class="cell-main"><text class="cell-label">切换到求职端</text></view>
        <text class="cell-arrow">›</text>
      </view>

      <view class="cell" @tap="onReset" role="button" tabindex="0" @keydown.enter.prevent.stop="onReset" @keydown.space.prevent.stop="onReset">
        <view class="cell-icon">
          <svg aria-hidden="true" viewBox="0 0 24 24" class="cell-ico" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
            <path d="M3.2 4.4v4.2h4.2" />
          </svg>
        </view>
        <view class="cell-main"><text class="cell-label">重置演示数据</text></view>
        <text class="cell-arrow">›</text>
      </view>

      <view class="cell cell--last" @tap="onLogout" role="button" tabindex="0" @keydown.enter.prevent.stop="onLogout" @keydown.space.prevent.stop="onLogout">
        <view class="cell-icon">
          <svg aria-hidden="true" viewBox="0 0 24 24" class="cell-ico" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
            <path d="M10 17l-5-5 5-5M5 12h10" />
          </svg>
        </view>
        <view class="cell-main"><text class="cell-label cell-label--danger">退出登录</text></view>
        <text class="cell-arrow">›</text>
      </view>
    </view>

    <view class="version">职能洞察 HR 端　演示版本 v1.0.0</view>

    <hr-tabbar active="mine" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import HrNavbar from "@/components/hr-navbar.vue";
import HrTabbar from "@/components/hr-tabbar.vue";
import HrAvatar from "@/components/hr-avatar.vue";
import { hrState, resetHrState } from "@/hr/store";
import { clearSession } from "@/api/request";
import { switchPortal } from "@/utils/portal";

const company = computed(() => hrState.company);
const team = computed(() => hrState.team);

const expandedInfo = ref(false);
const expandedTeam = ref(false);

const openPositions = computed(() => hrState.positions.filter((item) => item.status === "open").length);
const interviewTotal = computed(() => hrState.interviews.length);
const unreadTotal = computed(() => hrState.messages.reduce((sum, item) => sum + item.unread, 0));

const MANAGE_ITEMS = [
  {
    key: "interview",
    label: "面试管理",
    bg: "var(--color-surface)",
    color: "var(--color-primary)",
    action: () => uni.navigateTo({ url: "/pages-hr/interviews/interviews" }),
  },
  {
    key: "message",
    label: "沟通消息",
    bg: "var(--color-surface)",
    color: "var(--color-primary)",
    action: () => uni.navigateTo({ url: "/pages-hr/messages/messages" }),
  },
  {
    key: "report",
    label: "数据报表",
    bg: "var(--color-surface)",
    color: "var(--color-primary)",
    action: () => comingSoon("数据报表"),
  },
];

function goPositions() {
  uni.reLaunch({ url: "/pages-hr/positions/positions" });
}

function goCandidates() {
  uni.reLaunch({ url: "/pages-hr/candidates/candidates" });
}

function goInterviews() {
  uni.navigateTo({ url: "/pages-hr/interviews/interviews" });
}

function comingSoon(name: string) {
  uni.showToast({ title: `${name}　演示版暂未开放`, icon: "none" });
}

function onSwitchPortal() {
  uni.showModal({
    title: "切换端",
    content: "将切换到「职能洞察」求职端，可随时切回 HR 端。",
    success: (res) => {
      if (res.confirm) switchPortal();
    },
  });
}

function onReset() {
  uni.showModal({
    title: "重置演示数据",
    content: "将清空当前所有操作记录，恢复为初始演示数据。",
    success: (res) => {
      if (!res.confirm) return;
      resetHrState();
      expandedInfo.value = false;
      expandedTeam.value = false;
      uni.showToast({ title: "已重置", icon: "success" });
    },
  });
}

function onLogout() {
  uni.showModal({
    title: "退出登录",
    content: "确认退出当前招聘官账号？",
    success: (res) => {
      if (!res.confirm) return;
      clearSession();
      uni.reLaunch({ url: "/pages/login/login" });
    },
  });
}
</script>

<style scoped>
/* Hallmark　shape: app screen　genre: modern-minimal　theme: brand　redesign: full　nav: kept　signature: task list　states: existing　v2.0.0 */
/* Hallmark　pre-emit critique: P4 H4 E4 S4 R5 V3　weakest: V, shared tokens preserve distinct task layouts */
/* ---------- 企业头部 ---------- */
.comp-header {
  margin: 20rpx 20rpx 0;
  padding: 30rpx 26rpx;
  border-radius: 18rpx;
  background: var(--color-primary);
  box-shadow: none;
}

.comp-top {
  display: flex;
  align-items: center;
}

.comp-info {
  flex: 1;
  min-width: 0;
  margin-left: 24rpx;
}

.comp-name-row {
  display: flex;
  align-items: center;
}

.comp-name {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--color-paper);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 320rpx;
}

.comp-verified {
  margin-left: 14rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 3rpx 12rpx;
  border-radius: 20rpx;
  background: var(--color-rule);
  color: var(--color-paper);
}

.comp-verified-ico {
  width: 22rpx;
  height: 22rpx;
}

.comp-verified-text {
  margin-left: 4rpx;
  font-size: 19rpx;
}

.comp-tags {
  display: block;
  margin-top: 12rpx;
  font-size: 23rpx;
  color: var(--color-paper);
}

.comp-city {
  display: block;
  margin-top: 6rpx;
  font-size: 21rpx;
  color: var(--color-paper);
}

/* ---------- 数据条 ---------- */
.stat-strip {
  display: flex;
  margin: 20rpx 20rpx 0;
  background: var(--color-paper);
  border-radius: 18rpx;
  padding: 26rpx 0;
  box-shadow: none;
}

.stat-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-right: 1rpx solid var(--color-surface);
}

.stat-cell:last-child {
  border-right: none;
}

.stat-value {
  font-size: 42rpx;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
}

.stat-label {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: var(--color-secondary);
}

/* ---------- 功能单元格 ---------- */
.cell {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--color-surface);
}

.cell--last,
.cell:last-child {
  border-bottom: none;
}

.cell-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cell-ico {
  width: 34rpx;
  height: 34rpx;
}

.cell-main {
  flex: 1;
  min-width: 0;
  margin-left: 22rpx;
}

.cell-label {
  font-size: 28rpx;
  color: var(--color-ink);
}

.cell-label--danger {
  color: var(--color-danger);
}

.cell-hint {
  font-size: 21rpx;
  color: var(--color-rule);
  margin-right: 14rpx;
}

.cell-badge {
  min-width: 34rpx;
  height: 34rpx;
  padding: 0 9rpx;
  box-sizing: border-box;
  border-radius: 17rpx;
  background: var(--color-danger);
  color: var(--color-paper);
  font-size: 20rpx;
  line-height: 34rpx;
  text-align: center;
  font-weight: 600;
  margin-right: 14rpx;
}

.cell-arrow {
  color: var(--color-rule);
  font-size: 34rpx;
  line-height: 1;
  transition: transform 0.2s ease;
}

.cell-arrow--open {
  transform: rotate(90deg);
}

/* ---------- 展开面板 ---------- */
.panel {
  padding: 4rpx 0 20rpx;
  border-bottom: 1rpx solid var(--color-surface);
}

.panel-intro {
  font-size: 23rpx;
  color: var(--color-secondary);
  line-height: 1.7;
  padding: 6rpx 0 18rpx;
  border-bottom: 1rpx solid var(--color-surface);
}

.member {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
}

.member-info {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
}

.member-name-row {
  display: flex;
  align-items: center;
}

.member-name {
  font-size: 27rpx;
  font-weight: 600;
  color: var(--color-ink);
}

.member-dot {
  margin-left: 12rpx;
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: var(--color-success);
}

.member-role {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--color-muted);
}

.version {
  margin-top: 40rpx;
  text-align: center;
  font-size: 21rpx;
  color: var(--color-rule);
}

.comp-header { margin: 0; padding: 32rpx; border-radius: 0; background: var(--color-paper); }
.comp-name { color: var(--color-ink); font-size: 34rpx; }
.comp-tags, .comp-city { color: var(--color-secondary); font-size: 24rpx; }
.comp-verified { color: var(--color-primary); background: var(--color-primary-soft); }
.stat-strip { margin: 0; padding: 28rpx 0; border-radius: 0; }
.stat-value { color: var(--color-ink); font-size: 38rpx; font-weight: 600; }
.cell-icon { background: transparent; color: var(--color-secondary); width: 48rpx; height: 48rpx; border-radius: 0; }
.cell-label { font-size: 29rpx; }
.panel { background: transparent; border-radius: 0; padding-left: 0; padding-right: 0; }

</style>
