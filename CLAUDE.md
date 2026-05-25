# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start full development environment (Laravel + queue listener + Vite concurrently)
composer run dev

# Run tests (clears config cache first)
composer run test

# Frontend only
npm run dev
npm run build
```

## Architecture Overview

**Stack:** Laravel 12 + React 18 + Inertia.js v2 (SPA bridge), Vite, Tailwind CSS + DaisyUI + Shadcn/ui

### Request Lifecycle
```
Request → Middleware → Controller → Service → Repository → Database
```

### Multi-Database Design
Three separate MySQL databases with explicit connection routing:
- **`masterlist`** — Source-of-truth employee data (read-heavy). All employee profiles, work details, family relations, government IDs. Models: `EmployeeDetail`, `EmployeeWorkDetail`, family/address models.
- **`hris`** (default `mysql` connection) — Operational data (write-heavy). `EmployeeChangeRequest` (pending/approved/rejected/cancelled), `EmployeeAttachment` (file metadata).
- **`authify`** — SSO token validation only (read-only). `authify_sessions` table checked by `AuthMiddleware`.

### Authentication (SSO)
`AuthMiddleware` intercepts all protected routes. It checks for a token via query param `?key` → cookie → session, then validates against `authify_sessions` in the Authify DB. On success, it sets session variables (`emp_id`, `emp_name`, `dept`, etc.). No token redirects to the Authify SSO server at `http://192.168.1.12:8306/login`.

Cookies are set via `Cookie::queue()` (not `->withCookie()`) because some responses are `BinaryFileResponse` instances (e.g. Excel downloads) which don't support `->withCookie()`.

Frontend stores the token in `localStorage` as `authify-token`. Inertia's `HandleInertiaRequests` middleware injects `emp_data` as a shared prop.

### Change Request Workflow
1. Employee selects a category → modal pre-fills current values from masterlist
2. Employee submits → any existing `pending` request for the same category is auto-cancelled
3. HR reviews on `ChangeRequests/Index` page
4. Approval triggers `ApplyChangeRequest` action — runs a cross-DB transaction writing new values to the appropriate `masterlist` table(s)

10 change categories: `name`, `civil_status`, `address`, `education`, `father`, `mother`, `spouse`, `children`, `siblings`, `others`

HR approve/reject uses `router.post()` with `only: ['requests']` for a partial Inertia reload — only the requests list is re-fetched, not the full page.

### Inertia Conventions
- Controllers return `back()` for mutating actions (approve, reject, import upload) — never `JsonResponse` for Inertia-driven pages.
- Axios is only used for endpoints called from non-Inertia contexts (employee-side modals, attachment uploads).
- `toast` (sonner) is assigned to `window.toast` in `app.jsx` — import it globally once, call `toast.success()` / `toast.error()` anywhere without per-file imports.

### Inertia Lazy Loading
Two props on the employee show page are lazy-loaded (not sent on initial request):
- `attachments` — loaded on first Files tab click
- `activeEmployees` — loaded when the employee combobox opens

### File Storage
Files are stored on a private (non-public) disk and served through `AttachmentController@view` with correct MIME types. Files are only deleted when no active change request references them.

### Rate Limiting
Keyed by `emp_id` from session (falls back to IP). Four rate limiters defined in `RateLimiters.php`: API reads (60/min), CR submission (20/min), CR review (30/min), file uploads (10/min).

### Excel Import
Package: `maatwebsite/excel` (PhpSpreadsheet).

**Template generation** (`app/Exports/`):
- `EmployeeImportTemplate` — orchestrator, loads all lookup tables once, passes to sheets
- Sheet order matters: `LookupsSheet` must be **first** so its worksheet exists when `WorkDetailsSheet` registers data validations
- Dropdowns use `setShowDropDown(true)` — PhpSpreadsheet inverts this to `showDropDown="0"` in OOXML (which means *show*). Using `false` writes `"1"` which *hides* the arrow
- The Lookups sheet must **not** be hidden — Excel blocks dropdown validation from referencing hidden sheets

**Import processing** (`app/Imports/`):
- `LookupResolver` pre-loads all 9 lookup tables on `boot()` as `name → id` maps, then resolves each FK field at import time
- Each sheet reads by column index (not heading row) since the template column order is controlled
- Work Details rows are skipped entirely if any FK value cannot be resolved — no partial saves
- Employee Details → `masterlist` connection; Government Info → `hris` connection

Template download: `GET /HRIS/import/template` · Import page: `GET /HRIS/import` · Upload: `POST /HRIS/import/upload`

## Frontend Conventions

### Component Organisation
Page-specific components live under `resources/js/Components/{Feature}/`. Example for change requests:
```
Components/ChangeRequest/
├── ActionCell.jsx       — approve/reject buttons with inline reject form
├── DiffCell.jsx         — old → new field diff display
├── StatusBadge.jsx      — status pill + STATUS_STYLES map
├── ChangeRequestModal.jsx
├── EditSectionDropdown.jsx
└── Forms/CategoryForms.jsx
```
Page files (`Pages/`) should only contain layout, routing logic, and prop threading — no inline component definitions.

## Key File Locations

| Concern | Path |
|---|---|
| SSO auth middleware | `app/Http/Middleware/AuthMiddleware.php` |
| Inertia shared props | `app/Http/Middleware/HandleInertiaRequests.php` |
| Change request approval | `app/Actions/ApplyChangeRequest.php` |
| Rate limiter setup | `app/Http/RateLimiters.php` + `app/Providers/AppServiceProvider.php` |
| Route files | `routes/web.php`, `routes/general.php`, `routes/employee.php`, `routes/api/employeeApi.php` |
| Frontend entry | `resources/js/app.jsx` |
| Page components | `resources/js/Pages/` |
| Reusable components | `resources/js/Components/` |
| Excel template export | `app/Exports/EmployeeImportTemplate.php` |
| Excel import orchestrator | `app/Imports/EmployeeImport.php` |
| Lookup FK resolver | `app/Imports/Resolvers/LookupResolver.php` |
| Import controller | `app/Http/Controllers/General/ImportController.php` |

## Testing

Uses Pest PHP v3 with SQLite in-memory (`:memory:`) for the test database. Test-specific env vars are defined in `phpunit.xml`. Tests live in `tests/Feature/` and `tests/Unit/`.

```bash
# Run a single test file
php artisan test --filter=TestClassName
```
