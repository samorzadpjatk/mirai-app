import { Stack } from 'expo-router';

const backgroundColor = "#17181c";
const headerTintColor = "#00ced1";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor },
        headerTintColor: headerTintColor,
        headerTitleStyle: {
          fontFamily: "IBMPlexSans_600SemiBold",
          color: "#ffffff",
        },
        contentStyle: { backgroundColor },
        
      }}
    >
      <Stack.Screen 
        name="Profile" 
        options={{ 
          headerShown: false,
          title: "Profile"
        }} 
      />
    </Stack>
  );
}
