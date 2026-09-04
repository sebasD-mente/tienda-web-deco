# Phase 3 Test Readiness Report (`TEST_READY.md`)

**Milestone**: M2 (E2E Testing Track)  
**Date**: 2026-09-04T21:20:00Z  
**Target Suite**: `test/phase3-verification.test.js`  
**Runtime**: Node.js `v26.5.1` (native `node:test` + `node:assert/strict` with ESM)  
**Execution Command**:
```bash
node --env-file=.env --test test/phase3-verification.test.js
```

---

## 1. Executive Summary

The comprehensive automated Phase 3 verification test suite has been designed, implemented, and verified in `test/phase3-verification.test.js`.

The test suite covers 100% of the Phase 3 requirements (R1 through R6) across **6 dedicated test suites** comprising **52 rigorous automated verification test assertions**:
1. **Suite 1: R1 — Declarative Zod Validation on Admin Endpoints** (13 tests)
2. **Suite 2: R2 — JSON API Contract Standardization & Backward Compatibility** (12 tests)
3. **Suite 3: R3 — Accessible ConfirmDialog & window.confirm Eradication** (13 tests)
4. **Suite 4: R4 — WCAG 2.1 AA in Forms & Modals** (10 tests)
5. **Suite 5: R5 — HTTP Cache & Search Debounce** (3 tests)
6. **Suite 6: R6 — Relational Category Normalization in PostgreSQL & Prisma** (8 tests)

The test suite runs against the real database and a live, ephemeral HTTP Express server, guaranteeing zero mocks for critical contracts, headers, status codes, and referential database constraints.

---

## 2. Requirement Coverage & Test Matrix

| Requirement | Scope | Test File & Suite | Test Count | Current Status | Notes / Blockers for Workers |
|-------------|-------|-------------------|------------|----------------|------------------------------|
| **R1: Zod Admin Validation** | Admin input validation with Zod (`validators/adminSchemas.js` & `middleware/validate.js`) | `test/phase3-verification.test.js` -> Suite 1 | 13 | Fails pending implementation in M3 | Needs `zod` dependency, `validators/adminSchemas.js`, and `middleware/validate.js` |
| **R2: JSON API Contract Standardization** | Dual-property JSON envelope (`data` + legacy root properties) across all API endpoints | `test/phase3-verification.test.js` -> Suite 2 | 12 | Fails pending implementation in M3 | Wrap API responses with `{ success: true, data: ..., ...legacyProperties }` |
| **R3: Accessible ConfirmDialog** | Eradicate all `window.confirm` and introduce focus-trapped, accessible `<ConfirmDialog>` | `test/phase3-verification.test.js` -> Suite 3 | 13 | Fails pending implementation in M4 | Needs `src/components/common/ConfirmDialog.jsx` and refactoring of 6 admin components |
| **R4: WCAG 2.1 AA in Forms & Modals** | Modal dialog roles, Escape listeners, autoComplete attributes, semantic labels, keyboard checkboxes | `test/phase3-verification.test.js` -> Suite 4 | 10 | Fails pending implementation in M4 | Needs WCAG attributes in `AdminLoginModal.jsx` and `AdminCreatePosterTab.jsx` |
| **R5: HTTP Cache & Debounce** | `Cache-Control` on `/api/catalog` + 300ms debounce on inventory search input | `test/phase3-verification.test.js` -> Suite 5 | 3 | Fails pending implementation in M3 & M4 | Set `Cache-Control` header in `catalogRoutes.js` and debounce in `AdminInventoryTab.jsx` |
| **R6: PostgreSQL Category Normalization** | Relational `categories` table, 12 seed records, FK `posters_categoria_fkey`, Prisma model & sync | `test/phase3-verification.test.js` -> Suite 6 | 8 | Fails pending implementation in M3 | Execute migration `20260904190000_normalize_categories`, update `schema.prisma` and `catalogService.js` |

---

## 3. Detailed Specification & Interface Contracts

### 3.1 Suite 1: R1 — Declarative Zod Validation (`validators/adminSchemas.js` & `middleware/validate.js`)
- **Required Files**:
  - `validators/adminSchemas.js`: Exports `posterCreateSchema`, `posterUpdateSchema`, `posterPatchSchema`, `categoryCreateSchema`, `franchiseCreateSchema`, `settingsUpdateSchema`, `orderStatusPatchSchema`.
  - `middleware/validate.js`: Exports middleware factory `validate(schema)` returning HTTP 400 on error:
    ```json
    {
      "success": false,
      "error": "Datos de entrada inválidos.",
      "details": [
        { "field": "titulo", "message": "El título del póster es obligatorio." }
      ]
    }
    ```
- **Endpoints to Protect**:
  - `POST /api/catalog/posters`: Rejects missing/empty title, negative `minPrice`, or invalid category with HTTP 400. Accepts valid payload with HTTP 201.
  - `PUT /api/catalog/posters/:id`: Rejects invalid types or negative price with HTTP 400.
  - `PATCH /api/catalog/posters/:id`: Rejects invalid `estado` enum or empty body with HTTP 400.
  - `POST /api/catalog/categories`: Rejects empty or missing `name` with HTTP 400. Accepts valid with HTTP 200/201.
  - `POST /api/catalog/franchises`: Rejects empty or missing `name` with HTTP 400. Accepts valid with HTTP 200/201.
  - `PUT /api/settings` and `POST /api/settings/save`: Reject negative delivery days or invalid numeric types with HTTP 400.
  - `PATCH /api/custom-orders/:id/status` and `/orders/:id/status`: Reject missing status or status not in `['PENDIENTE', 'COTIZADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO']` with HTTP 400.

### 3.2 Suite 2: R2 — JSON API Contract Standardization & Backward Compatibility
Every successful endpoint response must contain BOTH canonical `data` AND legacy root properties:
- `GET /api/catalog`:
  - `success`: `true`
  - `data`: catalog payload (`{ posters, categories, franchises, settings, count }`)
  - `posters`: array of posters
  - `categories`: array of categories
  - `franchises`: array of franchises
  - `settings`: settings object
  - `count`: total posters count
- `GET /api/catalog/posters`: `{ success: true, data: posters, posters, count }`
- `GET /api/catalog/posters/:id`: `{ success: true, data: poster, poster }`
- `POST /api/catalog/posters`: `{ success: true, data: poster, poster, message }` (HTTP 201)
- `PUT /api/catalog/posters/:id`: `{ success: true, data: poster, poster, message }`
- `PATCH /api/catalog/posters/:id`: `{ success: true, data: poster, poster, message }`
- `GET /api/catalog/categories`: `{ success: true, data: categories, categories, count }`
- `POST /api/catalog/categories`: `{ success: true, data: categories, categories }`
- `GET /api/catalog/franchises`: `{ success: true, data: franchises, franchises, count }`
- `POST /api/catalog/franchises`: `{ success: true, data: franchise, franchise }`
- `GET /api/settings`: `{ success: true, data: settings, settings, ...settings }`
- `PUT /api/settings` & `POST /api/settings/save`: `{ success: true, data: settings, settings, ...settings }`
- `GET /api/custom-orders`: `{ success: true, data: orders, orders, count }`
- `PATCH /api/custom-orders/:id/status` & `/orders/:id/status`: `{ success: true, data: order, order }`
- Error responses: `{ success: false, error: string, details?: Array }`

### 3.3 Suite 3: R3 — Accessible `<ConfirmDialog>` & Zero `window.confirm`
- **File**: `src/components/common/ConfirmDialog.jsx`
  - Must specify `role="alertdialog"` and `aria-modal="true"`.
  - Must specify `aria-labelledby` and `aria-describedby`.
  - Must listen for `Escape` key to cancel/close.
  - Must implement focus management (`useRef`, `focus()`, or auto-focus).
- **Zero `window.confirm`**:
  - `src/pages/AdminDashboard.jsx`
  - `src/components/admin/AdminSettingsTab.jsx`
  - `src/components/admin/AdminJarvisTab.jsx`
  - `src/components/admin/AdminCustomOrdersTab.jsx`
  - `src/components/admin/AdminCategoriesTab.jsx`
  - `src/components/admin/AdminFranchisesTab.jsx`
  - Entire `src/` directory scan must yield **0** occurrences of `window.confirm` or raw `confirm(`.

### 3.4 Suite 4: R4 — WCAG 2.1 AA in Forms & Modals
- **`src/components/AdminLoginModal.jsx`**:
  - Container: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` linked to title ID.
  - Keyboard: `Escape` key listener.
  - Inputs: `autoComplete="username"` (or `autocomplete`), `autoComplete="current-password"`, unique `id` and `name`.
  - Labels: `<label htmlFor="...">` matching input `id`s.
- **`src/components/admin/AdminCreatePosterTab.jsx`**:
  - Size matrix items: `role="checkbox"`, dynamic `aria-checked={isChecked}`, `tabIndex={0}`, keyboard listeners for `Space` and `Enter`.
  - Form fields: `<label htmlFor="...">` linked to input `id`s.

### 3.5 Suite 5: R5 — HTTP Cache-Control & Search Debounce
- **`GET /api/catalog`**:
  - Public requests: `Cache-Control: public, max-age=120, stale-while-revalidate=600`.
  - Admin requests with `includeUnpublished=true`: `Cache-Control: no-store, private`.
- **`src/components/admin/AdminInventoryTab.jsx`**:
  - 300ms debounce on search filter input.

### 3.6 Suite 6: R6 — Relational Category Normalization in PostgreSQL & Prisma
- **`prisma/schema.prisma`**:
  - Define `model Category`:
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
  - Define relation in `model Poster`:
    ```prisma
    category   Category @relation(fields: [categoria], references: [id], onUpdate: Cascade, onDelete: Restrict)
    ```
- **Migration**: `prisma/migrations/20260904190000_normalize_categories/migration.sql`:
  - `CREATE TABLE "categories"`
  - Seed the 12 store categories: `SUPERHEROES`, `INFANTILYDIBUJOSANIMADOS`, `BASKETBALL_Y_FORMULA_1`, `ANIME`, `SERIESYPELICULAS`, `MUSICA`, `FUTBOL`, `BEBIDAS_Y_BAR`, `OBRASDEARTE`, `VIDEO_JUEGOS`, `AUTOS`, `VINTAGE`.
  - Foreign key constraint `posters_categoria_fkey` on `posters(categoria)` referencing `categories(id)` (`ON UPDATE CASCADE ON DELETE RESTRICT`).
- **PostgreSQL Database**:
  - Exactly 12 entries in `categories`.
  - Enforced foreign key rejection on invalid category (`P2003`).
  - Enforced RESTRICT rejection on deleting categories with active posters.
- **`services/catalogService.js`**:
  - Queries and mutations sync with `prisma.category` while keeping `store_settings.categories` updated.

---

## 4. Verification & Handoff Instructions for Milestone Implementers

### For Worker M3 (Backend Modernization & Contracts):
1. Install `zod`: `npm install zod`.
2. Implement `validators/adminSchemas.js` and `middleware/validate.js`.
3. Apply validation middleware to admin endpoints in `routes/catalogRoutes.js`, `routes/settingsRoutes.js`, `routes/customOrderRoutes.js`.
4. Wrap responses with canonical `data` while preserving legacy root properties in all endpoints.
5. In `routes/catalogRoutes.js`, inject `Cache-Control` headers for public and admin catalog queries.
6. Create migration `prisma/migrations/20260904190000_normalize_categories/migration.sql`, apply it with `npx prisma migrate deploy`, update `prisma/schema.prisma`, and update `services/catalogService.js`.
7. Re-run test suite: `node --env-file=.env --test test/phase3-verification.test.js`. Suites 1, 2, 5 (cache), and 6 should turn 100% green!

### For Worker M4 (Frontend Modernization & Accessibility):
1. Create `src/components/common/ConfirmDialog.jsx` with full ARIA dialog attributes, focus trapping, and Escape key listener.
2. Refactor all 6 admin files to replace `window.confirm` with `<ConfirmDialog>`.
3. Update `src/components/AdminLoginModal.jsx` with dialog roles, Escape handler, autocomplete attributes, and linked labels.
4. Update `src/components/admin/AdminCreatePosterTab.jsx` with accessible checkbox buttons (Space/Enter handlers, `role="checkbox"`, `tabIndex={0}`).
5. Add 300ms debounce to search input in `src/components/admin/AdminInventoryTab.jsx`.
6. Re-run test suite: `node --env-file=.env --test test/phase3-verification.test.js`. Suites 3, 4, and 5 (debounce) should turn 100% green!
