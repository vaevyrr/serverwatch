import { readFile } from "node:fs/promises";
import http from "node:http";
import { runChecks } from "./monitor.js";

const args = process.argv.slice(2);
const configPath = args[args.indexOf("--config") + 1] || "servers.json";
const config = JSON.parse(await readFile(configPath, "utf8"));
if (!Array.isArray(config.checks) || config.checks.some(c => !c.name || !["tcp", "http"].includes(c.type))) {
  throw new Error("config must contain checks with a name and type tcp/http");
}
const history = new Map();
let latest = [];

async function poll() {
  latest = await runChecks(config);
  for (const result of latest) {
    const rows = history.get(result.name) ?? [];
    rows.push(result);
    history.set(result.name, rows.slice(-20));
  }
  console.log(new Date().toISOString(), latest.map(x => `${x.name}: ${x.online ? "up" : "down"}`).join(" | "));
}

const page = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ServerWatch</title><style>
body{font:15px system-ui;background:#101318;color:#e7eaf0;margin:40px auto;max-width:900px;padding:0 18px}
h1{font-size:28px}.muted{color:#9aa4b2}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
article{background:#1a2029;border:1px solid #303a48;border-radius:10px;padding:16px}
.state{font-weight:700}.up{color:#70d6a0}.down{color:#ff8d8d}code{color:#b9c8dc}
</style></head><body><h1>ServerWatch</h1><p class="muted">Local endpoint monitor · refreshes every 10 seconds</p><main id="cards">Loading…</main>
<script>async function load(){const r=await fetch('/api/status');const d=await r.json();document.querySelector('#cards').innerHTML='<div class="grid">'+d.map(x=>'<article><h2>'+x.name.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))+'</h2><p class="state '+(x.online?'up':'down')+'">'+(x.online?'ONLINE':'OFFLINE')+'</p><p>'+x.latencyMs+' ms</p><p class="muted">'+(x.error||('Checked '+x.checkedAt))+'</p></article>').join('')+'</div>'}load();setInterval(load,10000)</script></body></html>`;

const server = http.createServer((req, res) => {
  if (req.url === "/api/status") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(latest)); return;
  }
  if (req.url === "/" || req.url === "/index.html") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(page); return;
  }
  res.writeHead(404); res.end("Not found");
});
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 8787);
await poll();
server.listen(port, host, () => console.log(`Dashboard: http://${host}:${port}`));
const interval = Math.max(5, Number(config.intervalSeconds || 30)) * 1000;
setInterval(poll, interval);
