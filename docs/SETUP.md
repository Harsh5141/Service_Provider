# FixMate – Complete Setup Guide

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| .NET SDK | 8.0+ | https://dotnet.microsoft.com/download |
| Node.js | 20 LTS | https://nodejs.org |
| SQL Server | 2019/2022 Express or Developer | https://www.microsoft.com/en-us/sql-server/sql-server-downloads |
| SSMS | 19+ | https://aka.ms/ssmsfullsetup |
| Git | any | https://git-scm.com |
| Docker Desktop (optional) | 4.x | https://www.docker.com/products/docker-desktop |

---

## 1 — SQL Server Setup (SSMS)

### 1.1 Install SQL Server Express (local dev)

1. Download **SQL Server 2022 Developer Edition** (free for dev/test).
2. Run the installer, choose **Custom** installation.
3. Under **Feature Selection**, enable: Database Engine Services.
4. Under **Instance Configuration**:
   - Named instance: `SQLEXPRESS` (this matches the connection string `localhost\SQLEXPRESS`)
   - Or default instance: use `localhost` in the connection string.
5. Under **Authentication Mode**:
   - **Recommended for dev**: Mixed Mode (SQL Server + Windows Auth)
   - Set `sa` password to something secure and note it.
6. Enable TCP/IP:
   - Open **SQL Server Configuration Manager**
   - `SQL Server Network Configuration → Protocols for SQLEXPRESS → TCP/IP` → Enabled
   - Restart the SQL Server service.

### 1.2 Connect in SSMS

```
Server type:    Database Engine
Server name:    localhost\SQLEXPRESS   (or just localhost for default instance)
Authentication: Windows Authentication  ← easiest for local dev
                SQL Server Auth         ← use if connecting from Docker
```

### 1.3 Connection Strings

**Windows Authentication (recommended for local development)**
```
Server=localhost\SQLEXPRESS;Database=FixMateDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true
```

**SQL Server Authentication (Docker / remote)**
```
Server=localhost\SQLEXPRESS;Database=FixMateDb;User Id=sa;Password=YOUR_SA_PASSWORD;TrustServerCertificate=True;MultipleActiveResultSets=true
```

> ⚠️ Never commit real passwords. Use `dotnet user-secrets` for local dev:
> ```bash
> cd backend/FixMate.API
> dotnet user-secrets init
> dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=...;Password=REAL_PW;..."
> ```

---

## 2 — Backend Setup (.NET 8 API)

```bash
# 1. Restore packages (run from backend/)
cd FixMate/backend
dotnet restore FixMate.sln

# 2. Install EF Core tools (once per machine)
dotnet tool install --global dotnet-ef

# 3. Add first migration (run from solution root or FixMate.API)
dotnet ef migrations add InitialCreate \
  --project FixMate.Infrastructure \
  --startup-project FixMate.API \
  --output-dir Persistence/Migrations

# 4. Apply migration → creates FixMateDb in SQL Server
dotnet ef database update \
  --project FixMate.Infrastructure \
  --startup-project FixMate.API

# 5. Run the API
cd FixMate.API
dotnet run
# Swagger UI: https://localhost:7001 (or http://localhost:5001)
```

### Verify in SSMS
After `database update`, refresh **Databases** in SSMS — you should see **FixMateDb** with all tables.

---

## 3 — Frontend Setup (React + Vite)

```bash
cd FixMate/frontend/fixmate-web
npm install
npm run dev
# App: http://localhost:5173
```

The Vite dev server proxies `/api/*` → `https://localhost:7001` automatically (configured in `vite.config.ts`).

---

## 4 — User Secrets (Development Secrets)

```bash
cd FixMate/backend/FixMate.API

# JWT key (must be ≥ 32 chars)
dotnet user-secrets set "Jwt:Key" "super-secret-dev-key-change-in-prod!!"

# Cloudinary
dotnet user-secrets set "Cloudinary:ApiSecret" "your_cloudinary_secret"

# Razorpay
dotnet user-secrets set "Razorpay:KeySecret"     "your_razorpay_secret"
dotnet user-secrets set "Razorpay:WebhookSecret" "your_webhook_secret"

# Email
dotnet user-secrets set "Email:Password" "your_smtp_password"
```

---

## 5 — Running with Docker Compose

```bash
cd FixMate/docker

# Build and start all services (SQL Server + API + React)
docker compose up --build

# API:    http://localhost:8080
# Web:    http://localhost:3000
# SSMS can still connect to Docker SQL Server:
#   Server: localhost,1433 | User: sa | Password: FixMate_Dev_2024!
```

---

## 6 — Running Tests

```bash
# Unit tests
cd FixMate/backend
dotnet test FixMate.Tests.Unit

# Integration tests (requires Docker for Testcontainers or a real SQL Server)
dotnet test FixMate.Tests.Integration

# Frontend tests
cd FixMate/frontend/fixmate-web
npm run test
```

---

## 7 — EF Core Migration Cheat Sheet

```bash
# Add a migration
dotnet ef migrations add <MigrationName> --project FixMate.Infrastructure --startup-project FixMate.API

# Apply to database
dotnet ef database update --project FixMate.Infrastructure --startup-project FixMate.API

# Roll back one migration
dotnet ef database update <PreviousMigrationName> --project FixMate.Infrastructure --startup-project FixMate.API

# Remove last unapplied migration
dotnet ef migrations remove --project FixMate.Infrastructure --startup-project FixMate.API

# Generate SQL script instead of applying
dotnet ef migrations script --project FixMate.Infrastructure --startup-project FixMate.API -o migration.sql
```

---

## 8 — SSMS Useful Operations

```sql
-- Check all tables were created
USE FixMateDb;
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME;

-- Check indexes
SELECT OBJECT_NAME(i.object_id) AS TableName, i.name AS IndexName, i.type_desc
FROM sys.indexes i
WHERE OBJECT_NAME(i.object_id) IN (SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE')
ORDER BY TableName;

-- View migration history
SELECT * FROM [__EFMigrationsHistory];
```
