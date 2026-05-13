// partner-view.jsx — the partner detail screen.
// 3 states: idle (pre-generation), generating (streaming), done (brief rendered)

const { useState: useStatePV, useEffect: useEffectPV, useMemo: useMemoPV } = React;

function PartnerHeader({ partner, onBack, mode, onGenerate, onExport, onRegenAll, regenAllBusy }) {
  return (
    <div className="pp-partner-h">
      <div className="pp-partner-h-top">
        <button className="pp-back" onClick={onBack}>
          <Icons.ArrowLeft size={14} /> Portfolio
        </button>
        <div className="pp-partner-h-actions">
          {mode === "done" && (
            <>
              <button className="pp-btn pp-btn-ghost" onClick={onRegenAll} disabled={regenAllBusy}>
                <Icons.Refresh size={13} />
                {regenAllBusy ? "Regenerating…" : "Regenerate brief"}
              </button>
              <button className="pp-btn pp-btn-primary" onClick={onExport}>
                <Icons.ArrowRight size={13} />
                Export
              </button>
            </>
          )}
        </div>
      </div>
      <div className="pp-partner-h-meta">
        <div className="pp-partner-h-name-row">
          <h1 className="pp-h1">{partner.name}</h1>
          {tierPill(partner.tier)}
        </div>
        <div className="pp-partner-h-sub">
          <span>{partner.type}</span>
          <span className="pp-dot-sep">·</span>
          <span>{partner.region}</span>
          <span className="pp-dot-sep">·</span>
          <span>{partner.hq}</span>
          <span className="pp-dot-sep">·</span>
          <span>{partner.revenue_tier}</span>
        </div>
      </div>
      <div className="pp-partner-h-grid">
        <div className="pp-meta">
          <div className="pp-meta-l">Health</div>
          <div className="pp-meta-v">
            <HealthDot score={partner.health.score} />
            <span className="pp-mono pp-meta-strong">{partner.health.score}</span>
            <Trend delta={partner.health.trend_qoq} />
          </div>
        </div>
        <div className="pp-meta">
          <div className="pp-meta-l">Next QBR</div>
          <div className="pp-meta-v">
            <Icons.Calendar size={13} />
            <span>{(partner.next_qbr || "").replace(" (FIRST QBR)", "")}</span>
            <span className="pp-meta-soft">· {dueLabel(daysUntil(partner.next_qbr))}</span>
          </div>
        </div>
        <div className="pp-meta">
          <div className="pp-meta-l">Account team</div>
          <div className="pp-meta-v">
            <span>{partner.account_manager}</span>
            <span className="pp-meta-soft">+ {partner.executive_sponsor_google.split(" (")[0]}</span>
          </div>
        </div>
        <div className="pp-meta">
          <div className="pp-meta-l">Partner sponsor</div>
          <div className="pp-meta-v">
            <span>{(() => {
              const raw = partner.executive_sponsor_partner || "";
              const m = raw.match(/now\s+([^(]+?)(?:\s*\(|$)/);
              if (m) return m[1].trim();
              return raw.split(" (")[0];
            })()}</span>
            {/CHANGED|changed|minimally/i.test(partner.executive_sponsor_partner) && (
              <span className="pp-chip pp-chip-warn">Changed recently</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreGenerate({ partner, onGenerate }) {
  const lastQbr = partner.last_qbr || "—";
  const sourceCount = useMemoPV(() => {
    const sources = [
      "CRM (deals & contacts)",
      "Play Console (revenue, MAU, retention)",
      "Activity log (emails, meetings)",
      "Open issues & escalations",
      "Policy review queue",
    ];
    return sources;
  }, []);

  return (
    <div className="pp-pregen">
      <div className="pp-pregen-card">
        <div className="pp-pregen-left">
          <div className="pp-pregen-eyebrow">
            <Icons.Sparkle size={12} /> Partnership Pulse
          </div>
          <h2 className="pp-pregen-h">Draft this QBR brief</h2>
          <p className="pp-pregen-p">
            Pulse will read {partner.name}'s CRM record, last quarter's performance, recent activity, and any open issues — then
            assemble a senior-ready 1-page brief in about 10 seconds. You'll review every section before it leaves your screen.
          </p>
          <button className="pp-cta" onClick={onGenerate}>
            <Icons.Sparkle size={14} /> Generate brief
            <span className="pp-cta-meta">⌘↵</span>
          </button>
          <div className="pp-pregen-foot">
            Drafted briefs are private to you until you export. Every claim links back to a source.
          </div>
        </div>
        <div className="pp-pregen-right">
          <div className="pp-pregen-sources">
            <div className="pp-pregen-sources-h">Sources for this brief</div>
            <ul className="pp-pregen-sources-list">
              {sourceCount.map((s) => (
                <li key={s}>
                  <Icons.Check size={12} />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <div className="pp-pregen-sources-foot">
              Last sync 6 min ago · {(partner.recent_activity || []).length} activity events · {(partner.open_issues || []).length} open issues
            </div>
          </div>
        </div>
      </div>

      <div className="pp-pregen-history">
        <div className="pp-pregen-history-h">Recent QBR briefs</div>
        <div className="pp-pregen-history-list">
          <div className="pp-pregen-history-row">
            <Icons.Doc size={13} />
            <span className="pp-pregen-history-name">{lastQbr === "—" ? "First QBR with this partner" : `Q1 2026 brief · ${lastQbr}`}</span>
            <span className="pp-pregen-history-meta">{lastQbr === "—" ? "" : "Opened, edited, exported to Doc"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportModal({ onClose, onConfirm }) {
  const [choice, setChoice] = useStatePV("doc");
  const opts = [
    { id: "doc", label: "Doc", Icon: Icons.Doc, hint: "Editable, shareable with team" },
    { id: "slides", label: "Slides", Icon: Icons.Slides, hint: "One section per slide, exec-ready" },
    { id: "pdf", label: "PDF", Icon: Icons.Pdf, hint: "Pixel-perfect, frozen snapshot" },
    { id: "md", label: "Markdown", Icon: Icons.Markdown, hint: "Copy into Notion / Linear" },
  ];
  return (
    <div className="pp-modal-overlay" onClick={onClose}>
      <div className="pp-modal" onClick={(e) => e.stopPropagation()}>
        <header className="pp-modal-h">
          <h3>Export brief</h3>
          <button className="pp-iconbtn" onClick={onClose} aria-label="Close">
            <Icons.Close size={14} />
          </button>
        </header>
        <div className="pp-modal-body">
          <div className="pp-export-grid">
            {opts.map((o) => (
              <button
                key={o.id}
                className={`pp-export-opt ${choice === o.id ? "is-on" : ""}`}
                onClick={() => setChoice(o.id)}
              >
                <div className="pp-export-icon">
                  <o.Icon size={18} />
                </div>
                <div className="pp-export-label">{o.label}</div>
                <div className="pp-export-hint">{o.hint}</div>
              </button>
            ))}
          </div>
          <div className="pp-export-options">
            <label className="pp-checkrow">
              <input type="checkbox" defaultChecked className="pp-checkbox" />
              <span>Include source links (recommended for internal share)</span>
            </label>
            <label className="pp-checkrow">
              <input type="checkbox" className="pp-checkbox" />
              <span>Strip section thumbnails for printable layout</span>
            </label>
            <label className="pp-checkrow">
              <input type="checkbox" defaultChecked className="pp-checkbox" />
              <span>Snapshot data for "what the brief said" reference</span>
            </label>
          </div>
        </div>
        <footer className="pp-modal-f">
          <button className="pp-btn pp-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="pp-btn pp-btn-primary" onClick={() => onConfirm(choice)}>
            Export to {opts.find((o) => o.id === choice).label}
            <Icons.ArrowRight size={13} />
          </button>
        </footer>
      </div>
    </div>
  );
}

function PartnerView({ partner, onBack, copilotAdd }) {
  const [mode, setMode] = useStatePV("idle"); // idle | generating | done
  const [brief, setBrief] = useStatePV(null);
  const [revealed, setRevealed] = useStatePV(0); // # of sections currently visible
  const [regenSection, setRegenSection] = useStatePV(null);
  const [regenAllBusy, setRegenAllBusy] = useStatePV(false);
  const [showExport, setShowExport] = useStatePV(false);
  const [exportToast, setExportToast] = useStatePV(null);

  useEffectPV(() => {
    // Reset when partner changes
    setMode("idle");
    setBrief(null);
    setRevealed(0);
    setRegenSection(null);
    setShowExport(false);
  }, [partner.id]);

  async function generate() {
    setMode("generating");
    setBrief(null);
    setRevealed(0);
    copilotAdd && copilotAdd({ role: "assistant", text: `Drafting QBR brief for ${partner.name}. I'm cross-referencing the latest CRM activity, Play Console performance, and open issues. This usually takes about 10 seconds.` });

    const total = SECTION_DEFS.length;
    let i = 0;
    const revealTimer = setInterval(() => {
      i++;
      setRevealed(i);
      if (i >= total) clearInterval(revealTimer);
    }, 700);

    const result = await window.PP_AI.generateBrief(partner);
    clearInterval(revealTimer);
    setBrief(result);
    setRevealed(total);
    setMode("done");

    const riskCount = (result.risks || []).length;
    const dealCount = (result.pipeline?.deals || []).length;
    copilotAdd && copilotAdd({
      role: "assistant",
      text: `Brief ready. ${riskCount} risk${riskCount === 1 ? "" : "s"} flagged, ${dealCount} active deal${dealCount === 1 ? "" : "s"} in pipeline. Want me to walk through the most important risk, or jump to the talking points?`,
    });
  }

  async function regenerateOne(sectionId) {
    setRegenSection(sectionId);
    const updated = await window.PP_AI.regenerateSection(sectionId, partner, brief);
    setBrief((b) => ({ ...b, [sectionId]: updated }));
    setRegenSection(null);
    copilotAdd && copilotAdd({
      role: "assistant",
      text: `Re-drafted "${SECTION_DEFS.find(s => s.id === sectionId)?.title || sectionId}" with a fresh angle. Take a look.`,
    });
  }

  async function regenerateAll() {
    setRegenAllBusy(true);
    setRevealed(0);
    const total = SECTION_DEFS.length;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setRevealed(i);
      if (i >= total) clearInterval(t);
    }, 350);
    const result = await window.PP_AI.generateBrief(partner, { angle: "Restructure: lead with the highest-stakes item, keep prose tighter than before, vary the talking-point sequencing." });
    clearInterval(t);
    setBrief(result);
    setRevealed(total);
    setRegenAllBusy(false);
  }

  function exportTo(kind) {
    setShowExport(false);
    setExportToast(`Brief exported to ${kind === "doc" ? "Doc" : kind === "slides" ? "Slides" : kind === "pdf" ? "PDF" : "Markdown"}.`);
    copilotAdd && copilotAdd({
      role: "assistant",
      text: `Done — exported to ${kind === "doc" ? "Doc" : kind === "slides" ? "Slides" : kind === "pdf" ? "PDF" : "Markdown"} and dropped the link in your QBR folder.`,
    });
    setTimeout(() => setExportToast(null), 3200);
  }

  return (
    <div className="pp-page">
      <PartnerHeader
        partner={partner}
        onBack={onBack}
        mode={mode}
        onGenerate={generate}
        onExport={() => setShowExport(true)}
        onRegenAll={regenerateAll}
        regenAllBusy={regenAllBusy}
      />

      {mode === "idle" && <PreGenerate partner={partner} onGenerate={generate} />}

      {mode !== "idle" && (
        <div className="pp-brief">
          <div className="pp-brief-meta">
            <div>
              <Icons.Sparkle size={11} /> Drafted by Pulse · {new Date("2026-05-12T08:42:00").toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            </div>
            <div className="pp-brief-meta-r">
              {mode === "generating" && (
                <span className="pp-brief-meta-status">
                  <span className="pp-spinner" /> Reasoning over {(partner.recent_activity || []).length} activity events + performance data
                </span>
              )}
              {mode === "done" && (
                <span className="pp-brief-meta-status pp-meta-soft">
                  <Icons.Check size={11} /> Brief ready · {SECTION_DEFS.length} sections
                </span>
              )}
            </div>
          </div>

          {window.SECTION_DEFS.map((def, idx) => {
            const sectionId = def.id;
            const data = brief ? brief[sectionId] : null;
            const visible = idx < revealed;
            const isRegen = regenSection === sectionId;
            if (!visible) return null;
            if (!data || isRegen) {
              return <SectionSkeleton key={sectionId} title={def.title} eyebrow={def.eyebrow} />;
            }
            const SectionComp = def.Comp;
            return (
              <Section
                key={sectionId}
                id={sectionId}
                title={def.title}
                eyebrow={def.eyebrow}
                regenerating={false}
                onRegenerate={() => regenerateOne(sectionId)}
              >
                <SectionComp s={data} partner={partner} />
              </Section>
            );
          })}

          {mode === "done" && (
            <div className="pp-brief-foot">
              <div className="pp-brief-foot-l">
                <Icons.Sparkle size={12} /> Drafted by Pulse · model claude-haiku-4.5 · 14 sources cited
              </div>
              <div className="pp-brief-foot-r">
                <button className="pp-btn pp-btn-ghost" onClick={regenerateAll}>
                  <Icons.Refresh size={13} /> Regenerate
                </button>
                <button className="pp-btn pp-btn-primary" onClick={() => setShowExport(true)}>
                  Export brief <Icons.ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showExport && <ExportModal onClose={() => setShowExport(false)} onConfirm={exportTo} />}

      {exportToast && (
        <div className="pp-toast">
          <Icons.Check size={13} /> {exportToast}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { PartnerView, ExportModal });
