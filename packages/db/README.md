# @integral-2025-app/db

Wspólny pakiet zarządzający schematem bazy danych i migracjami Prisma dla całego monorepo.

## Struktura

```
packages/db/
├── prisma/
│   ├── schema.prisma    # Schemat bazy danych
│   ├── seed.ts          # Skrypt wypełniający bazę danymi początkowymi
│   └── migrations/      # Historia migracji
└── src/
    ├── index.ts         # Eksportowany klient Prisma
    └── env.ts           # Konfiguracja zmiennych środowiskowych
```

## Dostępne komendy

Wszystkie komendy można uruchomić z katalogu głównego projektu używając:

```bash
pnpm --filter @integral-2025-app/db <komenda>
```

### Podstawowe komendy

#### `db:generate`

Generuje klienta Prisma na podstawie schematu. Uruchamiane automatycznie po `pnpm install`.

```bash
pnpm --filter @integral-2025-app/db db:generate
```

#### `db:push`

Wypycha zmiany schematu bezpośrednio do bazy danych bez tworzenia migracji. **Przydatne w środowisku deweloperskim**.

```bash
pnpm --filter @integral-2025-app/db db:push
```

#### `db:studio`

Otwiera Prisma Studio - graficzny interfejs do przeglądania i edycji danych w bazie.

```bash
pnpm --filter @integral-2025-app/db db:studio
```

#### `db:seed`

Wypełnia bazę danych przykładowymi danymi z pliku `prisma/seed.ts`.

```bash
pnpm --filter @integral-2025-app/db db:seed
```

### Komendy migracji (środowisko produkcyjne)

#### `db:migrate:dev`

Tworzy nową migrację na podstawie zmian w schemacie i aplikuje ją do bazy deweloperskiej.

```bash
pnpm --filter @integral-2025-app/db db:migrate:dev
```

Po wywołaniu zostaniesz poproszony o nazwę migracji.

#### `db:migrate`

Aplikuje zaległe migracje do bazy danych. **Używane w środowisku produkcyjnym**.

```bash
pnpm --filter @integral-2025-app/db db:migrate
```

#### `db:reset`

Resetuje bazę danych: usuwa wszystkie dane, ponownie aplikuje wszystkie migracje i uruchamia seed.

**⚠️ UWAGA: Usuwa wszystkie dane z bazy! Używaj tylko w środowisku deweloperskim!**

```bash
pnpm --filter @integral-2025-app/db db:reset
```

## Workflow deweloperski

### 1. Inicjalizacja projektu

Po sklonowaniu repozytorium:

```bash
# Zainstaluj zależności (automatycznie uruchomi db:generate)
pnpm install

# Wypełnij bazę danymi początkowymi
pnpm --filter @integral-2025-app/db db:seed
```

### 2. Modyfikacja schematu

Po zmianie pliku `prisma/schema.prisma`:

```bash
# W środowisku deweloperskim - szybkie prototypowanie
pnpm --filter @integral-2025-app/db db:push

# LUB z migracjami - dla zmian, które mają trafić do produkcji
pnpm --filter @integral-2025-app/db db:migrate:dev
```

### 3. Przeglądanie danych

```bash
pnpm --filter @integral-2025-app/db db:studio
```

Otwiera się w przeglądarce pod adresem `http://localhost:5555`

## Konfiguracja

Pakiet wymaga zmiennej środowiskowej `DATABASE_URL` zdefiniowanej w pliku `.env` w katalogu głównym projektu:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
```

## PG Crons

pg_crons must be managed manually from supabase dashboard (superuser permissions needed). To add NotificationSchedule processing cron go to supabase dashboard (http://localhost:8000) -> SQL Editor -> run [creating sql script](./sql/cron_process-notification-schedules.sql)

## Używanie w aplikacjach

```typescript
import { prisma } from "@integral-2025-app/db";

// Przykład użycia
const users = await prisma.user.findMany();
```

## Więcej informacji

- [Dokumentacja Prisma](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
