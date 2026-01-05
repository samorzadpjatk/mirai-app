import { Button, Paragraph, XStack } from "tamagui";
import { Moon, Sun } from "@tamagui/lucide-icons";

interface ThemeSwitcherProps {
  onToggle: () => void;
  currentTheme: "light" | "dark";
}

export function ThemeSwitcher({ onToggle, currentTheme }: ThemeSwitcherProps) {
  const isDark = currentTheme === "dark";
  const label = isDark ? "Dark Mode" : "Light Mode";

  return (
    <XStack
      space="$2"
      items="center"
      p="$3"
      rounded="$4"
      bg="$background"
    >
      <Button
        size="$4"
        circular
        icon={isDark ? Sun : Moon}
        bg={isDark ? "$gray3" : "$gray11"}
        color={isDark ? "$gray12" : "$gray1"}
        borderWidth={2}
        borderColor={isDark ? "$gray8" : "$gray9"}
        pressStyle={{ scale: 0.95, opacity: 0.8 }}
        hoverStyle={{
          bg: isDark ? "$gray4" : "$gray10",
          opacity: 0.9,
        }}
        onPress={onToggle}
        aria-label="Toggle theme"
        cursor="pointer"
      />
      <Paragraph
        size="$4"
        fontWeight="600"
        color="$color"
        accessibilityRole="text"
      >
        {label}
      </Paragraph>
    </XStack>
  );
}
