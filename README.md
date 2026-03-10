# Projekt `PJApp`

Aplikacja mobilna Samorządu Studenckiego PJATK

Obecnie aplikacja wyjazdowa przygotowana dla INTEGRAL 2025, rozbudowywana dla WINTEGRAL 2026, aby docelowo stać się ogólną aplikacją Samorządu dla wszystkich studentów

## Chcesz dołączyć?

Spójrz na [zasady współpracy wewnątrz repo](CONTRIBUTING.md)!

## Struktura projektu

Obecnie repozytorium pełni funkcję monorepo zaimplementowanego z użyciem **Turborepo** dla orchiestracji budowy kodu oraz **Bun workspaces** (Bun jako menedżer pakietów) dla zarządzania pakietami.

Sprawdź szczegóły ich konfiguracji wewnątrz plików [`turbo.json`](turbo.json) oraz [`bun.lock`](bun.lock)

Znajduje się w nim:

- **Aplikacja natywna** (Expo / React Native) → [`@mirai-app/native`](apps/native/)
- **Backend serwerowy** (Fastify + tRPC) → [`@mirai-app/backend-server`](apps/backend-server/)
- **Współdzielone biblioteki** → [`packages`](packages/)

Wszystkie skrypty mogą zostać wywołane z katalogu głównego projektu za pomocą `bun run <script>`. (Możesz też wejść do konkretnego pakietu i uruchomić `bun run <script>`).

Aby uruchomić skrypt przypisany danemu komponentowi używamy `bun run` (lub `cd <pakiet> && bun run <script>`):
```bash
cd apps/native && bun run dev
```

## Wymagania techniczne

Upewnij się, że masz zainstalowane:

- **Node.js** (version 18 lub wyższa)
- **Bun** (https://bun.sh)
- **Docker** (dla Supabase)

## Jak zacząć?

### 1. Sklonuj repozytorium

```bash
git clone <repository-url>
cd integral-app
```

### 2. Zainstaluj zależności

```bash
bun install
```

### 3. Uruchomienie środowiska deweloperskiego

Spójrz na jego [dokumentację](environment/dev/README.md)

### 4. Przygotowuj schemat bazy danych

```bash
# Generate Prisma client
cd packages/db && bun run postinstall

# Push the schema to the database
cd packages/db && bun run db:push

# Optional: Open Prisma Studio to view the database
cd packages/db && bun run db:studio
```

> 📖 **Więcej informacji o komendach bazodanowych**: Zobacz [packages/db/README.md](packages/db/README.md)

### 5. Uruchom wybraną aplikację

Przed uruchomieniem: 
- spójrz na dokumentację [aplikacji natywnej](apps/native/README.md) oraz [backendu](apps/backend-server/README.md)
- wywołaj testy za pomocą `bun run test`
- sprawdź, czy monorepo buduje aplikację za pomocą `bun run build`

#### `bun run dev`

Uruchamia wszystkie aplikacje w trybie developerskim jednocześnie:

- Backend server on `http://localhost:2022`
- Native app (Expo dev server)

#### `bun run dev:web`

Uruchamia tylko serwer backendowy (Fastify + tRPC) w trybie deweloperskim (domyślnie port 2022).

#### `bun run dev:native`

Uruchamia tylko aplikację natywną (Expo dev server).