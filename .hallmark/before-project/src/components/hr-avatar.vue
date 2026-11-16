<template>
  <view
    class="hr-avatar"
    :style="{
      width: size + 'rpx',
      height: size + 'rpx',
      background: bg,
      fontSize: size * 0.42 + 'rpx',
      borderRadius: square ? '16rpx' : '50%',
    }"
  >
    {{ text }}
  </view>
</template>

<script setup lang="ts">
/** 首字头像：按名称哈希稳定取色，避免每次渲染颜色跳动 */
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    name: string;
    size?: number;
    /** 圆角方形（企业 logo 用） */
    square?: boolean;
    /** 固定色，传入则不使用哈希取色 */
    color?: string;
  }>(),
  { size: 88, square: false, color: "" },
);

const PALETTE = [
  "linear-gradient(135deg, #00BEBD 0%, #00A6A5 100%)",
  "linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)",
  "linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)",
  "linear-gradient(135deg, #FB923C 0%, #EA580C 100%)",
  "linear-gradient(135deg, #34D399 0%, #059669 100%)",
  "linear-gradient(135deg, #F472B6 0%, #DB2777 100%)",
  "linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)",
  "linear-gradient(135deg, #FBBF24 0%, #D97706 100%)",
];

const text = computed(() => (props.name || "—").trim().slice(0, 1));

const bg = computed(() => {
  if (props.color) return props.color;
  let hash = 0;
  for (let i = 0; i < props.name.length; i += 1) {
    hash = (hash * 31 + props.name.charCodeAt(i)) % 9973;
  }
  return PALETTE[hash % PALETTE.length];
});
</script>

<style scoped>
.hr-avatar {
  color: #ffffff;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
</style>
