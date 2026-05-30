# Task Manager Runbook

The task manager app lives in:

```powershell
.\task-manager
```

## Prerequisites

- Node.js is installed.
- Use `npm` from your console. If PowerShell blocks `npm`, use `npm.cmd` as a fallback.

## Install Dependencies

```powershell
cd .\task-manager
npm install
```

## Set Up The Local Database

The app uses SQLite at `task-manager\prisma\dev.db`.

```powershell
cd .\task-manager
npm run db:setup
```

This command is safe to run multiple times. It creates the local SQLite database and required tables if they do not already exist.

## Start Development Server

```powershell
cd .\task-manager
npm run dev
```

Open:

```text
http://127.0.0.1:3000
```

The `dev` script runs database setup first, then starts Next.js.

## Build For Production

```powershell
cd .\task-manager
npm run build
```

The `build` script also runs database setup first.

## Start Production Server

Build first, then start:

```powershell
cd .\task-manager
npm run build
npm run start
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
npm run lint
```

Regenerate the Prisma client after changing `prisma\schema.prisma`:

```powershell
cd .\task-manager
npm run prisma:generate
```

## Docker

The app can also run in Docker. The Docker setup is separate from the native Node.js workflow above.

Docker files:

```text
task-manager\Dockerfile
task-manager\docker-compose.yml
task-manager\.dockerignore
```

### Docker Prerequisites

- Docker Desktop is installed and running.
- Port `3000` is free on your machine.

If Docker says it cannot connect to `npipe:////./pipe/docker_engine`, start Docker Desktop and retry the command.

### Build The Docker Image

```powershell
cd .\task-manager
docker build -t task-manager:local .
```

### Run With Docker

```powershell
cd .\task-manager
docker run --name task-manager --rm -p 3000:3000 -v task-manager-data:/app/data task-manager:local
```

Open:

```text
http://127.0.0.1:3000
```

The Docker container stores SQLite data in the named Docker volume `task-manager-data`.

### Stop A Docker Run

If the container is running in the current terminal, press:

```text
Ctrl+C
```

If it is running in the background or from another terminal:

```powershell
docker stop task-manager
```

### Run With Docker Compose

```powershell
cd .\task-manager
docker compose up --build
```

Run in the background:

```powershell
cd .\task-manager
docker compose up --build -d
```

Stop Docker Compose:

```powershell
cd .\task-manager
docker compose down
```

Stop Docker Compose and delete the SQLite data volume:

```powershell
cd .\task-manager
docker compose down -v
```

## Notes

- Local database files are ignored by Git.
- Environment variables are in `task-manager\.env`.
- The database setup script is `task-manager\scripts\ensure-db.mjs`.
- Docker uses `DATABASE_URL=file:/app/data/dev.db` and stores that database in the `task-manager-data` Docker volume.
