# CareGrid India Frontend Context

## Project Name
CareGrid India

## Purpose
Frontend dashboard for healthcare trust intelligence in India.

## Backend Base URL
http://localhost:8000

## Main Backend Endpoints
- GET /health
- GET /stats/overview
- GET /impact/trust-gap-summary
- GET /facilities/meta/filters
- GET /facilities
- GET /facilities/{facility_id}
- GET /search
- POST /agent/recommend

## Important Frontend Rules
- Do not rename API fields.
- Treat facility_id as primary key.
- Use state as the cleaned state field.
- Use latitude and longitude for map markers.
- Use evidence_summary for cards.
- Use combined_medical_evidence only in detail views.
- Show warning_flags as badges.
- Use trust_category and recommendation_readiness exactly as returned.
- Frontend must call backend APIs only.
- Never call Databricks, Tavily, OpenAI, Claude, Gemini, or any external model directly from frontend.
- Keep agent UI schema-tolerant for future backend AI/vector/web verification fields.

## Trust Category Values
- High Trust / Evidence Supported
- Moderate Trust / Verify Before Use
- Low Trust / Needs Human Verification
- High Risk / Insufficient Evidence

## Recommendation Readiness Values
- Ready for recommendation
- Usable with verification
- Do not recommend without human review
