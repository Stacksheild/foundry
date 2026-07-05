import { useState } from "react";
import { tokens as T } from "../tokens";
import { Icon, FoundryLogo } from "../icons";
import { SUGGESTIONS } from "../data/suggestions";

export const HomeScreen = ({ onSubmit }: { onSubmit: (prompt: string) => void }) => {
  const [tab, setTab] = useState("Mobile");
  const [input, setInput] = useState("");
  const submit = () => {
    if (input.trim()) onSubmit(input.trim());
  };
  const cards = SUGGESTIONS[tab];

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "auto",
        padding: "0 24px",
      }}
    >
      <div
        style={{
          flex: "0 0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          paddingTop: 32,
          paddingBottom: 40,
        }}
      >
        <FoundryLogo size={38} />
        <h1 style={{ fontSize: 40, fontWeight: 700, marginTop: 14, color: T.text, letterSpacing: "-.5px" }}>
          Foundry
        </h1>
        <p
          style={{
            fontSize: 15,
            color: T.textSub,
            marginTop: 8,
            textAlign: "center",
            maxWidth: 520,
            lineHeight: 1.55,
          }}
        >
          Build and deploy AI-powered internal applications using your team's data,
          <br />
          workflows, and platform services — from concept to production in minutes.
        </p>
        <div style={{ display: "flex", gap: 7, marginTop: 18, flexWrap: "wrap", justifyContent: "center" }}>
          {["Enterprise data", "Any platform", "Production-ready", "Governance-aware"].map((p) => (
            <span
              key={p}
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                border: `1px solid ${T.border}`,
                fontSize: 12.5,
                color: T.textSub,
              }}
            >
              {p}
            </span>
          ))}
        </div>

        <div style={{ width: "100%", maxWidth: 790, marginTop: 30 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: T.accent, letterSpacing: 1, marginBottom: 10 }}>
            SUGGESTED FOR {tab.toUpperCase()}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {cards.map((s, i) => (
                <div
                  key={i}
                  className="card-hover"
                  onClick={() => onSubmit(s.title)}
                  style={{
                    background: T.bg,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    padding: "14px 16px",
                    cursor: "pointer",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                  }}
                >
                  <button
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute",
                      top: 7,
                      right: 8,
                      width: 18,
                      height: 18,
                      border: "none",
                      background: "transparent",
                      color: T.textFaint,
                      fontSize: 16,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                  <Icon name="sparkle" size={16} color={T.accent} style={{ marginBottom: 2 }} />
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: T.accent, letterSpacing: 0.7 }}>
                    {s.cat}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{s.title}</div>
                  <div style={{ fontSize: 12.5, color: T.textSub, lineHeight: 1.45, flex: 1 }}>{s.desc}</div>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 6,
                      padding: "4px 10px",
                      background: T.accentBg,
                      borderRadius: 20,
                      fontSize: 11.5,
                      color: T.accentText,
                      fontWeight: 500,
                      alignSelf: "flex-start",
                    }}
                  >
                    {s.cta}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 12, justifyContent: "center" }}>
            {Object.keys(SUGGESTIONS).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "6px 17px",
                  borderRadius: 20,
                  border: "none",
                  background: tab === t ? T.accent : "transparent",
                  color: tab === t ? "#fff" : T.textSub,
                  fontSize: 13.5,
                  fontWeight: tab === t ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: "100%", maxWidth: 790, marginTop: 18 }}>
          <div style={{ fontSize: 12, color: T.textFaint, textAlign: "center", marginBottom: 9 }}>
            Or describe the internal application you want to build
          </div>
          <div
            style={{
              display: "flex",
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              overflow: "hidden",
              background: T.bg,
              boxShadow: "0 1px 4px rgba(0,0,0,.06)",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Describe what you want to prototype..."
              style={{ flex: 1, padding: "12px 16px", border: "none", outline: "none", fontSize: 14, color: T.text }}
            />
            <button
              onClick={submit}
              style={{
                width: 44,
                background: T.accent,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                borderRadius: "0 7px 7px 0",
              }}
            >
              <Icon name="send" size={16} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
