# Frontend Status

## AI-Ready Status
- Agent page is ready for future AI-enhanced backend fields.
- Frontend calls backend only; no direct Databricks, Tavily, or external model calls.
- No frontend secrets or API keys are used.
- Unknown response fields are preserved and shown in a debug panel.
- Vector, web verification, and AI summary panels are prepared for backend rollout.

## GIS Map Status
- India GIS map route is available at `/map`.
- Mapbox dark basemap is enabled through env values.
- India boundary source loads from `public/data/india-boundaries.geojson`.
- Converter script available: `npm run convert:india-shapefile`.
- If backend state overlays fail to join by name, map still renders neutral boundaries.

## Build Status
- `npm run build`: passing
- `npm run lint`: passing
- `npm run convert:india-shapefile`: passing

## Environment
- `VITE_API_BASE_URL=http://localhost:8000`
- `VITE_MAPBOX_TOKEN=<public mapbox token in .env.local>`
- `VITE_MAPBOX_STYLE=mapbox://styles/mapbox/dark-v11`

## How To Run
1. Start backend API.
2. In frontend directory, run `npm install`.
3. Run `npm run dev`.
4. Open the Agent page at `/agent`.

## How To Test Agent Page
1. Enter a custom query or click an example prompt.
2. Optionally toggle vector search, web verification, and AI explanation flags.
3. Submit and verify structured sections render safely even when some fields are missing.
4. Check Trace / Debug panel for raw additional fields and timing.

## Expected Future Backend Fields
- `agent_mode`
- `model_used`
- `model_provider`
- `ai_summary`
- `ai_reasoning`
- `ai_answer`
- `ai_limitations`
- `ai_confidence`
- `ai_next_steps`
- `retrieval_summary`
- `vector_enabled`
- `vector_available`
- `vector_count`
- `vector_reason`
- `web_verification_enabled`
- `tavily_verified_count`
- `recommendations`
- `evidence_snippets`
- `validation_findings`
- `warning_flags`
- `score_breakdown`
- `safety_note`
- `human_next_steps`
- `trace_summary`
- `raw_extra_fields`
