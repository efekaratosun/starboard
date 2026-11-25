import http from "http";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const chrome =
  process.env.CHROME ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const srv = http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split("?")[0]);
  if (u === "/" || u === "/tests" || u === "/tests/") u = "/tests/index.html";
  const f = path.join(root, u.replace(/^\//, "").replace(/\//g, path.sep));
  fs.readFile(f, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    const ext = path.extname(f);
    const types = {
      ".html": "text/html; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".json": "application/json",
      ".css": "text/css",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".ico": "image/x-icon",
      ".webmanifest": "application/manifest+json",
    };
    res.writeHead(200, { "Content-Type": types[ext] || "text/plain" });
    res.end(data);
  });
});

await new Promise((resolve, reject) => {
  srv.listen(0, () => resolve());
  srv.on("error", reject);
});
const port = srv.address().port;
const url = `http://127.0.0.1:${port}/tests/index.html`;

const html = await new Promise((resolve, reject) => {
  const proc = spawn(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--virtual-time-budget=120000",
    "--dump-dom",
    url,
  ]);
  let out = "";
  proc.stdout.on("data", (d) => (out += d));
  proc.stderr.on("data", () => {});
  proc.on("error", reject);
  proc.on("close", (code) => {
    if (code !== 0 && !out) reject(new Error("chrome exit " + code));
    else resolve(out);
  });
});

srv.close();

const m = html.match(/SONUC:\s*(\d+)\s*gecti,\s*(\d+)\s*kaldi/);
const pass = html.includes('data-result="pass"');
if (m) console.log(`SONUC: ${m[1]} gecti, ${m[2]} kaldi`);
else {
  const pre = html.match(/<pre id="out">([\s\S]*?)<\/pre>/);
  console.log(pre ? pre[1].replace(/<[^>]+>/g, "").slice(-500) : html.slice(0, 500));
}
process.exit(pass && m && m[2] === "0" ? 0 : 1);