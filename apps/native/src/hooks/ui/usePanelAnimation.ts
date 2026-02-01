import { useSharedValue, withTiming } from "react-native-reanimated";

/**
 * usePanelAnimation
 * A small helper that exposes a shared value and convenience helpers to animate it.
 * Follows Reanimated docs: https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue/
 */
export function usePanelAnimation(initialOpen = false, duration = 240) {
  const value = useSharedValue<number>(initialOpen ? 1 : 0);

  const open = () => {
    value.value = withTiming(1, { duration });
  };

  const close = () => {
    value.value = withTiming(0, { duration });
  };

  const setOpen = (isOpen: boolean) => {
    value.value = withTiming(isOpen ? 1 : 0, { duration });
  };

  const toggle = () => {
    value.value = withTiming(value.value === 1 ? 0 : 1, { duration });
  };

  return { value, open, close, setOpen, toggle } as const;
}
