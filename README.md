# Partnership Pulse

An AI co-pilot for partner managers — a working prototype that compresses Quarterly Business Review (QBR) prep from ~4 hours to ~15 minutes by auto-drafting reviewable briefs from CRM activity, performance data, pipeline, and open issues.

**Live demo:** https://partnership-pulse.vercel.app

This repo contains the PRD and a clickable prototype that makes the product concrete.

## What's in here

- [`PRD.md`](./PRD.md) — the product thinking: problem framing, target user, success metrics, scope tradeoffs, what the pilot looks like.
- [`project/`](./project/) — the HTML / JSX / CSS prototype (React via CDN + Babel standalone, no build step).

## What the prototype demonstrates

- **Portfolio view** with "Needs attention" surfacing — partners ranked worst-first, with hoverable signal chips (open issues, declining health drivers, contract risk) sourced from a JSON dataset.
- **AI-drafted QBR briefs** per partner, with confidence/source chips and per-section regenerate.
- **Conversational co-pilot** grounded in CRM activity, pipeline, and the current brief — intent-routed mock responses pulled from the partner data so it actually responds in the deployed preview.
- **Product tour** (Pendo-style) walking through the four surfaces, with a persistent "Restart tour" launcher.
- **Three AI presence modes** (background / visible / conversational) — a tweakable design exploration of how much an AI co-pilot should show its work.

## What's real vs. what's stubbed

| Real | Stubbed |
|---|---|
| Product design and information architecture | LLM calls — `window.claude.complete()` falls back to a deterministic mock generator routed by user intent (`ai.js → mockCopilotReply`) |
| The data model (`uploads/partners.json`) — 12 fictional partners with health, pipeline, issues, recent activity | The "refreshed 6 min ago" indicator |
| The prototype interactions, carousel, tooltips, tour | Auth, persistence, real CRM/perf integrations |

## Running locally

No build step. Serve the `project/` folder over HTTP:

```bash
cd project
python3 -m http.server 8765
# open http://localhost:8765
```
