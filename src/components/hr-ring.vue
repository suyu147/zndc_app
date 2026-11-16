<template>
  <view class="hr-ring" :style="{ width: size + 'rpx', height: size + 'rpx' }">
    <svg aria-hidden="true" viewBox="0 0 100 100" class="hr-ring-svg">
      <circle cx="50" cy="50" :r="radius" fill="none" stroke="var(--color-surface)" :stroke-width="stroke" />
      <circle
        cx="50"
        cy="50"
        :r="radius"
        fill="none"
        :stroke="color"
        :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
        transform="rotate(-90 50 50)"
        class="hr-ring-progress"
      />
    </svg>
    <view class="hr-ring-content">
      <slot>
        <text class="hr-ring-value" :style="{ color: color, fontSize: size * 0.34 + 'rpx' }">{{ value }}</text>
        <text v-if="unit" class="hr-ring-unit">{{ unit }}</text>
      </slot>
    </view>
  </view>
</template>

<script setup lang="ts">
/** 匹配度 / 得分环形进度（纯 SVG，无第三方图表依赖） */
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    /** 0-100 */
    value: number;
    size?: number;
    stroke?: number;
    color?: string;
    unit?: string;
  }>(),
  { size: 140, stroke: 8, color: "var(--color-primary)", unit: "" },
);

const radius = computed(() => 50 - props.stroke / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const offset = computed(() => {
  const percent = Math.max(0, Math.min(100, Number(props.value) || 0));
  return circumference.value * (1 - percent / 100);
});

/** 默认配色：>=90 优秀(青绿) / >=80 良好(蓝) / >=70 一般(橙) / 其他(灰红) */
const color = computed(() => {
  if (props.color !== "var(--color-primary)") return props.color;
  const v = Number(props.value) || 0;
  if (v >= 90) return "var(--color-primary)";
  if (v >= 80) return "var(--color-primary)";
  if (v >= 70) return "var(--color-warning)";
  return "var(--color-danger)";
});
</script>

<style scoped>
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */
.hr-ring {
  position: relative;
  flex-shrink: 0;
}

.hr-ring-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.hr-ring-progress {
  transition: opacity 0.18s ease;
}

.hr-ring-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.hr-ring-value {
  font-weight: 800;
  line-height: 1;
}

.hr-ring-unit {
  margin-top: 4rpx;
  font-size: 19rpx;
  color: var(--color-muted);
}
</style>
