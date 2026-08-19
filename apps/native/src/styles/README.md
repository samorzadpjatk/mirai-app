# Global Styles Guide

System globalnych stylów dla aplikacji PJapp. Używaj tych stylów zamiast hardcodowania wartości w każdym komponencie.

## Użycie

```tsx
import { colors, spacing, typography, shadows, commonStyles } from "../styles";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundDark,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.xxxl,
    fontWeight: typography.bold,
    color: colors.white,
  },
  card: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.md,
    ...shadows.medium,
  },
});
```

## Dostępne moduły

### 1. Colors (`colors.ts`)
```tsx
import { colors } from "../styles";

// Primary colors
colors.primary              // #00ced1
colors.accentMagenta        // #E533FF

// Background
colors.backgroundDark       // #17181c
colors.cardDark            // #1b2828

// Text
colors.textPrimary         // #ffffff
colors.textSecondary       // #9ca3af
colors.textTertiary        // #64748b

// Transparent variants
colors.primaryOpacity10    // rgba(0, 206, 209, 0.1)
colors.primaryOpacity20    // rgba(0, 206, 209, 0.2)
```

### 2. Spacing & Border Radius (`spacing.ts`)
```tsx
import { spacing, borderRadius } from "../styles";

// Spacing
spacing.xs    // 4
spacing.sm    // 8
spacing.md    // 12
spacing.lg    // 16
spacing.xl    // 20
spacing.xxl   // 24

// Border Radius
borderRadius.sm    // 8
borderRadius.md    // 12
borderRadius.lg    // 16
borderRadius.full  // 9999
```

### 3. Typography (`typography.ts`)
```tsx
import { typography } from "../styles";

// Font sizes
typography.xs     // 10
typography.sm     // 12
typography.base   // 14
typography.lg     // 16
typography.xxxl   // 24
typography.huge   // 36

// Font weights
typography.bold      // "700"
typography.semibold  // "600"
typography.medium    // "500"
```

### 4. Shadows (`shadows.ts`)
```tsx
import { shadows } from "../styles";

// Używaj spread operator
const styles = StyleSheet.create({
  card: {
    ...shadows.medium,
  },
  button: {
    ...shadows.primaryGlow,
  },
});

// Dostępne shadows:
shadows.small
shadows.medium
shadows.large
shadows.xl
shadows.primaryGlow
shadows.primaryGlowStrong
```

### 5. Common Styles (`commonStyles.ts`)
Gotowe style do użycia bez tworzenia własnych StyleSheet:

```tsx
import { commonStyles } from "../styles";

<View style={commonStyles.container}>
  <Text style={commonStyles.h1}>Title</Text>
  <Text style={commonStyles.textSecondary}>Subtitle</Text>

  <View style={[commonStyles.card, commonStyles.p16]}>
    <Text style={commonStyles.label}>Label</Text>
  </View>
</View>
```

## Przykłady

### Przykład 1: Karta z ikoną
```tsx
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardDark,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderWhite5,
    gap: spacing.sm,
    ...shadows.medium,
  },
  iconWrapper: {
    padding: spacing.sm,
    backgroundColor: colors.primaryOpacity10,
    borderRadius: borderRadius.sm,
    alignSelf: "flex-start",
  },
  title: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
  },
});
```

### Przykład 2: Przycisk
```tsx
const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    ...shadows.primaryGlowStrong,
  },
  buttonText: {
    color: colors.backgroundDark,
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
});
```

### Przykład 3: Używanie commonStyles
```tsx
<View style={[commonStyles.card, commonStyles.p16, commonStyles.gap12]}>
  <View style={commonStyles.iconWrapperPrimary}>
    <Icon size={20} color={colors.primary} />
  </View>
  <Text style={commonStyles.h4}>Title</Text>
  <Text style={commonStyles.textSecondary}>Description</Text>
</View>
```

## Best Practices

1. **Zawsze używaj theme variables** zamiast hardcodowanych wartości
   ```tsx
   // ❌ Źle
   backgroundColor: "#00ced1"

   // ✅ Dobrze
   backgroundColor: colors.primary
   ```

2. **Używaj spacing constants** dla padding/margin
   ```tsx
   // ❌ Źle
   padding: 16

   // ✅ Dobrze
   padding: spacing.lg
   ```

3. **Używaj shadows spread operator**
   ```tsx
   // ✅ Dobrze
   ...shadows.medium
   ```

4. **Łącz commonStyles z własnymi**
   ```tsx
   <View style={[commonStyles.card, styles.customCard]} />
   ```

## Style motywowane (themed styles)

Aplikacja wspiera per-tripowe motywy (np. `PIRATE`) nadpisujące część palety. Poniższe konwencje obowiązują dla każdego komponentu, którego style zależą od tokenów motywowalnych.

### 1. Kiedy używać motywu

`useThemedStyles`/`makeStyles(palette)` to DOMYŚLNY wzorzec dla każdego komponentu, którego style używają tokenów nadpisywanych przez motywy: `primary*`, `accentMagenta`/`magenta*`, `cardDark*`, `surfaceDark`, `borderDark`, `backgroundDarkAlt`, `feedCard*`, `feedAvatarBg`.

Bezpośredni import `colors` jest zarezerwowany dla:
- tokenów neutralnych/semantycznych (`danger`, `success`, `warning`),
- modułów niekomponentowych,
- miejsc poza React (np. konfiguracja nawigacji poza komponentem).

### 2. Wzorzec kanoniczny

```tsx
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

export function Foo() {
  const styles = useThemedStyles(makeStyles);
  const { palette, themeKey } = useTripTheme();
  // ...
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({ ... });
}
```

`makeStyles` MUSI być deklaracją funkcji (hoisted `function`), nie const-arrow — to konwencja pod Fast Refresh/TDZ. Provider (`TripThemeProvider`) jest zamontowany raz, na roocie aplikacji (`src/app/_layout.tsx`), keyed na globalnie wybranym tripie — każdy ekran czyta paletę przez `useTripTheme`/`useThemedStyles`.

### 3. Gwarancja no-op

Paleta `DEFAULT` jest referencyjnie tym samym obiektem co `colors` (`tripThemes.DEFAULT === colors`), więc migracja `colors.X` → `palette.X` niczego nie zmienia dla tripów bez motywu. Testy renderujące komponent bez `TripThemeProvider` dostają domyślny kontekst (paletę `DEFAULT`), więc nie wymagają dodatkowego mockowania.

### 4. Cienie/glow

Zamiast zapiekanych `shadows.primaryGlow`/`shadows.primaryGlowStrong` (które zawsze renderują teal, niezależnie od motywu) użyj `glow(palette.primary)`/`glowStrong(palette.primary)` z `~/styles`:

```tsx
import { glow, glowStrong } from "~/styles";

const styles = StyleSheet.create({
  card: {
    ...glow(palette.primary),
  },
  button: {
    ...glowStrong(palette.primary),
  },
});
```

### 5. WoodTexture

Dekoracyjna faktura drewna dla motywu `PIRATE`. Renderuj `<WoodTexture radius={<borderRadius karty>} />` jako PIERWSZE dziecko kontenera karty — komponent sam się gate'uje na `themeKey === "PIRATE"` i renderuje `null` na `DEFAULT`, więc nie trzeba go warunkować w miejscu użycia.

### 6. Czyste funkcje (nie-komponenty)

Funkcje pomocnicze poza komponentami (np. `getRewardButtonState`, `mapActionButtonsUtils`) przyjmują opcjonalny końcowy parametr `palette: ThemePalette = colors`, dzięki czemu wywołania bez przekazanej palety zachowują się jak wcześniej (paleta domyślna), a komponenty motywowane przekazują `palette` z `useTripTheme()`.

### 7. Pułapka `commonStyles`

`commonStyles.button` zapieka `colors.primary` na stałe. Plik `commonStyles.ts` jest snapshotowany — nie modyfikuj go. W komponentach motywowanych, które używają `commonStyles.button`, dodaj inline override w tablicy stylów:

```tsx
<TouchableOpacity style={[commonStyles.button, { backgroundColor: palette.primary }]}>
```

### 8. Elementy dekoracyjne pirackie

Poza kartami (patrz `WoodTexture` wyżej) niektóre ekrany mają własne elementy dekoracyjne dla motywu piratów — tło pokładu statku (deck-bg) tylko na hubie tripa oraz panele plank na kaflach hubów. Są one gate'owane bezpośrednio warunkiem `themeKey === "PIRATE"` w plikach `src/app/**` (te pliki są wyłączone z progów coverage w `jest.config.cjs`). W komponentach współdzielonych (poza `src/app/**`) preferuj `WoodTexture` zamiast powielania takiego gate'owania.

## Aktualizacja komponentów

Aby zaktualizować istniejący komponent:

1. Zaimportuj style: `import { colors, spacing, typography, shadows } from "../styles";`
2. Zamień hardcodowane wartości na zmienne z theme
3. Opcjonalnie użyj `commonStyles` dla typowych patternów

Przykład przed/po:

```tsx
// PRZED
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#17181c",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
});

// PO
import { colors, spacing, typography } from "../styles";

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundDark,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.xxxl,
    fontWeight: typography.bold,
    color: colors.white,
  },
});
```
