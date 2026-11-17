# 职能洞察界面规范

## 方向
招聘类移动应用，参考成熟招聘产品的信息密度、青绿搜索页头与岗位列表习惯，保留职能洞察自己的标识。
Genre: modern-minimal。Shape: app screen。Theme: existing teal brand。

## 设计变量
唯一来源是根目录 tokens.css，App.vue 导入 tokens.css 和 base.css。
主色 --color-primary 用于操作、选中状态和关键业务值；--color-brand 保留原品牌色。
页头采用 --color-brand-wash 薄荷底，内容使用白色和 --color-surface 浅灰分层，不使用装饰性渐变。
辅助的冷蓝、暖棕仅区分职业工具和岗位文字标识，不代表虚构公司或业务状态。
文字分三级：--color-ink、--color-secondary、--color-muted。
字体统一系统中文无衬线，不引入外部字体请求。
主要列表标题 32–34rpx，正文 28rpx，辅助信息 22–24rpx。

## 布局
所有页面保持原导航与业务路由。个人端使用原生 Tab；HR 和治理端使用各自的五项导航。
搜索与页头为连续浅薄荷面；列表在浅灰底上使用白色业务卡片，不嵌套装饰卡片。
卡片外边距 24rpx、内边距 28rpx、半径由 --radius-card 统一控制。
页面水平内边距 32rpx；桌面预览限制在 520px 并居中，不绘制手机边框。
首页使用真实统计、职业工具快捷入口和推荐岗位；岗位探索提供搜索和收藏入口。
岗位名称优先，招聘量右对齐，技能用中性短标签，趋势保留文字和真实数据。
统计使用平面数字行，不加图标色块。不将招聘量伪装成薪资。

## 控件
主按钮实色，圆角由 --radius-input 控制；次操作使用文字或中性色边框。
图标使用 AppIcon 和 src/static/icons 的同一套线性图标，不使用 Emoji。
键盘 focus-visible 清晰且即时，点击目标尽量至少 44px，遵循现有 loading/empty/error 状态。
不新增假指标，不改接口逻辑。HR 数据继续标明演示版。
颜色在 pages.json 中的原生导航配置是 tokens.css 对应变量的静态导出。

## 动效
无装饰性动画。仅短时状态反馈，支持 prefers-reduced-motion。

## Exports
tokens.css、base.css、src/components/AppIcon.vue。
