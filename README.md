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

## Environments

Three environments, picked via `ASPNETCORE_ENVIRONMENT`:

| Env | When | Where it runs | DB |
|-----|------|---------------|-----|
| **Development** | Local dev | Your machine | Local Postgres `sks_inventory` |
| **UAT** | Client testing / staging | Railway (UAT service) | Supabase (UAT project) |
| **Production** | Live | Railway (Prod service) | Supabase (Prod project) |

Per-env settings live in `appsettings.{Env}.json`. Secrets (connection string, JWT key, admin seed password) are **never committed** — they come from `dotnet user-secrets` locally and from platform env vars on Railway.

### Required env vars (UAT and Production on Railway)

.NET reads nested config keys with `__` as the separator, e.g. `Jwt:SigningKey` → `Jwt__SigningKey`.

```
ASPNETCORE_ENVIRONMENT       = UAT     (or Production)
ASPNETCORE_URLS              = http://+:${PORT}
ConnectionStrings__Default   = Host=db.<project>.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=<pwd>;SSL Mode=Require;Trust Server Certificate=true
Jwt__SigningKey              = <32+ random chars, generate fresh per env>
Jwt__Issuer                  = (optional override of appsettings)
Jwt__Audience                = (optional override of appsettings)
Seed__AdminPassword          = <strong password — only required on first deploy>
```

If `Seed__AdminPassword` is empty/missing, the admin auto-seed is **skipped**. After the first successful deploy creates the admin row, you can remove this env var; subsequent boots find an admin and skip seeding regardless.

### CORS

Allowed origins are read from `Cors:AllowedOrigins` per environment. Empty list = all cross-origin requests rejected (fail-secure). Update `appsettings.UAT.json` and `appsettings.Production.json` with the Vercel URLs once they're known.

### Health check

`GET /health` returns `{ "status": "ok", "env": "UAT", "time": "..." }` — anonymous, useful for Railway uptime probes.

### Swagger visibility

Always on in **Development**. In **UAT** / **Production**, controlled by `Swagger:Enabled` in the per-env appsettings file (default: on for UAT, off for Prod).

## Deployment (Phase 1)

1. **Database (Supabase, one project per env)**
   - Create the project, copy the connection string from Settings → Database.
   - In SQL Editor, paste `DB/phase1_init.sql` (comment out the `CREATE DATABASE` and `\c` lines — Supabase uses the default `postgres` DB).
   - Then paste `DB/phase1_procedures.sql`.
2. **Backend (Railway, one service per env)**
   - Deploy from this GitHub repo, root directory `Backend/API`.
   - Set the env vars listed above. Make sure `ASPNETCORE_ENVIRONMENT` matches the target.
   - Generate a public domain (Settings → Networking).
3. **Frontend (Vercel)** — set `VITE_API_URL` to the Railway URL for each env, redeploy.
