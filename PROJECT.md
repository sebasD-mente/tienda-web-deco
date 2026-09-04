# Project: Deco Vintage Guate — Phase 3 Architecture Modernization, UI/UX, Accessibility & Contracts

## Architecture
- **Backend**: Node.js v26 + Express 5, PostgreSQL database accessed via Prisma ORM 6.
- **Validation**: Declarative schema validation using Zod (`validators/adminSchemas.js`) via Express middleware (`middleware/validate.js`).
- **API Contracts**: Dual-property JSON envelope returning `{ success: true, data: ..., ...legacyProperties }` on 200/201 and `{ success: false, error: ..., details?: [...] }` on 400/500 to guarantee 100% backward compatibility with React frontends and J.A.R.V.I.S.
- **Frontend**: React 18 + Vite SPA, Tailwind CSS / custom CSS (`src/index.css`), Lucide icons.
- **Accessibility & UX**: WCAG 2.1 AA compliance in modals and forms, accessible `<ConfirmDialog>` component replacing all native `window.confirm` occurrences, and search debouncing.
- **Database Relational Integrity**: Normalized `categories` table in PostgreSQL with foreign key `posters_categoria_fkey` on `posters.categoria` referencing `categories.id` (`ON UPDATE CASCADE ON DELETE RESTRICT`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | R1: Zod Admin Validation | Declarative Zod schemas and validation middleware for admin endpoints rejecting invalid inputs with HTTP 400 | M3 | ORIGINAL_REQUEST §R1 |
| 2 | R2: JSON API Contract Standardization | Standardize responses under `{ success, data, ...legacy }` preserving all existing root keys (`poster`, `posters`, `catalog`, `categories`, `franchises`, `settings`, `count`) | M3 | ORIGINAL_REQUEST §R2 |
| 3 | R3: Accessible ConfirmDialog Component | Focus-trapped, accessible alertdialog modal replacing all 6 `window.confirm` occurrences in admin UI | M4 | ORIGINAL_REQUEST §R3 |
| 4 | R4: WCAG 2.1 AA in Forms & Modals | Full accessibility attributes, keyboard handlers, labels, and autocomplete in `AdminLoginModal` & `AdminCreatePosterTab` | M4 | ORIGINAL_REQUEST §R4 |
| 5 | R5: Performance & Network | HTTP `Cache-Control` headers on `GET /api/catalog` + 300ms search input debounce in `AdminInventoryTab` | M3 & M4 | ORIGINAL_REQUEST §R5 |
| 6 | R6: Relational Category Normalization | Prisma model, versioned SQL migration, 12 categories seed, FK constraint, and `catalogService.js` synchronization | M3 | ORIGINAL_REQUEST §R6 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|--------------|--------|
| M1 | Survey & Specification Mapping | Codebase analysis across Backend, Frontend, Testing | none | DONE |
| M2 | E2E Testing Track | Design and write `test/phase3-verification.test.js` | M1 | IN_PROGRESS |
| M3 | Backend Modernization & Contracts | Implement R1, R2, R5 (Cache-Control), R6 (Prisma/PostgreSQL) | M1, M2 | PLANNED |
| M4 | Frontend Modernization & A11y | Implement R3, R4, R5 (Search Debounce) | M1, M2 | PLANNED |
| M5 | Final Verification & Hardening | Run suites, npm run build, Chrome DevTools live tests, Challengers & Forensic Auditor | M3, M4 | PLANNED |

## Interface Contracts

### 1. Zod Validation & Errors (`middleware/validate.js`)
- Request Failure: HTTP 400
```json
{
  "success": false,
  "error": "Datos de entrada inválidos.",
  "details": [
    { "field": "titulo", "message": "El título del póster es obligatorio.", "code": "custom" }
  ]
}
```

### 2. Standardized API Response Envelopes
- Success Envelope:
```json
{
  "success": true,
  "data": "<primary_payload>",
  "<legacyKey1>": "<legacy_value>",
  "<legacyKey2>": "<legacy_value>"
}
```
- Endpoint specific mappings:
  - `GET /api/catalog`: `{ success: true, data: catalog, posters, categories, franchises, settings, count, updatedAt }`
  - `GET /api/catalog/posters`: `{ success: true, data: posters, count, nextCursor, hasMore, posters }`
  - `GET /api/catalog/posters/:id`: `{ success: true, data: poster, poster }`
  - `POST/PUT/PATCH /api/catalog/posters`: `{ success: true, data: poster, message: "...", poster }`
  - `GET /api/catalog/categories`: `{ success: true, data: categories, count, categories }`
  - `POST /api/catalog/categories`: `{ success: true, data: categories, categories }`
  - `GET /api/catalog/franchises`: `{ success: true, data: franchises, count, franchises }`
  - `POST /api/catalog/franchises`: `{ success: true, data: franchise, franchise }`
  - `GET /api/settings`: `{ success: true, data: settings, settings, ...settings }`
  - `PUT /api/settings` & `POST /api/settings/save`: `{ success: true, data: settings, settings, ...settings }`
  - `GET /api/custom-orders`: `{ success: true, data: orders, orders, count }`
  - `PATCH /api/custom-orders/:id/status` & `/orders/:id/status`: `{ success: true, data: order, order }`

### 3. HTTP Caching Headers (`GET /api/catalog`)
- Public requests (`includeUnpublished` is absent or false):
  - `Cache-Control: public, max-age=120, stale-while-revalidate=600`
- Admin/unpublished requests (`includeUnpublished=true`):
  - `Cache-Control: no-store, private`

### 4. Relational Category Schema & Foreign Key
- `Category` model in `prisma/schema.prisma`:
```prisma
model Category {
  id        String   @id
  name      String   @unique
  icon      String?  @default("🏷️")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posters   Poster[]
  @@map("categories")
}
```
- Relation in `model Poster`:
```prisma
category  Category @relation(fields: [categoria], references: [id], onUpdate: Cascade, onDelete: Restrict)
```
- Migration: `prisma/migrations/20260904190000_normalize_categories/migration.sql`:
  - `CREATE TABLE IF NOT EXISTS "categories" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "icon" TEXT DEFAULT '🏷️', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "categories_pkey" PRIMARY KEY ("id"));`
  - `CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_key" ON "categories"("name");`
  - Seed 12 categories: `SUPERHEROES`, `INFANTILYDIBUJOSANIMADOS`, `BASKETBALL_Y_FORMULA_1`, `ANIME`, `SERIESYPELICULAS`, `MUSICA`, `FUTBOL`, `BEBIDAS_Y_BAR`, `OBRASDEARTE`, `VIDEO_JUEGOS`, `AUTOS`, `VINTAGE`.
  - `ALTER TABLE "posters" ADD CONSTRAINT "posters_categoria_fkey" FOREIGN KEY ("categoria") REFERENCES "categories"("id") ON UPDATE CASCADE ON DELETE RESTRICT;`

### 5. Frontend `<ConfirmDialog>` Contract
```jsx
<ConfirmDialog
  isOpen={isOpen}
  title="Título"
  message="Mensaje explicativo"
  confirmText="Confirmar"
  cancelText="Cancelar"
  type="danger" | "warning" | "info"
  isLoading={false}
  onConfirm={handleConfirm}
  onClose={handleClose}
/>
```

## Code Layout
- Backend:
  - `validators/adminSchemas.js` (NEW)
  - `middleware/validate.js` (NEW)
  - `routes/catalogRoutes.js` (MODIFIED)
  - `routes/settingsRoutes.js` (MODIFIED)
  - `routes/customOrderRoutes.js` (MODIFIED)
  - `services/catalogService.js` (MODIFIED)
  - `prisma/schema.prisma` (MODIFIED)
  - `prisma/migrations/20260904190000_normalize_categories/migration.sql` (NEW)
- Frontend:
  - `src/components/common/ConfirmDialog.jsx` (NEW)
  - `src/pages/AdminDashboard.jsx` (MODIFIED: replace window.confirm)
  - `src/components/admin/AdminSettingsTab.jsx` (MODIFIED: replace window.confirm)
  - `src/components/admin/AdminJarvisTab.jsx` (MODIFIED: replace window.confirm)
  - `src/components/admin/AdminCustomOrdersTab.jsx` (MODIFIED: replace window.confirm & handle array response)
  - `src/components/admin/AdminCategoriesTab.jsx` (MODIFIED: replace window.confirm)
  - `src/components/admin/AdminFranchisesTab.jsx` (MODIFIED: replace window.confirm)
  - `src/components/AdminLoginModal.jsx` (MODIFIED: WCAG 2.1 AA)
  - `src/components/admin/AdminCreatePosterTab.jsx` (MODIFIED: WCAG 2.1 AA)
  - `src/components/admin/AdminInventoryTab.jsx` (MODIFIED: 300ms search debounce)
- Tests:
  - `test/phase3-verification.test.js` (NEW)
