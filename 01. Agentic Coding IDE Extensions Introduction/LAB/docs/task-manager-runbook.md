# Task Manager Runbook

The task manager app lives in:

```powershell
.\task-manager
```

## Prerequisites

- Node.js is installed.
- Use `npm.cmd` in PowerShell if `npm` is blocked by the Windows script execution policy.

## Install Dependencies

```powershell
cd .\task-manager
npm.cmd install
```

## Set Up The Local Database

The app uses SQLite at `task-manager\prisma\dev.db`.

```powershell
cd .\task-manager
npm.cmd run db:setup
```

This command is safe to run multiple times. It creates the local SQLite database and required tables if they do not already exist.

## Start Development Server

```powershell
cd .\task-manager
npm.cmd run dev
```

Open:

```text
http://127.0.0.1:3000
```

The `dev` script runs database setup first, then starts Next.js.

## Build For Production

```powershell
cd .\task-manager
npm.cmd run build
```

The `build` script also runs database setup first.

## Start Production Server

Build first, then start:

```powershell
cd .\task-manager
npm.cmd run build
npm.cmd run start
```

By default, Next.js serves the production app at:

```text
http://localhost:3000
```

## Stop The Server

If the server is running in the current terminal, press:

```text
Ctrl+C
```

If the server was started as a detached background process, like Codex did during setup, it is running outside the visible terminal. First find the process listening on port `3000`:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object LocalAddress, LocalPort, OwningProcess
```

Then stop it:

```powershell
$processIds = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($processId in $processIds) { Stop-Process -Id $processId }
```

To confirm it stopped:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
```

If that command prints nothing, nothing is listening on port `3000`.

## Useful Checks

Run lint:

```powershell
cd .\task-manager
npm.cmd run lint
```

Regenerate the Prisma client after changing `prisma\schema.prisma`:

```powershell
cd .\task-manager
npm.cmd run prisma:generate
```

## Notes

- Local database files are ignored by Git.
- Environment variables are in `task-manager\.env`.
- The database setup script is `task-manager\scripts\ensure-db.mjs`.
