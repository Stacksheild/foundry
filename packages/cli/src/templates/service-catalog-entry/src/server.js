import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseFlatYaml } from "./yaml-lite.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVICE_YAML_PATH = join(__dirname, "..", "service.yaml");

async function loadService() {
  const raw = await readFile(SERVICE_YAML_PATH, "utf-8");
  return parseFlatYaml(raw);
}

const server = createServer(async (req, res) => {
  const service = await loadService();

  if (req.url === "/api/service") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(service));
    return;
  }

  const rows = Object.entries(service)
    .map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`)
    .join("");

  res.writeHead(200, { "content-type": "text/html" });
  res.end(`<!doctype html>
<html><head><title>${service.name ?? "Service"}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 32px; background: #fafafa; }
  table { border-collapse: collapse; background: #fff; border: 1px solid #e8e8e8; border-radius: 8px; overflow: hidden; }
  th, td { padding: 10px 16px; text-align: left; border-bottom: 1px solid #f0f0f0; }
  th { color: #888; font-weight: 600; font-size: 12px; text-transform: uppercase; }
</style></head>
<body><h1>${service.name ?? "Service"}</h1><table>${rows}</table></body></html>`);
});

const port = process.env.PORT ?? 3000;
server.listen(port, () => console.log(`Service catalog entry running at http://localhost:${port}`));
