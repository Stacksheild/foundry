import { Fragment, useEffect, useState } from "react";
import { tokens as T } from "../tokens";
import { Icon } from "../icons";
import { StatusBadge } from "../components/StatusBadge";
import type { ScreenId } from "../types";

export const DeployScreen = ({
  setScreen,
  setNavActive,
}: {
  setScreen: (s: ScreenId) => void;
  setNavActive: (id: string) => void;
}) => {
  const [pct, setPct] = useState(42);
  useEffect(() => {
    const t = setInterval(() => setPct((p) => Math.min(p + 1, 100)), 280);
    return () => clearInterval(t);
  }, []);

  const stages = [
    { id: 0, label: "Dev", status: "done" as const, t: "3m 42s" },
    { id: 1, label: "Staging", status: "active" as const, t: "Running…" },
    { id: 2, label: "Production", status: "pending" as const, t: "" },
  ];

  const checks = [
    { l: "Unit tests", s: "pass" as const, d: "247 / 247" },
    { l: "Integration tests", s: "pass" as const, d: "89 / 89" },
    { l: "Security scan", s: "pass" as const, d: "No CVEs found" },
    { l: "Bundle size", s: "pass" as const, d: "142 KB gzip (↓8%)" },
    { l: "Architecture review", s: "pass" as const, d: "Approved by arch-agent" },
    { l: "Smoke tests", s: "run" as const, d: "12 / 15 passed" },
  ];

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "24px 32px" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.textFaint, marginBottom: 4 }}>
          <span
            style={{ color: T.accent, cursor: "pointer" }}
            onClick={() => {
              setScreen("dashboard");
              setNavActive("overview");
            }}
          >
            My Apps
          </span>
          {" / "}kpi-performance-tracker{" / "}Deployments
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Deploy: kpi-performance-tracker</h1>
          <StatusBadge status="deploying" />
        </div>
        <p style={{ color: T.textSub, fontSize: 13, marginTop: 3 }}>
          Triggered by Foundry Agent · PR #142 merged ·{" "}
          <code style={{ fontFamily: "monospace", fontSize: 12, background: T.surface, padding: "1px 5px", borderRadius: 3 }}>
            sha: 3f8a2c1
          </code>
        </p>
      </div>

      {/* Pipeline stepper */}
      <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "20px 40px", marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 22 }}>Deployment Pipeline</div>
        <div style={{ display: "flex", alignItems: "center" }}>
          {stages.map((s, i) => (
            <Fragment key={s.id}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 130 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: s.status === "done" ? T.successBg : s.status === "active" ? T.accentBg : T.surface,
                    border: `2px solid ${s.status === "done" ? T.success : s.status === "active" ? T.accent : T.border}`,
                  }}
                >
                  {s.status === "done" && <Icon name="check" size={16} color={T.success} />}
                  {s.status === "active" && (
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        border: `2px solid ${T.accent}`,
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin .65s linear infinite",
                      }}
                    />
                  )}
                  {s.status === "pending" && <div style={{ width: 9, height: 9, borderRadius: "50%", background: T.border }} />}
                </div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: s.status === "pending" ? T.textFaint : T.text }}>{s.label}</div>
                <div style={{ fontSize: 11.5, color: T.textFaint, fontFamily: "monospace" }}>{s.t || "—"}</div>
              </div>
              {i < stages.length - 1 && (
                <div style={{ flex: 1, height: 2, background: stages[i].status === "done" ? T.success : T.border, marginBottom: 30 }} />
              )}
            </Fragment>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Health checks */}
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "13px 18px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 14 }}>Health Checks</div>
          {checks.map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 18px",
                borderBottom: i < checks.length - 1 ? `1px solid ${T.border}` : "none",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: c.s === "pass" ? T.successBg : c.s === "run" ? T.accentBg : T.dangerBg,
                }}
              >
                {c.s === "pass" && <Icon name="check" size={11} color={T.success} />}
                {c.s === "run" && (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      border: `1.5px solid ${T.accent}`,
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin .65s linear infinite",
                    }}
                  />
                )}
              </div>
              <span style={{ flex: 1, fontSize: 13, color: T.text }}>{c.l}</span>
              <span style={{ fontSize: 12, color: T.textFaint, fontFamily: "monospace" }}>{c.d}</span>
            </div>
          ))}
        </div>

        {/* Canary rollout */}
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "13px 18px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 14 }}>
            Canary Rollout — Staging
          </div>
          <div style={{ padding: 18 }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.textSub, marginBottom: 8 }}>
                <span>Traffic on new version</span>
                <span style={{ fontWeight: 700, color: T.text }}>{pct}%</span>
              </div>
              <div style={{ background: T.surface, borderRadius: 6, height: 10, overflow: "hidden", border: `1px solid ${T.border}` }}>
                <div
                  style={{
                    height: "100%",
                    background: `linear-gradient(90deg, ${T.accent}, #7B81F0)`,
                    width: pct + "%",
                    transition: "width .25s ease",
                    borderRadius: 6,
                  }}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[
                { l: "Error rate", v: "0.0%" },
                { l: "P95 latency", v: "87ms" },
                { l: "Req / sec", v: "142" },
                { l: "Apdex", v: "0.98" },
              ].map((m, i) => (
                <div key={i} style={{ padding: "10px 12px", background: T.surface, borderRadius: 7, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, color: T.textFaint, marginBottom: 3 }}>{m.l}</div>
                  <div style={{ fontWeight: 700, fontSize: 19, color: T.success }}>{m.v}</div>
                </div>
              ))}
            </div>
            <div
              style={{
                padding: "10px 12px",
                background: T.accentBg,
                borderRadius: 7,
                fontSize: 12.5,
                color: T.accentText,
                lineHeight: 1.45,
                marginBottom: 14,
              }}
            >
              <strong>Auto-rollback armed.</strong> If error rate &gt; 2% or P95 &gt; 300ms, Foundry will roll back and
              notify #kpi-tracker-deploys.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{
                  flex: 1,
                  padding: "9px 0",
                  background: T.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Promote to 100%
              </button>
              <button
                style={{
                  padding: "9px 16px",
                  background: T.dangerBg,
                  color: T.danger,
                  border: "none",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Rollback
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
