import { useEffect, useState } from "react";
import { tokens as T } from "../tokens";
import { Icon } from "../icons";
import type { Session } from "../types";

const BUILD_STEPS = [
  { text: "Reading codebase context & service catalog", t: "0.4s" },
  { text: "Selecting golden path: React + design system + Analytics API", t: "0.6s" },
  { text: "Generating component tree and data schema", t: "1.1s" },
  { text: "Wiring UI components", t: "0.9s" },
  { text: "Running type-check + ESLint (0 errors)", t: "0.5s" },
  { text: "Deploying to dev environment", t: "4.2s" },
];

const CODE_LINES = [
  'import { useMetrics } from "@acme/analytics-sdk";',
  'import { Card, BarList, Table } from "@acme/design-system";',
  "",
  "export const TeamProductivityDash = () => {",
  '  const { dora, velocity, bottlenecks } = useMetrics("team-productivity");',
  "",
  "  return (",
  "    <PageLayout title=\"Team Productivity\">",
  "      <Card title=\"Deploy frequency — 30 days\">",
  "        <TrendChart data={dora.deployFrequency} />",
  "      </Card>",
  "      <BarList title=\"Velocity by squad\" items={velocity} />",
  "      <Table title=\"Top bottlenecks this week\" rows={bottlenecks} />",
  "    </PageLayout>",
  "  );",
  "};",
];

const CodePane = () => (
  <div style={{ background: "#1E1E2E", height: "100%", overflow: "auto", padding: "14px 18px" }}>
    <div style={{ fontSize: 11.5, color: "#9CA0B8", marginBottom: 10, fontFamily: "monospace" }}>
      src/screens/TeamProductivityDash.tsx
    </div>
    {CODE_LINES.map((line, i) => (
      <div key={i} style={{ display: "flex", gap: 14, fontFamily: "monospace", fontSize: 12.5, lineHeight: 1.7 }}>
        <span style={{ color: "#5A5E78", width: 20, textAlign: "right", flexShrink: 0, userSelect: "none" }}>{i + 1}</span>
        <span style={{ color: line.startsWith("import") ? "#89B4FA" : "#CDD6F4", whiteSpace: "pre" }}>{line}</span>
      </div>
    ))}
  </div>
);

const DEV_LOGS = [
  { t: "14:02:08", msg: "vite v5.4 dev server running at team-prod-dash.foundry.app", level: "info" },
  { t: "14:02:08", msg: "hmr connected — 47 modules transformed in 420ms", level: "info" },
  { t: "14:02:11", msg: "GET /api/metrics/dora 200 12ms", level: "info" },
  { t: "14:02:11", msg: "GET /api/metrics/velocity 200 9ms", level: "info" },
  { t: "14:02:14", msg: "type-check clean · eslint clean (0 warnings)", level: "info" },
  { t: "14:02:19", msg: "GET /api/metrics/bottlenecks 200 31ms", level: "info" },
  { t: "14:02:23", msg: "deployed to dev — health check /readyz 200", level: "success" },
];

const LogsPane = () => (
  <div style={{ background: T.bg, height: "100%", overflow: "auto", padding: "12px 18px" }}>
    {DEV_LOGS.map((l, i) => (
      <div key={i} style={{ display: "flex", gap: 12, fontFamily: "monospace", fontSize: 12.5, lineHeight: 1.9 }}>
        <span style={{ color: T.textFaint, flexShrink: 0 }}>{l.t}</span>
        <span style={{ color: l.level === "success" ? T.success : T.textMid }}>{l.msg}</span>
      </div>
    ))}
  </div>
);

const MiniPreviewDash = () => (
  <div style={{ background: "#F9F9FB", height: "100%", overflow: "auto", padding: 18, fontSize: 13 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Team Productivity Insights</div>
        <div style={{ color: "#6B6B6B", fontSize: 12, marginTop: 2 }}>Engineering · Q2 2026 · Updated just now</div>
      </div>
      <select style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid #E8E8E8", fontSize: 12, background: "#fff" }}>
        <option>Last 30 days</option>
      </select>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
      {[
        { l: "Deploy Freq", v: "4.2/day", d: "+12%" },
        { l: "Lead Time", v: "3.1 hrs", d: "−18%" },
        { l: "Chg Failure", v: "8.4%", d: "−3.2%" },
        { l: "MTTR", v: "22 min", d: "−35%" },
      ].map((m, i) => (
        <div key={i} style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: 7, padding: "10px 12px" }}>
          <div style={{ fontSize: 10.5, color: "#888", marginBottom: 3 }}>{m.l}</div>
          <div style={{ fontWeight: 700, fontSize: 19 }}>{m.v}</div>
          <div style={{ fontSize: 11, color: "#178B44", marginTop: 2 }}>{m.d}</div>
        </div>
      ))}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 14 }}>
      <div style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: 7, padding: "12px 14px", height: 148 }}>
        <div style={{ fontWeight: 600, fontSize: 11.5, marginBottom: 8 }}>Deploy frequency — 30 days</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 100 }}>
          {[38, 52, 28, 65, 60, 75, 42, 88, 70, 80, 55, 92, 65, 84, 48, 74, 88, 60, 80, 68, 85, 73, 90, 64, 82, 88, 70, 84, 93, 75].map(
            (h, i) => (
              <div
                key={i}
                style={{ flex: 1, background: i === 29 ? "#5258E4" : "#C5C8F5", borderRadius: "2px 2px 0 0", height: h + "%" }}
              />
            ),
          )}
        </div>
      </div>
      <div style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: 7, padding: "12px 14px", height: 148 }}>
        <div style={{ fontWeight: 600, fontSize: 11.5, marginBottom: 10 }}>Team velocity</div>
        {[
          { t: "Platform", v: 87, c: "#5258E4" },
          { t: "Checkout", v: 72, c: "#22C55E" },
          { t: "Payments", v: 65, c: "#F59E0B" },
          { t: "Identity", v: 91, c: "#8B5CF6" },
        ].map(({ t: team, v, c }) => (
          <div key={team} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, marginBottom: 2 }}>
              <span>{team}</span>
              <span style={{ fontWeight: 600 }}>{v}%</span>
            </div>
            <div style={{ background: "#F0F0F0", borderRadius: 4, height: 5 }}>
              <div style={{ width: v + "%", background: c, height: "100%", borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
    <div style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: 7, overflow: "hidden" }}>
      <div style={{ padding: "8px 12px", borderBottom: "1px solid #E8E8E8", fontWeight: 600, fontSize: 11.5 }}>
        Top bottlenecks this week
      </div>
      {[
        { n: "checkout-svc", i: "P95 review wait > 4h", s: "medium", a: "3d" },
        { n: "identity-api", i: "CI flake rate 18%", s: "high", a: "5d" },
        { n: "payment-worker", i: "No runbook attached", s: "low", a: "12d" },
      ].map((row, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "130px 1fr 72px 40px",
            padding: "7px 12px",
            borderBottom: i < 2 ? "1px solid #F0F0F0" : "none",
            alignItems: "center",
            fontSize: 11.5,
          }}
        >
          <span style={{ fontFamily: "monospace", fontSize: 10.5 }}>{row.n}</span>
          <span style={{ color: "#464646" }}>{row.i}</span>
          <span
            style={{
              padding: "2px 7px",
              borderRadius: 12,
              fontSize: 10.5,
              fontWeight: 600,
              background: row.s === "high" ? "#FDECEA" : row.s === "medium" ? "#FFF3CC" : "#F0F0F0",
              color: row.s === "high" ? "#D63B2A" : row.s === "medium" ? "#A86C00" : "#666",
            }}
          >
            {row.s}
          </span>
          <span style={{ color: "#888", fontSize: 10.5 }}>{row.a}</span>
        </div>
      ))}
    </div>
  </div>
);

export const BuildScreen = ({
  session,
  onPromote,
}: {
  session: Session | null;
  onPromote: () => void;
}) => {
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [pvTab, setPvTab] = useState("Preview");
  const [inp, setInp] = useState("");
  const [shared, setShared] = useState(false);

  const handleShare = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard?.writeText(url).catch(() => {
      // clipboard unavailable (permissions/insecure context) — still show feedback
    });
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  useEffect(() => {
    setStep(0);
    setReady(false);
    let count = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      count++;
      setStep(count);
      if (count <= BUILD_STEPS.length) {
        timer = setTimeout(tick, count === 1 ? 480 : 360);
      } else {
        setReady(true);
      }
    };
    const t = setTimeout(tick, 420);
    return () => {
      clearTimeout(t);
      clearTimeout(timer);
    };
  }, [session?.id]);

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* Chat panel */}
      <div style={{ width: 380, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", background: T.bg }}>
        <div
          style={{
            padding: "10px 16px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <Icon name="sparkle" size={13} color={T.accent} />
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session ? session.title : "New Session"}
          </span>
          {ready && (
            <span style={{ padding: "2px 8px", background: T.successBg, color: T.success, borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
              Deployed
            </span>
          )}
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="anim-slide" style={{ display: "flex", justifyContent: "flex-end" }}>
            <div
              style={{
                background: T.accent,
                color: "#fff",
                padding: "10px 14px",
                borderRadius: "12px 12px 2px 12px",
                fontSize: 13.5,
                maxWidth: "90%",
                lineHeight: 1.45,
              }}
            >
              {session ? session.prompt : "Build a team productivity dashboard"}
            </div>
          </div>

          {step >= 1 && (
            <div className="anim-slide" style={{ display: "flex", gap: 9 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  background: T.accent,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <Icon name="sparkle" size={12} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 7, color: T.text }}>Foundry Agent</div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
                  {BUILD_STEPS.slice(0, Math.max(0, step - 1)).map((s, i) => (
                    <div
                      key={i}
                      className="anim-fade"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 12px",
                        borderBottom: i < BUILD_STEPS.length - 1 ? `1px solid ${T.border}` : "none",
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: T.successBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon name="check" size={10} color={T.success} />
                      </div>
                      <span style={{ flex: 1, fontSize: 12.5, color: T.textMid }}>{s.text}</span>
                      <span style={{ fontSize: 11, color: T.textFaint, fontFamily: "monospace" }}>{s.t}</span>
                    </div>
                  ))}
                  {step - 1 < BUILD_STEPS.length && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px" }}>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: `2px solid ${T.accent}`,
                          borderTopColor: "transparent",
                          animation: "spin .65s linear infinite",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 12.5, color: T.textMid }}>
                        {BUILD_STEPS[step - 1] ? BUILD_STEPS[step - 1].text : "Processing…"}
                      </span>
                    </div>
                  )}
                </div>
                {ready && (
                  <div className="anim-slide">
                    <p style={{ fontSize: 13.5, color: T.text, lineHeight: 1.5, marginBottom: 12 }}>
                      ✓ Your <strong>Team Productivity Dashboard</strong> is live in dev. Real-time DORA metrics, team
                      velocity bars, and a bottleneck table — all wired to your Analytics API.
                    </p>
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                      <button
                        onClick={onPromote}
                        style={{
                          padding: "7px 14px",
                          background: T.accent,
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Icon name="deploy" size={12} color="#fff" /> Promote to Staging
                      </button>
                      <button
                        onClick={() => setPvTab("Code")}
                        style={{
                          padding: "7px 14px",
                          color: T.accent,
                          border: `1px solid ${T.accentBorder}`,
                          borderRadius: 6,
                          fontSize: 13,
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        Edit in IDE
                      </button>
                      <button
                        onClick={handleShare}
                        style={{
                          padding: "7px 14px",
                          color: shared ? T.success : T.textSub,
                          border: `1px solid ${shared ? T.success : T.border}`,
                          borderRadius: 6,
                          fontSize: 13,
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        {shared ? "✓ Link copied" : "Share"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: 12, borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", border: `1px solid ${T.border}`, borderRadius: 7, overflow: "hidden", background: T.bg }}>
            <input
              value={inp}
              onChange={(e) => setInp(e.target.value)}
              placeholder="Ask to change or improve…"
              style={{ flex: 1, padding: "9px 12px", border: "none", outline: "none", fontSize: 13 }}
            />
            <button
              style={{
                padding: "0 14px",
                background: T.accent,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Icon name="send" size={14} color="#fff" />
            </button>
          </div>
        </div>
      </div>

      {/* Preview panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.surface }}>
        <div style={{ height: 42, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: `1px solid ${T.border}`, background: T.bg }}>
          {["Preview", "Code", "Logs"].map((t) => (
            <button
              key={t}
              onClick={() => setPvTab(t)}
              style={{
                padding: "0 14px",
                height: 42,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: pvTab === t ? T.accent : T.textSub,
                borderBottom: pvTab === t ? `2px solid ${T.accent}` : "2px solid transparent",
                fontSize: 13.5,
                fontWeight: pvTab === t ? 600 : 400,
              }}
            >
              {t}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12, color: T.textFaint, display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: ready ? T.success : T.accent,
                display: "inline-block",
                animation: ready ? "none" : "pulse 1s ease infinite",
              }}
            />
            {ready ? "dev · team-prod-dash.foundry.app" : "Building…"}
          </div>
          {ready && (
            <button
              style={{
                marginLeft: 10,
                padding: "5px 12px",
                background: T.accentBg,
                color: T.accent,
                border: "none",
                borderRadius: 5,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Open ↗
            </button>
          )}
        </div>
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          {!ready ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: `3px solid ${T.accentBg}`,
                  borderTopColor: T.accent,
                  borderRadius: "50%",
                  animation: "spin .8s linear infinite",
                }}
              />
              <div style={{ fontSize: 14, color: T.textSub }}>Building your prototype…</div>
              <div style={{ fontSize: 12.5, color: T.textFaint }}>Wiring UI components</div>
            </div>
          ) : pvTab === "Code" ? (
            <CodePane />
          ) : pvTab === "Logs" ? (
            <LogsPane />
          ) : (
            <MiniPreviewDash />
          )}
        </div>
      </div>
    </div>
  );
};
