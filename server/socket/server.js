/**
 * Chat socket server (deploy to Render as a Node web service).
 *
 * - Clients connect with  wss://host?token=<sanctum token>
 * - The Next.js API broadcasts saved messages by POSTing to /broadcast with the
 *   shared SOCKET_SECRET header.
 */
import http from "node:http";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 3000;
const SOCKET_SECRET = process.env.SOCKET_SECRET || "";
const API_URL = (process.env.API_URL || "").replace(/\/+$/, "");

const clients = new Set();

function broadcast(message) {
  const frame = JSON.stringify({ type: "message", message });
  for (const socket of clients) {
    if (socket.readyState === socket.OPEN) socket.send(frame);
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, clients: clients.size }));
    return;
  }

  if (req.method === "POST" && req.url === "/broadcast") {
    if (SOCKET_SECRET && req.headers["x-socket-secret"] !== SOCKET_SECRET) {
      res.writeHead(401).end("unauthorized");
      return;
    }
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      try {
        const payload = JSON.parse(raw);
        if (payload?.message) broadcast(payload.message);
        res.writeHead(200).end("ok");
      } catch {
        res.writeHead(400).end("bad request");
      }
    });
    return;
  }

  res.writeHead(404).end("not found");
});

const wss = new WebSocketServer({ server });

/** Ask the Next.js API who owns this token. Returns null when invalid or server down. */
async function resolveUser(token) {
  if (!API_URL || !token) return null;
  try {
    const res = await fetch(`${API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

wss.on("connection", async (socket, req) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const token = url.searchParams.get("token");
  const user = await resolveUser(token);

  if (!user) {
    socket.close(4001, "unauthorized");
    return;
  }

  clients.add(socket);
  socket.send(JSON.stringify({ type: "ready" }));

  socket.on("close", () => clients.delete(socket));
  socket.on("error", () => clients.delete(socket));
});

// Drop dead connections so the client sees "offline" and starts retrying.
setInterval(() => {
  for (const socket of clients) {
    if (socket.readyState !== socket.OPEN) clients.delete(socket);
    else socket.ping();
  }
}, 30000);

server.listen(PORT, () => {
  console.log(`chat socket listening on :${PORT}`);
});
