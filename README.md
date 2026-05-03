# Kovilpatti Snacks — Shop-to-Godown Inventory Management

Phase 1 backend for **SK's Murukku & Snacks Kadai** — a .NET 9 Web API for managing products, godowns, shops, and staff accounts.

## Tech stack

- **.NET 9** Web API (3-tier: API → Business → Repository)
- **PostgreSQL 13+** / **Supabase** with hand-written stored functions
- **Dapper** for data access (no ORM)
- **JWT bearer** auth + **BCrypt** password hashing
- **FluentValidation** for request validation
- **Swashbuckle** for Swagger UI

## Layout

```
Backend/
├── KovilpattiSnacks.sln
├── API/          Controllers, middleware, Program.cs, appsettings
├── Business/     Services (Interface/Implementation), DTOs, validators, JWT, BCrypt
└── Repository/   Entities, NpgsqlDataSource factory, repos calling stored functions

DB/
├── phase1_init.sql        Schema — 5 tables, audit columns, user_role enum
└── phase1_procedures.sql  All stored functions (auth + CRUD for every entity)
```

## Prerequisites

- .NET 9 SDK (`dotnet --version` ≥ 9.0)
- PostgreSQL 13+ (or a Supabase project)

## First-time setup

### 1. Database

```bash
# Local Postgres — creates the DB then runs schema
psql -U postgres -f DB/phase1_init.sql
psql -U postgres -d sks_inventory -f DB/phase1_procedures.sql
```

For **Supabase**: paste both SQL files into the SQL Editor (init first, procedures second). Comment out the `CREATE DATABASE` line in `phase1_init.sql` — Supabase uses its default `postgres` database.

### 2. Connection string (user-secrets)

The connection string in `appsettings.json` is a placeholder. Set the real one via user-secrets so your password never lands in the repo:

```bash
cd Backend/API
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=sks_inventory;Username=postgres;Password=YOUR_PASSWORD"
```

### 3. JWT signing key (production)

The default `Jwt:SigningKey` in `appsettings.json` is a placeholder. Override with user-secrets in dev or environment variables in production:

```bash
dotnet user-secrets set "Jwt:SigningKey" "<at-least-32-byte-random-string>"
```

### 4. Build and run

```bash
cd Backend
dotnet build
dotnet run --project API
```

Open `http://localhost:5219/swagger` (port comes from `API/Properties/launchSettings.json`).

On the first Development run, an `admin` user is auto-seeded using the credentials in `appsettings.json:Seed`. Default: `admin / admin123`.

## API endpoints (Phase 1)

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/api/auth/login` | anonymous |
| `GET POST PUT DELETE` | `/api/products` | Admin (writes) / any authed (reads) |
| `GET POST PUT` | `/api/inventories` | Admin (writes) / any authed (reads) |
| `GET POST PUT` | `/api/shops` | Admin (writes) / any authed (reads) |
| `GET POST PUT` | `/api/users` | Admin only |
| `PUT` | `/api/users/{id}/password` | Admin only |

JWT lifetime is 1 hour. The token includes `userId`, `role`, and either `shopId` or `inventoryId` (depending on role). All write operations stamp `created_by` / `updated_by` via the JWT user.

## Phase 1 status

- [x] Auth (JWT + BCrypt + role-based authorization)
- [x] Products CRUD (auto-generated `P###` codes)
- [x] Inventories CRUD (auto-generated `INV###` codes)
- [x] Shops CRUD (auto-generated `SHP###` codes, GSTIN validation, mapped to inventory)
- [x] Staff (Users) CRUD with role/binding rules (no admin via UI)
- [ ] Excel bulk import for products *(deferred)*

## Conventions

- **Soft delete** — every entity has an `active` flag; `DELETE` endpoints set `active=false` rather than removing rows.
- **Auto-generated codes** — leave `code` blank on create and the DB allocates the next sequential value (`P001`, `INV001`, `SHP001`).
- **Audit columns** — `created_at`, `created_by`, `updated_at`, `updated_by` exist on every table; the API stamps them automatically on every write.
- **Reserved usernames** — `admin` and `inventory` cannot be used by staff; only the seeded admin row uses `admin`.
