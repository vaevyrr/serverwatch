# ServerWatch

A lightweight local dashboard for checking whether configured game servers and web endpoints respond. It uses Node.js built-ins only and keeps a small in-memory status history while running.

## Features

- TCP checks for services that expose a host and port
- HTTP checks with expected status codes
- Configurable polling interval and per-check timeout
- Local dashboard at `http://127.0.0.1:8787`
- JSON status endpoint at `/api/status`

ServerWatch does not query private game APIs or bypass server protections. A successful TCP check means only that a connection was accepted, not that a game server is fully playable.

## Run

Node.js 18 or newer.

```bash
cp servers.example.json servers.json
node src/index.js --config servers.json
```

Open the dashboard in your browser. Bind address defaults to loopback; change it only if you understand the exposure.

## Configuration

Each entry has a unique `name`, a `type` of `tcp` or `http`, and the matching connection fields. See `servers.example.json`.

## License

MIT
