<template>
  <view class="hr-funnel">
    <view v-for="(row, index) in rows" :key="row.label" class="hr-funnel-row">
      <view class="hr-funnel-head">
        <text class="hr-funnel-label">{{ row.label }}</text>
        <text class="hr-funnel-value" :style="{ color: row.color }">{{ row.value }}</text>
      </view>
      <view class="hr-funnel-track">
        <view
          class="hr-funnel-bar"
          :style="{ width: barWidth(row.value) + '%', background: row.color }"
        ></view>
      </view>
      <view v-if="index < rows.length - 1 && row.value > 0" class="hr-funnel-rate">
        转化率 {{ rate(row.value, rows[index + 1].value) }}%
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
/** 招聘漏斗：横向条形 + 相邻环节转化率 */
import { computed } from "vue";

const props = defineProps<{
  rows: Array<{ label: string; value: number; color: string }>;
}>();

const max = computed(() => Math.max(...props.rows.map((row) => row.value), 1));

function barWidth(value: number): number {
  const ratio = value / max.value;
  return Math.max(ratio * 100, value > 0 ? 3 : 0);
}

function rate(current: number, next: number): string {
  if (!current) return "0";
  return ((next / current) * 100).toFixed(1);
}
</script>

<style scoped>
.hr-funnel-row {
  margin-bottom: 22rpx;
}

.hr-funnel-row:last-child {
  margin-bottom: 0;
}

.hr-funnel-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8rpx;
}

.hr-funnel-label {
  font-size: 25rpx;
  color: #4b5563;
}

.hr-funnel-value {
  font-size: 27rpx;
  font-weight: 700;
}

.hr-funnel-track {
  height: 18rpx;
  border-radius: 9rpx;
  background: #f1f4f7;
  overflow: hidden;
}

.hr-funnel-bar {
  height: 100%;
  border-radius: 9rpx;
  transition: width 0.5s ease;
  min-width: 8rpx;
}

.hr-funnel-rate {
  margin-top: 8rpx;
  font-size: 20rpx;
  color: #9ca3af;
  text-align: right;
}
</style>
