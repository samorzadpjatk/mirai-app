[![English](https://img.shields.io/badge/English-Click-yellow)](CONTRIBUTING.md)
[![Polski](https://img.shields.io/badge/Polski-Click-yellow)](CONTRIBUTING_PL.md)

# Zasady współpracy wewnętrz repo

## Standardy nazewnictwa

Trzymamy się następujących standardów:
- [Conventional Branch](https://conventional-branch.github.io/pl/)
- [Conventional Commits](https://www.conventionalcommits.org/pl/v1.0.0/)

## Wymagania dotyczące testów

Wszystkie kontrybucje muszą zawierać odpowiednie testy. Monorepo MIRAI używa **84+ testów** w wielu pakietach z raportowaniem pokrycia.

### Przegląd runnerów testów

| Projekt | Runner | Pakiety |
|---------|--------|---------|
| `apps/native` | **Jest** (preset jest-expo) | Aplikacja React Native |
| Wszystkie pozostałe aplikacje i pakiety | **Vitest** | shared, auth, orpc, backend-server, notification-sender, seed |

Szczegółowe komendy testów, konfiguracja i przykłady znajdziesz w [TESTING.md](TESTING.md).

### Przed wysłaniem PR-a

Uruchom testy dla pakietów, które zmodyfikowałeś:

```bash
# Uruchom wszystkie testy (z poziomu root repozytorium)
bun run test

# Uruchom testy dla konkretnego pakietu
cd packages/common && bun run test
cd apps/backend-server && bun run test

# Uruchom testy w trybie watch podczas developmentu
bun run test:watch
```

**Kiedy uruchomić pełny zestaw testów:**
- Zmiany w `packages/common` (współdzielone narzędzia wpływają na wszystkie pakiety)
- Zmiany w `packages/auth` (autentykacja wpływa na wiele aplikacji)
- Zmiany w `packages/orpc` (routery oRPC wpływają na backend i aplikację natywną)
- Każdy refactoring, który może mieć wpływ między pakietami

### Testowanie CI/CD

Wszystkie PR-y muszą przejść zadanie testowe CI przed scaleniem. CI uruchamia:

```bash
bun run test:ci
```

Lokalna walidacja powinna jak najbardziej odpowiadać CI. Niepowodzenia testów w CI blokują scalanie PR-a.

### Wymagania dotyczące pokrycia

- Raporty pokrycia generowane są dla każdego uruchomienia testów
- Nie obniżaj pokrycia w obszarach, które modyfikujesz
- Nowe funkcjonalności powinny zawierać testy utrzymujące lub poprawiające pokrycie

## Jak wnieść swoją cegiełkę w projekt?

1. Utwórz brancha dla swojego PR-a
2. Na swoim branchu, wprowadzamy zmiany w kod źródłowy
3. Tworzymy PR-a w tytule ogólnie opisując zmiany, a w opisie pokazując, że kod źródłowy po zmianach działa prawidłowo

   **Lista kontrolna PR-a:**
   - [ ] Dodano lub zaktualizowano testy dla nowych funkcjonalności
   - [ ] Wszystkie testy przechodzą lokalnie (`bun run test`)
   - [ ] Pokrycie nie obniżyło się w zmienionych obszarach
   - [ ] Przetestowano odpowiednie pakiety (szczegóły w [TESTING.md](TESTING.md))
   - [ ] Zadanie testowe CI przechodzi pomyślnie

4. Prosisz osoby uprawnione o review
5. Wprowadzasz kod do głównego brancha za pomocą `squash and merge`: tytuł commit-a końcowego również musi trzymać się standardów!
