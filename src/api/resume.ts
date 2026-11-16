/**
 * 个人简历服务层
 *
 * 直连「职能洞察」网站后端 API（http://www.zndc.art/api/v1）：
 *   POST /resumes           上传简历（multipart/form-data，字段名 file）→ 返回 { taskId }
 *   GET  /tasks/{taskId}    轮询解析进度，completed 时 result 即 ResumeResult
 *   GET  /me/resumes        当前用户简历列表
 *   DELETE /me/resumes/{id} 删除简历
 *
 * 文件上传走 uni.uploadFile（与 src/admin/api.ts 的 createDataset 同一套实现），
 * 其余 JSON 接口复用 @/api/request 的 get/del 与统一信封解析。
 */
import { API_BASE } from "./config";
import { readSession, get, del } from "./request";
import type { ResumeResult } from "./types";

/** 调起系统文件选择后得到的临时文件信息 */
export interface ChosenResumeFile {
  filePath: string;
  name: string;
}

/** 解析任务轮询返回的状态体 */
interface ResumeTaskState {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  result?: ResumeResult;
  error?: string;
}

const ALLOWED_EXT = ["pdf", "docx", "txt", "md"];
const POLL_INTERVAL_MS = 500;
const POLL_MAX_ATTEMPTS = 240; // 240 * 0.5s = 120s 超时保护

function authHeader(): Record<string, string> {
  const session = readSession();
  return session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {};
}

function buildUrl(path: string): string {
  return `${API_BASE}${path}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 解析后端信封：成功返回 data，失败抛错 */
function unwrapEnvelope<T>(res: { statusCode: number; data: unknown }): T {
  const body = res.data as Record<string, unknown>;
  if (res.statusCode >= 200 && res.statusCode < 300) {
    if (body && typeof body === "object" && "code" in body) {
      if (body.code === 0) return body.data as T;
      throw new Error((body.message as string) || "请求失败");
    }
    return res.data as T;
  }
  if (res.statusCode === 401) throw new Error("登录状态无效或已过期");
  const detail =
    (body && typeof body === "object" && (body.message || body.detail)) || `请求失败(${res.statusCode})`;
  throw new Error(String(detail));
}

/**
 * 调起系统文件选择（仅 PDF / DOCX / TXT / MD）
 * @throws 用户取消或未选中文件时 reject
 */
export function chooseResumeFile(): Promise<ChosenResumeFile> {
  return new Promise((resolve, reject) => {
    uni.chooseFile({
      count: 1,
      type: "all",
      extension: ALLOWED_EXT,
      success: (res) => {
        const path = (res.tempFilePaths && res.tempFilePaths[0]) || "";
        if (!path) {
          reject(new Error("未选择文件"));
          return;
        }
        const tempFiles = (res as unknown as { tempFiles?: Array<{ name?: string }> }).tempFiles;
        const name =
          (tempFiles && tempFiles[0] && tempFiles[0].name) ||
          path.split("/").pop() ||
          "resume";
        resolve({ filePath: path, name });
      },
      fail: () => reject(new Error("未选择文件")),
    });
  });
}

/** 轮询解析任务直到完成或失败 */
async function pollTask(taskId: string, onProgress?: (pct: number) => void): Promise<ResumeResult> {
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt += 1) {
    await delay(POLL_INTERVAL_MS);
    const state = await get<ResumeTaskState>(`/tasks/${encodeURIComponent(taskId)}`, undefined, {
      auth: true,
    });
    if (onProgress) onProgress(state.progress || 0);
    if (state.status === "completed" && state.result) return state.result;
    if (state.status === "failed") throw new Error(state.error || "简历解析失败");
  }
  throw new Error("简历解析超时，请稍后重试");
}

/**
 * 上传简历并等待解析完成，返回结构化结果。
 * @param onProgress 可选进度回调（0~100）
 */
export function uploadResume(
  file: ChosenResumeFile,
  onProgress?: (pct: number) => void,
): Promise<ResumeResult> {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: buildUrl("/resumes"),
      filePath: file.filePath,
      name: "file",
      header: authHeader(),
      success: (res) => {
        try {
          const raw = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
          const env = unwrapEnvelope<{ taskId: string }>({ statusCode: res.statusCode, data: raw });
          pollTask(env.taskId, onProgress)
            .then(resolve)
            .catch(reject);
        } catch (error) {
          reject(error);
        }
      },
      fail: (err) =>
        reject(new Error(err && err.errMsg && err.errMsg.includes("timeout") ? "上传超时，请检查网络" : "上传失败，请检查文件或网络")),
    });
  });
}

/** 获取当前用户已上传的简历列表 */
export function getMyResumes(limit = 20): Promise<ResumeResult[]> {
  return get<{ items: ResumeResult[]; total: number }>("/me/resumes", { limit }, { auth: true }).then(
    (data) => data.items || [],
  );
}

/** 删除一份简历 */
export function deleteMyResume(resumeId: string): Promise<void> {
  return del<void>(`/me/resumes/${encodeURIComponent(resumeId)}`);
}
