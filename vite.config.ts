import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

// 说明：
// - H5 开发模式跑在 5175 端口，与后端 CORS 白名单中的 http://localhost:5175 一致；
//   H5 下所有 /api 请求经此代理转发到服务器，绕开浏览器跨域限制。
// - App（安卓/iOS 原生壳）不存在跨域问题，直接请求 API_BASE（见 src/api/config.ts）。
export default defineConfig({
  plugins: [uni()],
  server: {
    port: 5175,
    proxy: {
      "/api": {
        target: "http://www.zndc.art",
        changeOrigin: true,
      },
    },
  },
});
