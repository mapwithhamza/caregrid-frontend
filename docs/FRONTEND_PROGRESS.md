# CareGrid India Frontend Progress

## Current Stage
Facilities explorer and detail drawer completed.

## Completed Before Frontend
- Databricks data cleaning completed.
- V2 trust scoring completed.
- State normalization completed.
- Backend export table completed.
- Impact/desert analysis completed.
- FastAPI backend implemented.
- Backend endpoints tested.
- Backend test suite: 72 passed.

## Current Frontend Task
- Build live Facilities Explorer page using real backend API data.
- Add filter panel, pagination, facility cards, detail drawer, warning badges, and quick visible-results filter.

## Not Yet Done
- API integration.
- Dashboard KPI cards.
- Charts.
- Facility explorer.
- Map visualization.
- Search UI.
- Agent recommendation panel.
- Impact dashboard.
- Final UI polish.

## Rules
- Update this file after every frontend prompt.
- Do not use mock data as final data source.
- Use backend API responses.
- Preserve backend schema and category labels.

## Prompt 10 — Frontend Scaffold
- Frontend scaffold completed.
- React + TypeScript + Vite project created.
- Tailwind CSS configured.
- React Router layout and placeholder routes created.
- API client placeholders created.
- Frontend context, progress, and UI plan docs created.
- Build result: npm run build passed.

## Prompt 10B — Frontend Shell Polish + Tailwind Fix
- Frontend shell styling completed.
- Tailwind global import confirmed in src/main.tsx.
- Tailwind content paths confirmed in tailwind.config.js.
- globals.css confirmed with @tailwind base, components, and utilities directives.
- App shell, sticky header, dark sidebar, common badge, metric card, home overview, and placeholder pages polished.
- Build result: npm run build passed.

## Prompt 10C — Tailwind v3 Fix + Dashboard Shell
- Tailwind setup fixed for stable Tailwind v3 with standard PostCSS plugin configuration.
- tailwind.config.js content paths updated to include ./index.html and ./src/**/*.{js,ts,jsx,tsx}.
- globals.css confirmed with Tailwind directives and full-height html/body/root setup.
- Dashboard shell rebuilt with dark navy sidebar, sticky header, light slate background, white cards, rounded-2xl/3xl surfaces, and explicit Tailwind utility classes.
- Home page updated with hero gradient, four metrics, system cards, and live API integration callout.
- Placeholder pages polished without API integration, charts, map, search UI, or agent UI.
- Build result: npm run build passed.

## Prompt 11 — API Client and TypeScript Models
- API client completed with Axios base URL, timeout, and basic error handling.
- Endpoint constants completed for health, facilities, stats, impact, search, and agent groups.
- TypeScript interfaces added for health, facilities, stats, impact summary, priority states, search, agent request/response, and query parameter objects.
- Typed API functions added in src/api/caregridApi.ts.
- LoadingState and ErrorState polished for upcoming live API screens.
- No React hooks or UI data integration added yet.
- Build result: npm run build passed.

## Prompt 12 — Live Dashboard Data Integration
- Live dashboard API integration completed.
- KPI cards connected to /stats/overview and /impact/trust-gap-summary.
- Trust distribution chart added from /stats/trust-distribution.
- Readiness distribution chart added from /stats/readiness-distribution.
- Facility type summary added from /stats/facility-types.
- Priority states panel added from /impact/priority-states?limit=5.
- Headline insight and planning interpretation panel added from /impact/trust-gap-summary.
- Build result: npm run build passed.

## Prompt 13 — Facilities Explorer and Detail Drawer
- Live facilities list completed using /facilities.
- Filter panel completed using /facilities/meta/filters.
- Pagination completed using backend total, page, limit, total_pages, and results.
- Facility cards completed with trust/readiness labels, evidence summaries, and warning badges.
- Facility detail drawer completed using /facilities/{facility_id}.
- Quick visible-results filter completed for current page results.
- Build result: npm run build passed.

## Next Step
Prompt 14 — Search page and agent recommendation UI.

## Prompt 14 — Search, Impact, and Agent Live Integration
- Search page completed with live GET /search integration.
- Search filters wired to /facilities/meta/filters.
- Search results now display relevance score, matched_fields, warning_flags, and evidence_summary.
- Search result cards can open facility detail drawer via /facilities/{facility_id}.
- Impact page completed with live /impact/trust-gap-summary, /impact/priority-states, /impact/state-risk-index, and /impact/facility-type-gap integration.
- Agent page completed with live POST /agent/recommend integration.
- Agent response rendering is schema-tolerant to support future backend fields (including potential Stage 18 vector/Tavily additions) without frontend breakage.
- Frontend does not call Databricks, Tavily, or external AI models.

## Prompt 15 — Stage AI-Ready Agent Interface
- Added AI-ready normalized agent models in `src/types/agent.ts`.
- Added response adapter and payload builders in `src/api/agentAdapter.ts`.
- Added future-proof agent request fields and optional future response fields in `src/api/types.ts`.
- Added `recommendFacilitiesAiReady` in `src/api/caregridApi.ts` with:
	- Request payload centralization.
	- Response normalization centralization.
	- 30s timeout.
	- Automatic fallback retry to legacy-safe payload when backend rejects unknown fields.
- Upgraded Agent page with:
	- Query + example prompts.
	- Max results selector.
	- Vector/web/AI explanation toggles.
	- Advanced options section.
	- AI summary panel with graceful fallback when AI fields are not yet available.
	- Structured recommendation cards.
	- Evidence snippets panel with expandable excerpts and clickable truncated URLs.
	- Validation findings panel.
	- Vector retrieval and web verification panels with fallback messages.
	- Safety note fallback message when backend omits safety_note.
	- Collapsible trace/debug panel for retrieval/trace/raw unknown fields and timing.
	- Loading stage labels and user-friendly error states with collapsible technical detail.
- Added route-level lazy loading and Suspense in `src/App.tsx`.
- Build and typecheck validation completed successfully.
