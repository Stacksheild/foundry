import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@foundry/ui";
import "@foundry/ui/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
