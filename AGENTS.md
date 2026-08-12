# AGENTS.md

## Project: Self-Hosted Airtable Clone ("inejomaTable")

This is a **specification-only repository** — no code has been written yet. All three root files are design documents describing what to build.

### Key documents

| File | Purpose |
|---|---|
| `readme.md` | Architecture overview, recommended stack, and phased implementation roadmap (8 phases). |
| `details.md.md` | Exhaustive functional checklist — every Airtable feature with exact behavior, limits, and API contracts. The source of truth for *what* to build. |
| `frontend.md` | UI/UX layout spec — wireframes, color tokens, iconography, component positions. Describes *how* the interface should look. |

### Stack (from spec)

- **DB:** PostgreSQL 16+ (JSONB/EAV for dynamic schemas)
- **Cache/queues:** Redis 7+
- **Object storage:** MinIO (S3-compatible)
- **Backend:** Node.js (NestJS/Express) or Python (FastAPI)
- **Frontend:** React/Next.js or Vue 3/Nuxt 3 with Tailwind CSS, TanStack Table
- **Proxy:** Nginx or Traefik
- **Containerization:** Docker & Docker Compose

### Explicit exclusions

- AI features (Omni, etc.)
- Multi-user collaboration (User/Collaborator fields are mentioned but marked as excluded)

### Conventions for implementation

- Record IDs use the format `rec` + 14 alphanumeric chars (e.g. `recXXXXXXXXXXXXXX`)
- All field types use their Airtable API type names (e.g. `singleLineText`, `multipleRecordLinks`)
- IDs are prefixed by entity type: `rec`, `app`, `tbl`, `viw`, `fld`, `wsp`, `pag`
- Dates are always stored in UTC/GMT internally; ISO 8601 in API
- Fields reference columns (not cells); formulas use curly braces `{Field Name}`

### Archivo de idioma

All specs are written in Spanish. Implementation code may be in English (standard practice).
