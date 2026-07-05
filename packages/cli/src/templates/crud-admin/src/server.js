import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "public");
const CONTENT_TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

// Swap for a real database — this resets every restart.
let nextId = 1;
const items = [];

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => resolve(raw ? JSON.parse(raw) : {}));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  const json = (status, body) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };

  if (req.url === "/api/items" && req.method === "GET") {
    return json(200, items);
  }

  if (req.url === "/api/items" && req.method === "POST") {
    const body = await readBody(req);
    if (!body.name) return json(400, { error: "name is required" });
    const item = { id: nextId++, name: body.name, notes: body.notes ?? "" };
    items.push(item);
    return json(201, item);
  }

  const deleteMatch = req.method === "DELETE" && req.url.match(/^\/api\/items\/(\d+)$/);
  if (deleteMatch) {
    const id = Number(deleteMatch[1]);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return json(404, { error: "not found" });
    items.splice(idx, 1);
    return json(204, null);
  }

  const path = req.url === "/" ? "/index.html" : req.url;
  try {
    const filePath = join(PUBLIC_DIR, path);
    const fileBody = await readFile(filePath);
    res.writeHead(200, { "content-type": CONTENT_TYPES[extname(filePath)] ?? "text/plain" });
    res.end(fileBody);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

const port = process.env.PORT ?? 3000;
server.listen(port, () => console.log(`CRUD admin running at http://localhost:${port}`));
