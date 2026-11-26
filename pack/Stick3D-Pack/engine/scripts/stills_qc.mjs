// QC-mask stills (inputProps qcmask), resumable; frames "a-b" or list. usage: node stills_qc.mjs <engineDir> <compId> <outDir> <scale> <frame,frame,...>
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs"; import path from "node:path";
const [eng, id, out, scale, list] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.join(eng, "src/index.ts"), webpackOverride: (c) => c });
const pw = (() => { try { return fs.readdirSync("/opt/pw-browsers").filter((d) => d.startsWith("chromium_headless_shell")).map((d) => { try { const b = `/opt/pw-browsers/${d}`; const s = fs.readdirSync(b).find((x) => x.startsWith("chrome-headless-shell")); return s ? `${b}/${s}/chrome-headless-shell` : ""; } catch { return ""; } }).find((x) => x && fs.existsSync(x)); } catch { return undefined; } })();
const gl = fs.readFileSync(path.join(eng, "../.gl-flag"), "utf8").trim();
const composition = await selectComposition({ serveUrl, id, inputProps: { qcmask: true }, browserExecutable: pw, chromiumOptions: { gl } });
const frames = list.includes("-") ? (([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i))(list.split("-").map(Number)) : list.split(",").map(Number);
for (const fr of frames) {
  if (fs.existsSync(path.join(out, `f${String(fr).padStart(4, "0")}.png`))) continue;
  await renderStill({ serveUrl, composition, inputProps: { qcmask: true }, timeoutInMilliseconds: 200000, frame: fr, output: path.join(out, `f${String(fr).padStart(4, "0")}.png`), scale: Number(scale), browserExecutable: pw, chromiumOptions: { gl } });
  console.log("still", fr);
}
