import { useColorScheme } from "react-native";
import { NativeTabs, Label, Icon, VectorIcon } from 'expo-router/unstable-native-tabs';
import Ionicons from "@expo/vector-icons/Ionicons";

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

  const backgroundColor = isDark ? colors.backgroundDark : colors.backgroundLight;
  const activeColor = colors.accentColor;
  const inactiveColor = isDark ? colors.inactiveColorDark : colors.inactiveColorLight;

  return (
    <NativeTabs
      backgroundColor={backgroundColor}
      tintColor={activeColor}
      iconColor={inactiveColor}
      labelStyle={{
        default: { color: inactiveColor },
        selected: { color: activeColor },
      }}
    >
      <NativeTabs.Trigger name="index">
        <Icon src={<VectorIcon family={Ionicons} name="home" />} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="trips">
        <Icon src={<VectorIcon family={Ionicons} name="snow" />} />
        <Label>Trips</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notifications">
        <Icon src={<VectorIcon family={Ionicons} name="notifications" />} />
        <Label>Notifications</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon src={<VectorIcon family={Ionicons} name="person" />} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
