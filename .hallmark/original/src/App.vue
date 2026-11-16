<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app";

onLaunch(() => {
  console.log("职能洞察 App 启动");
});
</script>

<style>
/* 全局公共样式 —— BOSS 直聘青绿风格 */
page {
  background-color: #f5f6f8;
  font-size: 28rpx;
  color: #22262e;
  font-family: -apple-system, "PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* 通用卡片：紧凑圆角、白底 */
.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 16rpx 20rpx;
}

/* 通用主按钮 */
.btn-primary {
  background: linear-gradient(135deg, #00bebd 0%, #00a6a5 100%);
  color: #ffffff;
  border-radius: 48rpx;
  font-size: 32rpx;
  height: 92rpx;
  line-height: 92rpx;
  text-align: center;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(0, 190, 189, 0.16);
}

.btn-primary[disabled] {
  opacity: 0.6;
  color: #ffffff;
}

/* 次按钮 */
.btn-secondary {
  background: #e5f7f7;
  color: #00bebd;
  border-radius: 48rpx;
  font-size: 30rpx;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border: none;
  width: 100%;
}

/* 幽灵按钮 */
.btn-plain {
  background: transparent;
  color: #8a94a6;
  border-radius: 48rpx;
  font-size: 30rpx;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border: 1rpx solid #ebedf2;
  width: 100%;
}

/* 列表单元格 */
.cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f2f4f7;
  font-size: 29rpx;
}

.cell:last-child {
  border-bottom: none;
}

.cell-value {
  color: #8a94a6;
  font-size: 26rpx;
}

/* 骨架/加载文字 */
.loading-text {
  text-align: center;
  color: #8a94a6;
  font-size: 26rpx;
  padding: 30rpx 0;
}

.empty-text {
  text-align: center;
  color: #8a94a6;
  font-size: 26rpx;
  padding: 120rpx 0;
}

/* 通用区块标题 */
.section-title {
  font-size: 30rpx;
  font-weight: 700;
  margin-bottom: 20rpx;
  color: #22262e;
}

.section-title::before {
  content: "";
  display: inline-block;
  width: 6rpx;
  height: 24rpx;
  background: #00bebd;
  border-radius: 3rpx;
  margin-right: 12rpx;
  vertical-align: middle;
}

/* 列表项箭头 */
.arrow-right {
  color: #c2c9d6;
  font-size: 32rpx;
}

/* ==========================================================
   HR 端（招聘方 / B 端）全局样式
   统一 hr- 前缀，与求职端样式互不干扰
   ========================================================== */

/* 页面容器：为自建底部导航预留空间 */
.hr-page {
  min-height: 100vh;
  background: #f5f7f8;
  padding-bottom: calc(128rpx + env(safe-area-inset-bottom));
}

/* 非 Tab 的详情页面容器 */
.hr-page--plain {
  min-height: 100vh;
  background: #f5f7f8;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

/* 卡片 */
.hr-card {
  background: #ffffff;
  border-radius: 18rpx;
  padding: 26rpx 24rpx;
  margin: 20rpx 20rpx 0;
  box-shadow: 0 2rpx 12rpx rgba(15, 40, 45, 0.04);
}

/* 区块标题 */
.hr-sec-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 29rpx;
  font-weight: 700;
  color: #1a1d24;
  margin-bottom: 22rpx;
}

.hr-sec-title::before {
  content: "";
  display: inline-block;
  width: 6rpx;
  height: 24rpx;
  background: #00a6a5;
  border-radius: 3rpx;
  margin-right: 12rpx;
}

.hr-sec-title-main {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.hr-sec-more {
  font-size: 23rpx;
  font-weight: 400;
  color: #9ca3af;
  flex-shrink: 0;
  padding-left: 16rpx;
}

/* 通用标签 */
.hr-tag {
  display: inline-block;
  font-size: 21rpx;
  color: #6b7280;
  background: #f1f4f7;
  border-radius: 6rpx;
  padding: 6rpx 14rpx;
  margin: 0 12rpx 10rpx 0;
}

.hr-tag--primary {
  color: #00a6a5;
  background: #e5f7f7;
}

.hr-tag--danger {
  color: #e5484d;
  background: rgba(229, 72, 77, 0.08);
}

.hr-tag--success {
  color: #2da44e;
  background: rgba(45, 164, 78, 0.08);
}

.hr-tag--warn {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

/* 状态徽标（带边框，用于职位状态、候选人阶段） */
.hr-badge {
  display: inline-block;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  line-height: 1.5;
  white-space: nowrap;
}

.hr-badge--open {
  color: #00a6a5;
  background: #e5f7f7;
  border: 1rpx solid rgba(0, 166, 165, 0.24);
}

.hr-badge--paused {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border: 1rpx solid rgba(245, 158, 11, 0.24);
}

.hr-badge--closed,
.hr-badge--draft {
  color: #9ca3af;
  background: #f1f4f7;
  border: 1rpx solid #e5e9ef;
}

.hr-badge--new {
  color: #ff7a45;
  background: rgba(255, 122, 69, 0.1);
  border: 1rpx solid rgba(255, 122, 69, 0.24);
}

.hr-badge--screening {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
  border: 1rpx solid rgba(59, 130, 246, 0.22);
}

.hr-badge--interview {
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.08);
  border: 1rpx solid rgba(139, 92, 246, 0.22);
}

.hr-badge--offer {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border: 1rpx solid rgba(245, 158, 11, 0.24);
}

.hr-badge--hired {
  color: #2da44e;
  background: rgba(45, 164, 78, 0.08);
  border: 1rpx solid rgba(45, 164, 78, 0.22);
}

.hr-badge--rejected {
  color: #9ca3af;
  background: #f1f4f7;
  border: 1rpx solid #e5e9ef;
}

.hr-badge--urgent {
  color: #ffffff;
  background: linear-gradient(135deg, #ff9a5a 0%, #f5484d 100%);
  border: none;
}

/* HR 主按钮 */
.hr-btn {
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 44rpx;
  font-size: 29rpx;
  text-align: center;
  border: none;
  box-sizing: border-box;
}

.hr-btn::after {
  border: none;
}

.hr-btn--primary {
  background: linear-gradient(135deg, #00bebd 0%, #00a6a5 100%);
  color: #ffffff;
  box-shadow: 0 8rpx 20rpx rgba(0, 166, 165, 0.22);
}

.hr-btn--primary[disabled] {
  opacity: 0.55;
  color: #ffffff;
}

.hr-btn--ghost {
  background: #ffffff;
  color: #4b5563;
  border: 1rpx solid #e5e9ef;
}

.hr-btn--danger {
  background: #ffffff;
  color: #e5484d;
  border: 1rpx solid rgba(229, 72, 77, 0.3);
}

.hr-btn--sm {
  height: 62rpx;
  line-height: 62rpx;
  font-size: 25rpx;
  border-radius: 31rpx;
  padding: 0 28rpx;
}

/* 空状态 / 加载 */
.hr-empty {
  text-align: center;
  padding: 100rpx 0;
  color: #9ca3af;
  font-size: 25rpx;
}

.hr-loading {
  text-align: center;
  padding: 40rpx 0;
  color: #9ca3af;
  font-size: 25rpx;
}

/* 键值行 */
.hr-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #f1f4f7;
  font-size: 26rpx;
}

.hr-row:last-child {
  border-bottom: none;
}

.hr-row-label {
  color: #6b7280;
  flex-shrink: 0;
}

.hr-row-value {
  color: #1a1d24;
  font-weight: 500;
  text-align: right;
  padding-left: 24rpx;
}

/* 底部固定操作栏 */
.hr-action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 800;
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1rpx solid #eef1f5;
  box-shadow: 0 -6rpx 24rpx rgba(15, 40, 45, 0.06);
}

/* 悬浮发布按钮 */
.hr-fab {
  position: fixed;
  right: 32rpx;
  bottom: calc(148rpx + env(safe-area-inset-bottom));
  z-index: 850;
  width: 104rpx;
  height: 104rpx;
  border-radius: 52rpx;
  background: linear-gradient(135deg, #00bebd 0%, #00a6a5 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 28rpx rgba(0, 166, 165, 0.36);
  font-size: 52rpx;
  font-weight: 300;
  line-height: 1;
  padding-bottom: 4rpx;
}
</style>
