import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "public");

const CONTENT_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
};

// Replace this with a real data source (a database, an internal API, etc.)
const METRICS = {
  kpis: [
    { label: "Deploy Frequency", value: "4.2 / day", delta: "+12%" },
    { label: "Lead Time", value: "3.1 hrs", delta: "-18%" },
    { label: "Change Failure Rate", value: "8.4%", delta: "-3.2%" },
    { label: "MTTR", value: "22 min", delta: "-35%" },
  ],
  series: [38, 52, 28, 65, 60, 75, 42, 88, 70, 80],
};

const server = createServer(async (req, res) => {
  if (req.url === "/api/metrics") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(METRICS));
    return;
  }

  const path = req.url === "/" ? "/index.html" : req.url;
  try {
    const filePath = join(PUBLIC_DIR, path);
    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": CONTENT_TYPES[extname(filePath)] ?? "text/plain" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

const port = process.env.PORT ?? 3000;
server.listen(port, () => console.log(`Metrics dashboard running at http://localhost:${port}`));
