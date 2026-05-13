// ai.js — Claude integration for Partnership Pulse
// Uses window.claude.complete for real LLM calls; falls back to a
// deterministic shape if the call fails so the prototype stays usable.

(function () {
  const SCHEMA_PART_A = `Return ONLY a single JSON object, no prose, matching this schema EXACTLY:

{
  "snapshot": {
    "headline": "one sentence framing the QBR — what is this meeting actually about (max 30 words)",
    "facts": ["3-5 key facts: tier/region, contract status, exec sponsors. Each fact one short line."]
  },
  "health": {
    "narrative": "one short paragraph (max 2 sentences) interpreting the score and direction",
    "drivers": [
      { "text": "concise driver (max 15 words)", "impact": "+5 | -3 | 0", "evidence": "short phrase tying to a source field" }
    ]
  },
  "performance": {
    "summary": "one line — is the partner ahead/on/behind plan (max 25 words)",
    "metrics": [
      { "label": "short label", "value": "+18%", "note": "optional context (max 8 words)" }
    ]
  },
  "pipeline": {
    "summary": "one line on overall pipeline posture (max 25 words)",
    "deals": [
      { "name": "deal name", "stage": "stage", "value": "value", "blocker": "main blocker or null", "hot": true }
    ]
  }
}`;

  const SCHEMA_PART_B = `Return ONLY a single JSON object, no prose, matching this schema EXACTLY:

{
  "risks": [
    { "title": "action-oriented risk title (max 12 words)", "severity": "high|medium|low", "why": "1-2 sentences with evidence chain (max 40 words)", "evidence": "short phrase tying to a source field" }
  ],
  "wins": [
    { "text": "specific win, name names and numbers (max 20 words)", "evidence": "short phrase tying to a source field" }
  ],
  "talking_points": [
    "3-4 talking points, sequenced; each one short sentence (max 20 words)"
  ],
  "actions": [
    { "who": "owner first name", "what": "specific action (max 12 words)", "when": "Today | Tomorrow | Before QBR | etc" }
  ]
}`;

  const RULES = `Rules:
- Every claim must be groundable in the partner data. Do NOT invent metrics or names not in the data.
- If a section is sparse (empty pipeline, empty wins, no recent activity, etc), include the section but be HONEST about what's missing. Write things like "No active deals — relationship is dormant; this QBR may need to be a strategic decision conversation, not a tactical review" instead of fabricating filler.
- Tone: a senior partner manager briefing a peer. Specific, calm, decisive. No hype. No emoji. No nested headings.
- BREVITY IS CRITICAL — every word costs. Stay UNDER the per-field limits.`;

  function buildBriefPrompt(partner, part, opts = {}) {
    const schema = part === "A" ? SCHEMA_PART_A : SCHEMA_PART_B;
    const angle = opts.angle ? `\n\nFOR THIS REGENERATION, take a different angle: ${opts.angle}\n` : "";
    return `You are an AI co-pilot for a Google Play partner manager preparing a Quarterly Business Review (QBR). You synthesize CRM, performance, and activity data into a senior-ready briefing.${angle}

${schema}

${RULES}

PARTNER DATA (as_of ${(window.DATA && window.DATA.metadata && window.DATA.metadata.as_of_date) || "today"}):
${JSON.stringify(partner, null, 2)}`;
  }

  function buildSectionPrompt(sectionId, partner, currentBrief) {
    // Determine which part this section belongs to for the right schema fragment
    const isPartA = ["snapshot", "health", "performance", "pipeline"].includes(sectionId);
    return `You are regenerating ONE section of a QBR brief. Re-draft it from a different angle while keeping it grounded in the data.

Section: "${sectionId}"
Return ONLY a JSON object containing JUST that section's value (the value at the section's key in the schema above). No wrapping, no prose. Match the schema (${isPartA ? "Part A" : "Part B"}).

For reference, the rest of the brief looks like this (do not duplicate other sections' content):
${JSON.stringify({ ...currentBrief, [sectionId]: undefined }, null, 2)}

PARTNER DATA:
${JSON.stringify(partner, null, 2)}

${RULES}`;
  }

  function buildCopilotPrompt(partner, brief, history, userMsg) {
    return `You are the Partnership Pulse co-pilot — an assistant embedded in a tool that helps Google Play partner managers prep QBR meetings. You are talking with Sarah, a senior partner manager.

Style: warm but efficient. Short paragraphs (max 3 sentences each). When you make a specific claim, ground it in the partner data. When you don't know something, say so plainly. Never use emoji.

Current partner in view: ${partner ? partner.name : "(none)"}.

${brief ? `Current brief draft (JSON):\n${JSON.stringify(brief, null, 2)}\n` : ""}
${partner ? `Partner data:\n${JSON.stringify(partner, null, 2)}\n` : ""}

Conversation so far:
${history.map((m) => `${m.role.toUpperCase()}: ${m.text}`).join("\n")}

USER: ${userMsg}
ASSISTANT:`;
  }

  function extractJson(raw) {
    if (!raw) return null;
    // Strip code fences if present
    let s = raw.trim();
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) s = fence[1].trim();
    // Find first { … last } to be forgiving
    const first = s.indexOf("{");
    const last = s.lastIndexOf("}");
    if (first === -1 || last === -1) return null;
    const candidate = s.slice(first, last + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {
      // Try cleaning trailing commas
      try {
        return JSON.parse(candidate.replace(/,\s*([}\]])/g, "$1"));
      } catch (e2) {
        console.warn("JSON parse failed:", e2, candidate.slice(0, 200));
        return null;
      }
    }
  }

  async function generateBrief(partner, opts = {}) {
    if (!window.claude || !window.claude.complete) {
      return fallbackBrief(partner);
    }
    try {
      // Two parallel calls: each fits comfortably in the 1024-token output budget.
      const [partA, partB] = await Promise.all([
        callAndParse(buildBriefPrompt(partner, "A", opts)),
        callAndParse(buildBriefPrompt(partner, "B", opts)),
      ]);
      const fb = fallbackBrief(partner);
      const merged = { ...fb, ...(partA || {}), ...(partB || {}) };
      return normalizeBrief(merged);
    } catch (e) {
      console.warn("generateBrief failed:", e);
      return fallbackBrief(partner);
    }
  }

  async function callAndParse(prompt) {
    try {
      const text = await window.claude.complete(prompt);
      const json = extractJson(text);
      if (!json) console.warn("Unparseable response:", String(text).slice(0, 200));
      return json;
    } catch (e) {
      console.warn("call failed:", e);
      return null;
    }
  }

  async function regenerateSection(sectionId, partner, currentBrief) {
    if (!window.claude || !window.claude.complete) {
      return fallbackBrief(partner)[sectionId];
    }
    try {
      const prompt = buildSectionPrompt(sectionId, partner, currentBrief);
      const text = await window.claude.complete(prompt);
      const json = extractJson(text);
      return json || fallbackBrief(partner)[sectionId];
    } catch (e) {
      console.warn("regenerateSection failed:", e);
      return fallbackBrief(partner)[sectionId];
    }
  }

  async function copilotReply(partner, brief, history, userMsg) {
    if (window.claude && window.claude.complete) {
      try {
        const prompt = buildCopilotPrompt(partner, brief, history, userMsg);
        const text = await window.claude.complete(prompt);
        return text.trim();
      } catch (e) {
        console.warn("copilotReply failed, falling back to mock:", e);
      }
    }
    // Simulated latency so the "Thinking…" state is visible
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 700));
    return mockCopilotReply(partner, brief, history, userMsg);
  }

  function mockCopilotReply(partner, brief, history, userMsg) {
    const q = (userMsg || "").toLowerCase();
    const partners = window.PARTNERS || [];

    // ── Portfolio-level questions (no partner context) ─────────────────────
    if (!partner) {
      if (/prep|this week|upcoming|qbr/i.test(q)) {
        const upcoming = [...partners]
          .filter((p) => p.next_qbr)
          .sort((a, b) => a.next_qbr.localeCompare(b.next_qbr))
          .slice(0, 3);
        return (
          "Three partners need the most prep this week:\n\n" +
          upcoming
            .map(
              (p, i) =>
                `${i + 1}. **${p.name}** — QBR ${p.next_qbr}. Health ${p.health.score} (${p.health.trend_qoq} QoQ). ${
                  (p.open_issues || []).length
                    ? `${p.open_issues.length} open issue${p.open_issues.length === 1 ? "" : "s"}.`
                    : "No open issues."
                }`
            )
            .join("\n") +
          "\n\nWant me to draft pre-reads for any of them?"
        );
      }
      if (/chang|last 7|recent|week/i.test(q)) {
        const movers = [...partners]
          .map((p) => ({ p, delta: parseInt(p.health.trend_qoq, 10) || 0 }))
          .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
          .slice(0, 4);
        return (
          "Biggest movers across your book in the last 7 days:\n\n" +
          movers
            .map(
              ({ p, delta }) =>
                `• **${p.name}** ${delta >= 0 ? "↑" : "↓"} ${delta} QoQ — ${
                  (p.health.drivers || [])[0] || "no driver recorded"
                }`
            )
            .join("\n")
        );
      }
      if (/renewal|contract|expir/i.test(q)) {
        const renewals = partners
          .filter((p) => p.contract && p.contract.renewal_date)
          .map((p) => ({ p, date: p.contract.renewal_date }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 5);
        return (
          "Upcoming renewals in date order:\n\n" +
          renewals
            .map(
              ({ p, date }) =>
                `• **${p.name}** — ${date} · ${p.contract.status}`
            )
            .join("\n")
        );
      }
      if (/risk|issue|red flag|at risk/i.test(q)) {
        const risky = partners
          .filter((p) => (p.open_issues || []).length)
          .slice(0, 4);
        return (
          "Partners with the most flagged open issues:\n\n" +
          risky
            .map(
              (p) =>
                `• **${p.name}** (${p.open_issues.length}) — ${p.open_issues[0]}`
            )
            .join("\n")
        );
      }
      // Generic portfolio fallback
      const total = partners.length;
      const avg = Math.round(
        partners.reduce((s, p) => s + (p.health.score || 0), 0) / Math.max(1, total)
      );
      return `Across your ${total} partners, average health is ${avg}. Ask me about prep for the week, renewals, risks, or any specific partner by name.`;
    }

    // ── Partner-specific answers ───────────────────────────────────────────
    const p = partner;
    const drivers = p.health.drivers || [];
    const issues = p.open_issues || [];
    const wins = p.wins_to_celebrate || [];
    const pipeline = p.pipeline || [];
    const activity = p.recent_activity || [];

    if (/why.*health|health.*(why|qoq|trend|score)/i.test(q)) {
      const pos = drivers.filter((d) => /\(\+/.test(d));
      const neg = drivers.filter((d) => /\(-/.test(d));
      return (
        `Health is ${p.health.score} (${p.health.trend_qoq} QoQ). The main movers:\n\n` +
        (pos.length ? "**Lifting it up**\n" + pos.map((d) => `• ${d}`).join("\n") + "\n\n" : "") +
        (neg.length ? "**Pulling it down**\n" + neg.map((d) => `• ${d}`).join("\n") : "")
      ).trim();
    }
    if (/urgent|open issue|biggest issue|top issue/i.test(q)) {
      if (!issues.length) return `No open issues currently flagged for ${p.name}.`;
      return `Most urgent open issue for ${p.name}:\n\n**${issues[0]}**\n\nI'd raise this in the first 10 minutes of the QBR — getting ahead of it signals control. Want a suggested framing?`;
    }
    if (/stalled|unblock|deal|pipeline/i.test(q)) {
      const stalled = pipeline.find((d) => /stalled|risk|negotiation|policy/i.test(d.stage));
      if (!stalled) return `No stalled deals in ${p.name}'s pipeline right now. ${pipeline.length} active deal${pipeline.length === 1 ? "" : "s"}.`;
      return (
        `**Unblock plan for "${stalled.deal}"**\n\n` +
        `Current stage: ${stalled.stage}\n` +
        (stalled.blockers && stalled.blockers.length
          ? `Blocker: ${stalled.blockers[0]}\n\n`
          : "\n") +
        `Suggested next 3 steps:\n` +
        `1. Confirm the blocker owner internally this week\n` +
        `2. Send a written status to ${p.executive_sponsor_partner} so it doesn't surprise them at QBR\n` +
        `3. Propose a working session within 10 business days`
      );
    }
    if (/tone|open the meeting|opening/i.test(q)) {
      if (wins.length) {
        return `Open warm. Lead with: "${wins[0]}". It's specific, recent, and theirs — sets a collaborative tone before you get into the harder topics.`;
      }
      return `No clean recent win to lead with. I'd open by acknowledging the work they've put in this quarter, then move to data.`;
    }
    if (/email|intro|sponsor/i.test(q)) {
      return (
        `Here's a draft intro to ${p.executive_sponsor_partner}:\n\n` +
        `Subject: Looking forward to working together\n\n` +
        `Hi — I'm Sarah Chen, your counterpart at Google Play for ${p.name}. ` +
        `I've been getting up to speed on the partnership and wanted to introduce myself before our QBR on ${p.next_qbr}. ` +
        `A few things I'd love your perspective on: the ${pipeline[0] ? pipeline[0].deal.toLowerCase() : "active pipeline"}, ` +
        `and how we can best support your team this half. Happy to find 30 minutes in the next two weeks.\n\nBest,\nSarah`
      );
    }
    if (/recent|activity|last|happen/i.test(q)) {
      if (!activity.length) return `No recent activity logged for ${p.name}.`;
      return (
        `Most recent activity on ${p.name}:\n\n` +
        activity.slice(0, 4).map((a) => `• ${a.date} (${a.type}) — ${a.summary}`).join("\n")
      );
    }
    if (/performance|revenue|metric|mau|arpu/i.test(q)) {
      const perf = p.performance_recent_quarter || {};
      const lines = Object.entries(perf)
        .filter(([k]) => k !== "highlights")
        .map(([k, v]) => `• ${prettyLabel(k)}: ${v}`);
      return (
        `${p.name} last quarter:\n\n${lines.join("\n")}` +
        (perf.highlights ? `\n\n${perf.highlights}` : "")
      );
    }
    if (/renewal|contract/i.test(q)) {
      return `${p.name} contract: ${p.contract.type}. Renewal ${p.contract.renewal_date}. Status — ${p.contract.status}.`;
    }
    if (/sponsor|exec/i.test(q)) {
      return `Exec sponsors for ${p.name}:\n\n• Google: ${p.executive_sponsor_google}\n• Partner: ${p.executive_sponsor_partner}`;
    }

    // Generic partner fallback — ground it in real fields
    return (
      `Here's what I can see on ${p.name}:\n\n` +
      `• Health ${p.health.score} (${p.health.trend_qoq} QoQ)\n` +
      `• ${pipeline.length} active deal${pipeline.length === 1 ? "" : "s"}, ${issues.length} open issue${issues.length === 1 ? "" : "s"}\n` +
      `• Next QBR ${p.next_qbr}\n\n` +
      `Ask me about health drivers, the pipeline, recent activity, performance, or open issues — and I'll go deeper.`
    );
  }

  function normalizeBrief(b) {
    return {
      snapshot: b.snapshot || { headline: "", facts: [] },
      health: b.health || { narrative: "", drivers: [] },
      performance: b.performance || { summary: "", metrics: [] },
      pipeline: b.pipeline || { summary: "", deals: [] },
      risks: b.risks || [],
      wins: b.wins || [],
      talking_points: b.talking_points || [],
      actions: b.actions || [],
    };
  }

  // Deterministic fallback: extracts directly from JSON — no fabrication.
  function fallbackBrief(p) {
    const perf = p.performance_recent_quarter || {};
    const metricEntries = Object.entries(perf)
      .filter(([k]) => k !== "highlights")
      .slice(0, 4)
      .map(([k, v]) => ({ label: prettyLabel(k), value: String(v), note: "" }));
    return normalizeBrief({
      snapshot: {
        headline: `${p.name} — ${p.tier} ${p.type.toLowerCase()} in ${p.region}. Next QBR ${p.next_qbr}.`,
        facts: [
          `Revenue tier: ${p.revenue_tier}`,
          `Contract: ${p.contract.type} · renewal ${p.contract.renewal_date} · ${p.contract.status}`,
          `Google sponsor: ${p.executive_sponsor_google}`,
          `Partner sponsor: ${p.executive_sponsor_partner}`,
        ],
      },
      health: {
        narrative: `Health score ${p.health.score} (${p.health.trend_qoq} QoQ).`,
        drivers: (p.health.drivers || []).slice(0, 4).map((d) => ({
          text: d.replace(/\s*\([+-]?\d+\)\s*$/, ""),
          impact: (d.match(/\(([+-]?\d+)\)\s*$/) || [, "0"])[1],
          evidence: "health.drivers",
        })),
      },
      performance: {
        summary: perf.highlights || "Performance data available in source.",
        metrics: metricEntries,
      },
      pipeline: {
        summary: (p.pipeline && p.pipeline.length) ? `${p.pipeline.length} active deal(s).` : "No active pipeline.",
        deals: (p.pipeline || []).map((d) => ({
          name: d.deal,
          stage: d.stage,
          value: d.value,
          blocker: (d.blockers && d.blockers[0]) || null,
          hot: /stalled|risk|negotiation/i.test(d.stage),
        })),
      },
      risks: (p.open_issues || []).slice(0, 3).map((t) => ({
        title: t,
        severity: "medium",
        why: t,
        evidence: "open_issues",
      })),
      wins: (p.wins_to_celebrate || []).map((w) => ({ text: w, evidence: "wins_to_celebrate" })),
      talking_points: [
        "Open with the most recent win.",
        "Acknowledge the largest open issue before they raise it.",
        "Confirm one concrete next step before closing.",
      ],
      actions: [
        { who: "Sarah", what: "Send pre-read 24h before QBR", when: "Today" },
        { who: "Sarah", what: "Confirm attendance with exec sponsor", when: "Tomorrow" },
      ],
    });
  }

  function prettyLabel(key) {
    return key
      .replace(/_/g, " ")
      .replace(/\bqoq\b/i, "QoQ")
      .replace(/\byoy\b/i, "YoY")
      .replace(/\bmau\b/i, "MAU")
      .replace(/\barpu\b/i, "ARPU")
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  window.PP_AI = {
    generateBrief,
    regenerateSection,
    copilotReply,
    fallbackBrief,
    prettyLabel,
  };
})();
