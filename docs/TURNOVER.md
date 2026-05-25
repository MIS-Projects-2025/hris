# HRIS Turnover Documentation

## Table of Contents
1. [Project Summary](#1-project-summary)
2. [Environment Setup](#2-environment-setup)
3. [Database Configuration](#3-database-configuration)
4. [Key Configuration Values](#4-key-configuration-values)
5. [Running the Application](#5-running-the-application)
6. [Feature Overview](#6-feature-overview)
7. [API Routes Reference](#7-api-routes-reference)
8. [Common Development Tasks](#8-common-development-tasks)
9. [Testing](#9-testing)
10. [Build & Deployment](#10-build--deployment)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Project Summary

HRIS is a Laravel 12 + React 18 application built with Inertia.js for managing employee records and processing change requests. It integrates with an external SSO system (Authify).

### Quick Facts
- **Laravel Version**: 12.x
- **React Version**: 18.x
- **PHP Version**: 8.2+
- **Node Version**: 20+
- **Package Manager**: Composer (PHP), NPM (JS)

---

## 2. Environment Setup

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 20+
- MySQL (3 databases required)

### Initial Setup

```bash
# 1. Clone and navigate to project
git clone <repo-url>
cd HRIS

# 2. Install dependencies
composer install
npm install

# 3. Create environment file
cp .env.example .env
php artisan key:generate

# 4. Create storage link
php artisan storage:link
```

---

## 3. Database Configuration

Three MySQL databases required:

| Database | Purpose | Connection Name |
|---|---|---|
| `hris` | Operational data (change requests, attachments) | `mysql` (default) |
| `masterlist` | Employee source of truth | `masterlist` |
| `authify` | SSO token validation | `authify` |

### Environment Variables (.env)

```dotenv
# Application
APP_NAME=hris
APP_URL=http://localhost:8000

# Primary DB (hris)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hris
DB_USERNAME=root
DB_PASSWORD=

# Masterlist DB (employee source of truth)
DB_MASTERLIST_HOST=127.0.0.1
DB_MASTERLIST_PORT=3306
DB_MASTERLIST_DATABASE=masterlist
DB_MASTERLIST_USERNAME=root
DB_MASTERLIST_PASSWORD=

# Authify DB (SSO)
DB_AUTHIFY_HOST=127.0.0.1
DB_AUTHIFY_PORT=3306
DB_AUTHIFY_DATABASE=authify
DB_AUTHIFY_USERNAME=root
DB_AUTHIFY_PASSWORD=

# SSO Configuration
SSO_COOKIE_NAME=sso_token
SSO_LOGIN_URL=http://192.168.1.12:8306/login

# Internal Service Key (for service-to-service calls)
SSO_INTERNAL_KEY=your-internal-key
```

---

## 4. Key Configuration Values

### config/database.php
Defines three connections:
- `mysql` — default HRIS operational DB
- `masterlist` — employee records
- `authify` — SSO sessions

### config/filesystems.php
```php
'disks' => [
    'private' => [
        'driver' => 'local',
        'root'   => storage_path('app/private'),
    ],
]
```

### config/session.php
- Driver: `file` or `database`
- Lifetime: typically 120 minutes

### Rate Limiting (app/Http/RateLimiters.php)
| Limiter | Requests/Minute | Key |
|---|---|---|
| api-reads | 60 | emp_id |
| cr-submit | 20 | emp_id |
| cr-review | 30 | emp_id |
| cr-upload | 10 | emp_id |

---

## 5. Running the Application

### Development Mode
```bash
# Full stack (Laravel + Vite)
composer run dev
```

This runs:
- `php artisan serve` (Laravel)
- `npm run dev` (Vite hot reload)

Access at: `http://localhost:8000/hris`

### Frontend Only
```bash
npm run dev    # Development with HMR
npm run build  # Production build
```

### Running Tests
```bash
composer run test
```
This clears config cache and runs Pest tests with SQLite in-memory.

---

## 6. Feature Overview

### Employee Profile (3 Tabs)
1. **Personal Tab**
   - Name, birthday, gender, civil status
   - Address records
   - Family (parents, spouse, children, siblings)
   - Government IDs (SSS, PhilHealth, Pag-IBIG, TIN)

2. **Work Tab**
   - Department, job title, position
   - Production line, station, team
   - Employment status, classification, shift
   - Date hired, service length
   - Approver assignment

3. **Files Tab**
   - Lazy-loaded attachments
   - Image thumbnails or file type badges
   - Click to view in new tab

### Change Request System
- 10 categories for employee-submitted changes
- HR review queue with approve/reject
- Automatic write-back to masterlist on approval
- Optional attachment requirement per category

### Admin Panel
- Direct field editing (bypass change request workflow)
- Add/delete family records
- View and manage other admins

### Import/Export
- Excel template download with dropdown lookups
- Bulk employee data import
- Validates FK relationships before writing

---

## 7. API Routes Reference

### Web Routes

All routes under `/{APP_NAME}/` prefix (e.g., `/hris/`)

| Method | Route | Controller | Name |
|---|---|---|---|
| GET | `/` | DashboardController | dashboard |
| GET | `/profile` | ProfileController | profile.index |
| POST | `/change-password` | ProfileController | changePassword |
| GET | `/admin` | AdminController | admin |
| GET | `/employees/{employid}` | EmployeeController | employees.show |
| GET | `/attachments/{id}` | AttachmentController | attachments.view |
| GET | `/change-requests` | EmployeeChangeRequestController | change-requests.index |
| POST | `/change-requests` | EmployeeChangeRequestController | change-requests.store |
| POST | `/change-requests/{id}/approve` | EmployeeChangeRequestController | change-requests.approve |
| POST | `/change-requests/{id}/reject` | EmployeeChangeRequestController | change-requests.reject |
| POST | `/change-requests/attachments` | EmployeeChangeRequestController | change-requests.attachments.store |
| GET | `/import/template` | ImportController | import.template |
| GET | `/import` | ImportController | import.index |
| POST | `/import/upload` | ImportController | import.upload |
| GET | `/logout` | AuthenticationController | logout |

### API Routes

All under `/api/employees/` prefix, require AuthMiddleware.

| Method | Route | Controller |
|---|---|---|
| GET | `/{employid}` | Api\EmployeeController@show |
| GET | `/{employid}/work` | Api\EmployeeController@work |

---

## 8. Common Development Tasks

### Adding a New Change Request Category

1. **Add to category list** in `EmployeeChangeRequestService` or controller
2. **Create form component** in `resources/js/Components/ChangeRequest/Forms/CategoryForms.jsx`
3. **Implement apply logic** in `app/Actions/ApplyChangeRequest.php`
4. **Add to modal** in `ChangeRequestModal.jsx`

### Adding a New Lookup Table

1. Create migration in `database/migrations/`
2. Create model in `app/Models/`
3. Add FK relationship to relevant models
4. Add to `LookupService` if used in dropdowns

### Modifying Employee Display Fields

1. **Backend**: Update `EmployeeService.php` → `getFullDetail()`
2. **Frontend**: Update `resources/js/Pages/Employee/Show.jsx` or `EmployeeComponents.jsx`

### Adding a New Excel Import Sheet

1. Create import sheet class in `app/Imports/Sheets/`
2. Register in `app/Imports/EmployeeImport.php`
3. Create corresponding export sheet in `app/Exports/Sheets/`
4. Add to `EmployeeImportTemplate.php`

### Adding a New Route

1. Add to appropriate route file:
   - `routes/web.php` — general pages
   - `routes/employee.php` — employee-related
   - `routes/general.php` — auth-protected
   - `routes/api.php` — API endpoints

---

## 9. Testing

Uses Pest PHP v3 with SQLite in-memory database.

```bash
# Run all tests
php artisan test

# Run specific test
php artisan test --filter=TestClassName

# Run with coverage (if configured)
php artisan test --coverage
```

### Test Database
Tests use `:memory:` SQLite. Test-specific env vars defined in `phpunit.xml`.

---

## 10. Build & Deployment

### Production Build

```bash
# Build frontend assets
npm run build

# Clear and rebuild caches
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Storage
Ensure `storage/app/private` directory exists and is writable.

---

## 11. Troubleshooting

### "Class not found" after composer install
```bash
composer dump-autoload
```

### Rate limit exceeded
Check `app/Http/RateLimiters.php`. Default limits are 60/min (reads), 20/min (CR submit), 30/min (review), 10/min (upload).

### File not found errors
Ensure storage link is created:
```bash
php artisan storage:link
```

### Session/Auth issues
- Check SSO_LOGIN_URL in .env
- Verify authify database is accessible
- Check session configuration in config/session.php

### Database connection errors
- Verify all three databases exist
- Check credentials in .env
- Test connectivity: `php artisan tinker`

### CSS/JS not loading after build
```bash
npm run build
```
Ensure `public/build` directory is served. Check Vite config if using custom output path.

### Change requests not applying
Check `ApplyChangeRequest` action. Ensure masterlist connection is configured correctly.

---

## Key Contacts

- **SSO System**: Authify team (external)
- **Database Admin**: [To be filled]
- **Previous Developer**: [To be filled]

---

## External Dependencies

| Service | URL | Purpose |
|---|---|---|
| Authify SSO | http://192.168.1.12:8306 | Authentication |
| Masterlist DB | MySQL | Employee data |
| HRIS DB | MySQL | Operational data |
