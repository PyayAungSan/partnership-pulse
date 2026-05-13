// copilot.jsx — Conversational AI co-pilot panel
// Modes (driven by tweaks):
//  - "background"   — hidden, no panel, no AI artifacts (but brief still uses AI)
//  - "visible"      — panel toggle button visible, panel opens on click
//  - "conversational" — panel always open

const { useState: useStateCP, useEffect: useEffectCP, useRef: useRefCP, useMemo: useMemoCP } = React;

function suggestionsFor(partner) {
  if (!partner) {
    const partners = window.PARTNERS || [];
    const s = ["Which 3 partners need the most prep this week?"];
    const decliners = partners.filter((p) => (parseInt(p.health.trend_qoq, 10) || 0) < 0);
    if (decliners.length) s.push(`Why is ${decliners[0].name} trending down?`);
    s.push("Summarize what changed across my book in the last 7 days");
    const renewing = partners.filter((p) => p.contract && p.contract.renewal_date);
    if (renewing.length) s.push("Which renewals are coming up soonest?");
    const risky = partners.filter((p) => (p.open_issues || []).length);
    if (risky.length) s.push("Which partners have the most open issues?");
    return s.slice(0, 4);
  }
  const s = [`Why is health ${partner.health.trend_qoq} QoQ?`];
  if ((partner.open_issues || []).length) s.push(`What's the most urgent open issue?`);
  if ((partner.pipeline || []).some((d) => /stalled|risk/i.test(d.stage))) s.push("Draft an unblock plan for the stalled deal");
  if (/changed/i.test(partner.executive_sponsor_partner || "")) s.push("Draft an intro email to the new exec sponsor");
  if ((partner.wins_to_celebrate || []).length) s.push("Help me open the meeting with the right tone");
  return s.slice(0, 4);
}

function Bubble({ msg }) {
  const isAssistant = msg.role === "assistant";
  return (
    <div className={`pp-cp-bubble ${isAssistant ? "pp-cp-asst" : "pp-cp-user"}`}>
      {isAssistant && (
        <div className="pp-cp-avatar" aria-hidden="true">
          <Icons.Sparkle size={11} />
        </div>
      )}
      <div className="pp-cp-content">
        {msg.thinking ? (
          <span className="pp-cp-thinking">
            <span className="pp-spinner" /> Thinking…
          </span>
        ) : (
          msg.text.split("\n\n").map((para, i) => <p key={i}>{para}</p>)
        )}
      </div>
    </div>
  );
}

function CopilotPanel({ mode, partner, brief, messages, onSend, onClose }) {
  const [draft, setDraft] = useStateCP("");
  const [busy, setBusy] = useStateCP(false);
  const scroller = useRefCP(null);
  const inputRef = useRefCP(null);

  const suggestions = useMemoCP(() => suggestionsFor(partner), [partner]);

  useEffectCP(() => {
    if (scroller.current) {
      scroller.current.scrollTop = scroller.current.scrollHeight;
    }
  }, [messages]);

  async function send(text) {
    if (!text || busy) return;
    setBusy(true);
    setDraft("");
    onSend({ role: "user", text });
    const placeholderId = "thinking-" + Date.now();
    onSend({ role: "assistant", text: "", thinking: true, _id: placeholderId });

    const history = messages.filter((m) => !m.thinking);
    let reply;
    try {
      reply = await window.PP_AI.copilotReply(partner, brief, [...history, { role: "user", text }], text);
    } catch (e) {
      reply = "I hit an error reaching the model. Try again in a moment.";
    }
    onSend({ role: "assistant", text: reply, _replace: placeholderId });
    setBusy(false);
    setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
  }

  if (mode === "background") return null;

  return (
    <aside className="pp-cp">
      <header className="pp-cp-h">
        <div className="pp-cp-h-l">
          <div className="pp-cp-h-icon">
            <Icons.Sparkle size={13} />
          </div>
          <div>
            <div className="pp-cp-h-title">Pulse Co-pilot</div>
            <div className="pp-cp-h-sub">
              {partner ? `Context: ${partner.name}` : "Context: portfolio"}
            </div>
          </div>
        </div>
        {mode !== "background" && (
          <button className="pp-iconbtn" onClick={onClose} aria-label="Close co-pilot">
            <Icons.Close size={14} />
          </button>
        )}
      </header>

      <div className="pp-cp-body" ref={scroller}>
        {messages.length === 0 && (
          <div className="pp-cp-empty">
            <div className="pp-cp-empty-icon">
              <Icons.Sparkle size={18} />
            </div>
            <div className="pp-cp-empty-h">Hi Sarah</div>
            <div className="pp-cp-empty-p">
              Ask me anything about {partner ? partner.name : "your portfolio"}.
              I have access to CRM activity, performance data, open issues, and the current brief draft.
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <Bubble key={m._id || i} msg={m} />
        ))}
      </div>

      <div className="pp-cp-suggestions">
        {suggestions.map((s, i) => (
          <button key={i} className="pp-cp-sug" onClick={() => send(s)} disabled={busy}>
            {s}
          </button>
        ))}
      </div>

      <div className="pp-cp-input-wrap">
        <textarea
          ref={inputRef}
          className="pp-cp-input"
          rows={1}
          placeholder={partner ? `Ask about ${partner.name}…` : "Ask about your portfolio…"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(draft.trim());
            }
          }}
          disabled={busy}
        />
        <button
          className="pp-cp-send"
          onClick={() => send(draft.trim())}
          disabled={busy || !draft.trim()}
          aria-label="Send"
        >
          <Icons.Send size={14} />
        </button>
      </div>
    </aside>
  );
}

Object.assign(window, { CopilotPanel });
