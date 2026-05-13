// app.jsx — Partnership Pulse root

const { useState: useStateApp, useEffect: useEffectApp, useMemo: useMemoApp, useCallback: useCBApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "aiMode": "conversational",
  "showCopilotInBriefDemo": true
}/*EDITMODE-END*/;

// Replace with your Loom (or YouTube) share URL. Loom: copy the share link.
// YouTube: use the embed URL form (https://www.youtube.com/embed/VIDEO_ID).
const WALKTHROUGH_URL = "";

function WalkthroughModal({ open, onClose }) {
  useEffectApp(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="pp-modal-overlay" onClick={onClose}>
      <div className="pp-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pp-modal-close" onClick={onClose} aria-label="Close">
          <Icons.Close size={14} />
        </button>
        {WALKTHROUGH_URL ? (
          <div className="pp-modal-video">
            <iframe
              src={WALKTHROUGH_URL}
              title="Partnership Pulse walkthrough"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              frameBorder="0"
            />
          </div>
        ) : (
          <div className="pp-modal-placeholder">
            <div className="pp-modal-placeholder-icon"><Icons.Sparkle size={20} /></div>
            <h3>Walkthrough video coming soon</h3>
            <p>
              Drop your Loom or YouTube embed URL into <code>WALKTHROUGH_URL</code> at the top of <code>app.jsx</code>
              and the video will play here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function IntroCard({ onDismiss, onWatch }) {
  return (
    <div className="pp-intro-overlay">
      <div className="pp-intro-card">
        <div className="pp-intro-eyebrow">Prototype · Interactive demo</div>
        <h2 className="pp-intro-title">Partnership Pulse</h2>
        <p className="pp-intro-body">
          An AI co-pilot for partner managers. Pulse drafts QBR briefs, surfaces
          what changed across the book this week, and answers questions grounded
          in CRM activity, pipeline, and performance data.
        </p>
        <p className="pp-intro-body pp-intro-body-muted">
          You're looking at a clickable prototype — explore the portfolio, open
          any partner to see a generated brief, or ask the co-pilot something
          like "which renewals are coming up?"
        </p>
        <div className="pp-intro-actions">
          {WALKTHROUGH_URL && (
            <button className="pp-intro-btn pp-intro-btn-primary" onClick={onWatch}>
              <Icons.Sparkle size={13} /> Watch 2-min walkthrough
            </button>
          )}
          <button className="pp-intro-btn" onClick={onDismiss}>
            Explore on my own
          </button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ active, onNavigate, collapsed, onToggle }) {
  const briefsCount = (window.BRIEF_HISTORY || []).length;
  const nav = [
    { id: "portfolio", label: "Portfolio", Icon: Icons.Portfolio },
    { id: "briefs", label: "Briefs", Icon: Icons.Brief, badge: String(briefsCount) },
    { id: "insights", label: "Insights", Icon: Icons.Insights },
    { id: "settings", label: "Settings", Icon: Icons.Settings },
  ];
  return (
    <nav className={`pp-side ${collapsed ? "pp-side-collapsed" : ""}`}>
      <div className="pp-side-brand">
        <button className="pp-side-logo" onClick={onToggle} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <Icons.Pulse size={18} stroke={2} />
        </button>
        {!collapsed && (
          <div className="pp-side-brand-text">
            <div className="pp-side-name">Partnership Pulse</div>
            <div className="pp-side-org">GP Studio · APAC Gaming</div>
          </div>
        )}
        {!collapsed && (
          <button className="pp-side-toggle" onClick={onToggle} title="Collapse sidebar" aria-label="Collapse sidebar">
            <Icons.ArrowLeft size={13} />
          </button>
        )}
      </div>

      <div className="pp-side-nav">
        {nav.map((n) => (
          <button
            key={n.id}
            className={`pp-side-link ${active === n.id ? "is-on" : ""}`}
            onClick={() => onNavigate(n.id)}
            title={collapsed ? n.label : undefined}
          >
            <n.Icon size={15} />
            {!collapsed && <span>{n.label}</span>}
            {!collapsed && n.badge && <span className="pp-side-badge">{n.badge}</span>}
          </button>
        ))}
      </div>

      <div className="pp-side-foot">
        <div className="pp-side-user">
          <div className="pp-side-avatar">SC</div>
          {!collapsed && (
            <div className="pp-side-user-info">
              <div className="pp-side-user-name">Sarah Chen</div>
              <div className="pp-side-user-role">Senior PM · APAC</div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useStateApp({ name: "dashboard", partnerId: null, briefId: null });
  const [messages, setMessages] = useStateApp([]);
  const [copilotOpen, setCopilotOpen] = useStateApp(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useStateApp(
    () => { try { return localStorage.getItem("pp-sidebar") === "collapsed"; } catch (e) { return false; } }
  );
  const [walkthroughOpen, setWalkthroughOpen] = useStateApp(false);
  const [introOpen, setIntroOpen] = useStateApp(
    () => { try { return localStorage.getItem("pp-intro-seen") !== "1"; } catch (e) { return true; } }
  );
  const dismissIntro = useCBApp(() => {
    setIntroOpen(false);
    try { localStorage.setItem("pp-intro-seen", "1"); } catch (e) {}
  }, []);
  const watchFromIntro = useCBApp(() => {
    dismissIntro();
    setWalkthroughOpen(true);
  }, [dismissIntro]);

  // Demo brief data for co-pilot context (shared with partner-view via lift-up)
  const [currentBrief, setCurrentBrief] = useStateApp(null);

  const partner = view.partnerId ? window.PARTNERS_BY_ID[view.partnerId] : null;
  const briefRecord = view.briefId ? (window.BRIEF_HISTORY || []).find((b) => b.id === view.briefId) : null;

  // Determine effective co-pilot mode
  const aiMode = t.aiMode; // 'background' | 'visible' | 'conversational'

  function openPartner(p) {
    setView({ name: "partner", partnerId: p.id, briefId: null });
    setMessages([
      {
        role: "assistant",
        text:
          aiMode === "background"
            ? ""
            : `Loaded ${p.name}. Health is ${p.health.score} (${p.health.trend_qoq} QoQ). ${
                (p.open_issues || []).length
                  ? `${p.open_issues.length} open issue${p.open_issues.length === 1 ? "" : "s"} flagged.`
                  : "No open issues."
              } Want me to draft the QBR brief?`,
      },
    ].filter((m) => m.text));
  }

  function navigate(id) {
    if (id === "portfolio") setView({ name: "dashboard", partnerId: null, briefId: null });
    else if (id === "briefs") setView({ name: "briefs", partnerId: null, briefId: null });
    else if (id === "insights") setView({ name: "insights", partnerId: null, briefId: null });
    else if (id === "settings") setView({ name: "settings", partnerId: null, briefId: null });
  }

  function backToBriefs() {
    setView({ name: "briefs", partnerId: null, briefId: null });
  }

  function openBrief(b) {
    setView({ name: "brief-detail", partnerId: null, briefId: b.id });
  }

  function backFromPartner() {
    setView({ name: "dashboard", partnerId: null, briefId: null });
  }

  const onCopilotSend = useCBApp((m) => {
    setMessages((prev) => {
      if (m._replace) {
        return prev.map((x) => (x._id === m._replace ? { ...m, _id: undefined, _replace: undefined } : x));
      }
      return [...prev, m];
    });
  }, []);

  const copilotAdd = useCBApp((m) => {
    if (aiMode === "background") return;
    setMessages((prev) => [...prev, m]);
  }, [aiMode]);

  const copilotVisible = aiMode !== "background" && copilotOpen;

  // For any non-background mode — floating toggle button when panel is closed
  const showFloatingToggle = aiMode !== "background" && !copilotOpen;

  const activeNav =
    view.name === "dashboard" || view.name === "partner" ? "portfolio" :
    view.name === "briefs" || view.name === "brief-detail" ? "briefs" :
    view.name === "insights" ? "insights" :
    view.name === "settings" ? "settings" : "portfolio";

  function toggleSidebar() {
    setSidebarCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem("pp-sidebar", next ? "collapsed" : "expanded"); } catch (e) {}
      return next;
    });
  }

  return (
    <div className={`pp-app pp-ai-${aiMode} ${sidebarCollapsed ? "pp-app-sidebar-collapsed" : ""} ${copilotVisible ? "pp-app-cp-open" : ""}`}>
      <Sidebar active={activeNav} onNavigate={navigate} collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      <main className={`pp-main ${copilotVisible ? "pp-main-with-cp" : ""}`}>
        {view.name === "dashboard" && <Dashboard onOpenPartner={openPartner} />}
        {view.name === "partner" && partner && (
          <PartnerView
            partner={partner}
            onBack={backFromPartner}
            copilotAdd={copilotAdd}
          />
        )}
        {view.name === "briefs" && <BriefsLibrary onOpenBrief={openBrief} />}
        {view.name === "brief-detail" && briefRecord && (
          <BriefDetail brief={briefRecord} onBack={backToBriefs} onOpenPartner={openPartner} />
        )}
        {view.name === "insights" && <Insights onOpenPartner={openPartner} />}
        {view.name === "settings" && (
          <div className="pp-page">
            <header className="pp-pageh">
              <div>
                <div className="pp-eyebrow">Coming soon</div>
                <h1 className="pp-h1">Settings</h1>
                <p className="pp-sub">Notifications, sources, defaults, integrations.</p>
              </div>
            </header>
          </div>
        )}
      </main>

      {copilotVisible && (
        <CopilotPanel
          mode={aiMode}
          partner={partner}
          brief={currentBrief}
          messages={messages}
          onSend={onCopilotSend}
          onClose={() => setCopilotOpen(false)}
        />
      )}

      {showFloatingToggle && (
        <button className="pp-cp-fab" onClick={() => setCopilotOpen(true)}>
          <Icons.Sparkle size={14} />
          Ask Pulse
        </button>
      )}

      <button
        className="pp-watch-btn"
        onClick={() => setWalkthroughOpen(true)}
        title="Watch walkthrough">
        <Icons.Sparkle size={12} />
        <span>Watch walkthrough</span>
      </button>

      {introOpen && <IntroCard onDismiss={dismissIntro} onWatch={watchFromIntro} />}
      <WalkthroughModal open={walkthroughOpen} onClose={() => setWalkthroughOpen(false)} />

      <TweaksPanel>
        <TweakSection label="AI presence" />
        <TweakRadio
          label="Co-pilot mode"
          value={t.aiMode}
          options={[
            { value: "background", label: "Background" },
            { value: "visible", label: "Visible" },
            { value: "conversational", label: "Conversational" },
          ]}
          onChange={(v) => setTweak("aiMode", v)}
        />
        <div className="pp-tweak-note">
          {aiMode === "background" && "AI works behind the scenes — no confidence chips, no co-pilot, brief sections regenerate silently."}
          {aiMode === "visible" && "AI is acknowledged — source chips, regenerate, thumbs feedback, on-demand co-pilot."}
          {aiMode === "conversational" && "Pulse talks back — co-pilot panel always present, narrates what it's doing."}
        </div>
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
