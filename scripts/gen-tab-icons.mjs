/**
 * 生成 BOSS 风格 tabBar 图标（零依赖：手写 PNG 编码 + zlib）
 * 用法: node scripts/gen-tab-icons.mjs
 * 输出: src/static/tab/{home,job,star,mine,diagnosis,assistant}.png 与对应 -active.png
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SIZE = 81; // 输出像素
const SS = 4; // 超采样
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "src", "static", "tab");
mkdirSync(outDir, { recursive: true });

// ---------- 调色 ----------
const GRAY = [143, 149, 161]; // 未选中 #8F95A1
const TEAL = [0, 190, 189]; // 选中 #00BEBD

// ---------- 形状判定（坐标中心 0,0，半尺寸约 34/SS） ----------
const S = 34; // 图形半宽（超采样坐标系下再乘 SS）

function inHome(x, y) {
  // 屋顶三角
  const roofH = S * 0.62;
  const yRoofTop = -S * 0.85;
  const yRoofBot = yRoofTop + roofH;
  if (y >= yRoofTop && y <= yRoofBot) {
    const t = (y - yRoofTop) / roofH;
    const half = S * 0.92 * (1 - t * 0.42);
    if (Math.abs(x) <= half) return true;
  }
  // 房体
  if (y > yRoofBot && y <= S) {
    const half = S * 0.82;
    if (Math.abs(x) <= half) {
      // 门洞挖空
      if (y >= S * 0.45 && Math.abs(x) <= S * 0.28) return false;
      return true;
    }
  }
  return false;
}

function inJob(x, y) {
  // 提手
  const hw = S * 0.34;
  if (y >= -S * 0.95 && y <= -S * 0.42 && Math.abs(x) <= hw) return true;
  // 包体（圆角矩形近似）
  const rx = S * 0.88, ry = S * 0.62;
  const yTop = -S * 0.42, yBot = S * 0.98;
  if (y >= yTop && y <= yBot) {
    const yy = Math.max(yTop, Math.min(y, yBot));
    const nx = Math.abs(x);
    // 左右圆角半径 r=S*0.22
    const r = S * 0.22;
    const rightEdge = rx - r + (y <= yTop + r ? Math.sqrt(Math.max(0, r * r - (y - (yTop + r)) ** 2)) : y >= yBot - r ? Math.sqrt(Math.max(0, r * r - (y - (yBot - r)) ** 2)) : r);
    const _ = yy;
    if (nx <= rightEdge) return true;
  }
  return false;
}

// 五角星顶点
function starPoints() {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? S * 1.0 : S * 0.45;
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([Math.cos(ang) * r, Math.sin(ang) * r]);
  }
  return pts;
}
const STAR = starPoints();
function inPoly(pts, x, y) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inMine(x, y) {
  // 头
  const hr = S * 0.34;
  const hcY = -S * 0.42;
  if ((x / hr) ** 2 + ((y - hcY) / hr) ** 2 <= 1) return true;
  // 身体半椭圆
  const by = y - S * 0.28;
  if (by > 0) {
    const halfW = S * 0.78 * Math.sqrt(Math.max(0, 1 - (by / (S * 0.9)) ** 2));
    if (Math.abs(x) <= halfW) return true;
  }
  return false;
}

// 点到线段的最短距离（用于描边类图形，如对勾）
function segDist(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay;
  const wx = px - ax, wy = py - ay;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return Math.hypot(px - ax, py - ay);
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) return Math.hypot(px - bx, py - by);
  const t = c1 / c2;
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
}

function inDiag(x, y) {
  // 能力诊断：对勾徽章 = 粗圆环 + 内部对勾
  const r = Math.hypot(x, y);
  if (r <= S * 0.98 && r >= S * 0.78) return true;
  const w = S * 0.21;
  const p1 = [-S * 0.30, S * 0.10];
  const p2 = [-S * 0.02, S * 0.36];
  const p3 = [S * 0.42, -S * 0.32];
  const d = Math.min(
    segDist(x, y, p1[0], p1[1], p2[0], p2[1]),
    segDist(x, y, p2[0], p2[1], p3[0], p3[1])
  );
  return d <= w;
}

function inAsst(x, y) {
  // 职业助手：对话气泡 = 圆角矩形主体 + 左下尾巴
  const X = S * 0.94;
  const yTop = -S * 0.82;
  const yBot = S * 0.54;
  const rr = S * 0.3;
  if (y >= yTop && y <= yBot) {
    const nx = Math.abs(x);
    if (nx <= X - rr) return true;
    if (nx <= X) {
      if (y < yTop + rr) return (nx - (X - rr)) ** 2 + (y - (yTop + rr)) ** 2 <= rr * rr;
      if (y > yBot - rr) return (nx - (X - rr)) ** 2 + (y - (yBot - rr)) ** 2 <= rr * rr;
      return true;
    }
  }
  const A = [-S * 0.26, yBot];
  const B = [-S * 0.92, S * 1.04];
  const C = [-S * 0.6, yBot];
  return inPoly([A, B, C], x, y);
}

const SHAPES = {
  home: inHome,
  job: inJob,
  star: (x, y) => inPoly(STAR, x, y),
  mine: inMine,
  diagnosis: inDiag,
  assistant: inAsst,
};

// ---------- PNG 编码 ----------
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(pixels, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------- 渲染 ----------
function renderIcon(shape, color) {
  const px = Buffer.alloc(SIZE * SIZE * 4);
  const hit = new Float64Array(SIZE * SIZE);
  for (let sy = 0; sy < SIZE * SS; sy++) {
    for (let sx = 0; sx < SIZE * SS; sx++) {
      const x = (sx - (SIZE * SS) / 2 + 0.5) / SS;
      const y = (sy - (SIZE * SS) / 2 + 0.5) / SS;
      if (shape(x, y)) hit[Math.floor(sy / SS) * SIZE + Math.floor(sx / SS)] += 1;
    }
  }
  const max = SS * SS;
  for (let i = 0; i < SIZE * SIZE; i++) {
    const a = Math.min(1, hit[i] / max);
    px[i * 4] = color[0];
    px[i * 4 + 1] = color[1];
    px[i * 4 + 2] = color[2];
    px[i * 4 + 3] = Math.round(a * 255);
  }
  return encodePng(px, SIZE);
}

for (const [name, fn] of Object.entries(SHAPES)) {
  writeFileSync(join(outDir, `${name}.png`), renderIcon(fn, GRAY));
  writeFileSync(join(outDir, `${name}-active.png`), renderIcon(fn, TEAL));
  console.log(`generated ${name}.png / ${name}-active.png`);
}
console.log("done ->", outDir);
