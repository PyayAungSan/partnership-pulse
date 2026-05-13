// insights.jsx — Portfolio patterns + AI quality dashboard

const { useState: useStateIN, useMemo: useMemoIN } = React;

function detectPatterns(partners) {
  const patterns = [];

  // 1. Declining partners
  const declining = partners.filter((p) => {
    const t = parseInt(String(p.health.trend_qoq).replace(/[^-\d]/g, ""), 10);
    return !isNaN(t) && t <= -5;
  });
  if (declining.length >= 1) {
    patterns.push({
      id: "declining",
      severity: "high",
      title: `${declining.length} partner${declining.length === 1 ? " is" : "s are"} declining sharply this quarter`,
      why: "QoQ trend at -5 or worse. Worth understanding whether it's a partner issue, a category effect, or our doing.",
      partners: declining,
      action: "Review root causes in next 1:1 with Min-jae",
    });
  }

  // 2. Renewals next 90 days
  const today = new Date("2026-05-12");
  const ninety = new Date(today.getTime() + 90 * 86400000);
  const renewalsSoon = partners.filter((p) => {
    if (!p.contract?.renewal_date) return false;
    const r = new Date(p.contract.renewal_date);
    return r >= today && r <= ninety;
  });
  if (renewalsSoon.length > 0) {
    patterns.push({
      id: "renewals",
      severity: "high",
      title: `${renewalsSoon.length} renewal${renewalsSoon.length === 1 ? "" : "s"} due in the next 90 days`,
      why: "Two are Strategic tier. Of these, at least one is showing engagement risk.",
      partners: renewalsSoon,
      action: "Block renewal prep time on calendar",
    });
  }

  // 3. Exec sponsor changes
  const sponsorChanged = partners.filter((p) =>
    /CHANGED|changed/.test(p.executive_sponsor_partner || "")
  );
  if (sponsorChanged.length > 0) {
    patterns.push({
      id: "sponsor-change",
      severity: "medium",
      title: `${sponsorChanged.length} partner${sponsorChanged.length === 1 ? "" : "s"} had an exec sponsor change recently`,
      why: "Sponsor transitions correlate with health drops in our last 4 quarters of data. Get on calendars early.",
      partners: sponsorChanged,
      action: "Draft intro emails (the co-pilot can help)",
    });
  }

  // 4. Stalled / at-risk pipeline
  const stalled = partners.filter((p) =>
    (p.pipeline || []).some((d) => /stalled|risk/i.test(d.stage))
  );
  if (stalled.length > 0) {
    patterns.push({
      id: "stalled",
      severity: "medium",
      title: `${stalled.length} partner${stalled.length === 1 ? " has" : "s have"} stalled deals in pipeline`,
      why: "Mostly legal review timelines. Pattern: 4+ revisions, no convergence. May need escalation.",
      partners: stalled,
      action: "Flag for escalation in weekly team sync",
    });
  }

  // 5. Policy / compliance overhead
  const policyHeavy = partners.filter((p) =>
    (p.open_issues || []).some((iss) => /polic|complian|appeal|RBI/i.test(iss))
  );
  if (policyHeavy.length > 0) {
    patterns.push({
      id: "policy",
      severity: "medium",
      title: `${policyHeavy.length} partner${policyHeavy.length === 1 ? "" : "s"} carrying open policy or compliance items`,
      why: "Policy review timelines have been a recurring blocker for APAC accounts this year.",
      partners: policyHeavy,
      action: "Schedule joint sync with Policy team",
    });
  }

  // 6. Hyper-growth
  const growing = partners.filter((p) => {
    const t = parseInt(String(p.health.trend_qoq).replace(/[^-\d]/g, ""), 10);
    return !isNaN(t) && t >= 6;
  });
  if (growing.length > 0) {
    patterns.push({
      id: "growth",
      severity: "low",
      title: `${growing.length} partner${growing.length === 1 ? " is" : "s are"} compounding fast — invest, don't coast`,
      why: "Health up 6+ points QoQ. Worth expansion conversations or tier upgrades.",
      partners: growing,
      action: "Propose investment conversations",
    });
  }

  return patterns;
}

function PatternCard({ pat, onOpenPartner }) {
  return (
    <article className={`pp-pat pp-pat-${pat.severity}`}>
      <header className="pp-pat-h">
        <span className={`pp-pat-sev pp-pat-sev-${pat.severity}`}>{pat.severity.toUpperCase()}</span>
        <h3 className="pp-pat-title">{pat.title}</h3>
      </header>
      <p className="pp-pat-why">{pat.why}</p>
      <div className="pp-pat-partners">
        {pat.partners.map((p) => (
          <button key={p.id} className="pp-pat-partner" onClick={() => onOpenPartner(p)}>
            <HealthDot score={p.health.score} />
            <span>{p.name}</span>
            <Trend delta={p.health.trend_qoq} />
          </button>
        ))}
      </div>
      <footer className="pp-pat-f">
        <span className="pp-pat-action">
          <Icons.ArrowRight size={11} /> {pat.action}
        </span>
      </footer>
    </article>
  );
}

// AI quality — section performance card
function QualityRow({ section }) {
  const editPct = Math.round(section.editRate * 100);
  const downPct = Math.round(section.thumbsDown * 100);
  const conf = Math.round(section.avgConfidence * 100);
  const isWorst = section.id === "risks";
  return (
    <div className={`pp-qrow ${isWorst ? "pp-qrow-flagged" : ""}`}>
      <div className="pp-qrow-l">{section.label}</div>
      <div className="pp-qrow-bar-wrap">
        <div className="pp-qrow-bar">
          <div className="pp-qrow-bar-fill pp-qrow-edit" style={{ width: `${Math.min(editPct, 100)}%` }} />
        </div>
        <span className="pp-mono pp-qrow-v">{editPct}%</span>
      </div>
      <div className="pp-qrow-bar-wrap">
        <div className="pp-qrow-bar">
          <div className="pp-qrow-bar-fill pp-qrow-down" style={{ width: `${Math.min(downPct * 3, 100)}%` }} />
        </div>
        <span className="pp-mono pp-qrow-v">{downPct}%</span>
      </div>
      <div className="pp-qrow-bar-wrap">
        <div className="pp-qrow-bar">
          <div className="pp-qrow-bar-fill pp-qrow-conf" style={{ width: `${conf}%` }} />
        </div>
        <span className="pp-mono pp-qrow-v">{conf}%</span>
      </div>
    </div>
  );
}

function Sparkline({ values, w = 220, h = 48 }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const last = values[values.length - 1];
  const lastX = w;
  const lastY = h - ((last - min) / range) * (h - 4) - 2;
  return (
    <svg width={w} height={h} className="pp-spark" aria-hidden="true">
      <polyline points={pts.join(" ")} fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx={lastX} cy={lastY} r="2.5" fill="currentColor" />
    </svg>
  );
}

function Insights({ onOpenPartner }) {
  const [tab, setTab] = useStateIN("portfolio");
  const partners = window.PARTNERS;
  const patterns = useMemoIN(() => detectPatterns(partners), [partners]);
  const evals = window.EVAL_METRICS;
  const prod = window.PRODUCTIVITY;
  const latestEval = evals.evalScores[evals.evalScores.length - 1];
  const evalDelta = latestEval - evals.evalScores[0];

  return (
    <div className="pp-page">
      <header className="pp-pageh">
        <div>
          <div className="pp-eyebrow">Across your portfolio</div>
          <h1 className="pp-h1">Insights</h1>
          <p className="pp-sub">
            Cross-partner patterns Pulse surfaces from your CRM, Console, and activity data — plus how the AI itself is performing.
          </p>
        </div>
      </header>

      <div className="pp-tabs pp-tabs-big">
        <button className={`pp-tab ${tab === "portfolio" ? "is-on" : ""}`} onClick={() => setTab("portfolio")}>
          Portfolio patterns
          <span className="pp-tab-n">{patterns.length}</span>
        </button>
        <button className={`pp-tab ${tab === "quality" ? "is-on" : ""}`} onClick={() => setTab("quality")}>
          AI quality
        </button>
        <button className={`pp-tab ${tab === "productivity" ? "is-on" : ""}`} onClick={() => setTab("productivity")}>
          Productivity
        </button>
      </div>

      {tab === "portfolio" && (
        <section className="pp-section">
          <div className="pp-pat-grid">
            {patterns.map((p) => (
              <PatternCard key={p.id} pat={p} onOpenPartner={onOpenPartner} />
            ))}
          </div>
        </section>
      )}

      {tab === "quality" && (
        <section className="pp-section pp-quality">
          <div className="pp-quality-top">
            <div className="pp-quality-kpi">
              <div className="pp-quality-kpi-l">Brief acceptance · 60d</div>
              <div className="pp-quality-kpi-v">{latestEval}%</div>
              <div className={`pp-trend ${evalDelta >= 0 ? "pp-trend-up" : "pp-trend-down"}`}>
                {evalDelta >= 0 ? "+" : ""}{evalDelta}% from start of period
              </div>
              <div className="pp-quality-spark" style={{ color: "var(--accent)" }}>
                <Sparkline values={evals.evalScores} w={240} h={42} />
              </div>
              <div className="pp-meta-soft">
                Weekly synthetic eval: % of briefs scoring ≥3/5 against senior-PM gold set.
              </div>
            </div>

            <div className="pp-quality-fresh">
              <div className="pp-quality-fresh-h">Source freshness</div>
              <ul className="pp-quality-fresh-list">
                {Object.entries(evals.freshness).map(([name, m]) => (
                  <li key={name}>
                    <span className={`pp-dot ${m.status === "fresh" ? "pp-dot-good" : "pp-dot-warn"}`} />
                    <span className="pp-quality-fresh-name">{name}</span>
                    <span className="pp-quality-fresh-age pp-mono">
                      {m.hours < 1 ? `${Math.round(m.hours * 60)}m` : `${Math.round(m.hours)}h`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pp-quality-section">
            <div className="pp-secth">
              <h2 className="pp-h2">Section-level performance</h2>
              <span className="pp-secth-note">Last 60 days · {evals.sections[0].briefsGenerated} briefs across all PMs</span>
            </div>
            <div className="pp-qtable">
              <div className="pp-qhead">
                <div className="pp-qrow-l">Section</div>
                <div className="pp-qrow-bar-wrap">Edit rate</div>
                <div className="pp-qrow-bar-wrap">Thumbs-down</div>
                <div className="pp-qrow-bar-wrap">Avg confidence</div>
              </div>
              {evals.sections.map((s) => <QualityRow key={s.id} section={s} />)}
            </div>
          </div>

          <div className="pp-quality-section">
            <div className="pp-secth">
              <h2 className="pp-h2">Top edit patterns</h2>
              <span className="pp-secth-note">Where PMs are reworking the AI's draft most</span>
            </div>
            <ul className="pp-edit-list">
              {evals.topEdits.map((e, i) => (
                <li key={i}>
                  <span className="pp-edit-section">{e.section}</span>
                  <span className="pp-edit-cat">{e.category}</span>
                  <span className="pp-edit-count pp-mono">{e.count}×</span>
                </li>
              ))}
            </ul>
            <div className="pp-quality-callout">
              <Icons.Sparkle size={12} />
              <span>
                Risks and Talking points are the two highest-friction sections. Next iteration:
                tighten severity language in the risks prompt and ground talking-point sequencing
                in partner-sponsor history.
              </span>
            </div>
          </div>
        </section>
      )}

      {tab === "productivity" && (
        <section className="pp-section pp-prod">
          <div className="pp-prod-row">
            <div className="pp-prod-kpi">
              <div className="pp-prod-kpi-l">Prep time per QBR</div>
              <div className="pp-prod-kpi-cmp">
                <div className="pp-prod-then">
                  <div className="pp-prod-then-l">Before Pulse</div>
                  <div className="pp-prod-then-v pp-mono">{prod.prepTimeBefore}</div>
                </div>
                <Icons.ArrowRight size={18} />
                <div className="pp-prod-now">
                  <div className="pp-prod-now-l">With Pulse</div>
                  <div className="pp-prod-now-v pp-mono">{prod.prepTimeAfter}</div>
                </div>
              </div>
              <div className="pp-prod-kpi-foot">−90% prep time · target was −50%</div>
            </div>

            <div className="pp-prod-kpi">
              <div className="pp-prod-kpi-l">Hours saved · last 90 days</div>
              <div className="pp-prod-kpi-big pp-mono">{prod.hoursSaved}h</div>
              <div className="pp-meta-soft">Across {prod.briefsGenerated} briefs · ~3 hours per brief saved</div>
            </div>

            <div className="pp-prod-kpi">
              <div className="pp-prod-kpi-l">Usage rate</div>
              <div className="pp-prod-kpi-big pp-mono">{Math.round(prod.usageRate * 100)}%</div>
              <div className="pp-meta-soft">Of in-scope QBRs using Pulse · target ≥70%</div>
            </div>

            <div className="pp-prod-kpi">
              <div className="pp-prod-kpi-l">CSAT</div>
              <div className="pp-prod-kpi-big pp-mono">{prod.csat}<span className="pp-prod-csat-max">/5</span></div>
              <div className="pp-meta-soft">Monthly pulse survey · target ≥4.0</div>
            </div>
          </div>

          <div className="pp-quality-callout">
            <Icons.Sparkle size={12} />
            <span>
              You're 26 points ahead of the prep-time goal and 12 points ahead of the satisfaction floor.
              Worth socializing in your next director update.
            </span>
          </div>
        </section>
      )}
    </div>
  );
}

Object.assign(window, { Insights });
