[![English](https://img.shields.io/badge/English-Click-yellow)](README.md)
[![Polski](https://img.shields.io/badge/Polski-Click-yellow)](README_PL.md)<br>
[![AGPLv3](https://img.shields.io/badge/License-AGPLv3-blue)](LICENSE)
<img width="1440" height="565" alt="mirai_app_banner" src="https://github.com/user-attachments/assets/88e9e651-ec6d-458f-b650-4a351b1bb534" />

<div align="center">
<h1>MIRAI</h1>
<b>Aplikacja mobilna Samorządu Studenckiego PJATK</b>
<p>inaczej: Projekt <code>PJApp</code></p>
<p>Obecnie aplikacja wyjazdowa przygotowana dla wyjazdów integracyjnych<br>Docelowo stanie się ogólną aplikacją Samorządu dla wszystkich studentów</p>
</div>

<br>

## Chcesz dołączyć?

Spójrz na [zasady współpracy wewnątrz repo](CONTRIBUTING.md)!

> [!IMPORTANT]
> **Call for Mainteiners**
>
> Szukamy osób, którzy przejmą opiekę nad projektem.
> Jeśli jesteś zainteresowany, prosimy o kontakt z Samorządem Studenckim PJATK.

## Struktura projektu

Obecnie repozytorium pełni funkcję monorepo zaimplementowanego z użyciem **Turborepo** dla orchiestracji budowy kodu oraz **Bun workspaces** (Bun jako menedżer pakietów) dla zarządzania pakietami.

Sprawdź szczegóły ich konfiguracji wewnątrz plików [`turbo.json`](turbo.json) oraz [`bun.lock`](bun.lock)

Znajduje się w nim:

- **Aplikacja natywna** (Expo / React Native) → [`@mirai-app/native`](apps/native/)
- **Backend serwerowy** (Hono + GraphQL) → [`@mirai-app/backend-server`](apps/backend-server/)
- **Nadawca powiadomień** (Expo Push Notifications) → [`@mirai-app/notification-sender`](apps/notification-sender/)
- **Seed CLI** (Baza danych & Storage seeding) → [`@mirai-app/seed`](apps/seed/)
- **Współdzielone biblioteki** → [`packages`](packages/)
  - [`@mirai-app/domain`](packages/domain/) - **Warstwa domenowa** - Encje, obiekty wartości, reguły biznesowe
  - [`@mirai-app/use-cases`](packages/use-cases/) - **Warstwa przypadków użycia** - Orkiestracja i workflow
  - [`@mirai-app/adapters`](packages/adapters/) - **Warstwa adapterów** - Kontrolery i bramy (gateways)
  - [`@mirai-app/frameworks`](packages/frameworks/) - **Warstwa frameworków** - DI, GraphQL, Drizzle config
  - [`@mirai-app/auth`](packages/auth/) - Logika autoryzacji
  - [`@mirai-app/db`](packages/db/) - Klient Prisma bazy danych
  - [`@mirai-app/supabase`](packages/supabase/) - Konfiguracja klienta Supabase

Wszystkie skrypty mogą zostać wywołane z katalogu głównego projektu za pomocą `bun run <script>`. (Możesz też wejść do konkretnego pakietu i uruchomić `bun run <script>`).

Aby uruchomić skrypt przypisany danemu komponentowi używamy `bun run` (lub `cd <pakiet> && bun run <script>`):

```bash
cd apps/native && bun run dev
```

## Wymagania techniczne

Upewnij się, że masz zainstalowane:

- **Node.js** (version 18 lub wyższa)
- **Bun** (https://bun.sh)
- **Docker** (dla środowiska deweloperskiego, w tym Supabase)

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
cd packages/seed && bun run db:generate

# Push the schema to the database
cd packages/seed && bun run db:push

# Optional: Open Prisma Studio to view the database
cd packages/seed && bun run db:studio
```

> 📖 **Więcej informacji o komendach bazodanowych**: Zobacz [packages/seed/README.md](packages/seed/README.md)

### 5. Uruchom wybraną aplikację

Przed uruchomieniem:

- spójrz na dokumentację [aplikacji natywnej](apps/native/README.md) oraz [backendu](apps/backend-server/README.md)

#### `bun run dev`

Uruchamia wszystkie aplikacje w trybie developerskim jednocześnie:

- Backend server on `http://localhost:2022`
- Native app (Expo dev server)
- Notification sender service

#### `bun run dev:backend`

Uruchamia tylko serwer backendowy (Hono + GraphQL) w trybie deweloperskim (domyślnie port 2022).

#### `bun run dev:native`

Uruchamia tylko aplikację natywną (Expo dev server).

#### `bun run dev:notification-sender`

Uruchamia tylko usługę nadawcy powiadomień dla powiadomień push.
