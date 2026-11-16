<template>
  <view class="hr-ring" :style="{ width: size + 'rpx', height: size + 'rpx' }">
    <svg viewBox="0 0 100 100" class="hr-ring-svg">
      <circle cx="50" cy="50" :r="radius" fill="none" stroke="#eef1f5" :stroke-width="stroke" />
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
  { size: 140, stroke: 8, color: "#00A6A5", unit: "" },
);

const radius = computed(() => 50 - props.stroke / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const offset = computed(() => {
  const percent = Math.max(0, Math.min(100, Number(props.value) || 0));
  return circumference.value * (1 - percent / 100);
});

/** 默认配色：>=90 优秀(青绿) / >=80 良好(蓝) / >=70 一般(橙) / 其他(灰红) */
const color = computed(() => {
  if (props.color !== "#00A6A5") return props.color;
  const v = Number(props.value) || 0;
  if (v >= 90) return "#00A6A5";
  if (v >= 80) return "#3B82F6";
  if (v >= 70) return "#F59E0B";
  return "#F5484D";
});
</script>

<style scoped>
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
  transition: stroke-dashoffset 0.6s ease;
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
  color: #9ca3af;
}
</style>
