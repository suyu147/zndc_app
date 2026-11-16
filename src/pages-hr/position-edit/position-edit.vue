<template>
  <view class="hr-page hr-page--plain">
    <!-- 智能建议（基于平台数据） -->
    <view v-if="advice" class="advice">
      <view class="advice-head">
        <AppIcon name="chart" />
        <text class="advice-title">智能招聘建议</text>
        <text class="advice-source">基于职能洞察平台数据</text>
      </view>
      <view class="advice-metrics">
        <view class="advice-metric">
          <text class="advice-value">{{ advice.marketSalary }}K</text>
          <text class="advice-label">市场中位薪资</text>
        </view>
        <view class="advice-metric">
          <text class="advice-value" :class="advice.trendPp >= 0 ? 'up' : 'down'">
            {{ advice.trendPp >= 0 ? "+" : "" }}{{ advice.trendPp.toFixed(1) }}pp
          </text>
          <text class="advice-label">需求热度环比</text>
        </view>
        <view class="advice-metric">
          <text class="advice-value">{{ advice.supplyIndex.toFixed(2) }}</text>
          <text class="advice-label">供需指数</text>
        </view>
        <view class="advice-metric">
          <text class="advice-value">{{ advice.suggestedDays }}<text class="advice-unit">天</text></text>
          <text class="advice-label">预计招聘周期</text>
        </view>
      </view>
      <view class="advice-difficulty">{{ advice.difficulty }}</view>
      <view v-if="advice.suggestedSkills.length" class="advice-skills">
        <text class="advice-skills-label">热门技能（点击添加）</text>
        <view class="advice-skills-wrap">
          <text
            v-for="skill in advice.suggestedSkills"
            :key="skill"
            class="advice-skill"
            @tap="addSkill(skill)"
           role="button" tabindex="0" @keydown.enter.prevent.stop="addSkill(skill)" @keydown.space.prevent.stop="addSkill(skill)">
            + {{ skill }}
          </text>
        </view>
      </view>
    </view>

    <!-- 基本信息 -->
    <view class="hr-card">
      <view class="hr-sec-title"><text class="hr-sec-title-main">基本信息</text></view>

      <view class="form-row">
        <text class="form-label">职位名称</text>
        <input v-model="form.title" class="form-input" placeholder="如：高级数据分析师" :maxlength="30" />
      </view>

      <view class="form-row">
        <text class="form-label">所属领域</text>
        <picker mode="selector" :range="FIELDS" :value="FIELDS.indexOf(form.field)" @change="onFieldChange">
          <view class="form-value">
            {{ form.field || "请选择" }}<text class="form-arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="form-row">
        <text class="form-label">工作城市</text>
        <picker mode="selector" :range="CITIES" :value="CITIES.indexOf(form.city)" @change="onCityChange">
          <view class="form-value">
            {{ form.city }}<text class="form-arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="form-row">
        <text class="form-label">经验要求</text>
        <picker mode="selector" :range="EXPERIENCES" :value="EXPERIENCES.indexOf(form.experience)" @change="onExpChange">
          <view class="form-value">
            {{ form.experience }}<text class="form-arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="form-row">
        <text class="form-label">学历要求</text>
        <picker mode="selector" :range="EDUCATIONS" :value="EDUCATIONS.indexOf(form.education)" @change="onEduChange">
          <view class="form-value">
            {{ form.education }}<text class="form-arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="form-row">
        <text class="form-label">招聘人数</text>
        <view class="stepper">
          <text class="stepper-btn" @tap="form.headcount = Math.max(1, form.headcount - 1)" role="button" tabindex="0" @keydown.enter.prevent.stop="form.headcount = Math.max(1, form.headcount - 1)" @keydown.space.prevent.stop="form.headcount = Math.max(1, form.headcount - 1)">−</text>
          <text class="stepper-value">{{ form.headcount }}</text>
          <text class="stepper-btn" @tap="form.headcount = Math.min(99, form.headcount + 1)" role="button" tabindex="0" @keydown.enter.prevent.stop="form.headcount = Math.min(99, form.headcount + 1)" @keydown.space.prevent.stop="form.headcount = Math.min(99, form.headcount + 1)">+</text>
        </view>
      </view>
    </view>

    <!-- 薪资 -->
    <view class="hr-card">
      <view class="hr-sec-title">
        <text class="hr-sec-title-main">薪资范围</text>
        <text v-if="advice" class="hr-sec-more">市场 {{ advice.marketSalary }}K</text>
      </view>
      <view class="salary-row">
        <input v-model="form.salaryMin" class="salary-input" type="number" placeholder="最低" />
        <text class="salary-sep">至</text>
        <input v-model="form.salaryMax" class="salary-input" type="number" placeholder="最高" />
        <text class="salary-unit">K / 月</text>
      </view>
      <view class="salary-tip">
        当前区间 {{ salaryRangeText }}
        <text v-if="advice" :class="salaryTipClass">　{{ salaryTipText }}</text>
      </view>
    </view>

    <!-- 技能要求 -->
    <view class="hr-card">
      <view class="hr-sec-title"><text class="hr-sec-title-main">技能要求</text></view>
      <view class="skill-input-row">
        <input v-model="skillDraft" class="form-input" placeholder="输入技能后回车添加" :maxlength="20" @confirm="addSkill(skillDraft)" />
        <text class="skill-add" @tap="addSkill(skillDraft)" role="button" tabindex="0" @keydown.enter.prevent.stop="addSkill(skillDraft)" @keydown.space.prevent.stop="addSkill(skillDraft)">添加</text>
      </view>
      <view v-if="form.skills.length" class="skill-wrap">
        <view v-for="skill in form.skills" :key="skill" class="skill-chip" @tap="removeSkill(skill)" role="button" tabindex="0" @keydown.enter.prevent.stop="removeSkill(skill)" @keydown.space.prevent.stop="removeSkill(skill)">
          {{ skill }}<text class="skill-chip-x">✕</text>
        </view>
      </view>
      <view v-else class="skill-empty">尚未添加技能要求</view>
    </view>

    <!-- 职位描述 -->
    <view class="hr-card">
      <view class="hr-sec-title"><text class="hr-sec-title-main">职位描述</text></view>
      <textarea
        v-model="form.jdText"
        class="jd-input"
        placeholder="每行一条，保存后自动拆分为职责列表"
        :maxlength="800"
        auto-height
      />
    </view>

    <!-- 急聘 -->
    <view class="hr-card">
      <view class="switch-row">
        <view class="switch-main">
          <text class="switch-label">标记为急聘</text>
          <text class="switch-hint">展示急聘角标，获得更多曝光</text>
        </view>
        <switch :checked="form.urgent" color="var(--color-primary)" @change="onUrgentChange" />
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="hr-action-bar">
      <button class="bar-btn" @tap="save('draft')">存为草稿</button>
      <button class="bar-btn bar-btn--primary" @tap="save('open')">{{ isEdit ? "保存并更新" : "立即发布" }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { genId, todayLabel } from "@/hr/store";
import { getPosition, getPositionAdvice, savePosition, type PositionAdvice } from "@/hr/api";
import type { HrPosition, PositionStatus } from "@/hr/types";

const FIELDS = ["数据分析", "人工智能", "后端开发", "前端开发", "算法", "数据工程", "产品", "测试", "运维", "人力资源"];
const CITIES = ["杭州", "上海", "北京", "深圳", "广州", "成都", "武汉", "南京", "西安"];
const EXPERIENCES = ["应届生", "1年以内", "1-3年", "3-5年", "5-10年", "10年以上"];
const EDUCATIONS = ["大专", "本科", "硕士", "博士", "不限"];

const isEdit = ref(false);
const editingId = ref("");
const skillDraft = ref("");
const advice = ref<PositionAdvice | null>(null);

const form = reactive({
  title: "",
  field: "数据分析",
  city: "杭州",
  salaryMin: "25",
  salaryMax: "40",
  experience: "3-5年",
  education: "本科",
  headcount: 1,
  urgent: false,
  skills: [] as string[],
  jdText: "",
});

onLoad(async (query) => {
  const id = (query?.id as string) || "";
  if (!id) return;
  const detail = await getPosition(id);
  if (!detail) {
    uni.showToast({ title: "职位不存在", icon: "none" });
    return;
  }
  isEdit.value = true;
  editingId.value = id;
  form.title = detail.title;
  form.field = FIELDS.includes(detail.field) ? detail.field : FIELDS[0];
  form.city = CITIES.includes(detail.city) ? detail.city : CITIES[0];
  form.salaryMin = String(detail.salaryMin);
  form.salaryMax = String(detail.salaryMax);
  form.experience = EXPERIENCES.includes(detail.experience) ? detail.experience : EXPERIENCES[2];
  form.education = EDUCATIONS.includes(detail.education) ? detail.education : EDUCATIONS[1];
  form.headcount = detail.headcount;
  form.urgent = detail.urgent;
  form.skills = detail.skills.slice();
  form.jdText = detail.jd.join("\n");
  uni.setNavigationBarTitle({ title: "编辑职位" });
});

/* ---------- 智能建议（输入职位名称后防抖请求） ---------- */
let adviceTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => form.title,
  (value) => {
    if (adviceTimer) clearTimeout(adviceTimer);
    adviceTimer = setTimeout(async () => {
      advice.value = await getPositionAdvice(value);
    }, 400);
  },
  { immediate: true },
);

const salaryRangeText = computed(() => `${form.salaryMin || "?"}-${form.salaryMax || "?"}K`);

const salaryDiff = computed(() => {
  if (!advice.value) return 0;
  const mid = (Number(form.salaryMin || 0) + Number(form.salaryMax || 0)) / 2;
  if (!mid) return 0;
  return ((mid - advice.value.marketSalary) / advice.value.marketSalary) * 100;
});

const salaryTipText = computed(() => {
  const diff = salaryDiff.value;
  if (diff >= 8) return `高于市场中位数 ${diff.toFixed(0)}%`;
  if (diff >= -3) return "与市场中位数持平";
  return `低于市场中位数 ${Math.abs(diff).toFixed(0)}%`;
});

const salaryTipClass = computed(() => {
  const diff = salaryDiff.value;
  if (diff >= -3) return "tip-good";
  return "tip-warn";
});

/* ---------- 交互 ---------- */
function onFieldChange(event: { detail: { value: number } }) {
  form.field = FIELDS[event.detail.value];
}

function onCityChange(event: { detail: { value: number } }) {
  form.city = CITIES[event.detail.value];
}

function onExpChange(event: { detail: { value: number } }) {
  form.experience = EXPERIENCES[event.detail.value];
}

function onEduChange(event: { detail: { value: number } }) {
  form.education = EDUCATIONS[event.detail.value];
}

function onUrgentChange(event: Event) {
  form.urgent = (event as unknown as { detail: { value: boolean } }).detail.value;
}

function addSkill(skill: string) {
  const value = (skill || "").trim();
  if (!value) return;
  if (form.skills.includes(value)) {
    uni.showToast({ title: "技能已存在", icon: "none" });
    return;
  }
  form.skills.push(value);
  skillDraft.value = "";
}

function removeSkill(skill: string) {
  form.skills = form.skills.filter((item) => item !== skill);
}

async function save(status: PositionStatus) {
  if (!form.title.trim()) {
    uni.showToast({ title: "请填写职位名称", icon: "none" });
    return;
  }
  const min = Number(form.salaryMin) || 0;
  const max = Number(form.salaryMax) || 0;
  if (min && max && min > max) {
    uni.showToast({ title: "最低薪资不能高于最高薪资", icon: "none" });
    return;
  }

  const jdLines = form.jdText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const payload: HrPosition = {
    id: editingId.value || genId("p"),
    title: form.title.trim(),
    field: form.field,
    city: form.city,
    salaryMin: min,
    salaryMax: max,
    experience: form.experience,
    education: form.education,
    headcount: form.headcount,
    hiredCount: 0,
    status,
    urgent: form.urgent,
    publishedAt: todayLabel(),
    updatedAt: todayLabel(),
    stats: { views: 0, applicants: 0, screening: 0, interviewing: 0, offered: 0, hired: 0 },
    skills: form.skills,
    jd: jdLines.length ? jdLines : ["暂无职位描述"],
    trendPp: advice.value?.trendPp ?? 0,
    marketSalary: advice.value?.marketSalary ?? Math.round((min + max) / 2),
    supplyIndex: advice.value?.supplyIndex ?? 1,
    owner: "林悦",
  };

  // 编辑时保留已招人数与统计数据，不覆盖真实进展
  if (isEdit.value) {
    const origin = await getPosition(editingId.value);
    if (origin) {
      payload.hiredCount = origin.hiredCount;
      payload.stats = origin.stats;
      payload.publishedAt = origin.publishedAt;
      payload.owner = origin.owner;
    }
  }

  await savePosition(payload);
  uni.showToast({ title: status === "open" ? "职位已发布" : "已存为草稿", icon: "success" });
  setTimeout(() => uni.navigateBack(), 600);
}
</script>

<style scoped>
/* Hallmark　shape: app screen　genre: modern-minimal　theme: brand　redesign: full　nav: kept　signature: task list　states: existing　v2.0.0 */
/* Hallmark　pre-emit critique: P4 H4 E4 S4 R5 V3　weakest: V, shared tokens preserve distinct task layouts */
/* ---------- 智能建议 ---------- */
.advice {
  margin: 20rpx 20rpx 0;
  padding: 26rpx 24rpx;
  border-radius: 18rpx;
  background: var(--color-primary);
  box-shadow: none;
}

.advice-head {
  display: flex;
  align-items: center;
}

.advice-icon {
  font-size: 30rpx;
}

.advice-title {
  margin-left: 10rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: var(--color-paper);
}

.advice-source {
  margin-left: auto;
  font-size: 19rpx;
  color: var(--color-paper);
}

.advice-metrics {
  display: flex;
  margin-top: 24rpx;
}

.advice-metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.advice-value {
  font-size: 32rpx;
  font-weight: 800;
  color: var(--color-paper);
  line-height: 1;
}

.advice-value.up {
  color: var(--color-warning);
}

.advice-value.down {
  color: var(--color-success);
}

.advice-unit {
  font-size: 22rpx;
  font-weight: 600;
}

.advice-label {
  margin-top: 10rpx;
  font-size: 20rpx;
  color: var(--color-paper);
}

.advice-difficulty {
  margin-top: 24rpx;
  padding: 16rpx 18rpx;
  border-radius: 12rpx;
  background: var(--color-rule);
  font-size: 23rpx;
  color: var(--color-paper);
  line-height: 1.6;
}

.advice-skills {
  margin-top: 20rpx;
}

.advice-skills-label {
  font-size: 21rpx;
  color: var(--color-paper);
}

.advice-skills-wrap {
  margin-top: 12rpx;
  display: flex;
  flex-wrap: wrap;
}

.advice-skill {
  font-size: 22rpx;
  color: var(--color-paper);
  background: var(--color-rule);
  border-radius: 24rpx;
  padding: 8rpx 20rpx;
  margin: 0 14rpx 12rpx 0;
}

/* ---------- 表单 ---------- */
.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 0;
  border-bottom: 1rpx solid var(--color-surface);
}

.form-row:last-child {
  border-bottom: none;
}

.form-label {
  font-size: 27rpx;
  color: var(--color-ink);
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  margin-left: 24rpx;
  font-size: 26rpx;
  color: var(--color-ink);
  text-align: right;
}

.form-value {
  font-size: 26rpx;
  color: var(--color-secondary);
}

.form-arrow {
  margin-left: 10rpx;
  color: var(--color-rule);
  font-size: 30rpx;
}

.stepper {
  display: flex;
  align-items: center;
}

.stepper-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 28rpx;
  background: var(--color-surface);
  color: var(--color-secondary);
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stepper-value {
  min-width: 70rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-ink);
}

/* ---------- 薪资 ---------- */
.salary-row {
  display: flex;
  align-items: center;
}

.salary-input {
  flex: 1;
  height: 76rpx;
  background: var(--color-surface);
  border-radius: 12rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-ink);
}

.salary-sep {
  padding: 0 20rpx;
  color: var(--color-muted);
}

.salary-unit {
  padding-left: 20rpx;
  font-size: 24rpx;
  color: var(--color-muted);
  flex-shrink: 0;
}

.salary-tip {
  margin-top: 18rpx;
  font-size: 22rpx;
  color: var(--color-secondary);
}

.tip-good {
  color: var(--color-success);
}

.tip-warn {
  color: var(--color-warning);
}

/* ---------- 技能 ---------- */
.skill-input-row {
  display: flex;
  align-items: center;
}

.skill-add {
  flex-shrink: 0;
  margin-left: 20rpx;
  padding: 12rpx 28rpx;
  border-radius: 30rpx;
  background: var(--color-surface);
  color: var(--color-primary);
  font-size: 24rpx;
  font-weight: 600;
}

.skill-wrap {
  margin-top: 18rpx;
  display: flex;
  flex-wrap: wrap;
}

.skill-chip {
  display: flex;
  align-items: center;
  font-size: 23rpx;
  color: var(--color-primary);
  background: var(--color-surface);
  border-radius: 8rpx;
  padding: 10rpx 18rpx;
  margin: 0 14rpx 14rpx 0;
}

.skill-chip-x {
  margin-left: 12rpx;
  font-size: 20rpx;
  color: var(--color-primary);
}

.skill-empty {
  margin-top: 18rpx;
  font-size: 23rpx;
  color: var(--color-rule);
}

/* ---------- JD ---------- */
.jd-input {
  width: 100%;
  min-height: 200rpx;
  background: var(--color-surface);
  border-radius: 12rpx;
  padding: 20rpx;
  box-sizing: border-box;
  font-size: 25rpx;
  color: var(--color-ink);
  line-height: 1.7;
}

/* ---------- 开关行 ---------- */
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.switch-main {
  display: flex;
  flex-direction: column;
}

.switch-label {
  font-size: 27rpx;
  color: var(--color-ink);
}

.switch-hint {
  margin-top: 8rpx;
  font-size: 21rpx;
  color: var(--color-muted);
}

/* ---------- 底部 ---------- */
.bar-btn {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 42rpx;
  font-size: 28rpx;
  margin-left: 18rpx;
  background: var(--color-paper);
  color: var(--color-secondary);
  border: 1rpx solid var(--color-surface);
  padding: 0;
}

.bar-btn::after {
  border: none;
}

.bar-btn:first-child {
  margin-left: 0;
}

.bar-btn--primary {
  background: var(--color-primary);
  color: var(--color-paper);
  border-color: transparent;
  box-shadow: none;
}

.advice { margin: 12rpx 0; background: var(--color-paper); border-radius: 0; padding: 28rpx 32rpx; }
.advice-title { color: var(--color-ink); font-size: 30rpx; }
.advice-source, .advice-label, .advice-difficulty, .advice-skills-label { color: var(--color-secondary); }
.advice-value { color: var(--color-primary); font-weight: 600; }
.advice-skill { background: var(--color-primary-soft); color: var(--color-primary); border-radius: 6rpx; }
.form-row { min-height: 92rpx; }
.form-input { font-size: 28rpx; }


.advice-head { color: var(--color-primary); flex-wrap: wrap; row-gap: 12rpx; }
.advice-source { flex-basis: 100%; margin-left: 0; font-size: 22rpx; }
.advice-value.up { color: var(--color-danger); }
.advice-value.down { color: var(--color-success); }
.advice-difficulty { background: var(--color-surface); border-radius: 6rpx; }
</style>
