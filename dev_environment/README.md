# Środowisko deweloperskie PJApp

## Jak uruchomić?

Wykonaj następujące komendy w tym folderze:

1. Ta komenda przygotowuje zmienne środowiskowe:

```bash
cp .env.example .env
```

2. Ta komenda uruchamia bazę danych PostgreSQL z Supabase:

```bash
docker compose up -d
```

3. Ta komenda seeduje supabase-auth z defaultowymi userami dla dev purposes

```bash
./seed-supabase-auth.sh
```

4. Te komendy tworzą schemat i wypełniają bazę danych danymi początkowymi:

```bash
pnpm --filter @integral-2025-app/db run db:generate
pnpm --filter @integral-2025-app/db run db:seed
```

> 📖 **Dokumentacja komend bazodanowych**: Zobacz [packages/db/README.md](../packages/db/README.md)

## Jak zresetować?

```bash
bash ./reset.sh
```

## Przydatne komendy

- `pnpm --filter @integral-2025-app/db run db:push` - Wypchnij zmiany schematu do bazy danych
- `pnpm --filter @integral-2025-app/db run db:studio` - Otwórz Prisma Studio
- `pnpm --filter @integral-2025-app/db run db:generate` - Wygeneruj i uruchom migracje
- `pnpm build:packages` - Zbuduj shared packages

> 📖 **Pełna lista komend**: Zobacz [packages/db/README.md](../packages/db/README.md)

## Hasło do fikcyjnych kont

`MockUser123`

## Hasło do konta administracyjnego `akadmin` w Authentik

zmienna środowiskowa `AUTHENTIK_BOOTSTRAP_PASSWORD` w pliku `.env.example`

## Problemy z Windows
W przypadku problemów, upewnij się, że masz skonfigurowane LF End of Line sequences, (follow this gist to fix)[https://gist.github.com/tjsudarsan/f2bfe4c4d567243e302cf8ba40e1c7e5].