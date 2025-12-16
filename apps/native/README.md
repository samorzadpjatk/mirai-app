# Aplikacja mobilna Expo React Native

Natywna aplikacja mobilna Samorządu Studenckiego PJATK zbudowana z użyciem Expo i React Native.

## Technologie

- **Expo SDK 54** z nową architekturą
- **React 19** & **React Native 0.81**
- **Expo Router 6** - routing oparty na systemie plików
- **Supabase** - backend i autentykacja
- **TypeScript** - statyczne typowanie
- **Jest** & **React Native Testing Library** - testy

## Wymagania

- Node.js 18+
- pnpm 8+
- iOS Simulator (macOS) lub Android Studio (dla emulatora Android)
- Expo Go na urządzeniu fizycznym (opcjonalnie)

## Instalacja

Z katalogu głównego projektu:

```bash
pnpm install
```

## Dostępne komendy

| Komenda | Opis |
|---------|------|
| `pnpm --filter @integral-2025-app/native dev` | Uruchamia serwer deweloperski Expo |
| `pnpm --filter @integral-2025-app/native android` | Uruchamia aplikację na emulatorze/urządzeniu Android |
| `pnpm --filter @integral-2025-app/native ios` | Uruchamia aplikację na symulatorze/urządzeniu iOS |
| `pnpm --filter @integral-2025-app/native web` | Uruchamia aplikację w przeglądarce |
| `pnpm --filter @integral-2025-app/native build` | Buduje aplikację do produkcji |
| `pnpm --filter @integral-2025-app/native lint` | Sprawdza kod pod kątem błędów ESLint |
| `pnpm --filter @integral-2025-app/native lint:fix` | Naprawia automatycznie błędy ESLint |
| `pnpm --filter @integral-2025-app/native typecheck` | Sprawdza typy TypeScript |
| `pnpm --filter @integral-2025-app/native test` | Uruchamia testy z pokryciem |
| `pnpm --filter @integral-2025-app/native format:check` | Sprawdza formatowanie kodu |
| `pnpm --filter @integral-2025-app/native format:write` | Formatuje kod |

## Struktura projektu

```
apps/native/
├── src/
│   ├── app/          # Routing Expo Router
│   ├── components/   # Komponenty React
│   └── hooks/        # Custom React hooks
├── assets/           # Obrazy, ikony, czcionki
├── app.json          # Konfiguracja Expo
└── package.json
```

## Uruchomienie z monorepo

Z katalogu głównego projektu:

```bash
# Uruchom serwer deweloperski
pnpm --filter @integral-2025-app/native dev

# Uruchom na platformie
pnpm --filter @integral-2025-app/native android
pnpm --filter @integral-2025-app/native ios
```

## Rozwój

1. Uruchom serwer deweloperski: `pnpm dev`
2. Zeskanuj kod QR w aplikacji Expo Go lub wybierz platformę (a/i/w)
3. Kod przeładowuje się automatycznie po zapisaniu zmian

## Routing

Aplikacja używa [Expo Router](https://docs.expo.dev/router/introduction/) - routing oparty na systemie plików. Pliki w `src/app/` automatycznie stają się ekranami.

## Testowanie

```bash
# Uruchom wszystkie testy
pnpm --filter @integral-2025-app/native test

# Testy bez pokrycia (dla CI)
pnpm --filter @integral-2025-app/native test:ci
```

## Więcej informacji

- [Dokumentacja Expo](https://docs.expo.dev/)
- [Dokumentacja React Native](https://reactnative.dev/)
- [Dokumentacja Expo Router](https://docs.expo.dev/router/introduction/)
- [Główne README projektu](../../README.md)
