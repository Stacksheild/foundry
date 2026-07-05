/** Wraps bundled JS into a self-contained HTML document, suitable for an <iframe src="..."> via a Blob/data URL. */
export function buildPreviewHtml(bundledCode: string): string {
  return `<!doctype html>
<html>
<head><meta charset="UTF-8" /></head>
<body>
<div id="root"></div>
<script>${bundledCode}</script>
</body>
</html>`;
}

/** A blob: URL an <iframe src> can point at directly, entirely client-side. */
export function buildPreviewBlobUrl(bundledCode: string): string {
  const html = buildPreviewHtml(bundledCode);
  const blob = new Blob([html], { type: "text/html" });
  return URL.createObjectURL(blob);
}
