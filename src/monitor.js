import net from "node:net";

export async function runCheck(check, timeoutMs = 4000) {
  const started = Date.now();
  try {
    if (check.type === "http") {
      const response = await fetch(check.url, { signal: AbortSignal.timeout(timeoutMs) });
      const expected = check.expectedStatus ?? 200;
      return { name: check.name, type: check.type, online: response.status === expected,
        status: response.status, expectedStatus: expected, latencyMs: Date.now() - started,
        checkedAt: new Date().toISOString(), error: null };
    }
    if (check.type === "tcp") {
      await new Promise((resolve, reject) => {
        const socket = net.createConnection({ host: check.host, port: check.port });
        const timer = setTimeout(() => socket.destroy(new Error("connection timed out")), timeoutMs);
        socket.once("connect", () => { clearTimeout(timer); socket.end(); resolve(); });
        socket.once("error", error => { clearTimeout(timer); reject(error); });
      });
      return { name: check.name, type: check.type, online: true, latencyMs: Date.now() - started,
        checkedAt: new Date().toISOString(), error: null };
    }
    throw new Error(`unknown check type: ${check.type}`);
  } catch (error) {
    return { name: check.name, type: check.type, online: false, latencyMs: Date.now() - started,
      checkedAt: new Date().toISOString(), error: error.message };
  }
}

export async function runChecks(config) {
  return Promise.all(config.checks.map(check => runCheck(check, config.timeoutMs ?? 4000)));
}
