import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { App } from "@foundry/ui";
import "@foundry/ui/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App apiBaseUrl={import.meta.env.VITE_API_BASE_URL} apiToken={import.meta.env.VITE_API_TOKEN} />
    <Analytics />
  </StrictMode>,
);
