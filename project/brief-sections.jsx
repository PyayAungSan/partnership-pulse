// brief-sections.jsx — Renders each brief section. Each section is self-contained,
// regenerable, and has thumbs-up/thumbs-down feedback.

const { useState: useStateBS, useEffect: useEffectBS } = React;

// Source chip — hover/click to see the evidence
function SourceChip({ partner, evidence }) {
  const [open, setOpen] = useStateBS(false);
  if (!evidence) return null;
  const found = findEvidence(partner, evidence);
  return (
    <span
      className="pp-src"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      tabIndex={0}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <Icons.Link size={10} />
      <span className="pp-src-label">{evidence.split(/[.\[]/)[0]}</span>
      {open && (
        <span className="pp-src-pop" role="tooltip">
          <div className="pp-src-pop-h">Source · {found.label}</div>
          <div className="pp-src-pop-b">{found.text}</div>
        </span>
      )}
    </span>
  );
}

function findEvidence(p, evidence) {
  const ev = String(evidence || "").toLowerCase();
  // Try matching some common evidence shapes
  if (ev.includes("health.drivers") || ev.includes("driver")) {
    return { label: "Health drivers", text: (p.health.drivers || []).join(" · ") };
  }
  if (ev.includes("open_issues") || ev.includes("issue")) {
    return { label: "Open issues", text: (p.open_issues || []).join(" · ") };
  }
  if (ev.includes("pipeline") || ev.includes("deal")) {
    return {
      label: "Pipeline",
      text: (p.pipeline || []).map((d) => `${d.deal} — ${d.stage}`).join(" · "),
    };
  }
  if (ev.includes("performance") || ev.includes("revenue") || ev.includes("mau") || ev.includes("metric")) {
    return {
      label: "Performance — recent quarter",
      text: JSON.stringify(p.performance_recent_quarter || {}).replace(/[{}"]/g, ""),
    };
  }
  if (ev.includes("activity") || ev.includes("email") || ev.includes("meeting")) {
    const acts = (p.recent_activity || []).slice(0, 3).map((a) => `${a.date} · ${a.type} · ${a.summary}`);
    return { label: "Recent activity", text: acts.join(" · ") };
  }
  if (ev.includes("contract") || ev.includes("renewal")) {
    return {
      label: "Contract",
      text: `${p.contract.type} · renewal ${p.contract.renewal_date} · ${p.contract.status}`,
    };
  }
  if (ev.includes("sponsor")) {
    return {
      label: "Sponsors",
      text: `Google: ${p.executive_sponsor_google} · Partner: ${p.executive_sponsor_partner}`,
    };
  }
  if (ev.includes("wins")) {
    return { label: "Wins", text: (p.wins_to_celebrate || []).join(" · ") };
  }
  return { label: evidence, text: "Match in partner record" };
}

// Section wrapper — gives every section a uniform header/footer
function Section({ id, title, eyebrow, status, onRegenerate, onFeedback, regenerating, children }) {
  const [feedback, setFeedback] = useStateBS(null);
  return (
    <section className={`pp-bs ${regenerating ? "pp-bs-regen" : ""}`} data-section={id}>
      <header className="pp-bs-h">
        <div>
          {eyebrow && <div className="pp-bs-eyebrow">{eyebrow}</div>}
          <h3 className="pp-bs-title">{title}</h3>
        </div>
        <div className="pp-bs-h-right">
          {status}
          <button
            className="pp-bs-regen-btn"
            onClick={onRegenerate}
            disabled={regenerating}
            title="Regenerate this section"
          >
            <Icons.Refresh size={13} />
            <span>{regenerating ? "Regenerating…" : "Regenerate"}</span>
          </button>
        </div>
      </header>
      <div className="pp-bs-body">{children}</div>
      <footer className="pp-bs-f">
        <span className="pp-bs-f-note">
          <Icons.Sparkle size={11} /> AI-drafted · review before sending
        </span>
        <div className="pp-bs-thumbs">
          <button
            className={`pp-thumb ${feedback === "up" ? "is-on" : ""}`}
            onClick={() => { setFeedback("up"); onFeedback && onFeedback("up"); }}
            aria-label="Helpful"
          >
            <Icons.ThumbsUp size={13} />
          </button>
          <button
            className={`pp-thumb ${feedback === "down" ? "is-on" : ""}`}
            onClick={() => { setFeedback("down"); onFeedback && onFeedback("down"); }}
            aria-label="Needs work"
          >
            <Icons.ThumbsDown size={13} />
          </button>
        </div>
      </footer>
    </section>
  );
}

function SectionSkeleton({ title, eyebrow, lines = 3 }) {
  return (
    <section className="pp-bs pp-bs-skel">
      <header className="pp-bs-h">
        <div>
          {eyebrow && <div className="pp-bs-eyebrow">{eyebrow}</div>}
          <h3 className="pp-bs-title">{title}</h3>
        </div>
        <div className="pp-bs-h-right">
          <span className="pp-bs-pending">
            <span className="pp-spinner" /> Drafting…
          </span>
        </div>
      </header>
      <div className="pp-bs-body pp-bs-skel-body">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="pp-skel-line" style={{ width: `${100 - i * 8}%` }} />
        ))}
      </div>
    </section>
  );
}

// --- Section renderers ---

function SnapshotSection({ s, partner }) {
  return (
    <>
      <p className="pp-bs-headline">{s.headline}</p>
      <ul className="pp-fact-list">
        {(s.facts || []).map((f, i) => (
          <li key={i}>
            <span className="pp-fact-dot" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function HealthSection({ s, partner }) {
  const score = partner.health.score;
  const trend = String(partner.health.trend_qoq);
  const trendNum = parseInt(trend.replace(/[^-\d]/g, ""), 10);
  const prev = !isNaN(trendNum) ? score - trendNum : null;
  return (
    <>
      <div className="pp-health-row">
        <div className="pp-health-num">
          <div className="pp-bs-health-score">{score}</div>
          <div className="pp-health-trend">
            <Trend delta={partner.health.trend_qoq} /> QoQ
            {prev !== null && <span className="pp-health-prev">  from {prev}</span>}
          </div>
        </div>
        <div className="pp-health-bar-wrap">
          <div className="pp-health-bar">
            <div className="pp-health-bar-fill" style={{ width: `${score}%` }} />
            <div className="pp-health-bar-marker" style={{ left: "70%" }} title="Healthy threshold (70)" />
          </div>
          <div className="pp-health-bar-meta">
            <span>0</span>
            <span>70 healthy</span>
            <span>100</span>
          </div>
        </div>
      </div>
      <p className="pp-bs-narrative">{s.narrative}</p>
      <ul className="pp-driver-list">
        {(s.drivers || []).map((d, i) => {
          const impactStr = String(d.impact || "0");
          const impactNum = parseInt(impactStr.replace(/[^-\d]/g, ""), 10) || 0;
          let cls = "pp-driver-flat";
          if (impactNum > 0) cls = "pp-driver-up";
          else if (impactNum < 0) cls = "pp-driver-down";
          return (
            <li key={i} className="pp-driver">
              <span className={`pp-driver-impact ${cls}`}>{impactNum > 0 ? `+${impactNum}` : impactNum}</span>
              <span className="pp-driver-text">
                {d.text}
                <SourceChip partner={partner} evidence={d.evidence} />
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function PerformanceSection({ s, partner }) {
  return (
    <>
      <p className="pp-bs-narrative">{s.summary}</p>
      <div className="pp-metric-grid">
        {(s.metrics || []).map((m, i) => {
          const valueStr = String(m.value || "");
          let dir = null;
          if (/^[+]/.test(valueStr)) dir = "up";
          else if (/^[-]/.test(valueStr)) dir = "down";
          return (
            <div key={i} className="pp-metric">
              <div className="pp-metric-label">{m.label}</div>
              <div className={`pp-metric-value pp-metric-${dir || "flat"}`}>{m.value}</div>
              {m.note && <div className="pp-metric-note">{m.note}</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}

function PipelineSection({ s, partner }) {
  return (
    <>
      <p className="pp-bs-narrative">{s.summary}</p>
      {(s.deals || []).length === 0 ? (
        <div className="pp-empty">No active pipeline.</div>
      ) : (
        <div className="pp-deals">
          {(s.deals || []).map((d, i) => (
            <div key={i} className={`pp-deal ${d.hot ? "pp-deal-hot" : ""}`}>
              <div className="pp-deal-row">
                <div className="pp-deal-name">{d.name}</div>
                <div className="pp-deal-stage">{d.stage}</div>
              </div>
              <div className="pp-deal-meta">
                <span className="pp-deal-value">{d.value}</span>
                {d.blocker && (
                  <span className="pp-deal-blocker">
                    <Icons.Warning size={11} /> {d.blocker}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function RisksSection({ s, partner }) {
  if (!s || s.length === 0) {
    return <div className="pp-empty">No material risks flagged.</div>;
  }
  return (
    <ol className="pp-risk-list">
      {s.map((r, i) => (
        <li key={i} className={`pp-risk pp-risk-${(r.severity || "medium").toLowerCase()}`}>
          <div className="pp-risk-h">
            <span className="pp-risk-sev">{(r.severity || "medium").toUpperCase()}</span>
            <span className="pp-risk-title">{r.title}</span>
          </div>
          <div className="pp-risk-why">
            {r.why}
            <SourceChip partner={partner} evidence={r.evidence} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function WinsSection({ s, partner }) {
  if (!s || s.length === 0) {
    return <div className="pp-empty">No notable wins this quarter. (Worth naming this directly in the meeting — silence here is itself a signal.)</div>;
  }
  return (
    <ul className="pp-win-list">
      {s.map((w, i) => (
        <li key={i} className="pp-win">
          <Icons.Check size={13} />
          <span>
            {w.text}
            <SourceChip partner={partner} evidence={w.evidence} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function TalkingSection({ s, partner }) {
  if (!s || s.length === 0) return <div className="pp-empty">No talking points generated.</div>;
  return (
    <ol className="pp-talking-list">
      {s.map((t, i) => (
        <li key={i}>
          <span className="pp-talking-n">{i + 1}</span>
          <span>{t}</span>
        </li>
      ))}
    </ol>
  );
}

function ActionsSection({ s, partner }) {
  if (!s || s.length === 0) return <div className="pp-empty">No action items.</div>;
  return (
    <div className="pp-actions">
      {s.map((a, i) => (
        <label key={i} className="pp-action">
          <input type="checkbox" className="pp-checkbox" />
          <div className="pp-action-body">
            <div className="pp-action-what">{a.what}</div>
            <div className="pp-action-meta">
              <span className="pp-action-who">{a.who}</span>
              <span className="pp-dot-sep">·</span>
              <span className="pp-action-when">{a.when}</span>
            </div>
          </div>
        </label>
      ))}
    </div>
  );
}

const SECTION_DEFS = [
  { id: "snapshot", title: "Snapshot", eyebrow: "01", Comp: SnapshotSection },
  { id: "health", title: "Health score", eyebrow: "02", Comp: HealthSection },
  { id: "performance", title: "Performance vs goals", eyebrow: "03", Comp: PerformanceSection },
  { id: "pipeline", title: "Pipeline", eyebrow: "04", Comp: PipelineSection },
  { id: "risks", title: "Top risks", eyebrow: "05", Comp: RisksSection },
  { id: "wins", title: "Wins to celebrate", eyebrow: "06", Comp: WinsSection },
  { id: "talking_points", title: "Suggested talking points", eyebrow: "07", Comp: TalkingSection },
  { id: "actions", title: "Pre-meeting actions", eyebrow: "08", Comp: ActionsSection },
];

Object.assign(window, {
  Section,
  SectionSkeleton,
  SECTION_DEFS,
  SourceChip,
});
