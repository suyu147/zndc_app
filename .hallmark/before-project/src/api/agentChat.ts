/**
 * 职业助手聊天传输层（后端 /agent/chat 为 SSE 流）
 *
 * - H5：浏览器 fetch + ReadableStream，逐 token 渲染（打字机效果）
 * - App：uni.request 拉取整段 SSE 后统一解析（原生层不支持流式），
 *   期间页面展示“思考中…”占位，结束后一次性填充消息
 *
 * 事件格式（data: {...}\n\n）：type = tool | evidence | token | done
 */
import { API_BASE } from "./config";
import { readSession } from "./request";
import type { AgentChatPayload, AgentChatDone, AgentEvidenceItem } from "./types";

export interface AgentStreamHandlers {
  onToken: (delta: string) => void;
  onEvidence: (items: AgentEvidenceItem[]) => void;
  onTool?: (name: string, status?: string) => void;
  onDone: (done: AgentChatDone) => void;
}

interface SseEvent {
  type?: string;
  content?: string;
  items?: AgentEvidenceItem[];
  name?: string;
  status?: string;
  sessionId?: string;
  modelAvailable?: boolean;
  providerAvailable?: boolean;
  provider?: string;
  providerReason?: string;
  cached?: boolean;
}

function dispatchEvent(item: SseEvent, handlers: AgentStreamHandlers, fallbackSessionId = "") {
  if (item.type === "token" && item.content) {
    handlers.onToken(item.content);
  } else if (item.type === "evidence" && Array.isArray(item.items)) {
    handlers.onEvidence(item.items || []);
  } else if (item.type === "tool") {
    handlers.onTool?.(item.name || "", item.status || "");
  } else if (item.type === "done") {
    handlers.onDone({
      sessionId: item.sessionId || fallbackSessionId,
      modelAvailable: item.modelAvailable ?? item.providerAvailable ?? false,
      providerAvailable: item.providerAvailable,
      provider: item.provider,
      providerReason: item.providerReason,
      cached: item.cached,
    });
  }
}

/** 解析 SSE 文本：按空行分帧，取每帧所有 data: 行 */
function parseSseText(text: string, handlers: AgentStreamHandlers) {
  const frames = text.split(/\r?\n\r?\n/);
  for (const frame of frames) {
    if (!frame) continue;
    const dataLines: string[] = [];
    for (const line of frame.split(/\r?\n/)) {
      const trimmed = line.replace(/^data:\s?/, "");
      if (trimmed && trimmed !== line) dataLines.push(trimmed);
    }
    for (const raw of dataLines) {
      if (!raw || raw === "[DONE]") continue;
      try {
        dispatchEvent(JSON.parse(raw) as SseEvent, handlers);
      } catch {
        // 忽略无法解析的行
      }
    }
  }
}

function decodeUtf8(buffer: ArrayBuffer): string {
  try {
    // @ts-ignore App 与 H5 的 WebView 均提供 TextDecoder
    return new TextDecoder("utf-8").decode(new Uint8Array(buffer));
  } catch {
    const bytes = new Uint8Array(buffer);
    let out = "";
    for (let i = 0; i < bytes.length; i += 8192) {
      out += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 8192)));
    }
    try {
      return decodeURIComponent(escape(out));
    } catch {
      return out;
    }
  }
}

function authHeader(): Record<string, string> {
  const session = readSession();
  return session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {};
}

/**
 * 发起一次助手对话，返回 Promise<AgentChatDone>
 * token / evidence 会通过 handlers 实时回调
 */
export function streamAgentChat(payload: AgentChatPayload, handlers: AgentStreamHandlers): Promise<AgentChatDone> {
  // #ifdef H5
  return streamH5(payload, handlers);
  // #endif
  // #ifndef H5
  return streamApp(payload, handlers);
  // #endif
}

// #ifdef H5
async function streamH5(payload: AgentChatPayload, handlers: AgentStreamHandlers): Promise<AgentChatDone> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 240000);
  try {
    const response = await fetch(`${API_BASE}/agent/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream", ...authHeader() },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) {
      let message = `请求失败(${response.status})`;
      try {
        const body = (await response.json()) as { message?: string; detail?: string };
        message = body?.message || (body?.detail as string) || message;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error("当前浏览器不支持流式读取");
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let fallbackSessionId = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() || "";
      for (const frame of frames) {
        parseSseText(frame + "\n\n", {
          ...handlers,
          onDone: (info) => {
            fallbackSessionId = info.sessionId || fallbackSessionId;
            handlers.onDone(info);
          },
        });
      }
    }
    if (buffer.trim()) parseSseText(buffer + "\n\n", handlers);
    return { sessionId: fallbackSessionId, modelAvailable: true };
  } finally {
    clearTimeout(timer);
  }
}
// #endif

// #ifndef H5
function streamApp(payload: AgentChatPayload, handlers: AgentStreamHandlers): Promise<AgentChatDone> {
  return new Promise<AgentChatDone>((resolve, reject) => {
    uni.request({
      url: `${API_BASE}/agent/chat`,
      method: "POST",
      data: payload as never,
      responseType: "arraybuffer",
      timeout: 240000,
      header: { "Content-Type": "application/json", Accept: "text/event-stream", ...authHeader() },
      success: (res) => {
        const status = res.statusCode || 0;
        if (status >= 200 && status < 300) {
          const text = decodeUtf8(res.data as ArrayBuffer);
          let done: AgentChatDone = { sessionId: "", modelAvailable: true };
          parseSseText(text, {
            ...handlers,
            onDone: (info) => {
              done = info;
              handlers.onDone(info);
            },
          });
          resolve(done);
          return;
        }
        let message = `请求失败(${status})`;
        try {
          const text = decodeUtf8(res.data as ArrayBuffer);
          const body = JSON.parse(text) as { message?: string; detail?: string };
          message = body?.message || (body?.detail as string) || message;
        } catch {
          /* ignore */
        }
        reject(new Error(message));
      },
      fail: (err) => {
        const msg = err?.errMsg || "";
        reject(new Error(msg.includes("timeout") ? "助手思考超时，请重试" : "网络连接失败，请检查网络或服务器状态"));
      },
    });
  });
}
// #endif
