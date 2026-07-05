import type { Suggestion } from "../types";

export const SUGGESTIONS: Record<string, Suggestion[]> = {
  Engineering: [
    {
      cat: "CI/CD PIPELINE",
      title: "Build pipeline monitor",
      desc: "Live view of CI/CD pipelines, failure rates, and flaky test detection across repos.",
      cta: "Unblock your CI",
    },
    {
      cat: "SERVICE CATALOG",
      title: "Internal service registry",
      desc: "Searchable catalog of all internal services with owners, SLAs, and runbook links.",
      cta: "Find any service fast",
    },
    {
      cat: "GOLDEN PATHS",
      title: "Service scaffolding wizard",
      desc: "Describe a service in one sentence — get a repo with CI, monitoring, runbook, and chat channel in 90s.",
      cta: "Start a new service",
    },
  ],
  Product: [
    {
      cat: "FEATURE FLAGS",
      title: "Feature flag dashboard",
      desc: "Real-time rollout percentages, A/B test results, and adoption metrics by segment.",
      cta: "See what's rolling out",
    },
    {
      cat: "OKR TRACKER",
      title: "Objective key results board",
      desc: "Live progress against product OKRs with owner accountability and risk signals.",
      cta: "Check quarterly progress",
    },
    {
      cat: "USER RESEARCH",
      title: "Interview insights tracker",
      desc: "Tag, cluster, and surface themes from user interviews linked to backlog epics.",
      cta: "Turn research into backlog",
    },
  ],
  Operations: [
    {
      cat: "INCIDENT MGMT",
      title: "On-call intelligence board",
      desc: "Active incidents, alerts, and MTTR trends — all in one place with suggested runbooks.",
      cta: "See active incidents",
    },
    {
      cat: "COST GOV",
      title: "Cloud cost anomaly detector",
      desc: "Per-team spend, cost spikes flagged with owning service, and savings recommendations.",
      cta: "Find cost leaks",
    },
    {
      cat: "COMPLIANCE",
      title: "Policy compliance dashboard",
      desc: "Security scans, SBOM freshness, and compliance gate status across all production services.",
      cta: "Stay audit-ready",
    },
  ],
  Analytics: [
    {
      cat: "TEAM PERFORMANCE",
      title: "Team productivity insights",
      desc: "Delivery velocity, task age distribution, and bottleneck identification across teams.",
      cta: "Unblock delivery bottlenecks",
    },
    {
      cat: "CUSTOMER INTELLIGENCE",
      title: "Customer escalation intelligence",
      desc: "Priority matrix, SLA breach risk, and escalation trends mapped to account owners.",
      cta: "Reduce time-to-resolution",
    },
    {
      cat: "KPI TRACKING",
      title: "KPI performance tracker",
      desc: "Goal attainment, trend lines, and variance alerts across key business metrics.",
      cta: "Keep every metric on track",
    },
  ],
  Mobile: [
    {
      cat: "FIELD SERVICE",
      title: "On-call & field service app",
      desc: "Mobile-first app for field techs: job queue, checklists, and photo-based proof of completion.",
      cta: "Build a field app",
    },
    {
      cat: "APPROVALS",
      title: "Manager approvals on the go",
      desc: "Push-notified approvals for expenses, time-off, and POs with one-tap approve/reject.",
      cta: "Speed up approvals",
    },
    {
      cat: "ON-CALL",
      title: "Incident response companion",
      desc: "Mobile on-call app: page acknowledgment, live incident feed, and one-tap escalation.",
      cta: "Respond from anywhere",
    },
  ],
};
