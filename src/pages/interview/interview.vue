<template>
  <view class="page tool-page">
    <!-- ============ 配置阶段 ============ -->
    <view v-if="phase === 'setup'">
      <view class="card">
        <view class="section-title">目标岗位</view>
        <view v-if="!role" class="role-empty" @tap="chooseRole" role="button" tabindex="0" @keydown.enter.prevent.stop="chooseRole()" @keydown.space.prevent.stop="chooseRole()">
          <text class="role-empty-main">点击选择模拟面试的目标岗位</text>
          <text class="role-empty-sub">AI 将围绕该岗位的真实技能要求出题</text>
        </view>
        <view v-else class="role-box">
          <view class="role-head">
            <view class="role-name">{{ role.roleName }}</view>
            <view class="role-change" @tap="chooseRole" role="button" tabindex="0" @keydown.enter.prevent.stop="chooseRole()" @keydown.space.prevent.stop="chooseRole()">更换</view>
          </view>
          <view class="role-sub">{{ role.field || "—" }}　招聘帖 {{ role.postingCount || 0 }}</view>
        </view>
      </view>

      <!-- 个人简历（可选） -->
      <view class="card">
        <view class="section-title">个人简历（可选）<text class="score-tip">上传后 AI 会结合简历追问细节</text></view>
        <view class="resume-row">
          <view class="resume-value" @tap="openResumePicker" role="button" tabindex="0" @keydown.enter.prevent.stop="openResumePicker" @keydown.space.prevent.stop="openResumePicker">
            <text v-if="selectedResumeName">{{ selectedResumeName }}</text>
            <text v-else class="resume-placeholder">不使用简历 / 点击选择</text>
          </view>
          <button class="resume-btn" :disabled="resumeBusy" @tap="uploadResumeFile">
            {{ resumeBusy ? '解析中…' : '上传新简历' }}
          </button>
        </view>
        <view v-if="resumeBusy" class="resume-bar"><view class="resume-bar-fill" :style="{ width: resumeProgress + '%' }"></view></view>
      </view>

      <view class="card">
        <view class="section-title">题目数量</view>
        <view class="count-row">
          <view
            v-for="count in [3, 6, 8]"
            :key="count"
            class="count-item"
            :class="{ active: questionCount === count }"
            @tap="questionCount = count"
           role="button" tabindex="0" @keydown.enter.prevent.stop="questionCount = count" @keydown.space.prevent.stop="questionCount = count">{{ count }} 题</view>
        </view>
      </view>

      <view class="card">
        <view class="section-title">自我介绍（可选）<text class="score-tip">100~300 字效果最佳</text></view>
        <textarea
          v-model="selfIntro"
          class="intro-input"
          aria-label="简单介绍你的背景、项目经历与求职意向，AI 会围绕它追问细节" placeholder="简单介绍你的背景、项目经历与求职意向，AI 会围绕它追问细节"
          :maxlength="1000"
        />
        <view class="intro-count">{{ selfIntro.length }} / 1000</view>
      </view>

      <view class="submit-wrap">
        <button class="btn-primary" :disabled="busy || !role" @tap="startInterview">
          {{ busy ? "正在生成题目…" : "开始面试" }}
        </button>
        <view class="submit-tip">首次生成题目约需 10~40 秒，请耐心等待</view>
      </view>
    </view>

    <!-- ============ 面试房间 ============ -->
    <view v-else-if="interview">
      <!-- 进度 -->
      <view class="card progress-card">
        <view class="progress-main">
          <text class="progress-job">{{ interview.roleName }}</text>
          <text class="progress-status" :class="interview.status === 'in_progress' ? '' : 'done'">
            {{ interview.status === "in_progress" ? "进行中" : "已结束" }}
          </text>
        </view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
        <view class="progress-text">已完成 {{ interview.currentIndex }} / {{ interview.totalCount }} 题</view>
      </view>

      <!-- 当前题目 -->
      <view v-if="current" class="card question-card">
        <view class="q-index">第 {{ current.index + 1 }} 题<text class="q-focus" v-if="current.focus">　{{ current.focus }}</text></view>
        <view class="q-text">{{ current.question }}</view>
        <textarea
          v-model="draft"
          class="answer-input"
          aria-label="输入你的回答（尽量具体，包含项目与数据）" placeholder="输入你的回答（尽量具体，包含项目与数据）"
          :maxlength="8000"
        />
        <view class="answer-count">{{ draft.length }} / 8000</view>
        <button class="btn-primary" :disabled="answerBusy || !draft.trim()" @tap="submitAnswer">
          {{ answerBusy ? "AI 评估中…" : "提交本答案" }}
        </button>
      </view>

      <!-- 全部答完：生成报告 -->
      <view v-if="!current && !report" class="card done-card">
        <view class="done-icon"><AppIcon name="check" size="32" /></view>
        <view class="done-text">全部题目已作答完毕</view>
        <view class="done-sub">AI 正在整理你的面试表现，报告会从专业能力、表达与逻辑等维度给分</view>
        <button class="btn-primary" :disabled="reportBusy" @tap="generateReport">
          {{ reportBusy ? "报告生成中，约 30~90 秒…" : "生成面试报告" }}
        </button>
      </view>

      <!-- 面试报告 -->
      <view v-if="report" class="card report-card">
        <view class="report-head">
          <view class="report-score" :style="{ color: scoreColor(report.overallScore) }">{{ Math.round(report.overallScore) }}</view>
          <view class="report-cap">综合得分 / 100</view>
        </view>
        <view class="report-summary" v-if="report.summary">{{ report.summary }}</view>

        <view class="report-section" v-if="report.dimensions && report.dimensions.length">
          <view class="report-section-title">维度评分</view>
          <view v-for="dim in report.dimensions" :key="dim.name" class="dim-row">
            <text class="dim-label">{{ dim.name }}</text>
            <view class="dim-bar"><view class="dim-fill" :style="{ width: dim.score + '%', background: scoreColor(dim.score) }"></view></view>
            <text class="dim-score">{{ Math.round(dim.score) }}</text>
          </view>
          <template v-for="dim in report.dimensions" :key="dim.name + '-comment'">
            <view v-if="dim.comment" class="dim-comment">{{ dim.name }}：{{ dim.comment }}</view>
          </template>
        </view>

        <view class="report-section" v-if="report.strengths && report.strengths.length">
          <view class="report-section-title">做得好的地方</view>
          <view v-for="(item, i) in report.strengths" :key="i" class="report-li good"> {{ item }}</view>
        </view>
        <view class="report-section" v-if="report.improvements && report.improvements.length">
          <view class="report-section-title">需要改进</view>
          <view v-for="(item, i) in report.improvements" :key="i" class="report-li bad"> {{ item }}</view>
        </view>
        <view class="report-section" v-if="report.suggestions && report.suggestions.length">
          <view class="report-section-title">提升建议</view>
          <view v-for="(item, i) in report.suggestions" :key="i" class="report-li tip">→ {{ item }}</view>
        </view>

        <button class="btn-plain" @tap="restart">再来一场（换岗位）</button>
      </view>

      <!-- 作答记录 -->
      <view class="card" v-if="answeredItems.length">
        <view class="section-title">作答记录</view>
        <view v-for="(qa, qi) in answeredItems" :key="qa.index" class="qa-item">
          <view class="qa-head" @tap="toggleQA(qi)" role="button" tabindex="0" @keydown.enter.prevent.stop="toggleQA(qi)" @keydown.space.prevent.stop="toggleQA(qi)">
            <text class="qa-no">Q{{ qa.index + 1 }}</text>
            <text class="qa-question">{{ qa.question }}</text>
            <text class="qa-score" :style="{ color: qa.score != null ? scoreColor(qa.score) : 'var(--color-muted)' }">{{ qa.score != null ? Math.round(qa.score) + " 分" : "—" }}</text>
          </view>
          <view v-if="expandedQA === qi" class="qa-body">
            <view class="qa-block"><text class="qa-k">我的回答</text><text class="qa-txt">{{ qa.answer }}</text></view>
            <view class="qa-block" v-if="qa.feedback"><text class="qa-k">AI 点评</text><text class="qa-txt">{{ qa.feedback }}</text></view>
            <view class="qa-block" v-if="qa.referencePoints && qa.referencePoints.length">
              <text class="qa-k">参考要点</text>
              <text v-for="(point, pi) in qa.referencePoints" :key="pi" class="qa-txt point">· {{ point }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { api } from "@/api/api";
import { requireLogin } from "@/api/request";
import type { InterviewReport, InterviewSessionState, ResumeResult } from "@/api/types";
import { chooseResumeFile, uploadResume, getMyResumes } from "@/api/resume";
import { pickRole, type PickedRole } from "@/utils/pickRole";

const phase = ref<"setup" | "room">("setup");
const role = ref<PickedRole | null>(null);
const questionCount = ref(6);
const selfIntro = ref("");
const busy = ref(false);

// 个人简历（可选）
const selectedResumeId = ref("");
const selectedResumeName = ref("");
const resumeBusy = ref(false);
const resumeProgress = ref(0);

const interview = ref<InterviewSessionState | null>(null);
const draft = ref("");
const answerBusy = ref(false);
const report = ref<InterviewReport | null>(null);
const reportBusy = ref(false);
const expandedQA = ref<number | null>(null);

const current = computed(() => {
  const iv = interview.value;
  if (!iv) return null;
  if (iv.currentIndex < iv.totalCount) return iv.questions[iv.currentIndex] || null;
  return null;
});

const answeredItems = computed(() =>
  (interview.value?.questions || []).filter((q) => q.answered)
);

const progressPercent = computed(() => {
  const iv = interview.value;
  if (!iv || iv.totalCount === 0) return 0;
  return Math.round((iv.currentIndex / iv.totalCount) * 100);
});

onShow(() => {
  requireLogin();
});

/** 从岗位详情进入时预填目标岗位（roleId/roleName） */
onLoad((query) => {
  const rid = query && query.roleId ? String(query.roleId) : "";
  if (!rid) return;
  const roleName = query && query.roleName ? String(query.roleName) : "该岗位";
  role.value = { roleId: rid, roleName };
  api
    .getJob(rid)
    .then((detail) => {
      if (!role.value || role.value.roleId !== rid) return;
      role.value = {
        roleId: rid,
        roleName,
        field: detail.field,
        postingCount: detail.postingCount,
      };
    })
    .catch(() => {});
});

function scoreColor(score: number): string {
  if (score >= 75) return "var(--color-success)";
  if (score >= 55) return "var(--color-warning)";
  return "var(--color-danger)";
}

async function chooseRole() {
  const picked = await pickRole();
  if (picked) role.value = picked;
}

async function uploadResumeFile() {
  let file;
  try {
    file = await chooseResumeFile();
  } catch {
    return; // 用户取消
  }
  resumeBusy.value = true;
  resumeProgress.value = 0;
  try {
    const parsed = await uploadResume(file, (p) => (resumeProgress.value = p));
    selectedResumeId.value = parsed.resumeId;
    selectedResumeName.value = parsed.fileName || "已解析简历";
    uni.showToast({ title: "简历上传成功", icon: "success" });
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "简历上传失败", icon: "none" });
  } finally {
    resumeBusy.value = false;
    resumeProgress.value = 0;
  }
}

async function openResumePicker() {
  if (resumeBusy.value) return;
  let list: ResumeResult[] = [];
  try {
    list = await getMyResumes(20);
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "简历列表读取失败", icon: "none" });
    return;
  }
  if (!list.length) {
    uni.showToast({ title: "暂无简历，请先上传", icon: "none" });
    return;
  }
  const items = list.map((r) => r.fileName || "已解析简历");
  uni.showActionSheet({
    itemList: items,
    success: (res) => {
      const item = list[res.tapIndex];
      if (item) {
        selectedResumeId.value = item.resumeId;
        selectedResumeName.value = item.fileName || "已解析简历";
      }
    },
  });
}

async function startInterview() {
  if (!role.value) {
    uni.showToast({ title: "请先选择目标岗位", icon: "none" });
    return;
  }
  busy.value = true;
  try {
    const state = await api.startInterview({
      roleId: role.value.roleId,
      questionCount: questionCount.value,
      selfIntro: selfIntro.value.trim(),
      resumeId: selectedResumeId.value || undefined,
    });
    interview.value = state;
    report.value = null;
    draft.value = "";
    expandedQA.value = null;
    phase.value = "room";
    uni.pageScrollTo({ scrollTop: 0, duration: 200 });
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "启动面试失败", icon: "none" });
  } finally {
    busy.value = false;
  }
}

async function submitAnswer() {
  const iv = interview.value;
  const q = current.value;
  if (!iv || !q) return;
  const answer = draft.value.trim();
  if (!answer) return;
  answerBusy.value = true;
  try {
    const result = await api.answerInterview(iv.id, answer);
    const target = iv.questions[q.index];
    if (target) {
      target.answered = true;
      target.answer = answer;
      target.feedback = result.feedback;
      target.score = result.score;
      target.referencePoints = result.referencePoints || [];
    }
    if (result.nextQuestion) {
      iv.currentIndex = result.nextQuestion.index;
    } else {
      iv.currentIndex = iv.totalCount;
    }
    iv.status = result.status as InterviewSessionState["status"];
    draft.value = "";
    expandedQA.value = q.index;
    uni.pageScrollTo({ scrollTop: 0, duration: 250 });
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "提交失败", icon: "none" });
  } finally {
    answerBusy.value = false;
  }
}

async function generateReport() {
  const iv = interview.value;
  if (!iv) return;
  reportBusy.value = true;
  try {
    report.value = await api.interviewReport(iv.id);
    uni.pageScrollTo({ scrollTop: 0, duration: 250 });
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "报告生成失败", icon: "none" });
  } finally {
    reportBusy.value = false;
  }
}

function toggleQA(index: number) {
  expandedQA.value = expandedQA.value === index ? null : index;
}

function restart() {
  phase.value = "setup";
  interview.value = null;
  report.value = null;
  selfIntro.value = "";
  draft.value = "";
  expandedQA.value = null;
  uni.pageScrollTo({ scrollTop: 0, duration: 200 });
}
</script>

<style scoped>
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */

/* Hallmark · theme: project teal · shape: app screen · redesign: full · scope: app */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V; flattened repeated panels into task sections. */
.page {
  padding-bottom: 60rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
}

.score-tip {
  margin-left: 16rpx;
  color: var(--color-muted);
  font-size: 24rpx;
  font-weight: 400;
}

.role-empty {
  text-align: center;
  border: 2rpx dashed var(--color-rule);
  border-radius: 16rpx;
  padding: 40rpx 20rpx;
}

.role-empty-main {
  display: block;
  color: var(--color-primary);
  font-size: 30rpx;
}

.role-empty-sub {
  display: block;
  margin-top: 10rpx;
  color: var(--color-muted);
  font-size: 24rpx;
}

.role-box {
  background: var(--color-paper);
  border-radius: 16rpx;
  padding: 24rpx;
}

.role-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.role-name {
  font-size: 34rpx;
  font-weight: 700;
}

.role-change {
  color: var(--color-primary);
  font-size: 26rpx;
}

.role-sub {
  margin-top: 8rpx;
  color: var(--color-muted);
  font-size: 24rpx;
}

/* 个人简历卡片 */
.resume-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.resume-value {
  flex: 1;
  min-width: 0;
  background: var(--color-surface);
  border-radius: 14rpx;
  height: 84rpx;
  line-height: 84rpx;
  padding: 0 24rpx;
  font-size: 27rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resume-placeholder {
  color: var(--color-muted);
}

.resume-btn {
  flex-shrink: 0;
  background: var(--color-primary);
  color: var(--color-paper);
  font-size: 26rpx;
  border-radius: 14rpx;
  height: 84rpx;
  line-height: 84rpx;
  padding: 0 28rpx;
  border: none;
}

.resume-btn[disabled] {
  opacity: 0.6;
 cursor: not-allowed;}

.resume-bar {
  margin-top: 18rpx;
  height: 12rpx;
  background: var(--color-primary-soft);
  border-radius: 6rpx;
  overflow: hidden;
}

.resume-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 6rpx;
  transition: opacity 0.16s ease;
}

.count-row {
  display: flex;
}

.count-item {
  flex: 1;
  text-align: center;
  background: var(--color-surface);
  border-radius: 14rpx;
  padding: 18rpx 0;
  font-size: 28rpx;
  color: var(--color-secondary);
  margin-right: 16rpx;
}

.count-item:last-child {
  margin-right: 0;
}

.count-item.active {
  background: var(--color-primary);
  color: var(--color-paper);
  font-weight: 600;
}

.intro-input {
  width: 100%;
  box-sizing: border-box;
  min-height: 180rpx;
  background: var(--color-surface);
  border-radius: 14rpx;
  padding: 20rpx;
  font-size: 27rpx;
  line-height: 1.6;
}

.intro-count,
.answer-count {
  text-align: right;
  color: var(--color-muted);
  font-size: 22rpx;
  margin-top: 8rpx;
}

.submit-wrap {
  margin: 30rpx 24rpx;
}

.submit-tip {
  text-align: center;
  color: var(--color-muted);
  font-size: 24rpx;
  margin-top: 16rpx;
}

.progress-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-job {
  font-size: 32rpx;
  font-weight: 700;
}

.progress-status {
  font-size: 24rpx;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  padding: 6rpx 18rpx;
  border-radius: 20rpx;
}

.progress-status.done {
  color: var(--color-success);
  background: var(--color-primary-soft);
}

.progress-bar {
  margin-top: 20rpx;
  height: 14rpx;
  background: var(--color-primary-soft);
  border-radius: 7rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 7rpx;
  transition: opacity 0.16s ease;
}

.progress-text {
  margin-top: 12rpx;
  text-align: right;
  color: var(--color-muted);
  font-size: 24rpx;
}

.q-index {
  color: var(--color-primary);
  font-size: 26rpx;
  font-weight: 600;
}

.q-focus {
  color: var(--color-warning);
  font-weight: 400;
}

.q-text {
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1.5;
  margin: 20rpx 0;
}

.answer-input {
  width: 100%;
  box-sizing: border-box;
  min-height: 220rpx;
  background: var(--color-surface);
  border-radius: 14rpx;
  padding: 20rpx;
  font-size: 28rpx;
  line-height: 1.6;
  margin-bottom: 20rpx;
}

.done-card {
  text-align: center;
  padding: 50rpx 30rpx;
}

.done-icon {
  font-size: 90rpx;
}

.done-text {
  font-size: 32rpx;
  font-weight: 700;
  margin-top: 12rpx;
}

.done-sub {
  color: var(--color-muted);
  font-size: 26rpx;
  margin: 16rpx 0 30rpx;
  line-height: 1.6;
}

.report-head {
  text-align: center;
  padding-bottom: 20rpx;
}

.report-score {
  font-size: 100rpx;
  font-weight: 800;
  line-height: 1.1;
}

.report-cap {
  color: var(--color-muted);
  font-size: 24rpx;
}

.report-summary {
  background: var(--color-paper);
  border-radius: 14rpx;
  padding: 20rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--color-ink);
}

.report-section {
  margin-top: 26rpx;
}

.report-section-title {
  font-size: 28rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}

.dim-row {
  display: flex;
  align-items: center;
  padding: 10rpx 0;
}

.dim-label {
  width: 170rpx;
  font-size: 25rpx;
}

.dim-bar {
  flex: 1;
  height: 14rpx;
  background: var(--color-primary-soft);
  border-radius: 7rpx;
  overflow: hidden;
  margin: 0 14rpx;
}

.dim-fill {
  height: 100%;
  border-radius: 7rpx;
}

.dim-score {
  width: 56rpx;
  text-align: right;
  font-weight: 600;
}

.dim-comment {
  margin-top: 10rpx;
  color: var(--color-secondary);
  font-size: 24rpx;
  line-height: 1.5;
}

.report-li {
  font-size: 26rpx;
  line-height: 1.6;
  padding: 8rpx 0;
}

.report-li.good {
  color: var(--color-success);
}

.report-li.bad {
  color: var(--color-danger);
}

.report-li.tip {
  color: var(--color-warning);
}

.qa-item {
  border-bottom: 1rpx solid var(--color-rule);
  padding: 16rpx 0;
}

.qa-item:last-child {
  border-bottom: none;
}

.qa-head {
  display: flex;
  align-items: center;
}

.qa-no {
  color: var(--color-primary);
  font-weight: 700;
  margin-right: 12rpx;
  font-size: 26rpx;
}

.qa-question {
  flex: 1;
  font-size: 26rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qa-score {
  font-weight: 700;
  font-size: 26rpx;
  margin-left: 12rpx;
}

.qa-body {
  margin-top: 14rpx;
  background: var(--color-paper);
  border-radius: 12rpx;
  padding: 16rpx;
}

.qa-block {
  margin-top: 10rpx;
}

.qa-block:first-child {
  margin-top: 0;
}

.qa-k {
  display: block;
  color: var(--color-secondary);
  font-size: 22rpx;
  margin-bottom: 4rpx;
}

.qa-txt {
  display: block;
  font-size: 25rpx;
  line-height: 1.6;
  word-break: break-all;
}

.qa-txt.point {
  margin-top: 4rpx;
}

.btn-plain {
  margin-top: 26rpx;
  background: transparent;
  color: var(--color-muted);
  border-radius: 48rpx;
  font-size: 30rpx;
  height: 92rpx;
  line-height: 92rpx;
  text-align: center;
  border: 1rpx solid var(--color-rule);
  width: 100%;
}

.tool-page { background:var(--color-surface); padding-top: 0; padding-bottom: 40rpx; }
.tool-page .card { margin: 0 0 16rpx; padding: 32rpx; border-radius:0; box-shadow:none; background:var(--color-paper); }
.section-title { display:flex; flex-wrap:wrap; align-items:baseline; gap: 8rpx 16rpx; font-size:30rpx; line-height:1.5; font-weight:600; margin-bottom: 24rpx; }
.section-title::before { display:none; }
.role-empty { text-align:left; border:0; border-bottom:1rpx solid var(--color-rule); padding: 16rpx 0 24rpx; border-radius:0; }
.role-empty-main { display:block; color:var(--color-ink); font-size:30rpx; line-height:1.5; }
.role-empty-sub { color:var(--color-muted); font-size:25rpx; line-height:1.6; }
.role-box, .resume-applied { padding: 0; background:transparent; border-radius:0; }
.role-name { color:var(--color-ink); font-size:34rpx; font-weight:600; min-width:0; overflow-wrap:anywhere; }
.role-head { gap: 20rpx; }
.role-change { flex-shrink:0; min-height:72rpx; display:flex; align-items:center; }
.role-sub, .score-tip { font-size:25rpx; color:var(--color-muted); line-height:1.6; }
.score-tip { display:block; width:100%; margin: 0; }
.recommend-link { text-align:left; font-size:26rpx; padding: 12rpx 0; }
.resume-btn, .resume-btn.ghost { background:var(--color-surface); color:var(--color-primary); border-radius:8rpx; border:0; font-size:26rpx; padding: 0 16rpx; }
.resume-btn::after { border:0; }
.resume-row { flex-wrap:wrap; }
.resume-value { min-width:260rpx; padding: 0 16rpx; border-radius:8rpx; background:var(--color-surface); }
.resume-actions { flex-wrap:wrap; }
.resume-file { line-height:1.6; }
.tag { border-radius:6rpx; padding: 10rpx 16rpx; font-size:25rpx; line-height:1.4; }
.tag-add { background:var(--color-surface); color:var(--color-secondary); }
.tag-on { background:var(--color-primary-soft); color:var(--color-primary); }
.tag-plan, .tag-cert { background:var(--color-surface); color:var(--color-secondary); }
.add-input, .intro-input, .answer-input { border-radius:8rpx; font-size:28rpx; line-height:1.65; background:var(--color-surface); }
.add-input { min-width:0; }
.add-btn { background:transparent; padding: 20rpx 8rpx; font-size:27rpx; }
.submit-wrap, .action-wrap { margin: 32rpx; }
.submit-tip { text-align:left; line-height:1.6; font-size:25rpx; }
.tool-page .btn-primary, .tool-page .btn-secondary, .tool-page .btn-plain { border-radius:8rpx; font-size:29rpx; height:88rpx; line-height:88rpx; box-shadow:none; }
.score-card { gap: 24rpx; align-items:flex-start; }
.score-left { width:180rpx; padding-top: 4rpx; text-align:left; }
.score-num { font-size:72rpx; font-weight:600; }
.score-right { padding-left: 24rpx; min-width:0; }
.score-role { font-size:32rpx; line-height:1.5; }
.score-cap { font-size:24rpx; margin-top: 8rpx; }
.score-meta { color:var(--color-secondary); }
.dim-bar, .progress-bar, .resume-bar { background:var(--color-surface); height:8rpx; border-radius:0; }
.dim-fill, .progress-fill, .resume-bar-fill { border-radius:0; background:var(--color-primary); transition:none; }
.stage { border:0; border-top:1rpx solid var(--color-rule); border-radius:0; margin-top: 20rpx; }
.stage-head { padding: 20rpx 0; gap: 16rpx; background:transparent; }
.stage-body { padding: 20rpx 0; }
.stage-title { line-height:1.7; min-width:0; }
.stage-no { background:transparent; color:var(--color-primary); border-radius:0; width:auto; }
.stage-duration { display:block; color:var(--color-muted); }
.count-row { gap: 16rpx; }
.count-item { border:1rpx solid var(--color-rule); background:var(--color-paper); border-radius:8rpx; margin-right: 0; }
.count-item.active { background:var(--color-primary-soft); color:var(--color-primary); border-color:var(--color-primary); }
.q-index { color:var(--color-secondary); }
.q-focus { color:var(--color-muted); }
.q-text { font-size:34rpx; font-weight:600; line-height:1.65; }
.progress-text { text-align:left; }
.done-card { text-align:left; }
.done-icon { color:var(--color-primary); display:flex; }
.done-sub { line-height:1.7; color:var(--color-secondary); }
.report-head { display:flex; text-align:left; align-items:baseline; gap: 20rpx; border-bottom:1rpx solid var(--color-rule); }
.report-score { font-size:76rpx; font-weight:600; }
.report-summary, .qa-body { padding: 20rpx 0; background:transparent; border-radius:0; }
.report-section { padding-top: 24rpx; border-top:1rpx solid var(--color-rule); }
.report-li.good, .report-li.bad, .report-li.tip { color:var(--color-secondary); }
.qa-question { min-width:0; }
.qa-k { font-size:25rpx; }
.qa-txt { font-size:27rpx; }
button:focus-visible, input:focus-visible, textarea:focus-visible, [tabindex]:focus-visible { outline:2px solid var(--color-primary); outline-offset:2px; }
@media (max-width:360px) { .tool-page .card { padding: 28rpx; } .dim-label { width:140rpx; } .resume-actions { flex-direction:column; } .score-card { gap: 16rpx; } .score-left { width:150rpx; } }
@media (prefers-reduced-motion:reduce) { * { animation:none !important; transition:none !important; scroll-behavior:auto !important; } }
</style>
