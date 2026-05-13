# Partnership Pulse

**Product Requirements Document — Draft v0.1**
Author: [Your name] · GP Studio · For internal review

---

## TL;DR

Partnership Pulse is an internal AI co-pilot for Google Play partner managers. It compresses prep time for recurring partner meetings from ~4 hours to ~15 minutes by auto-generating reviewable briefs from CRM, performance, and support data — freeing partner managers to spend their time on the conversations, not the synthesis.

**Pilot target:** 50% prep-time reduction for 10 partner managers in Q1, with 80%+ of generated briefs used as-is or with minor edits.

---

## Context: what's a Quarterly Business Review (QBR)?

Every quarter, a Google Play partner manager runs a structured review meeting with each of their strategic partners (game studios, OEMs, publishers, payments providers). The meeting covers four things, every time:

1. **Performance** — how the partner did against shared goals last quarter
2. **Open issues** — escalations, blockers, integration status
3. **Opportunities** — new products, programs, deal motions for next quarter
4. **Alignment** — strategic check-in with senior stakeholders on both sides

QBRs are the heartbeat of partnership management. They're also where most of the relationship-shaping happens — but the prep eats the partner manager's week.

---

## Problem

A Google Play partner manager owns 15–30 strategic partners. Each QBR requires:

- Pulling app performance from Play Console
- Reading last quarter's meeting notes, emails, and follow-ups
- Reviewing CRM for open deals and contract milestones
- Checking ticket trackers for unresolved escalations
- Synthesizing all of it into a coherent narrative for a senior audience

**Rough scale of the problem:**
- 20 partners × 4 quarters × 4 hours prep = **~320 hours/year per partner manager**
- ~16 working weeks lost to synthesis work
- Multiplied across the partnerships org: thousands of hours/quarter

The synthesis is repetitive, structured-input → structured-output work with a consistent bar for "good." The judgment lives in the meeting itself, not the deck.

---

## User

**Primary:** Sarah, Senior Partner Manager, Google Play. 6 years in BD. Owns 22 partners across APAC gaming. Spends Monday mornings prepping the week's QBRs.

Quotes (to validate in user research):
- *"I'm not adding value reformatting analytics into slides."*
- *"Every QBR feels like I'm rediscovering what I already knew about the partner."*
- *"I don't have time to surface leading indicators — I just react to fires."*

**Secondary users:**
- Sarah's director — uses briefs as portfolio reviews
- Cross-functional partners (Policy, Legal, Eng) — receive briefs ahead of joint meetings
- New partner managers onboarding to a book of business

---

## Goals

### Q1 launch goals
| Metric | Target | How measured |
|---|---|---|
| Prep time per QBR | –50% | Self-reported pre/post, light instrumentation |
| Briefs used as-is or w/ minor edits | ≥80% | Edit-distance + thumbs feedback |
| Partner manager satisfaction (CSAT) | ≥4.0 / 5 | Monthly pulse survey |

### Leading indicators (weekly)
- % of in-scope QBRs using the tool
- Edit distance per section (which sections need the most rework)
- Thumbs-down rate by section type
- Time-to-first-brief for new users

### Long-term goals
- Earlier partner-risk detection (compound advantage on partnership health)
- 25–30% capacity unlock — partner managers own more relationships at same quality bar
- Foundation for other GBO partnership orgs (Cloud, Ads)

---

## Non-goals (v1)

- Replacing the CRM. Pulse reads from it; doesn't replace it.
- Auto-sending briefs to partners. Internal-only.
- Pipeline forecasting / deal scoring. Separate problem.
- Replacing partner manager judgment. Every brief is human-reviewed before use.

---

## Stakeholders & engagement

Mapping who's involved, what they care about, and how I'd engage them. Goes deeper than the JD's "engineering, UX, and business stakeholders as well as peers on the GP Studio team" framing.

### Sponsors & decision-makers
- **GP Studio leadership** *(direct manager + skip-level)* — owns roadmap and resourcing. Cares about: portfolio coherence with other GP Studio bets, ROI defensibility. *Engage:* monthly written update, quarterly review.
- **Play BD VP / Partnership Directors** *(economic buyer)* — cares about partner manager capacity, partnership health visibility, risk surfacing. *Engage:* pilot results readout, QBR-style updates.
- **GBO leadership** *(adjacent sponsor)* — cares about cross-org applicability (Ads, Cloud partnerships). *Engage:* readout after Q1 milestone, not before.

### Build team (GP Studio + close partners)
- **Engineering lead** — co-owner. Architecture, infra, AI integration patterns. *Engage:* daily; paired on technical trade-offs.
- **UX lead** — partner manager workflows, brief design, trust UI patterns (source links, confidence cues). *Engage:* weekly design crits, paired user research.
- **Data Science / ML** — health score model, eval infrastructure, error analysis loop. *Engage:* weekly during build; embedded in eval rituals post-launch.
- **AI Infra team** *(Gemini / internal model access)* — inference patterns, latency budget, capacity planning. *Engage:* kickoff sync, then async.

### End users (must drive design)
- **Pilot cohort (10 partner managers)** — co-design brief structure and section priorities. *Engage:* 5 interviews pre-PRD, weekly office hours during pilot, brief-level thumbs feedback always-on.
- **Senior partner managers (3–5)** — provide gold-standard briefs for the eval set. *Engage:* 2-hour structured workshops, one per quarter.
- **New partner manager onboards** — secondary test population for "time-to-value" metric.

### Governance & risk owners
- **Privacy / Legal** — partner data handling, cross-region constraints, what the model can see. *Engage **early*** — this gates architecture, not launch.
- **Security review** — internal tool but sensitive partner data; access controls and audit logging.
- **AI Principles review** — required for any Google AI product. *Engage:* pre-pilot, with documented risks and mitigations drawn directly from the AI Quality Plan.

### Adjacent product teams (dependencies)
- **CRM platform team** — read access in v1, writeback in v2. Hard dependency on API stability and partner data schema.
- **Play Console / analytics team** — performance data source. Need a data freshness SLA.
- **Play Policy team** — escalations data; potential downstream consumer for joint policy review meetings.

### Peers on GP Studio
- Other PMs on GP Studio working adjacent surfaces (deal workflow tools, partner-facing portals, contract automation). *Engage:* weekly team sync; explicit boundary agreements to avoid feature overlap with neighboring products.

### Flagged for later
- **Partners themselves** are data subjects, not stakeholders in v1 (briefs are internal-only). If AI-derived insights ever surface in partner-facing materials, this becomes a partner-trust conversation. Flagging now to avoid retrofit.

---

## Solution

Two surfaces, both accessed from the existing GP CRM.

### 1. Partner Portfolio Dashboard
- Every partner the PM owns, with health score + trend
- Next QBR date, days-until indicator
- "Needs attention" surfacing for partners with declining health or stalled deals

### 2. Generated QBR Brief *(the core unlock)*

On click, generate a 1-page brief:

- **Snapshot** — partner, tier, contract value, account team
- **Health score** with 2–3 driver explanations *(e.g. "↓7 pts: integration milestone slipped, exec sponsor changed")*
- **Performance** vs. last quarter and vs. goals
- **Pipeline** — open deals, stages, blockers
- **Top 3 risks** — each with linked source evidence
- **Wins to celebrate**
- **3–4 suggested talking points**
- **Pre-meeting action items** with owners

**Design principles for the brief:**
- Every claim sourced — click any line, see the underlying data
- Every section regenerable independently
- Every section has thumbs-up/down for eval data collection
- Brief reads like a senior PM wrote it, not a template

---

## How it works (v1 architecture sketch)

1. **Ingest** from CRM, Play Console, internal ticket tracker → Partner State JSON
2. **Generate** on-demand: per-section LLM calls with structured prompts grounded in Partner State
3. **Review** loop: section-level accept / edit / regenerate
4. **Export** to Doc or Slides for the actual meeting

Read-only on source systems in v1 to de-risk. Writeback (action items → CRM) is a v2 conversation.

---

## AI quality plan

Treating AI quality as a first-class product surface, not a follow-up.

### Eval framework
- **Synthetic eval set:** ~50 partner-state JSONs spanning realistic scenarios — high-growth, churning, integration-stuck, contract-renegotiation, dispute, dormant
- **Graded against** ~30 human-written briefs from senior partner managers
- **Per-section grading:** factual accuracy, completeness, tone, actionability

### Failure modes to monitor
| Failure | Risk | Mitigation |
|---|---|---|
| Hallucinated risks | High — false alarms erode trust | Source-grounding requirement; risks must link to evidence |
| Missed deal-stage changes | High — false negatives costlier than false positives | Pipeline section uses structured CRM data directly, not generation |
| Generic talking points | Medium — low value, high volume | Per-partner context injection; explicit "specific to this partner" prompt |
| Stale data | Medium | Freshness timestamps in UI; flag if source data >7 days old |

### Iterative loop
- Weekly error analysis on flagged briefs (first 90 days)
- Failure-mode tagging → prioritize by frequency × impact
- Section-specific prompt tightening, not global rewrites

### Trust signals in the UI
- Every claim links to source
- Confidence flags where source data is sparse
- "Why this risk?" expansion shows the evidence chain
- "Last updated" on every input source

---

## Roadmap

**Q1 — Prove value**
Read-only QBR brief generation. Rules-based health score. 10-PM pilot. Eval infrastructure live from day one.

**Q2 — Expand depth**
Meeting transcript → CRM action items. Stalled-deal detector. Health score v2 (learned). CRM writeback (with confirmation).

**Q3 — Expand reach**
Pre-meeting briefs for non-QBR touchpoints. Cross-team rollout (Play → broader GBO).

**Q4 — Strategic layer**
Portfolio-level pattern detection (which partner segments are growing / at risk). Director-level rollups.

---

## Open questions

- **Data residency:** which partner data can the model see, and where does inference run?
- **Versioning:** if briefs are generated on-demand, how do PMs reference "what the brief said last quarter"? Snapshot on export?
- **Build vs. internal models vs. external:** which components use Google-internal models, which use Gemini API, where (if anywhere) is external acceptable?
- **Personalization vs. consistency:** do we let each PM tune brief tone/structure, or hold the bar consistent for cross-team readability?

---

## What "good" looks like in 6 months

A new partner manager runs their first QBR with 80% less prep time than their predecessor. The brief they bring is indistinguishable from a senior PM's brief. They spend their freed time on the conversations themselves — and on the partners no one had time for before.

---

*Next: validate the prep-time number with 5–10 partner manager interviews; build the prototype on a fictional partner dataset; iterate on brief structure with 3 senior partner managers before pilot.*
