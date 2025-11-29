import { Button, XStack } from "tamagui";
import { Moon, Sun } from "@tamagui/lucide-icons";

interface ThemeSwitcherProps {
  onToggle: () => void;
  currentTheme: "light" | "dark";
}

export function ThemeSwitcher({ onToggle, currentTheme }: ThemeSwitcherProps) {
  const isDark = currentTheme === "dark";

  return (
    <XStack
      space="$2"
      alignItems="center"
      padding="$3"
      borderRadius="$4"
      backgroundColor="$background"
    >
      <Button
        size="$4"
        circular
        icon={isDark ? Sun : Moon}
        backgroundColor={isDark ? "$gray3" : "$gray11"}
        color={isDark ? "$gray12" : "$gray1"}
        borderWidth={2}
        borderColor={isDark ? "$gray8" : "$gray9"}
        pressStyle={{ scale: 0.95, opacity: 0.8 }}
        hoverStyle={{
          backgroundColor: isDark ? "$gray4" : "$gray10",
          opacity: 0.9,
        }}
        onPress={onToggle}
        aria-label="Toggle theme"
        cursor="pointer"
      />
    </XStack>
  );
}
