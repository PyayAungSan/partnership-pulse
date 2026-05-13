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

const TOUR_STEPS = [
  {
    selector: ".pp-side",
    title: "Navigate your work",
    body: "Portfolio, AI-drafted Briefs, and Insights live here. The sidebar collapses with the logo button.",
    placement: "right",
  },
  {
    selector: ".pp-attn-carousel",
    title: "What needs your attention",
    body: "Pulse surfaces partners that need prep this week, ranked worst-first. Hover any chip for the underlying signals.",
    placement: "bottom",
  },
  {
    selector: ".pp-table, .pp-portfolio",
    title: "Your full book",
    body: "Every partner you own. Sort by next QBR, health, or name — click a row to open the AI-drafted brief.",
    placement: "top",
  },
  {
    selector: ".pp-cp",
    title: "Ask Pulse anything",
    body: "Conversational co-pilot, grounded in CRM activity, pipeline, and the current brief. Try the suggested prompts.",
    placement: "left",
    onEnter: (ctx) => ctx.setCopilotOpen && ctx.setCopilotOpen(true),
  },
];

function ProductTour({ open, onClose, ctx }) {
  const [step, setStep] = useStateApp(0);
  const [rect, setRect] = useStateApp(null);
  const current = TOUR_STEPS[step];

  useEffectApp(() => {
    if (!open) return;
    setStep(0);
  }, [open]);

  useEffectApp(() => {
    if (!open || !current) return;
    if (typeof current.onEnter === "function") current.onEnter(ctx || {});
  }, [open, step, current, ctx]);

  useEffectApp(() => {
    if (!open || !current) return;
    function findTarget() {
      const sels = current.selector.split(",").map((s) => s.trim());
      for (const s of sels) {
        const el = document.querySelector(s);
        if (el) return el;
      }
      return null;
    }
    function measure() {
      const el = findTarget();
      if (!el) { setRect(null); return null; }
      const r = el.getBoundingClientRect();
      const z = parseFloat(getComputedStyle(document.body).zoom) || 1;
      setRect({
        top: r.top / z,
        left: r.left / z,
        width: r.width / z,
        height: r.height / z,
      });
      return el;
    }
    // Scroll the target into view ONCE per step.
    const initial = findTarget();
    if (initial) {
      initial.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
    measure();

    // Re-measure for ~1.2s after step change to catch async mounts/reflows
    // (e.g., opening the co-pilot triggers grid reflow on the next paint).
    const retryIds = [60, 180, 320, 520, 800, 1200].map((d) =>
      setTimeout(measure, d)
    );

    // Watch the target for size changes (panel opening, content load).
    let ro = null;
    const target = findTarget();
    if (target && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(target);
    }

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      retryIds.forEach(clearTimeout);
      if (ro) ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step, current]);

  useEffectApp(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function next() {
    if (step < TOUR_STEPS.length - 1) setStep(step + 1);
    else onClose();
  }
  function back() {
    if (step > 0) setStep(step - 1);
  }

  if (!open) return null;
  if (!rect) {
    return <div className="pp-tour-backdrop pp-tour-loading" onClick={onClose} />;
  }

  const PAD = 8;
  const spotlight = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };

  // Tooltip placement
  const TIP_W = 320;
  const TIP_GAP = 14;
  let tipStyle = {};
  const z = parseFloat(getComputedStyle(document.body).zoom) || 1;
  const vw = window.innerWidth / z, vh = window.innerHeight / z;
  if (current.placement === "right") {
    tipStyle = { top: Math.max(16, spotlight.top), left: spotlight.left + spotlight.width + TIP_GAP, width: TIP_W };
  } else if (current.placement === "left") {
    tipStyle = { top: Math.max(16, spotlight.top), left: spotlight.left - TIP_W - TIP_GAP, width: TIP_W };
  } else if (current.placement === "top") {
    tipStyle = { top: spotlight.top - TIP_GAP, left: Math.min(vw - TIP_W - 16, Math.max(16, spotlight.left)), width: TIP_W, transform: "translateY(-100%)" };
  } else {
    tipStyle = { top: spotlight.top + spotlight.height + TIP_GAP, left: Math.min(vw - TIP_W - 16, Math.max(16, spotlight.left)), width: TIP_W };
  }

  return (
    <>
      <div className="pp-tour-backdrop" onClick={onClose} />
      <div
        className="pp-tour-spotlight"
        style={spotlight}
      />
      <div className="pp-tour-tip" style={tipStyle}>
        <div className="pp-tour-tip-eyebrow">Step {step + 1} of {TOUR_STEPS.length}</div>
        <div className="pp-tour-tip-title">{current.title}</div>
        <div className="pp-tour-tip-body">{current.body}</div>
        <div className="pp-tour-tip-foot">
          <button className="pp-tour-skip" onClick={onClose}>Skip tour</button>
          <div className="pp-tour-tip-nav">
            {step > 0 && (
              <button className="pp-tour-btn" onClick={back}>Back</button>
            )}
            <button className="pp-tour-btn pp-tour-btn-primary" onClick={next}>
              {step === TOUR_STEPS.length - 1 ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function IntroCard({ onDismiss, onWatch, onTour }) {
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
          <button className="pp-intro-btn pp-intro-btn-primary" onClick={onTour}>
            <Icons.Sparkle size={13} /> Take the tour
          </button>
          {WALKTHROUGH_URL && (
            <button className="pp-intro-btn" onClick={onWatch}>
              Watch walkthrough
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
    { id: "portfolio", label: "Portfolio", Icon: Icons.Portfolio,
      desc: "Your full book of partners — health, QBR dates, what needs attention this week." },
    { id: "briefs", label: "Briefs", Icon: Icons.Brief, badge: String(briefsCount),
      desc: "AI-generated QBR pre-reads. Pulse drafts them from CRM activity, performance, and open issues." },
    { id: "insights", label: "Insights", Icon: Icons.Insights,
      desc: "Cross-portfolio trends — where time is going, which partners are trending up or down." },
    { id: "settings", label: "Settings", Icon: Icons.Settings,
      desc: "Notification, source, and integration preferences." },
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
            className={`pp-side-link ${active === n.id ? "is-on" : ""} ${collapsed ? "pp-side-link-tip" : ""}`}
            onClick={() => onNavigate(n.id)}
          >
            <n.Icon size={15} />
            {!collapsed && <span>{n.label}</span>}
            {!collapsed && n.badge && <span className="pp-side-badge">{n.badge}</span>}
            {collapsed && (
              <span className="pp-side-tip" role="tooltip">
                <span className="pp-side-tip-title">
                  {n.label}
                  {n.badge && <span className="pp-side-tip-badge">{n.badge}</span>}
                </span>
                <span className="pp-side-tip-desc">{n.desc}</span>
              </span>
            )}
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
  const [copilotOpen, setCopilotOpen] = useStateApp(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useStateApp(
    () => { try { return localStorage.getItem("pp-sidebar") === "collapsed"; } catch (e) { return false; } }
  );
  const [walkthroughOpen, setWalkthroughOpen] = useStateApp(false);
  const [tourOpen, setTourOpen] = useStateApp(false);
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
  const tourFromIntro = useCBApp(() => {
    dismissIntro();
    setTourOpen(true);
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

      {WALKTHROUGH_URL && (
        <button
          className="pp-watch-btn"
          onClick={() => setWalkthroughOpen(true)}
          title="Watch walkthrough">
          <Icons.Sparkle size={12} />
          <span>Watch walkthrough</span>
        </button>
      )}

      {introOpen && <IntroCard onDismiss={dismissIntro} onWatch={watchFromIntro} onTour={tourFromIntro} />}
      <WalkthroughModal open={walkthroughOpen} onClose={() => setWalkthroughOpen(false)} />
      <ProductTour
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        ctx={{ setCopilotOpen }}
      />

      {!introOpen && !tourOpen && (
        <button
          className="pp-tour-launcher"
          onClick={() => setTourOpen(true)}
          title="Restart tour"
          aria-label="Restart tour">
          <Icons.Sparkle size={13} />
          <span>Tour</span>
        </button>
      )}

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
