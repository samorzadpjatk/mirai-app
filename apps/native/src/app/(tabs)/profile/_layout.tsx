import { Stack } from "expo-router";
import { useTripTheme } from "~/theme/TripThemeProvider";

function ProfileStack() {
  const { palette } = useTripTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide by default; override per screen
        headerStyle: { backgroundColor: palette.headerBackground },
        headerTintColor: palette.primary,
        headerTitleStyle: {
          fontFamily: "IBMPlexSans_600SemiBold",
          color: palette.white,
        },
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: palette.backgroundDark },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Profile",
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          headerShown: true,
          title: "Edit Profile",
        }}
      />
    </Stack>
  );
}

export default function ProfileLayout() {
  return <ProfileStack />;
}
