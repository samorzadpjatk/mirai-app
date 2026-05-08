import { useColorScheme } from "react-native";
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useUser } from '@mirai-app/auth/client';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';

const colors = {
  backgroundDark: "#17181c",
  backgroundLight: "#f1f1f4",
  accentColor: "#00ced1",
  inactiveColorDark: "#8E8E93",
  inactiveColorLight: "#8E8E93",
};

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark" || colorScheme === null;
  const user = useUser();
  
  const hasAdminAccess = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  const backgroundColor = isDark ? colors.backgroundDark : colors.backgroundLight;
  const activeColor = colors.accentColor;
  const inactiveColor = isDark ? colors.inactiveColorDark : colors.inactiveColorLight;

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <NativeTabs
        backgroundColor={backgroundColor}
        tintColor={activeColor}
        iconColor={inactiveColor}
        disableTransparentOnScrollEdge
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
        <NativeTabs.Trigger.Icon sf="snowflake" md="ac_unit" />
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
      {hasAdminAccess && (
        <NativeTabs.Trigger name="admin">
          <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
          <NativeTabs.Trigger.Label>Admin</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      )}
      </NativeTabs>
    </ThemeProvider>
  );
}
