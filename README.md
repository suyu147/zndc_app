# 职能洞察 · 手机 App（uni-app）

「职能洞察」职业数据平台的手机端应用。**纯前端项目，不含后端代码**，所有功能通过 HTTP API 直接调用已部署在 `http://www.zndc.art` 的后端服务（原 Web 项目的 API 层完全复用，后端一行代码都不用改）。

## 项目结构

```
zndc_app/
├── index.html              # H5 入口模板
├── package.json
├── vite.config.ts          # 含 H5 开发代理（/api -> http://www.zndc.art）
├── tsconfig.json
└── src/
    ├── main.ts             # 应用入口
    ├── App.vue             # 全局样式
    ├── pages.json          # 页面路由 + 底部 TabBar 配置
    ├── manifest.json       # App 打包配置（appid、权限、各平台设置）
    ├── api/
    │   ├── config.ts       # API_BASE（App 直连 IP；H5 走代理）
    │   ├── request.ts      # uni.request 封装：Token 注入、envelope 解析、401 处理
    │   ├── api.ts          # 业务接口（登录/总览/岗位/详情/收藏）
    │   └── types.ts        # 与后端合同对应的 TS 类型
    ├── utils/format.ts     # 数字/薪资格式化
    └── pages/
        ├── login/          # 登录（个人用户 / 企业 HR / 治理管理员 三端入口）
        ├── overview/       # 数据总览
        ├── jobs/           # 岗位列表（搜索、分页、上拉加载、下拉刷新）
        ├── job-detail/     # 岗位详情（技能权重、城市分布、薪资分布、收藏）
        ├── favorites/      # 我的收藏
        └── profile/        # 我的（服务状态检测、退出登录）
```

## 快速开始（H5 浏览器调试）

```bash
npm install --registry=https://registry.npmmirror.com
npm run dev:h5
```

浏览器打开 `http://localhost:5175`，用与网站相同的账号登录（预设：user / enterprise / admin，密码 123456，请以「三端预设账号.txt」为准）。

> H5 跨域说明：后端 CORS 白名单只放行 `localhost:5175`，所以开发端口固定为 5175，
> 请求经 vite 代理转发到服务器，与后端 CORS 配置天然兼容。

## 打包 Android APK（推荐流程）

本项目是标准的 uni-app Vue3 + Vite 工程，最省事的方式是用 **HBuilderX 云打包**（无需安装 Android Studio / JDK）：

1. 下载安装 [HBuilderX](https://www.dcloud.io/hbuilderx.html)（正式版，含 App 开发插件）。
2. 菜单「文件 → 导入 → 从本地目录导入」，选择本文件夹（`zndc_app`）。
   - 也可以只用 HBuilderX 新建一个空白 uni-app 项目，把 `src` 下内容和 `package.json` 等文件对应拷入。
3. 菜单「发行 → 原生App-云打包」：
   - 选择 **Android → APK 包**；
   - 使用 DCloud 公用测试证书（首次测试够用，正式上架换自己的证书）；
   - 勾选/不勾选广告联盟均可（测试可不勾）；
   - 点击「打包」，几分钟后下载 APK，安装到手机即可。
4. App 端请求直连 `http://www.zndc.art`（见 `src/api/config.ts`），无跨域限制。

iOS 打包同理（发行 → 云打包 → iOS，需要 Apple 开发者账号，且 iOS 对 HTTP 明文有限制，见下方注意事项）。

## 直接命令行编译（进阶）

```bash
npm run build:app       # 产出 unpackage/dist/build/app 资源包（配合 HBuilderX 生成离线打包资源）
npm run build:h5        # 产出 dist/build/h5，可部署到任意静态服务器
npm run build:mp-weixin # 编译微信小程序（生产环境不可用，见下）
```

## 重要注意事项（无域名 / 无 SSL 的现状）

| 平台 | 现状 | 结论 |
|------|------|------|
| Android App | uni-app 原生网络请求允许 HTTP 明文，云打包默认可用 | ✅ 完全可用 |
| H5（手机浏览器） | 直接部署到其他域名会因后端 CORS 拒绝；用 IP 访问 H5 页面还会被浏览器标记不安全 | ⚠️ 仅本地调试用 |
| iOS App | ATS 默认禁止 HTTP 明文，需在 HBuilderX 的 manifest 里配置允许任意加载（`manifest.json → app-plus → 加 `NSAllowsArbitraryLoads`，或等后端上 HTTPS） | ⚠️ 可用但受限 |
| 微信小程序 | **正式环境强制要求 HTTPS + 已备案域名**，纯 IP + HTTP 无法配置合法域名（开发工具可勾选「不校验合法域名」临时调试） | ❌ 生产不可用 |
| 应用商店上架 | 主流安卓市场审核通常要求 HTTPS + 软件著作权等资质 | ⚠️ 上架前需上域名 |

**建议的演进路线**：当前用 IP + HTTP 跑通 App → 后续购买域名（服务器在阿里云杭州，国内服务器 80/443 端口需 ICP 备案）→ 域名上挂免费 SSL（如 Let's Encrypt 或阿里云免费证书）→ 把 `src/api/config.ts` 里的地址换成 `https://你的域名/api/v1`，其余代码零修改。

## 如何扩展更多功能

后端还有大量现成接口可直接接入（见后端 `docs/API接口清单-20260814.md`），在 `src/api/api.ts` 里照现有样式加一行即可，例如：

```ts
// 能力图谱
getGraph: (params: Record<string, unknown>) => get("/graph", params),
// 趋势预测
getForecast: (horizon = 3) => get("/forecasts/overview", { horizon }),
// 智能助理（SSE 流式）
// POST /agent/chat —— App 端可用 uni.request 的 enableChunked 或插件实现流式接收
// 模拟面试
startInterview: (payload: {...}) => post("/interview/start", payload),
```

复杂图表（图谱、趋势图）可引入 `uCharts`（uni-app 生态的图表库）渲染。

## 与后端项目的关系

- 本项目**只读**后端 API，不包含、也不修改「职能洞察」项目的任何代码。
- 认证方式与 Web 端一致：`POST /api/v1/auth/login` 换取 Bearer Token，存于 `uni.storage`，过期自动跳登录。
