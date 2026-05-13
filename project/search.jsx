// search.jsx — SmartSearch with rotating placeholder + multi-type results.
// Indexes partners, pipeline deals, and open issues at module load.

const { useState: useStateSR, useEffect: useEffectSR, useMemo: useMemoSR, useRef: useRefSR } = React;

const SEARCH_HINTS = [
  "Search partners, deals, issues…",
  "Try \"Lumen: Stardrift\"",
  "Try \"renewal stuck in legal\"",
  "Try \"Yokai Court appeal\"",
  "Try \"Min-jae Park\"",
  "Try \"TileTales\"",
  "Try \"exec sponsor changed\"",
  "Try \"UPI compliance\"",
];

function buildSearchIndex(partners) {
  const items = [];
  partners.forEach((p) => {
    // Partner record
    items.push({
      kind: "partner",
      partnerId: p.id,
      partner: p.name,
      label: p.name,
      sub: `${p.type} · ${p.region.replace(/^APAC — /, "")} · health ${p.health.score}`,
      hay: [p.name, p.type, p.region, p.hq, p.revenue_tier, p.tier, p.executive_sponsor_partner, p.executive_sponsor_google]
        .join(" ").toLowerCase(),
    });
    // Apps
    (p.apps || []).forEach((a) => {
      if (!a.name || a.name.startsWith("(")) return;
      items.push({
        kind: "app",
        partnerId: p.id,
        partner: p.name,
        label: a.name,
        sub: `${a.genre} · ${p.name} · ${a.status}`,
        hay: `${a.name} ${a.genre} ${a.status} ${p.name}`.toLowerCase(),
      });
    });
    // Pipeline deals
    (p.pipeline || []).forEach((d) => {
      items.push({
        kind: "deal",
        partnerId: p.id,
        partner: p.name,
        label: d.deal,
        sub: `${d.stage} · ${p.name}`,
        hay: `${d.deal} ${d.stage} ${(d.blockers || []).join(" ")} ${p.name}`.toLowerCase(),
      });
    });
    // Open issues
    (p.open_issues || []).forEach((iss) => {
      items.push({
        kind: "issue",
        partnerId: p.id,
        partner: p.name,
        label: iss.length > 64 ? iss.slice(0, 62).trim() + "…" : iss,
        sub: `Open issue · ${p.name}`,
        hay: `${iss} ${p.name}`.toLowerCase(),
      });
    });
    // Recent activity
    (p.recent_activity || []).forEach((a) => {
      items.push({
        kind: "activity",
        partnerId: p.id,
        partner: p.name,
        label: a.summary.length > 60 ? a.summary.slice(0, 58).trim() + "…" : a.summary,
        sub: `${a.date} · ${a.type.replace(/_/g, " ")} · ${p.name}`,
        hay: `${a.summary} ${a.type} ${p.name}`.toLowerCase(),
      });
    });
  });
  return items;
}

const KIND_META = {
  partner:  { label: "Partner",   Icon: () => <Icons.Portfolio size={11} /> },
  app:      { label: "App",        Icon: () => <Icons.Sparkle size={11} /> },
  deal:     { label: "Deal",       Icon: () => <Icons.Bolt size={11} /> },
  issue:    { label: "Issue",      Icon: () => <Icons.Warning size={11} /> },
  activity: { label: "Activity",   Icon: () => <Icons.Calendar size={11} /> },
};

function highlight(text, q) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="pp-srch-hl">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

function SmartSearch({ partners, onOpenPartner, autoFocus }) {
  const [q, setQ] = useStateSR("");
  const [open, setOpen] = useStateSR(false);
  const [hintIdx, setHintIdx] = useStateSR(0);
  const [activeIdx, setActiveIdx] = useStateSR(0);
  const wrapRef = useRefSR(null);
  const inputRef = useRefSR(null);

  const index = useMemoSR(() => buildSearchIndex(partners || []), [partners]);

  // Rotating placeholder when not focused / empty
  useEffectSR(() => {
    if (q || open) return;
    const id = setInterval(() => setHintIdx((i) => (i + 1) % SEARCH_HINTS.length), 3200);
    return () => clearInterval(id);
  }, [q, open]);

  // Click outside → close
  useEffectSR(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cmd-K / Ctrl-K to focus
  useEffectSR(() => {
    function handler(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const results = useMemoSR(() => {
    if (!q || q.length < 2) return [];
    const needle = q.toLowerCase();
    const matches = index.filter((it) => it.hay.includes(needle));
    // Order: partner > app > deal > issue > activity, then by label length
    const order = { partner: 0, app: 1, deal: 2, issue: 3, activity: 4 };
    matches.sort((a, b) => order[a.kind] - order[b.kind] || a.label.length - b.label.length);
    return matches.slice(0, 12);
  }, [q, index]);

  // Group results by kind for display
  const grouped = useMemoSR(() => {
    const g = {};
    results.forEach((r, i) => {
      if (!g[r.kind]) g[r.kind] = [];
      g[r.kind].push({ ...r, idx: i });
    });
    return g;
  }, [results]);

  function handleSelect(item) {
    const p = window.PARTNERS_BY_ID[item.partnerId];
    if (p && onOpenPartner) onOpenPartner(p);
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
  }

  function handleKey(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[activeIdx]) handleSelect(results[activeIdx]);
    }
  }

  const showDropdown = open && q.length >= 2;

  return (
    <div className={`pp-srch-wrap ${open ? "is-open" : ""}`} ref={wrapRef}>
      <div className="pp-search">
        <Icons.Search size={14} />
        <input
          ref={inputRef}
          placeholder={SEARCH_HINTS[hintIdx]}
          value={q}
          onChange={(e) => { setQ(e.target.value); setActiveIdx(0); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          autoFocus={autoFocus}
        />
        {q ? (
          <button className="pp-srch-clear" onClick={() => { setQ(""); inputRef.current?.focus(); }} aria-label="Clear">
            <Icons.Close size={11} />
          </button>
        ) : (
          <kbd>⌘K</kbd>
        )}
      </div>

      {showDropdown && (
        <div className="pp-srch-pop" role="listbox">
          {results.length === 0 ? (
            <div className="pp-srch-empty">No matches for "{q}"</div>
          ) : (
            <>
              <div className="pp-srch-meta">
                {results.length} result{results.length === 1 ? "" : "s"} · ↑↓ navigate · ↵ open
              </div>
              {Object.entries(grouped).map(([kind, items]) => {
                const KindIcon = KIND_META[kind].Icon;
                return (
                <div key={kind} className="pp-srch-group">
                  <div className="pp-srch-group-h">
                    <KindIcon />
                    <span>{KIND_META[kind].label}{items.length > 1 ? "s" : ""}</span>
                    <span className="pp-srch-group-n">{items.length}</span>
                  </div>
                  {items.map((it) => (
                    <button
                      key={it.kind + "-" + it.partnerId + "-" + it.label}
                      className={`pp-srch-item ${it.idx === activeIdx ? "is-on" : ""}`}
                      onMouseEnter={() => setActiveIdx(it.idx)}
                      onClick={() => handleSelect(it)}
                    >
                      <div className="pp-srch-item-l">
                        <div className="pp-srch-item-label">{highlight(it.label, q)}</div>
                        <div className="pp-srch-item-sub">{highlight(it.sub, q)}</div>
                      </div>
                      <Icons.ArrowRight size={12} />
                    </button>
                  ))}
                </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { SmartSearch });
