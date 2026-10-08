# FixMate – Project Structure Overview

## Quick Start
See `docs/SETUP.md` for full SQL Server, .NET, and React setup instructions.

## Monorepo Layout
```
FixMate/
├── backend/                          # .NET 8 Solution
│   ├── FixMate.sln
│   ├── FixMate.API/
│   ├── FixMate.Application/
│   ├── FixMate.Domain/
│   ├── FixMate.Infrastructure/
│   ├── FixMate.Tests.Unit/
│   └── FixMate.Tests.Integration/
├── frontend/                         # React 18 + Vite
│   └── fixmate-web/
├── database/                         # SQL scripts for SSMS
│   ├── FixMateDb_Schema.sql
│   └── FixMateDb_Seed.sql
├── docker/
│   └── docker-compose.yml
└── docs/
    ├── SETUP.md
    └── API.md
```
