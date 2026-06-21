# React Native Shimmer Skeleton (Reanimated 4 + expo-linear-gradient)

> Reusable guidance for building animated shimmer/skeleton placeholders in `apps/native`
> using **`react-native-reanimated` 4.x** and **`expo-linear-gradient`** (both already installed).
> No new dependencies. No `@react-native-masked-view/masked-view` (not installed — use the
> `overflow: 'hidden'` wrapper pattern below).

## When to use

- Replace `ActivityIndicator` with content-shaped shimmer placeholders while data loads.
- Any `*LoadingState` component, `LoadingScreen`, or `PrimaryLoadingButton` loading slot.

## Stack & versions (verified `apps/native/package.json`)

- `react-native-reanimated` **4.2.1** (uses `react-native-worklets` 0.7.4 under the hood)
- `expo-linear-gradient` **~55.0.13** → `import { LinearGradient } from 'expo-linear-gradient'` (**named** export, not default)
- Expo SDK 55, React Native 0.83.6, React 19.2, New Architecture enabled

## Core Reanimated 4.x APIs

| API | Purpose |
|---|---|
| `useSharedValue(initial)` | Mutable value shared between JS and UI threads. Drive animations by writing `.value`. |
| `useAnimatedStyle(() => {...})` | Worklet returning a style object. Runs on the **UI thread**. Re-runs when referenced shared values change. |
| `withTiming(to, {duration, easing, reduceMotion}, cb)` | Duration-based animation. `cb` is a worklet. |
| `withRepeat(anim, reps, reverse, cb, reduceMotion)` | Repeat. `reps = -1` = infinite. |
| `cancelAnimation(sv)` | Stop a running animation on a shared value. Call on unmount / when `isLoading` flips to false. |
| `interpolate(v, inputRange, outputRange, options?)` | Map a shared value through ranges. |
| `useReducedMotion()` | Synchronous `boolean` — preferred over async `AccessibilityInfo.isReduceMotionEnabled()`. **Caveat:** does NOT rerender when the system setting changes after mount. |
| `Easing.linear` | Constant-speed shimmer (no ease). |
| `ReduceMotion.System \| Always \| Never` | Pass to `withTiming({reduceMotion})`. `System` (default) auto-disables animation when OS reduce-motion is on. |

### Worklet rule

In Reanimated 4.x, `useAnimatedStyle` and animation callbacks are automatically treated as
worklets — you do **not** need the `'worklet';` directive inside them. You **do** need it only
for standalone worklet functions you define yourself and call from within an animated style.
Keep the shimmer logic inside `useAnimatedStyle` to stay on the UI thread.

## expo-linear-gradient API

```tsx
import { LinearGradient } from 'expo-linear-gradient'; // named export

<LinearGradient
  colors={['#base', '#highlight', '#base']} // ≥2 stops; use `as const` for TS
  start={{ x: 0, y: 0.5 }}   // default {x:0.5, y:0.0} = vertical top→bottom
  end={{ x: 1, y: 0.5 }}     // default {x:0.5, y:1.0}
  locations={[0, 0.5, 1]}     // optional, ascending 0..1
  dither={true}               // default true; set false only if banding is fine + you need perf
  style={StyleSheet.absoluteFill}
/>
```

- `colors` must have **at least 2** entries. For a single solid color use a plain `View` instead.
- For TypeScript, pass `colors` inline or `as const` so the tuple length is inferred.

## Masking pattern (NO masked-view dependency)

`LinearGradient` does **not** reliably clip to `borderRadius` on iOS, and partial radii
(`borderTopLeftRadius` etc.) are broken on both platforms. The robust, dependency-free pattern:

```tsx
<View style={{ overflow: 'hidden', borderRadius, width, height, backgroundColor: base }}>
  <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
    <LinearGradient
      colors={[base, highlight, base]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={StyleSheet.absoluteFill}
    />
  </Animated.View>
</View>
```

- The **outer `View`** carries `overflow: 'hidden'` + `borderRadius` → clips the translating gradient.
- The **`Animated.View`** carries only `transform: [{ translateX }]` + a `width` (the wave width).
- The **`LinearGradient`** fills the animated view absolutely.
- For `circle`: `borderRadius = width / 2` (or `borderRadius.full` token = 9999).
- For `text`/`line`: small `height` (e.g. `typography.base`), `borderRadius.sm`.
- Do **not** animate `backgroundColor`, `width`, or `height` — only `transform`. Layout-only
  changes on the wrapper are fine; the animation stays on the UI thread.

> If you ever need arbitrary alpha masks (e.g. text-shaped shimmer), you'd need
> `@react-native-masked-view/masked-view` — **not installed, do not add**. Stick to View shapes.

## Canonical shimmer component

```tsx
import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  interpolate,
  Easing,
  ReduceMotion,
  useReducedMotion,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '~/styles';

const DURATION_MS = 1500;
const WAVE_FRACTION = 0.5; // gradient width as fraction of container width

export interface SkeletonProps {
  width: number | string;
  height: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  colors?: { base: string; highlight: string }; // override
  testID?: string;
}

export function Skeleton({
  width,
  height,
  borderRadius = 8,
  style,
  colors: override,
  testID,
}: SkeletonProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const measuredWidth = useSharedValue(0);

  const base = override?.base ?? colors.surfaceDark;
  const highlight = override?.highlight ?? colors.whiteOpacity15;

  useEffect(() => {
    if (reduceMotion) return; // static block, no animation
    progress.value = withRepeat(
      withTiming(1, { duration: DURATION_MS, easing: Easing.linear, reduceMotion: ReduceMotion.System }),
      -1,
      false,
    );
    return () => cancelAnimation(progress);
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const w = measuredWidth.value;
    if (w === 0) return { opacity: 0 }; // avoid flash before layout
    const waveWidth = w * WAVE_FRACTION;
    const translateX = interpolate(progress.value, [0, 1], [-waveWidth, w]);
    return { transform: [{ translateX }], width: waveWidth, opacity: 1 };
  });

  const onLayout = (e: LayoutChangeEvent) => {
    measuredWidth.value = e.nativeEvent.layout.width;
  };

  if (reduceMotion) {
    return (
      <View
        testID={testID}
        style={[{ width, height, borderRadius, backgroundColor: base }, style]}
      />
    );
  }

  return (
    <View
      testID={testID}
      onLayout={onLayout}
      style={[{ width, height, borderRadius, backgroundColor: base, overflow: 'hidden' }, style]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={[base, highlight, base] as const}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}
```

### Variants

Derive from the base by changing `borderRadius` + dimensions:

| variant | shape |
|---|---|
| `box` | `borderRadius.md` (12) |
| `line` / `text` | `height: typography.base`, `borderRadius.sm` (8) |
| `circle` | `borderRadius = width / 2` (or `borderRadius.full`) |

### Synchronizing timing (`Skeleton.Group`)

All instances reading the **same** `DURATION_MS` constant and starting on mount will naturally
drift in sync because `withRepeat(withTiming(...))` is deterministic. For perfect sync across
siblings that mount at slightly different times, lift a single `progress` shared value into a
context and have each `Skeleton` consume it via `useContext` + `useAnimatedStyle`. Only do this
if visible drift is reported; the constant-duration approach is usually enough.

## Reduced motion (accessibility) — required by the design plan

1. **Prefer `useReducedMotion()`** from reanimated (synchronous, no promise).
2. When `true`: render a **static** `colors.surfaceDark` block — no `Animated.View`, no gradient.
3. Also pass `reduceMotion: ReduceMotion.System` to `withTiming` as defense-in-depth (this is
   the default, but being explicit documents intent).
4. `cancelAnimation(progress)` in the effect cleanup so a skeleton that unmounts mid-loop
   doesn't leak.
5. **Live setting changes:** `useReducedMotion()` does NOT rerender when the user toggles the
   OS setting after mount. If that matters (long-lived skeleton), subscribe explicitly:
   ```tsx
   const [reduced, setReduced] = useState(useReducedMotion());
   useEffect(() => {
     const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
     return () => sub.remove();
   }, []);
   ```
   For `LoadingScreen` / `*LoadingState` (short-lived), `useReducedMotion()` alone is fine.

## Theme tokens (from `apps/native/src/styles/colors.ts`)

| role | token | value |
|---|---|---|
| base (dark) | `colors.surfaceDark` | `#272935` |
| base alt | `colors.cardDark` | `#1b2828` |
| bg | `colors.backgroundDark` | `#17181c` |
| highlight (overlay) | `colors.whiteOpacity15` | `rgba(255,255,255,0.15)` |
| highlight alt | `colors.whiteOpacity10` | `rgba(255,255,255,0.10)` |
| border | `colors.borderWhite5` | `rgba(255,255,255,0.05)` |

- Default gradient: `[colors.surfaceDark, colors.whiteOpacity15, colors.surfaceDark]`.
- The `rgba` highlight composites correctly as a `LinearGradient` color stop.
- For light theme (future): swap base → `colors.gray100` / `colors.gray200`, highlight → `colors.white`.
  Resolving from tokens means no skeleton edits when light theme lands.
- `borderRadius` tokens: `borderRadius.sm` (8), `.md` (12), `.lg` (16), `.full` (9999).

## Performance checklist

- ✅ Animation runs on the **UI thread** via `useAnimatedStyle` (no JS bridge per frame).
- ✅ Only `transform: [{ translateX }]` is animated — never `backgroundColor`/layout props.
- ✅ `cancelAnimation` on unmount and when `isLoading` becomes false.
- ✅ `React.memo` the `Skeleton` to prevent parent re-renders from restarting the loop.
- ✅ Measure width once via `onLayout` into a shared value (no `useState` → no re-render).
- ✅ `Easing.linear` for constant sweep speed.
- ✅ `overflow: 'hidden'` on the wrapper clips the off-screen gradient cheaply.
- ⚠️ Avoid nesting many skeletons inside a single `Animated.View` — each skeleton owns its own.
- ⚠️ On Android, animating a `maskElement` requires `androidRenderingMode="software"` — we are
  **not** using `MaskedView`, so this does not apply.

## Pitfalls

1. **`LinearGradient` default export** — `expo-linear-gradient` exports `LinearGradient` as a
   **named** export. `import LinearGradient from 'expo-linear-gradient'` is wrong.
2. **`borderRadius` on `LinearGradient`** — unreliable on iOS, broken for partial radii. Always
   put `borderRadius` + `overflow: 'hidden'` on the wrapping `View`.
3. **Forgetting `cancelAnimation`** — a shared value keeps animating after unmount if not
   cancelled; can cause "worklet on unmounted component" warnings.
4. **`useReducedMotion()` staleness** — returns the value at mount time; won't rerender on
   toggle. Acceptable for short-lived loaders; subscribe explicitly for long-lived ones.
5. **`colors` tuple typing** — TS needs `as const` or an inline literal to infer length ≥ 2.
6. **Animating `width`/`height`** — triggers layout on the UI thread and is expensive. Animate
   only `transform`.
7. **`withRepeat` + reduced motion** — when `ReduceMotion.System` is set and the OS setting is
   on, an infinite reversed repeat does **not** start. Good — but still render the static block
   so there's no empty gap.
8. **Web** — `expo-linear-gradient` `start`/`end` only change the angle on web (CSS limitation).
   The shimmer still works; the sweep angle is approximate. Acceptable for our use case.

## Testing notes (Jest + RNTL)

- `react-native-reanimated` mocks: `jest-expo` ships a mock. Ensure `jest.setup.js` includes
  `jest.mock('react-native-reanimated')` or uses `require('react-native-reanimated/mock')`.
- Assert the static block renders when `useReducedMotion` returns `true` (mock the hook).
- Query by `testID`, not by animation state. Assert `colors.surfaceDark` background presence.
- `expo-linear-gradient` is auto-mocked by `jest-expo`; assert it receives `colors` prop.

## References

- Reanimated 4.x docs: <https://docs.swmansion.com/react-native-reanimated/>
- `useReducedMotion`: <https://docs.swmansion.com/react-native-reanimated/docs/device/useReducedMotion/>
- Accessibility guide: <https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/>
- `expo-linear-gradient`: <https://docs.expo.dev/versions/latest/sdk/linear-gradient/>
- `AccessibilityInfo`: <https://reactnative.dev/docs/accessibilityinfo>
