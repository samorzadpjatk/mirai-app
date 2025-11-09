# PJApp Dev Environment

This is a minimal Docker Compose setup for self-hosting Supabase. 

## How to start?

Run the following commands inside this folder:
1. This command prepares environmental variables:
```bash
cp .env.example .env
```
2. This command launches PostgreSQL DB with Supabase:
```bash
docker compose up -d
```
3. Those commands creates the schema and seeds the DB
```bash
pnpm --filter @integral-2025-app/web run db:generate
pnpm --filter @integral-2025-app/web run db:seed
```
4. This command starts the server
```bash
pnpm --filter @integral-2025-app/web run dev
```

## How to reset?
```bash
bash ./reset.sh
```
