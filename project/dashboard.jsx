// dashboard.jsx — Portfolio dashboard
// Shows "Needs attention" surfacing + full partner table.

const { useState, useMemo, useRef, useEffect, useCallback } = React;

function HealthDot({ score }) {
  let cls = "pp-dot-good";
  if (score < 60) cls = "pp-dot-bad";else
  if (score < 75) cls = "pp-dot-warn";
  return <span className={`pp-dot ${cls}`} />;
}

// HealthCell — inline health display with a hover tooltip that explains
// how the score is derived (driver-level breakdown from the partner data).
function HealthCell({ partner, compact }) {
  const [hov, setHov] = React.useState(false);
  const [pos, setPos] = React.useState(null);
  const ref = React.useRef(null);

  function onEnter() {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left });
    setHov(true);
  }
  function onLeave() { setHov(false); }

  const driverList = (partner.health.drivers || []).map((d) => {
    const m = String(d).match(/\(([+-]?\d+)\)\s*$/);
    const impact = m ? parseInt(m[1], 10) : null;
    const text = String(d).replace(/\s*\([+-]?\d+\)\s*$/, "");
    return { text, impact };
  });
  const score = partner.health.score;
  const trend = partner.health.trend_qoq;
  const tier = score >= 75 ? "Healthy" : score >= 60 ? "Watch" : "At risk";

  return (
    <>
      <span
        ref={ref}
        className="pp-hcell"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onClick={(e) => e.stopPropagation()}
      >
        <HealthDot score={score} />
        <span className="pp-mono pp-health-score">{score}</span>
        {!compact && <Trend delta={trend} />}
      </span>
      {hov && pos && ReactDOM.createPortal(
        <div className="pp-htip" style={{ top: pos.top, left: pos.left }} role="tooltip">
          <div className="pp-htip-h">
            <div className="pp-htip-score">
              <HealthDot score={score} />
              <span className="pp-mono pp-htip-num">{score}</span>
              <Trend delta={trend} />
            </div>
            <span className={`pp-htip-tier pp-htip-tier-${tier.toLowerCase().replace(' ', '-')}`}>{tier}</span>
          </div>
          <div className="pp-htip-explain">
            Pulse blends signals from CRM, Play Console, support, and activity logs into a 0–100 score.
            70 is the healthy threshold.
          </div>
          <div className="pp-htip-drivers-h">Drivers this quarter</div>
          <ul className="pp-htip-drivers">
            {driverList.slice(0, 5).map((d, i) => (
              <li key={i}>
                {d.impact !== null && (
                  <span className={`pp-htip-impact ${d.impact > 0 ? "pp-htip-up" : d.impact < 0 ? "pp-htip-down" : "pp-htip-flat"}`}>
                    {d.impact > 0 ? "+" : ""}{d.impact}
                  </span>
                )}
                <span>{d.text}</span>
              </li>
            ))}
          </ul>
          <div className="pp-htip-foot">
            <Icons.Sparkle size={10} /> Click the partner to see the full health breakdown
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function Trend({ delta }) {
  if (delta === null || delta === undefined || delta === "N/A — new partner" || delta === "N/A") {
    return <span className="pp-trend pp-trend-flat">—</span>;
  }
  const numeric = typeof delta === "number" ? delta : parseInt(String(delta).replace(/[^-\d]/g, ""), 10);
  if (isNaN(numeric)) return <span className="pp-trend pp-trend-flat">{String(delta)}</span>;
  if (numeric > 1) {
    return (
      <span className="pp-trend pp-trend-up">
        <Icons.ArrowUp size={11} stroke={2} /> {Math.abs(numeric)}
      </span>);

  }
  if (numeric < -1) {
    return (
      <span className="pp-trend pp-trend-down">
        <Icons.ArrowDown size={11} stroke={2} /> {Math.abs(numeric)}
      </span>);

  }
  return (
    <span className="pp-trend pp-trend-flat">
      <Icons.Minus size={11} stroke={2} /> 0
    </span>);

}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const m = String(dateStr).match(/(\d{4}-\d{2}-\d{2})/);
  if (!m) return null;
  const target = new Date(m[1] + "T00:00:00");
  const today = new Date("2026-05-12T00:00:00");
  return Math.round((target - today) / 86400000);
}

function dueLabel(days) {
  if (days === null) return "—";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  return `${Math.round(days / 30)}mo`;
}

function tierPill(tier) {
  let cls = "pp-pill-tier";
  const t = String(tier).toLowerCase();
  if (t.includes("review") || t.includes("downgrade")) cls += " pp-pill-warn";else
  if (t.includes("emerging") || t.includes("new")) cls += " pp-pill-soft";
  return <span className={cls}>{tier}</span>;
}

function attentionReasons(p) {
  const reasons = [];
  const days = daysUntil(p.next_qbr);
  if (days !== null && days <= 7) {
    reasons.push({ label: `QBR in ${dueLabel(days)}`, details: [`Next QBR scheduled for ${p.next_qbr}`] });
  }
  if (p.health.score < 70) {
    reasons.push({
      label: `Health ${p.health.score}`,
      details: (p.health.drivers || []).filter((d) => /\(-/.test(d)),
      empty: "Below threshold — see brief for drivers.",
    });
  }
  const trendNum = parseInt(String(p.health.trend_qoq).replace(/[^-\d]/g, ""), 10);
  if (!isNaN(trendNum) && trendNum <= -5) {
    reasons.push({
      label: `${trendNum} QoQ`,
      details: (p.health.drivers || []).filter((d) => /\(-/.test(d)),
      empty: "Trend declined this quarter.",
    });
  }
  if (p.contract.status && /risk|stalled|review/i.test(p.contract.status)) {
    reasons.push({
      label: "Contract at risk",
      details: [`${p.contract.type} · renewal ${p.contract.renewal_date}`, p.contract.status],
    });
  }
  const issues = p.open_issues || [];
  if (issues.length >= 2) {
    reasons.push({ label: `${issues.length} open issues`, details: issues });
  }
  return reasons;
}

function AttentionCard({ p, onOpen }) {
  const reasons = attentionReasons(p);
  return (
    <button className="pp-attn" onClick={() => onOpen(p)}>
      <div className="pp-attn-h">
        <div className="pp-attn-name">{p.name}</div>
        <div className="pp-attn-score">
          <HealthDot score={p.health.score} />
          <span className="pp-mono">{p.health.score}</span>
          <Trend delta={p.health.trend_qoq} />
        </div>
      </div>
      <div className="pp-attn-meta">{p.type} · {p.region.replace(/^APAC — /, "")}</div>
      <div className="pp-attn-reasons">
        {reasons.map((r, i) =>
        <span
          key={i}
          className="pp-chip pp-chip-warn pp-chip-pop"
          onClick={(e) => e.stopPropagation()}
          tabIndex={0}>
          {r.label}
          <span className="pp-chip-pop-card" role="tooltip">
            <span className="pp-chip-pop-title">{r.label}</span>
            {r.details && r.details.length ?
              <ul className="pp-chip-pop-list">
                {r.details.map((d, j) => <li key={j}>{d}</li>)}
              </ul> :
              <span className="pp-chip-pop-empty">{r.empty || "No further detail."}</span>
            }
          </span>
        </span>
        )}
      </div>
      <div className="pp-attn-foot">
        <span className="pp-attn-qbr">
          <Icons.Calendar size={12} /> QBR {dueLabel(daysUntil(p.next_qbr))}
        </span>
        <span className="pp-attn-open">
          Open brief <Icons.ArrowRight size={12} />
        </span>
      </div>
    </button>);

}

function Dashboard({ onOpenPartner }) {
  const [sortKey, setSortKey] = useState("qbr");

  const partners = window.PARTNERS;

  const attention = useMemo(() => {
    return partners.
    map((p) => ({ p, reasons: attentionReasons(p) })).
    filter((x) => {
      const t = parseInt(String(x.p.health.trend_qoq).replace(/[^-\d]/g, ""), 10);
      const declining = !isNaN(t) && t < 0;
      return x.reasons.length >= 1 || x.p.health.score < 70 || declining;
    }).
    sort((a, b) => a.p.health.score - b.p.health.score).
    map((x) => x.p);
  }, [partners]);

  const attnScroller = useRef(null);
  const [attnPos, setAttnPos] = useState({ atStart: true, atEnd: false });
  const updateAttnPos = useCallback(() => {
    const el = attnScroller.current;
    if (!el) return;
    setAttnPos({
      atStart: el.scrollLeft <= 4,
      atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);
  useEffect(() => { updateAttnPos(); }, [attention, updateAttnPos]);
  function scrollAttn(dir) {
    const el = attnScroller.current;
    if (!el) return;
    const card = el.querySelector(".pp-attn");
    const step = card ? card.getBoundingClientRect().width + 12 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step * 1.5, behavior: "smooth" });
  }

  const rows = useMemo(() => {
    let r = [...partners];
    if (sortKey === "qbr") {
      r = r.sort((a, b) => (daysUntil(a.next_qbr) ?? 999) - (daysUntil(b.next_qbr) ?? 999));
    } else if (sortKey === "health") {
      r = r.sort((a, b) => a.health.score - b.health.score);
    } else if (sortKey === "name") {
      r = r.sort((a, b) => a.name.localeCompare(b.name));
    }
    return r;
  }, [partners, sortKey]);

  const stats = useMemo(() => {
    const total = partners.length;
    const avgHealth = Math.round(partners.reduce((s, p) => s + p.health.score, 0) / total);
    const thisWeek = partners.filter((p) => {
      const d = daysUntil(p.next_qbr);
      return d !== null && d >= 0 && d <= 7;
    }).length;
    const declining = partners.filter((p) => {
      const t = parseInt(String(p.health.trend_qoq).replace(/[^-\d]/g, ""), 10);
      return !isNaN(t) && t < 0;
    }).length;
    return { total, avgHealth, thisWeek, declining };
  }, [partners]);

  return (
    <div className="pp-page">
      <header className="pp-pageh">
        <div>
          <div className="pp-eyebrow">Tuesday · May 12 · 8:42 AM</div>
          <h1 className="pp-h1">Good morning, Sarah</h1>
          <p className="pp-sub">
            <span>{stats.thisWeek} QBRs this week</span>
            <span className="pp-sub-sep">·</span>
            <span>{stats.declining} partners trending down</span>
            <span className="pp-sub-sep">·</span>
            <span>book health avg {stats.avgHealth}</span>
          </p>
        </div>
        <div className="pp-pageh-actions">
          <SmartSearch partners={partners} onOpenPartner={onOpenPartner} />
        </div>
      </header>

      <section className="pp-section">
        <div className="pp-secth">
          <h2 className="pp-h2">Needs attention <span className="pp-secth-count">{attention.length}</span></h2>
          <div className="pp-secth-right">
            <span className="pp-secth-note">Surfaced by Pulse · refreshed 6 min ago</span>
            <div className="pp-carousel-nav">
              <button
                className="pp-carousel-btn"
                onClick={() => scrollAttn(-1)}
                disabled={attnPos.atStart}
                aria-label="Previous">
                <Icons.ArrowLeft size={14} />
              </button>
              <button
                className="pp-carousel-btn"
                onClick={() => scrollAttn(1)}
                disabled={attnPos.atEnd}
                aria-label="Next">
                <Icons.ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
        <div
          className="pp-attn-carousel"
          ref={attnScroller}
          onScroll={updateAttnPos}>
          {attention.map((p) =>
          <AttentionCard key={p.id} p={p} onOpen={onOpenPartner} />
          )}
        </div>
      </section>

      <section className="pp-section">
        <div className="pp-secth">
          <h2 className="pp-h2">Your portfolio</h2>
          <div className="pp-tabs">
            <button
              className={`pp-tab ${sortKey === "qbr" ? "is-on" : ""}`}
              onClick={() => setSortKey("qbr")}>
              
              By next QBR
            </button>
            <button
              className={`pp-tab ${sortKey === "health" ? "is-on" : ""}`}
              onClick={() => setSortKey("health")}>
              
              By health
            </button>
            <button
              className={`pp-tab ${sortKey === "name" ? "is-on" : ""}`}
              onClick={() => setSortKey("name")}>
              
              Alphabetical
            </button>
          </div>
        </div>

        <div className="pp-table">
          <div className="pp-tr pp-th">
            <div className="pp-td pp-td-name">Partner</div>
            <div className="pp-td pp-td-type">Type</div>
            <div className="pp-td pp-td-tier">Tier</div>
            <div className="pp-td pp-td-health">Health</div>
            <div className="pp-td pp-td-qbr">Next QBR</div>
            <div className="pp-td pp-td-status">Status</div>
            <div className="pp-td pp-td-action"></div>
          </div>
          {rows.map((p) => {
            const d = daysUntil(p.next_qbr);
            const isSoon = d !== null && d <= 7;
            const status = (() => {
              if (/risk|stalled/i.test(p.contract.status)) return { text: "Contract at risk", cls: "pp-status-bad" };
              if (/review/i.test(p.contract.status)) return { text: "Under review", cls: "pp-status-warn" };
              if (/onboarding/i.test(p.contract.status)) return { text: "Onboarding", cls: "pp-status-soft" };
              if ((p.open_issues || []).length >= 2) return { text: `${p.open_issues.length} open issues`, cls: "pp-status-warn" };
              return { text: p.contract.status.split(" — ")[0], cls: "pp-status-ok" };
            })();
            return (
              <button key={p.id} className="pp-tr pp-tr-row" onClick={() => onOpenPartner(p)}>
                <div className="pp-td pp-td-name">
                  <div className="pp-partner-name">{p.name}</div>
                  <div className="pp-partner-hq">{p.hq}</div>
                </div>
                <div className="pp-td pp-td-type">{p.type}</div>
                <div className="pp-td pp-td-tier">{tierPill(p.tier)}</div>
                <div className="pp-td pp-td-health">
                  <HealthCell partner={p} />
                </div>
                <div className="pp-td pp-td-qbr">
                  <span className={`pp-mono ${isSoon ? "pp-due-soon" : ""}`}>{dueLabel(d)}</span>
                  <span className="pp-qbr-date">{(p.next_qbr || "").replace(" (FIRST QBR)", "")}</span>
                </div>
                <div className="pp-td pp-td-status">
                  <span className={`pp-status ${status.cls}`}>{status.text}</span>
                </div>
                <div className="pp-td pp-td-action">
                  <Icons.ArrowRight size={14} />
                </div>
              </button>);

          })}
        </div>
      </section>
    </div>);

}

Object.assign(window, { Dashboard, daysUntil, dueLabel, HealthDot, Trend, HealthCell });