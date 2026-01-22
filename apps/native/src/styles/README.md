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
