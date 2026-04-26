# CareGrid India Frontend

React + TypeScript + Vite frontend scaffold for CareGrid India.

## Current Stage
Polished shell, typed API client, live dashboard integration, facilities explorer, search UI, impact dashboard, and an AI-ready agent interface are connected to backend endpoints.

## Architecture Guardrail
Frontend must call backend APIs only.

Correct flow:
Frontend -> Backend API -> CareGrid Agent / AI model / Vector DB / Tavily

The frontend must never call Databricks, Tavily, OpenAI, Claude, Gemini, or any external AI model directly.

## Backend Dependency
Run the backend locally at:

```bash
http://localhost:8000
```

The frontend should use real backend API responses and must not introduce mock healthcare datasets as the final data source.

## Environment Variables
Create a local `.env` file for Vite:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_MAPBOX_TOKEN=your_mapbox_public_token
VITE_MAPBOX_STYLE=mapbox://styles/mapbox/dark-v11
```

Only backend base URL settings belong in Vite env. Never place secrets or API keys in frontend env files.

Mapbox token must be stored in `.env.local` and must not be hardcoded in source files.

## India GIS Conversion
Convert local India shapefile into frontend GeoJSON:

```bash
npm run convert:india-shapefile
```

Output file:

```text
public/data/india-boundaries.geojson
```

Map route:

```text
/map
```

## Setup
```bash
npm install
```

## Run Locally
```bash
npm run dev
```

## Build
```bash
npm run build
```

## Lint / Type Check
```bash
npm run lint
```

## Docs
- docs/FRONTEND_CONTEXT.md
- docs/FRONTEND_PROGRESS.md
- docs/UI_PLAN.md

## API Layer
- `src/api/client.ts` contains the Axios client.
- `src/api/endpoints.ts` contains backend path constants.
- `src/api/types.ts` contains backend-aligned TypeScript models.
- `src/api/caregridApi.ts` contains typed API functions.

## Agent AI-Ready Notes
- The Agent page uses a response adapter (`src/api/agentAdapter.ts`) and normalized types (`src/types/agent.ts`).
- Unknown backend fields are preserved and shown in a debug panel.
- If future AI/vector/web fields are added by backend, the UI remains stable.

Expected future fields include:
- `agent_mode`, `model_used`, `model_provider`
- `ai_summary`, `ai_reasoning`, `ai_answer`, `ai_limitations`, `ai_confidence`, `ai_next_steps`
- `retrieval_summary`, `trace_summary`
- `vector_enabled`, `vector_available`, `vector_count`, `vector_reason`
- `web_verification_enabled`, `tavily_verified_count`
- `evidence_snippets`, `validation_findings`, `warning_flags`, `score_breakdown`
- `human_next_steps`, `raw_extra_fields`

## Testing Agent Page
1. Start backend at `http://localhost:8000`.
2. Run frontend with `npm run dev`.
3. Open `/agent` and click one of the example prompts.
4. Verify:
	- Request succeeds against backend endpoint `/agent/recommend`.
	- Structured panels render current response safely.
	- Debug panel shows additional unknown fields when present.
	- No external AI provider calls are made by frontend.
