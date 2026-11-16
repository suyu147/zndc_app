<template>
  <view class="page">
    <!-- ============ 表单区 ============ -->
    <view v-if="phase === 'form'">
      <!-- 目标岗位 -->
      <view class="card">
        <view class="section-title">① 目标岗位</view>
        <view v-if="!role" class="role-empty" @tap="chooseRole">
          <text class="role-empty-main">点击选择要诊断的目标岗位</text>
          <text class="role-empty-sub">支持关键词搜索，已选技能时会优先展示推荐岗位</text>
        </view>
        <view v-else class="role-box">
          <view class="role-head">
            <view class="role-name">{{ role.roleName }}</view>
            <view class="role-change" @tap="chooseRole">更换</view>
          </view>
          <view class="role-sub">{{ role.field || "—" }} · 招聘帖 {{ role.postingCount || 0 }}</view>
          <view v-if="pool.length" class="skill-tags">
            <view
              v-for="skill in pool"
              :key="skill.name"
              class="tag tag-add"
              @tap="toggleSkill(skill.name)"
            >＋{{ skill.name }}</view>
          </view>
          <view v-else class="role-empty-sub">该岗位暂无可选高频技能，请直接添加下方技能</view>
        </view>
        <view v-if="mySkills.length" class="recommend-link" @tap="chooseRole(true)">按我的技能换一批推荐岗位 →</view>
      </view>

      <!-- 个人简历（可选） -->
      <view class="card">
        <view class="section-title">个人简历（可选）<text class="score-tip">上传后自动填充技能 / 学历 / 经验</text></view>
        <view v-if="selectedResume" class="resume-applied">
          <view class="resume-applied-head">
            <text class="resume-file">📄 {{ selectedResume.fileName || '已解析简历' }}</text>
            <text class="resume-remove" @tap="removeResume">移除</text>
          </view>
          <view class="resume-meta">
            <text>技能 {{ selectedResume.skills.length }} 项</text>
            <text>学历 {{ selectedResume.education || '未识别' }}</text>
            <text>经验 {{ selectedResume.experienceYears != null ? selectedResume.experienceYears + ' 年' : '未识别' }}</text>
          </view>
        </view>
        <view v-else class="resume-actions">
          <button class="resume-btn" :disabled="resumeBusy" @tap="uploadResumeFile">
            {{ resumeBusy ? '解析中 ' + resumeProgress + '%' : '上传简历并填充' }}
          </button>
          <button class="resume-btn ghost" :disabled="resumeBusy" @tap="openResumePicker">选择已有简历</button>
        </view>
        <view v-if="resumeBusy" class="resume-bar"><view class="resume-bar-fill" :style="{ width: resumeProgress + '%' }"></view></view>
      </view>

      <!-- 我的技能 -->
      <view class="card">
        <view class="section-title">② 我的技能（已掌握 {{ mySkills.length }} 项）</view>
        <view v-if="mySkills.length" class="skill-tags">
          <view v-for="skill in mySkills" :key="skill" class="tag tag-on" @tap="toggleSkill(skill)">
            {{ skill }} ✕
          </view>
        </view>
        <view v-else class="role-empty-sub">从上方岗位技能中点选，或手动输入（可多个，用逗号或回车分隔）</view>
        <view class="add-row">
          <input v-model="skillInput" class="add-input" placeholder="输入技能名，如：Python" confirm-type="done" @confirm="addSkills" />
          <view class="add-btn" @tap="addSkills">添加</view>
        </view>
      </view>

      <!-- 学历 / 年限 -->
      <view class="card">
        <view class="section-title">③ 基本信息</view>
        <picker mode="selector" :range="educationOptions" @change="onEducation">
          <view class="row">
            <text class="row-label">最高学历</text>
            <text class="row-value picker-value">{{ education }}</text>
          </view>
        </picker>
        <picker mode="selector" :range="experienceLabels" @change="onExperience">
          <view class="row">
            <text class="row-label">从业年限</text>
            <text class="row-value picker-value">{{ experienceLabels[experienceYears] }}</text>
          </view>
        </picker>
      </view>

      <!-- 工作方式自评 -->
      <view class="card">
        <view class="section-title">④ 工作方式自评（可选）<text class="score-tip">均值 {{ workStyleScore }}</text></view>
        <view v-for="(item, index) in workStyleItems" :key="item.key" class="slider-row">
          <text class="slider-label">{{ item.label }}</text>
          <slider :min="1" :max="5" :step="1" :value="workStyle[index]" activeColor="#00bebd" @change="onWorkStyle(index, $event)" />
          <text class="slider-value">{{ workStyle[index] }}</text>
        </view>
      </view>

      <view class="submit-wrap">
        <button class="btn-primary" :disabled="busy || !role" @tap="runMatch">
          {{ busy ? "诊断分析中…" : "开始诊断" }}
        </button>
        <view class="submit-tip">诊断基于岗位数据库与你的技能画像，通常 5~30 秒完成</view>
      </view>
    </view>

    <!-- ============ 结果区 ============ -->
    <view v-else-if="phase === 'result' && match">
      <view class="card score-card">
        <view class="score-left">
          <view class="score-num" :style="{ color: scoreColor(match.score) }">{{ Math.round(match.score) }}</view>
          <view class="score-cap">匹配度 / 100</view>
        </view>
        <view class="score-right">
          <view class="score-role">{{ match.roleName }}</view>
          <view class="score-notice" v-if="match.notice">{{ match.notice }}</view>
          <view class="score-meta" v-if="match.skillScore != null">技能覆盖 {{ Math.round(match.skillScore) }}</view>
          <view class="score-meta" v-if="match.breadthScore != null">知识广度 {{ Math.round(match.breadthScore) }}</view>
          <view class="score-meta" v-if="match.workStyleScore != null">工作方式 {{ Math.round(match.workStyleScore) }}</view>
        </view>
      </view>

      <!-- 维度 -->
      <view class="card" v-if="match.dimensions && match.dimensions.length">
        <view class="section-title">匹配维度</view>
        <view v-for="dim in match.dimensions" :key="dim.name" class="dim-row">
          <text class="dim-label">{{ dimLabel(dim.name) }}</text>
          <view class="dim-bar"><view class="dim-fill" :style="{ width: dim.score + '%', background: scoreColor(dim.score) }"></view></view>
          <text class="dim-score">{{ Math.round(dim.score) }}</text>
        </view>
      </view>

      <!-- 画像 -->
      <view class="card" v-if="match.educationProfile && match.educationProfile.current">
        <view class="section-title">学历画像</view>
        <view class="row"><text class="row-label">我的学历</text><text class="row-value">{{ match.educationProfile.provided || "—" }}</text></view>
        <view class="row"><text class="row-label">岗位要求</text><text class="row-value">{{ match.educationProfile.required || "—" }}</text></view>
        <view class="row"><text class="row-label">学历匹配</text><text class="row-value">{{ match.educationProfile.matchScore != null ? Math.round(match.educationProfile.matchScore * 100) + "%" : "—" }}</text></view>
      </view>
      <view class="card" v-if="match.experienceProfile && match.experienceProfile.requiredYears != null">
        <view class="section-title">经验画像</view>
        <view class="row"><text class="row-label">我的年限</text><text class="row-value">{{ match.experienceProfile.providedYears ?? 0 }} 年</text></view>
        <view class="row"><text class="row-label">岗位要求</text><text class="row-value">{{ match.experienceProfile.requiredYears }} 年</text></view>
      </view>

      <!-- 技能差距 -->
      <view class="card" v-if="matchedSkills.length">
        <view class="section-title">已掌握（{{ matchedSkills.length }}）</view>
        <view class="skill-tags">
          <view v-for="skill in matchedSkills" :key="skill.skill" class="tag tag-matched">✓ {{ skill.skill }}</view>
        </view>
      </view>
      <view class="card" v-if="partialSkills.length">
        <view class="section-title">待加强（{{ partialSkills.length }}）</view>
        <view v-for="skill in partialSkills" :key="skill.skill" class="gap-row">
          <view class="gap-name">◐ {{ skill.skill }}<text class="gap-level" v-if="skill.level"> · {{ skill.level }}</text></view>
          <view class="gap-evidence" v-if="skill.jobEvidence">{{ skill.jobEvidence }}</view>
        </view>
      </view>
      <view class="card" v-if="missingSkills.length">
        <view class="section-title">重点缺口（{{ missingSkills.length }}）</view>
        <view v-for="skill in missingSkills" :key="skill.skill" class="gap-row">
          <view class="gap-name">○ {{ skill.skill }}<text class="gap-level" v-if="skill.importance"> · {{ skill.importance }}</text></view>
          <view class="gap-evidence" v-if="skill.jobEvidence">{{ skill.jobEvidence }}</view>
        </view>
      </view>

      <!-- 学习路径 -->
      <view class="card" v-if="lp">
        <view class="section-title">学习路径（{{ lp.stages.length }} 阶段）</view>
        <view v-for="(stage, idx) in lp.stages" :key="idx" class="stage">
          <view class="stage-head" @tap="toggleStage(idx)">
            <view class="stage-title">
              <text class="stage-no">{{ idx + 1 }}</text>
              {{ stage.name || `阶段 ${idx + 1}` }}
              <text class="stage-duration" v-if="stage.duration"> {{ stage.duration }}</text>
            </view>
            <text class="stage-arrow">{{ expandedIndex === idx ? "收起 ▲" : "展开 ▼" }}</text>
          </view>
          <view v-if="expandedIndex === idx" class="stage-body">
            <view v-if="stage.goal" class="stage-line"><text class="stage-k">目标</text>{{ stage.goal }}</view>
            <view v-if="stage.outcome" class="stage-line"><text class="stage-k">成果</text>{{ stage.outcome }}</view>
            <view v-if="stage.skills && stage.skills.length" class="skill-tags">
              <view v-for="skill in stage.skills" :key="skill" class="tag tag-plan">📚 {{ skill }}</view>
            </view>
            <view v-if="stage.courses && stage.courses.length" class="stage-line"><text class="stage-k">课程</text>
              <text v-for="(course, ci) in stage.courses" :key="ci" class="course-item">{{ courseText(course) }}</text>
            </view>
            <view v-if="stage.certificates && stage.certificates.length" class="skill-tags">
              <view v-for="cert in stage.certificates" :key="cert" class="tag tag-cert">🏅 {{ cert }}</view>
            </view>
            <view v-if="stage.weeklyTasks && stage.weeklyTasks.length" class="stage-line"><text class="stage-k">周任务</text>
              <view v-for="(task, ti) in stage.weeklyTasks" :key="ti" class="task-item">
                <text v-if="task.period" class="task-period">{{ task.period }}</text>{{ task.title || "任务" }}
              </view>
            </view>
            <view v-if="stage.acceptanceCriteria" class="stage-line"><text class="stage-k">验收</text>{{ stage.acceptanceCriteria }}</view>
          </view>
        </view>
      </view>

      <view class="action-wrap" v-if="match.reportId">
        <button class="btn-primary" :disabled="pathBusy" @tap="buildPath">
          {{ pathBusy ? "生成中，约需 10~60 秒…" : lp ? "刷新学习路径" : "生成学习路径" }}
        </button>
        <button class="btn-secondary" @tap="askAssistant">智能解读诊断报告</button>
        <button class="btn-plain" @tap="goForm">修改信息重新诊断</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { api } from "@/api/api";
import { requireLogin } from "@/api/request";
import type { JobSkill, LearningPath, MatchResult, MatchSkillGap, ResumeResult } from "@/api/types";
import { chooseResumeFile, uploadResume, getMyResumes, deleteMyResume } from "@/api/resume";
import { pickRole, type PickedRole } from "@/utils/pickRole";
import { setPendingCtx, takePendingCtx } from "@/utils/tabCtx";

const educationOptions = ["大专", "本科", "硕士", "博士"];
const experienceLabels = Array.from({ length: 26 }, (_, i) => (i === 25 ? "25年以上" : `${i} 年`));

const phase = ref<"form" | "result">("form");
const role = ref<PickedRole | null>(null);
const mySkills = ref<string[]>([]);
const skillInput = ref("");
const education = ref("本科");
const experienceYears = ref(3);
const workStyle = ref([3, 3, 3, 3]);
const workStyleItems = [
  { key: "collaboration", label: "团队协作" },
  { key: "adaptability", label: "快速适应" },
  { key: "resilience", label: "抗压韧性" },
  { key: "initiative", label: "主动担当" },
];
const busy = ref(false);
const match = ref<MatchResult | null>(null);
const lp = ref<LearningPath | null>(null);
const pathBusy = ref(false);
const expandedIndex = ref<number | null>(null);

// 个人简历（可选）
const selectedResume = ref<ResumeResult | null>(null);
const resumeBusy = ref(false);
const resumeProgress = ref(0);
const resumeList = ref<ResumeResult[]>([]);
const resumeListLoading = ref(false);

const pool = computed<JobSkill[]>(() => {
  const names = new Set(mySkills.value.map((s) => s.toLowerCase()));
  return (role.value?.skills || []).filter((s) => !names.has(s.name.toLowerCase()));
});

const workStyleScore = computed(() => {
  const sum = workStyle.value.reduce((a, b) => a + b, 0);
  return (Math.round((sum / workStyle.value.length) * 10) / 10).toFixed(1);
});

const matchedSkills = computed<MatchSkillGap[]>(() => match.value?.gaps.filter((g) => g.status === "matched") || []);
const partialSkills = computed<MatchSkillGap[]>(() => match.value?.gaps.filter((g) => g.status === "partial") || []);
const missingSkills = computed<MatchSkillGap[]>(() => match.value?.gaps.filter((g) => g.status === "missing") || []);

onShow(() => {
  if (requireLogin()) return;
  const ctx = takePendingCtx("diagnosis");
  if (ctx && (ctx.roleId || ctx.roleName)) {
    applyPendingRole(ctx.roleId || "", ctx.roleName || "该岗位");
  }
});

/** 从岗位详情等入口预填目标岗位（tab 页 switchTab 不支持 query，用 storage 暂存） */
function applyPendingRole(rid: string, roleName: string) {
  phase.value = "form";
  match.value = null;
  lp.value = null;
  expandedIndex.value = null;

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
        skills: detail.skills,
      };
      if (!mySkills.value.length && detail.skills?.length) {
        mySkills.value = detail.skills.slice(0, 3).map((s) => s.name);
      }
    })
    .catch(() => {});
}

function scoreColor(score: number): string {
  if (score >= 75) return "#2da44e";
  if (score >= 55) return "#f59e0b";
  return "#e5484d";
}

function dimLabel(name: string): string {
  const map: Record<string, string> = {
    skills: "技能覆盖",
    education: "学历",
    experience: "经验",
    certificates: "证书",
    breadth: "知识广度",
    workStyle: "工作方式",
  };
  return map[name] || name;
}

async function chooseRole(withSkills: boolean = false) {
  const skills = withSkills ? mySkills.value : pool.value.map((s) => s.name);
  const picked = await pickRole(skills);
  if (picked) {
    role.value = picked;
    // 岗位高频技能默认不全选，仅在没有任何技能时预填最靠前的 3 项作引导
    if (mySkills.value.length === 0 && picked.skills?.length) {
      mySkills.value = picked.skills.slice(0, 3).map((s) => s.name);
    }
  }
}

function toggleSkill(name: string) {
  const index = mySkills.value.findIndex((s) => s.toLowerCase() === name.toLowerCase());
  if (index >= 0) mySkills.value.splice(index, 1);
  else mySkills.value.push(name);
}

function addSkills() {
  const raw = skillInput.value.trim();
  if (!raw) return;
  const parts = raw.split(/[,，;；、]/).map((s) => s.trim()).filter(Boolean);
  const names = new Set(mySkills.value.map((s) => s.toLowerCase()));
  for (const part of parts) {
    if (part.length > 40) continue;
    if (!names.has(part.toLowerCase())) mySkills.value.push(part);
  }
  skillInput.value = "";
}

function onEducation(event: { detail: { value: number } }) {
  education.value = educationOptions[event.detail.value] || "本科";
}

function onExperience(event: { detail: { value: number } }) {
  experienceYears.value = event.detail.value;
}

function onWorkStyle(index: number, event: { detail: { value: number } }) {
  workStyle.value[index] = event.detail.value;
}

/** 将简历解析结果映射到表单可选学历；无法识别时返回 null（不覆盖用户选择） */
function mapEducation(raw?: string | null): string | null {
  if (!raw) return null;
  const v = String(raw).trim();
  if ((educationOptions as string[]).includes(v)) return v;
  const lower = v.toLowerCase();
  if (/(bachelor|本科|学士)/.test(lower)) return "本科";
  if (/(master|硕士|研究生)/.test(lower)) return "硕士";
  if (/(doctor|博士|phd)/.test(lower)) return "博士";
  if (/(college|大专|专科|高职)/.test(lower)) return "大专";
  return null;
}

/** 用解析后的简历填充技能 / 学历 / 经验 */
function applyResume(resume: ResumeResult) {
  const names = resume.skills.map((s) => s.skill_name).filter(Boolean);
  if (names.length) {
    const seen = new Set<string>();
    mySkills.value = names.filter((n) => {
      const key = n.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 30);
  }
  const edu = mapEducation(resume.education);
  if (edu) education.value = edu;
  if (resume.experienceYears != null && !isNaN(Number(resume.experienceYears))) {
    experienceYears.value = Math.max(0, Math.min(25, Math.round(Number(resume.experienceYears))));
  }
  selectedResume.value = resume;
  uni.showToast({ title: "已从简历填充信息", icon: "success" });
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
    applyResume(parsed);
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "简历上传失败", icon: "none" });
  } finally {
    resumeBusy.value = false;
    resumeProgress.value = 0;
  }
}

async function openResumePicker() {
  if (resumeBusy.value) return;
  resumeListLoading.value = true;
  try {
    resumeList.value = await getMyResumes(20);
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "简历列表读取失败", icon: "none" });
    return;
  } finally {
    resumeListLoading.value = false;
  }
  if (!resumeList.value.length) {
    uni.showToast({ title: "暂无简历，请先上传", icon: "none" });
    return;
  }
  const items = resumeList.value.map((r) => r.fileName || "已解析简历");
  uni.showActionSheet({
    itemList: items,
    success: (res) => {
      const item = resumeList.value[res.tapIndex];
      if (item) applyResume(item);
    },
  });
}

async function removeResume() {
  const resume = selectedResume.value;
  if (!resume) return;
  try {
    if (resume.resumeId) await deleteMyResume(resume.resumeId);
    uni.showToast({ title: "已移除该简历", icon: "none" });
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "移除失败", icon: "none" });
  } finally {
    selectedResume.value = null;
  }
}

async function runMatch() {
  if (!role.value) {
    uni.showToast({ title: "请先选择目标岗位", icon: "none" });
    return;
  }
  busy.value = true;
  try {
    const result = await api.matchManual({
      targetRoleId: role.value.roleId,
      skills: mySkills.value,
      education: education.value,
      experienceYears: experienceYears.value,
      certificates: [],
      workStyleScore: Number(workStyleScore.value),
      resumeId: selectedResume.value?.resumeId,
    });
    match.value = result;
    lp.value = null;
    expandedIndex.value = null;
    phase.value = "result";
    uni.pageScrollTo({ scrollTop: 0, duration: 200 });
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "诊断失败", icon: "none" });
  } finally {
    busy.value = false;
  }
}

function goForm() {
  phase.value = "form";
  uni.pageScrollTo({ scrollTop: 0, duration: 200 });
}

async function buildPath() {
  if (!match.value?.reportId) return;
  pathBusy.value = true;
  try {
    lp.value = await api.createLearningPath(match.value.reportId);
    uni.showToast({ title: "学习路径已生成", icon: "success" });
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "生成失败", icon: "none" });
  } finally {
    pathBusy.value = false;
  }
}

function toggleStage(index: number) {
  expandedIndex.value = expandedIndex.value === index ? null : index;
}

function courseText(course: Record<string, unknown> | string): string {
  if (typeof course === "string") return course;
  const obj = course as Record<string, unknown>;
  return String(obj?.title || obj?.name || obj?.course || JSON.stringify(obj) || "");
}

function askAssistant() {
  if (!match.value) return;
  setPendingCtx({
    target: "assistant",
    mode: "ability_analysis",
    reportId: match.value.reportId,
    roleId: match.value.roleId,
    roleName: match.value.roleName,
  });
  uni.switchTab({ url: "/pages/assistant/assistant" });
}
</script>

<style scoped>
.page {
  padding-bottom: calc(60rpx + var(--window-bottom, 0px));
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
}

.role-empty {
  text-align: center;
  border: 2rpx dashed #c2c9d6;
  border-radius: 16rpx;
  padding: 40rpx 20rpx;
}

.role-empty-main {
  display: block;
  color: #00bebd;
  font-size: 30rpx;
}

.role-empty-sub {
  display: block;
  margin-top: 10rpx;
  color: #8a94a6;
  font-size: 24rpx;
}

.role-box {
  background: #f7fbfb;
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
  color: #00bebd;
  font-size: 26rpx;
}

.role-sub {
  margin-top: 8rpx;
  color: #8a94a6;
  font-size: 24rpx;
}

.recommend-link {
  margin-top: 20rpx;
  color: #00bebd;
  font-size: 26rpx;
  text-align: center;
}

/* 个人简历卡片 */
.resume-applied {
  background: #f7fbfb;
  border-radius: 16rpx;
  padding: 22rpx;
}

.resume-applied-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.resume-file {
  font-size: 28rpx;
  font-weight: 600;
  max-width: 70%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resume-remove {
  color: #e5484d;
  font-size: 26rpx;
  flex-shrink: 0;
}

.resume-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 14rpx;
  color: #6b7688;
  font-size: 24rpx;
}

.resume-actions {
  display: flex;
  gap: 16rpx;
}

.resume-btn {
  flex: 1;
  background: #00bebd;
  color: #ffffff;
  font-size: 28rpx;
  border-radius: 14rpx;
  height: 84rpx;
  line-height: 84rpx;
  text-align: center;
  border: none;
}

.resume-btn[disabled] {
  opacity: 0.6;
}

.resume-btn.ghost {
  background: #e5f7f7;
  color: #00bebd;
}

.resume-bar {
  margin-top: 18rpx;
  height: 12rpx;
  background: #e5f7f7;
  border-radius: 6rpx;
  overflow: hidden;
}

.resume-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00bebd, #00a6a5);
  border-radius: 6rpx;
  transition: width 0.3s;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  margin-top: 16rpx;
}

.tag {
  font-size: 24rpx;
  padding: 10rpx 22rpx;
  border-radius: 28rpx;
  margin: 0 14rpx 12rpx 0;
  max-width: 100%;
}

.tag-add {
  background: #e5f7f7;
  color: #00bebd;
}

.tag-on {
  background: #00bebd;
  color: #ffffff;
}

.tag-matched {
  background: #e6f4ea;
  color: #2da44e;
}

.tag-plan {
  background: #eef6ff;
  color: #0ea5e9;
}

.tag-cert {
  background: #fdf3e0;
  color: #b45309;
}

.add-row {
  display: flex;
  margin-top: 16rpx;
}

.add-input {
  flex: 1;
  background: #f5f6fa;
  border-radius: 14rpx;
  height: 76rpx;
  padding: 0 24rpx;
  font-size: 27rpx;
}

.add-btn {
  margin-left: 16rpx;
  color: #00bebd;
  font-size: 28rpx;
  padding: 18rpx 24rpx;
  background: #e5f7f7;
  border-radius: 14rpx;
}

.row {
  display: flex;
  justify-content: space-between;
  padding: 22rpx 0;
  border-bottom: 1rpx solid #f0f2f7;
}

.row:last-child {
  border-bottom: none;
}

.row-label {
  color: #6b7688;
}

.row-value {
  font-weight: 600;
}

.picker-value {
  color: #26303e;
}

.score-tip {
  margin-left: 16rpx;
  color: #8a94a6;
  font-size: 24rpx;
  font-weight: 400;
}

.slider-row {
  display: flex;
  align-items: center;
  padding: 6rpx 0;
}

.slider-label {
  width: 140rpx;
  font-size: 26rpx;
  color: #6b7688;
}

.slider-row slider {
  flex: 1;
}

.slider-value {
  width: 60rpx;
  text-align: right;
  color: #00bebd;
  font-weight: 600;
}

.submit-wrap,
.action-wrap {
  margin: 30rpx 24rpx;
}

.submit-tip {
  text-align: center;
  color: #8a94a6;
  font-size: 24rpx;
  margin-top: 16rpx;
}

.score-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #f7fbfb, #e5f7f7);
}

.score-left {
  width: 220rpx;
  text-align: center;
}

.score-num {
  font-size: 88rpx;
  font-weight: 800;
  line-height: 1.1;
}

.score-cap {
  color: #8a94a6;
  font-size: 22rpx;
}

.score-right {
  flex: 1;
  padding-left: 24rpx;
  border-left: 1rpx solid #e3e7f0;
}

.score-role {
  font-size: 32rpx;
  font-weight: 700;
}

.score-notice {
  margin-top: 10rpx;
  color: #6b7688;
  font-size: 24rpx;
  line-height: 1.5;
}

.score-meta {
  margin-top: 8rpx;
  color: #00bebd;
  font-size: 24rpx;
}

.dim-row {
  display: flex;
  align-items: center;
  padding: 14rpx 0;
}

.dim-label {
  width: 150rpx;
  font-size: 26rpx;
  color: #26303e;
}

.dim-bar {
  flex: 1;
  height: 16rpx;
  background: #e5f7f7;
  border-radius: 8rpx;
  overflow: hidden;
  margin: 0 16rpx;
}

.dim-fill {
  height: 100%;
  border-radius: 8rpx;
  transition: width 0.4s;
}

.dim-score {
  width: 56rpx;
  text-align: right;
  font-weight: 600;
}

.gap-row {
  padding: 16rpx 4rpx;
  border-bottom: 1rpx solid #f0f2f7;
}

.gap-row:last-child {
  border-bottom: none;
}

.gap-name {
  font-size: 28rpx;
  font-weight: 600;
}

.gap-level {
  color: #8a94a6;
  font-size: 22rpx;
  font-weight: 400;
}

.gap-evidence {
  margin-top: 8rpx;
  color: #6b7688;
  font-size: 24rpx;
  line-height: 1.5;
}

.stage {
  border: 1rpx solid #e5f7f7;
  border-radius: 14rpx;
  margin-top: 16rpx;
  overflow: hidden;
}

.stage-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22rpx 24rpx;
  background: #fafbff;
}

.stage-title {
  font-size: 28rpx;
  font-weight: 600;
  flex: 1;
}

.stage-no {
  display: inline-block;
  width: 40rpx;
  height: 40rpx;
  line-height: 40rpx;
  text-align: center;
  border-radius: 10rpx;
  background: #00bebd;
  color: #fff;
  font-size: 24rpx;
  margin-right: 12rpx;
}

.stage-duration {
  color: #0ea5e9;
  font-size: 24rpx;
  font-weight: 400;
}

.stage-arrow {
  color: #8a94a6;
  font-size: 22rpx;
  margin-left: 12rpx;
}

.stage-body {
  padding: 20rpx 24rpx;
  border-top: 1rpx solid #f0f2f7;
}

.stage-line {
  font-size: 25rpx;
  color: #26303e;
  line-height: 1.6;
  margin-bottom: 10rpx;
}

.stage-k {
  color: #6b7688;
  margin-right: 12rpx;
}

.course-item {
  display: block;
  margin: 6rpx 0;
  color: #00bebd;
}

.task-item {
  display: block;
  padding: 4rpx 0;
  color: #26303e;
}

.task-period {
  color: #b45309;
  margin-right: 8rpx;
}

.action-wrap button {
  margin-bottom: 20rpx;
}

.btn-secondary {
  background: #e5f7f7;
  color: #00bebd;
  border-radius: 48rpx;
  font-size: 32rpx;
  height: 92rpx;
  line-height: 92rpx;
  text-align: center;
  border: none;
  width: 100%;
}

.btn-plain {
  background: transparent;
  color: #8a94a6;
  border-radius: 48rpx;
  font-size: 30rpx;
  height: 92rpx;
  line-height: 92rpx;
  text-align: center;
  border: 1rpx solid #e3e7f0;
  width: 100%;
}
</style>
