# Backend Server

Dedykowany serwer backend dla aplikacji Integral, oparty na Fastify i tRPC.

## Uruchamianie

```bash
# Development
pnpm dev

# Testy
pnpm test

# Testy z pokryciem
pnpm test:coverage
```

## Konfiguracja

Serwer wymaga następujących zmiennych środowiskowych:

```env
# Port serwera (domyślnie: 2022)
PORT=2022

# Supabase
SUPABASE_URL="http://localhost:8000"
SUPABASE_KEY="your-anon-key"
```

## Autoryzacja

Serwer backend obsługuje autoryzację poprzez tokeny JWT z Supabase.

### HTTP Requests

Dla żądań HTTP, token jest przekazywany w nagłówku `Authorization`:

```typescript
headers: {
  Authorization: `Bearer ${accessToken}`
}
```

### WebSocket Connections

Dla połączeń WebSocket, token jest przekazywany w `connectionParams`:

```typescript
createWSClient({
  url: 'ws://localhost:2022/trpc',
  connectionParams: {
    authToken: accessToken
  }
});
```

### Ścieżka autoryzacji

1. **Klient** (aplikacja natywna/webowa):
   - Pobiera `access_token` z sesji Supabase
   - Przekazuje token w `connectionParams` (WebSocket) lub `Authorization` header (HTTP)

2. **tRPC Context** (`packages/trpc/src/api/trpc.ts`):
   - Ekstraktuje token z nagłówków lub `connectionParams`
   - Tworzy klienta Supabase
   - Przekazuje token do kontekstu

3. **Auth Middleware** (`packages/auth/src/authServer.ts`):
   - `protectedProcedure` wywołuje `requireAuth(supabase, accessToken)`
   - `requireAuth` weryfikuje token przez `supabase.auth.getUser(accessToken)`
   - Jeśli token jest nieprawidłowy/brakuje → `AuthenticationError`
   - Jeśli token jest prawidłowy → procedura kontynuuje z danymi użytkownika

### Brak tokena

Gdy klient łączy się **bez** tokena:
- HTTP/WebSocket działa normalnie dla `publicProcedure`
- `protectedProcedure` rzuca `AuthenticationError("Unauthorized")`
- Nie ma błędów `AuthSessionMissingError` w logach (naprawione w `authServer.ts`)

### Dynamiczna aktualizacja tokena

W aplikacji natywnej token jest automatycznie aktualizowany przy zmianach sesji:

```typescript
// apps/native/src/app/_layout.tsx
supabaseClient.auth.onAuthStateChange((_event, session) => {
  const newToken = session?.access_token;
  setAuthToken(newToken);
});
```

Zmiana tokena powoduje rekonstrukcję klienta tRPC z nowym tokenem w `connectionParams`.

## Architektura

```
┌─────────────────┐
│   Native App    │
│   (Expo/RN)     │
└────────┬────────┘
         │ authToken
         ↓
┌─────────────────┐     ┌──────────────┐
│   APIProvider   │────→│  WS Client   │
│  (tRPC Client)  │     │connectionParams
└────────┬────────┘     └──────┬───────┘
         │                     │
         │ HTTP: Bearer token  │ WS: authToken
         ↓                     ↓
┌─────────────────────────────────────┐
│      WebSocket Server (Fastify)     │
│         + tRPC + WebSocket          │
└──────────────┬──────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│    tRPC Context (createTRPCContext)  │
│  - extracts token from headers/params│
│  - creates Supabase client           │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│   protectedProcedure middleware      │
│   - requireAuth(supabase, token)     │
│   - verifies with Supabase Auth      │
└──────────────────────────────────────┘
```

## Endpointy

- `/health` - Health check endpoint
- `/trpc` - tRPC endpoint (HTTP + WebSocket)

## Testowanie

Testy znajdują się w `src/__tests__/`:

```typescript
import { createServer } from "../server";

const server = createServer({
  dev: true,
  port: 3001,
  prefix: "/trpc",
});

await server.start();
// ... testy
await server.stop();
```

## Monorepo Structure

Serwer korzysta z pakietów wspólnych:

- `@integral-2025-app/trpc` - Router tRPC i procedury
- `@integral-2025-app/auth` - Logika autoryzacji
- `@integral-2025-app/supabase` - Klient Supabase
- `@integral-2025-app/db` - Prisma client

## Troubleshooting

### AuthSessionMissingError

Jeśli widzisz `AuthSessionMissingError: Auth session missing!` w logach:

- **Przyczyna**: Serwer próbował wywołać `supabase.auth.getUser()` bez tokena
- **Rozwiązanie**: Poprawka została zastosowana w `packages/auth/src/authServer.ts` - funkcja `getAuthServerUser` teraz zwraca `null` gdy brak tokena, zamiast wywoływać Supabase Auth

### WebSocket nie łączy się

1. Sprawdź, czy serwer działa: `curl http://localhost:2022/health`
2. Sprawdź URL WebSocket w aplikacji (powinien zaczynać się od `ws://` lub `wss://`)
3. Sprawdź logi serwera pod kątem błędów

### Token nie jest przekazywany

1. Sprawdź, czy sesja Supabase jest aktywna: `supabase.auth.getSession()`
2. Sprawdź, czy `authToken` jest przekazywany do `APIProvider`
3. Sprawdź logi serwera - czy token jest widoczny w kontekście
