// briefs.jsx — Briefs library + comparison view

const { useState: useStateBR, useMemo: useMemoBR } = React;

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
function relTime(iso) {
  const d = new Date(iso);
  const today = new Date("2026-05-12T08:42:00");
  const days = Math.floor((today - d) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  return `${Math.round(days / 30)}mo ago`;
}

function statusPill(b) {
  if (b.status === "exported") {
    const fmt = (b.exportFormat || "doc").toUpperCase();
    return <span className="pp-bf-status pp-bf-st-exp">Exported · {fmt}</span>;
  }
  return <span className="pp-bf-status pp-bf-st-draft">Draft</span>;
}

function BriefRow({ brief, onOpen }) {
  return (
    <button className="pp-bf-row" onClick={() => onOpen(brief)}>
      <div className="pp-bf-row-l">
        <div className="pp-bf-name">{brief.partner}</div>
        <div className="pp-bf-headline">{brief.state.headline}</div>
      </div>
      <div className="pp-bf-row-meta">
        <div className="pp-bf-mono">
          <HealthDot score={brief.state.health} />
          <span className="pp-mono">{brief.state.health}</span>
          <Trend delta={brief.state.trend} />
        </div>
      </div>
      <div className="pp-bf-row-q">{brief.quarter}</div>
      <div className="pp-bf-row-when">
        <div>{fmtDate(brief.generatedAt)}</div>
        <div className="pp-bf-soft">{relTime(brief.generatedAt)} · {fmtTime(brief.generatedAt)}</div>
      </div>
      <div className="pp-bf-row-edits">
        {brief.editCount > 0 ? (
          <span className="pp-bf-edits">
            <Icons.Refresh size={11} /> {brief.editCount} edit{brief.editCount === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="pp-bf-soft">Used as-is</span>
        )}
      </div>
      <div className="pp-bf-row-status">{statusPill(brief)}</div>
      <div className="pp-bf-row-arrow"><Icons.ArrowRight size={14} /></div>
    </button>
  );
}

function BriefsLibrary({ onOpenBrief }) {
  const [filter, setFilter] = useStateBR("all");
  const [query, setQuery] = useStateBR("");

  const all = window.BRIEF_HISTORY || [];
  const filtered = useMemoBR(() => {
    let r = all;
    if (filter === "q2") r = r.filter((b) => b.quarter === "Q2 2026");
    else if (filter === "q1") r = r.filter((b) => b.quarter === "Q1 2026");
    else if (filter === "drafts") r = r.filter((b) => b.status === "draft");
    else if (filter === "exported") r = r.filter((b) => b.status === "exported");
    if (query) {
      const q = query.toLowerCase();
      r = r.filter((b) => (b.partner + " " + b.state.headline).toLowerCase().includes(q));
    }
    return [...r].sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
  }, [filter, query, all]);

  const counts = useMemoBR(() => ({
    all: all.length,
    q2: all.filter((b) => b.quarter === "Q2 2026").length,
    q1: all.filter((b) => b.quarter === "Q1 2026").length,
    drafts: all.filter((b) => b.status === "draft").length,
    exported: all.filter((b) => b.status === "exported").length,
  }), [all]);

  return (
    <div className="pp-page">
      <header className="pp-pageh">
        <div>
          <div className="pp-eyebrow">Library</div>
          <h1 className="pp-h1">Briefs</h1>
          <p className="pp-sub">
            {counts.all} briefs across your portfolio · {counts.drafts} drafts · {counts.exported} exported
          </p>
        </div>
        <div className="pp-pageh-actions">
          <div className="pp-search" style={{minWidth: 280}}>
            <Icons.Search size={14} />
            <input
              placeholder="Search briefs, partners, headlines…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="pp-bf-filters">
        {[
          { id: "all", label: "All", count: counts.all },
          { id: "q2", label: "This quarter", count: counts.q2 },
          { id: "q1", label: "Q1 2026", count: counts.q1 },
          { id: "drafts", label: "Drafts", count: counts.drafts },
          { id: "exported", label: "Exported", count: counts.exported },
        ].map((f) => (
          <button
            key={f.id}
            className={`pp-bf-filter ${filter === f.id ? "is-on" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            <span className="pp-bf-filter-n">{f.count}</span>
          </button>
        ))}
      </div>

      <div className="pp-bf-list">
        <div className="pp-bf-list-h">
          <div className="pp-bf-row-l">Partner / headline</div>
          <div className="pp-bf-row-meta">Health</div>
          <div className="pp-bf-row-q">Quarter</div>
          <div className="pp-bf-row-when">Generated</div>
          <div className="pp-bf-row-edits">Edits</div>
          <div className="pp-bf-row-status">Status</div>
          <div className="pp-bf-row-arrow"></div>
        </div>
        {filtered.map((b) => (
          <BriefRow key={b.id} brief={b} onOpen={onOpenBrief} />
        ))}
        {filtered.length === 0 && (
          <div className="pp-empty" style={{margin: "16px 0"}}>No briefs match these filters.</div>
        )}
      </div>
    </div>
  );
}

// ─── Brief detail with diff to current quarter ───────────────────────────────

function deltaArrow(prev, cur) {
  const p = parseInt(String(prev).replace(/[^-\d]/g, ""), 10);
  const c = parseInt(String(cur).replace(/[^-\d]/g, ""), 10);
  if (isNaN(p) || isNaN(c)) return null;
  return c - p;
}

function BriefDetail({ brief, onBack, onOpenPartner }) {
  const [compare, setCompare] = useStateBR(true);
  const partner = window.PARTNERS_BY_ID[brief.partnerId];
  const isQ1 = brief.quarter === "Q1 2026";
  // The current (Q2) view uses the live partner data for comparison
  const current = partner ? {
    health: partner.health.score,
    trend: partner.health.trend_qoq,
    headline: `Health ${partner.health.score} (${partner.health.trend_qoq} QoQ) · ${partner.contract.status}`,
  } : null;

  const healthDelta = current ? deltaArrow(brief.state.health, current.health) : null;

  return (
    <div className="pp-page">
      <div className="pp-partner-h">
        <div className="pp-partner-h-top">
          <button className="pp-back" onClick={onBack}>
            <Icons.ArrowLeft size={14} /> Briefs
          </button>
          <div className="pp-partner-h-actions">
            {isQ1 && partner && (
              <button className="pp-btn pp-btn-ghost" onClick={() => setCompare(!compare)}>
                <Icons.Refresh size={13} /> {compare ? "Hide comparison" : "Compare to current quarter"}
              </button>
            )}
            {partner && (
              <button className="pp-btn pp-btn-primary" onClick={() => onOpenPartner(partner)}>
                Open current brief <Icons.ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
        <div className="pp-partner-h-name-row">
          <h1 className="pp-h1">{brief.partner}</h1>
          <span className="pp-pill-tier">{brief.quarter}</span>
          {statusPill(brief)}
        </div>
        <div className="pp-partner-h-sub">
          Generated {fmtDate(brief.generatedAt)} at {fmtTime(brief.generatedAt)} · {brief.editCount} section edit{brief.editCount === 1 ? "" : "s"} · {brief.thumbsUp} 👍 {brief.thumbsDown} 👎
        </div>
      </div>

      {isQ1 && compare && current && (
        <section className="pp-section">
          <div className="pp-secth">
            <h2 className="pp-h2">What changed since {brief.quarter}</h2>
            <span className="pp-secth-note">
              <Icons.Sparkle size={11} /> Pulse delta · Q1 2026 → Q2 2026
            </span>
          </div>

          <div className="pp-diff-grid">
            <div className="pp-diff-card">
              <div className="pp-diff-card-l">Health score</div>
              <div className="pp-diff-card-body">
                <div className="pp-diff-num">
                  <span className="pp-diff-then pp-mono">{brief.state.health}</span>
                  <Icons.ArrowRight size={14} />
                  <span className="pp-diff-now pp-mono">{current.health}</span>
                </div>
                <div className={`pp-diff-delta ${healthDelta > 0 ? "pp-diff-up" : healthDelta < 0 ? "pp-diff-down" : ""}`}>
                  {healthDelta > 0 ? "+" : ""}{healthDelta} pts
                </div>
              </div>
            </div>
            <div className="pp-diff-card">
              <div className="pp-diff-card-l">QoQ trend</div>
              <div className="pp-diff-card-body">
                <div className="pp-diff-num">
                  <span className="pp-mono">{brief.state.trend}</span>
                  <Icons.ArrowRight size={14} />
                  <span className="pp-mono">{current.trend}</span>
                </div>
                <div className="pp-meta-soft">previous quarter → this quarter</div>
              </div>
            </div>
            <div className="pp-diff-card pp-diff-card-wide">
              <div className="pp-diff-card-l">Brief framing shifted</div>
              <div className="pp-diff-card-body">
                <div className="pp-diff-then-block">
                  <div className="pp-diff-tag">Then</div>
                  <p>{brief.state.headline}</p>
                </div>
                <div className="pp-diff-now-block">
                  <div className="pp-diff-tag pp-diff-tag-now">Now</div>
                  <p>{current.headline}</p>
                </div>
              </div>
            </div>
          </div>

          {(partner.open_issues || []).length > 0 && (
            <div className="pp-diff-narrative">
              <div className="pp-diff-narrative-h">
                <Icons.Sparkle size={12} /> New since {brief.quarter}
              </div>
              <ul className="pp-diff-bullets">
                {partner.open_issues.slice(0, 3).map((iss, i) => (
                  <li key={i}><span className="pp-diff-dot pp-diff-dot-new" /> {iss}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="pp-section">
        <div className="pp-secth">
          <h2 className="pp-h2">Brief snapshot · {brief.quarter}</h2>
          <span className="pp-secth-note">As it was at the time of the meeting</span>
        </div>
        <div className="pp-bs">
          <div className="pp-bs-h">
            <div>
              <div className="pp-bs-eyebrow">Headline</div>
              <h3 className="pp-bs-title">{brief.state.headline}</h3>
            </div>
          </div>
          <div className="pp-bs-body">
            <div className="pp-snap-row">
              <div className="pp-snap-col">
                <div className="pp-snap-lbl">Health at time</div>
                <div className="pp-snap-val">
                  <HealthDot score={brief.state.health} />
                  <span className="pp-mono pp-snap-num">{brief.state.health}</span>
                  <Trend delta={brief.state.trend} />
                </div>
              </div>
              <div className="pp-snap-col">
                <div className="pp-snap-lbl">Edits before export</div>
                <div className="pp-snap-val">
                  <span className="pp-mono pp-snap-num">{brief.editCount}</span>
                  <span className="pp-meta-soft">{brief.edited.length ? "in " + brief.edited.join(", ") : "no edits"}</span>
                </div>
              </div>
              <div className="pp-snap-col">
                <div className="pp-snap-lbl">Feedback</div>
                <div className="pp-snap-val">
                  <span className="pp-thumb is-on" style={{cursor:"default"}}><Icons.ThumbsUp size={12} /></span>
                  <span className="pp-mono">{brief.thumbsUp}</span>
                  <span className="pp-thumb" style={{cursor:"default", marginLeft: 4}}><Icons.ThumbsDown size={12} /></span>
                  <span className="pp-mono">{brief.thumbsDown}</span>
                </div>
              </div>
              <div className="pp-snap-col">
                <div className="pp-snap-lbl">Status</div>
                <div className="pp-snap-val">{statusPill(brief)}</div>
              </div>
            </div>
            <div className="pp-snap-note">
              Brief content snapshots from prior quarters are stored on export.
              For the full Q1 brief, open the archived export
              {brief.status === "exported" && brief.exportFormat ? ` in ${brief.exportFormat.toUpperCase()}` : ""}
              .
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { BriefsLibrary, BriefDetail });
