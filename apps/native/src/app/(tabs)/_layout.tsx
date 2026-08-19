import { useUser } from "@mirai-app/auth/client";
import { hasAdminAccess } from "@mirai-app/common/users";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useMemo } from "react";
import { useColorScheme } from "react-native";
import { useTripTheme } from "~/theme/TripThemeProvider";

const INACTIVE_COLOR = "#8E8E93";

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark" || colorScheme === null;
  const user = useUser();
  const { palette } = useTripTheme();

  const backgroundColor = isDark ? palette.backgroundDark : "#f1f1f4";
  const activeColor = palette.primary;
  const inactiveColor = INACTIVE_COLOR;

  const navTheme = useMemo(
    () =>
      isDark
        ? {
            ...DarkTheme,
            colors: {
              ...DarkTheme.colors,
              primary: palette.primary,
              background: palette.backgroundDark,
              card: palette.backgroundDark,
            },
          }
        : DefaultTheme,
    [isDark, palette],
  );

  return (
    <ThemeProvider value={navTheme}>
      <NativeTabs
        backgroundColor={backgroundColor}
        tintColor={activeColor}
        iconColor={inactiveColor}
        disableTransparentOnScrollEdge={true}
        labelStyle={{
          default: { color: inactiveColor },
          selected: { color: activeColor },
        }}
        minimizeBehavior="onScrollDown"
      >
        <NativeTabs.Trigger name="community">
          <NativeTabs.Trigger.Icon sf="person.2.fill" md="people" />
          <NativeTabs.Trigger.Label>Community</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="trips">
          <NativeTabs.Trigger.Icon sf="airplane" md="flight" />
          <NativeTabs.Trigger.Label>Trips</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="notifications">
          <NativeTabs.Trigger.Icon sf="bell.fill" md="notifications" />
          <NativeTabs.Trigger.Label>Notifications</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon sf="person.fill" md="person" />
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="admin" hidden={!hasAdminAccess(user?.role)}>
          <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
          <NativeTabs.Trigger.Label>Admin</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </ThemeProvider>
  );
}
