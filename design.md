# 职能洞察界面规范

## 方向
招聘类移动应用，参考 BOSS 直聘的信息密度与布局习惯，保持自身标识。
Genre: modern-minimal。Shape: app screen。Theme: existing teal brand。

## 设计变量
唯一来源是根目录 tokens.css，App.vue 导入 tokens.css 和 base.css。
白底导航和内容区，浅灰页面分区。青绿色仅用于主操作、选中状态和关键业务值。
文字分三级：--color-ink、--color-secondary、--color-muted。
状态使用 --color-danger、--color-warning、--color-success，配套文字而非只靠颜色。
字体统一系统中文无衬线，不引入外部字体请求。
正文 28rpx，主要列表标题 32–34rpx，辅助信息 22–24rpx。

## 布局
所有页面保持原导航与业务路由。个人端使用原生 Tab；HR 和治理端使用各自的五项导航。
内容以全宽白色列表或业务分区呈现，分区之间 8–16rpx 浅灰间隔。
岗位名称优先，招聘量右对齐，技能用灰底短标签。保留真实数据含义，不将招聘量伪装成薪资。
统计使用平面数字行，不加图标色块。详情使用自然分节，不套多层卡片。
移动端水平内边距 32rpx。桌面预览限制在 520px 并居中。

## 控件
主按钮实色、8rpx 圆角、84–92rpx 高；次操作使用文字或中性色边框。
图标使用 AppIcon 和 src/static/icons 的同一套线性图标，不使用 Emoji。
键盘 focus-visible 清晰，按钮点击目标至少 44px。交互信息支持现有 loading/empty/error 状态。
不新增假指标、不改接口逻辑。HR 数据继续标明演示版。

## 动效
无装饰性动画。仅短时状态反馈，支持 prefers-reduced-motion。

## Exports
tokens.css、base.css、src/components/AppIcon.vue。
