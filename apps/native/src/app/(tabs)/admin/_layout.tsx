import { Stack } from 'expo-router';
import { useTRPC } from '@integral-2025-app/trpc/client';
import { useQuery } from '@tanstack/react-query';
import { colors } from '~/styles';

const backgroundColor = "#17181c";
const headerTintColor = "#00ced1";

export default function AdminLayout() {
  const trpc = useTRPC();

  const { data: user } = useQuery(trpc.user.getMy.queryOptions());

  // Check if user has admin role based on the user object
  const hasAdminAccess = user?.role === 'ADMIN' || user?.role === 'MODERATOR';
  const headerBackgroundColor = colors.backgroundDark;
  const headerTintColor = colors.textPrimary;
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: headerBackgroundColor,
        },
        headerTintColor: headerTintColor,
        headerShadowVisible: true,
        headerTitleStyle: {
          fontWeight: "600",
        },
        contentStyle: { backgroundColor },
      }}
    >
      {/* Protected admin routes - only accessible to users with admin or moderator role */}
      <Stack.Protected guard={hasAdminAccess}>
        <Stack.Screen
          name="index"
          options={{
            title: "Admin Panel",
            headerBackTitle: "Back"
          }}
        />
        <Stack.Screen
          name="users/index"
          options={{
            title: "Users",
            headerBackTitle: "Back"
          }}
        />
        <Stack.Screen
          name="groups/index"
          options={{
            title: "Groups",
            headerBackTitle: "Back"
          }}
        />
        <Stack.Screen
          name="coins/index"
          options={{
            title: "Coins",
            headerBackTitle: "Back"
          }}
        />
        <Stack.Screen
          name="transactions/index"
          options={{
            title: "Transactions",
            headerBackTitle: "Back"
          }}
        />
        <Stack.Screen
          name="challenges/index"
          options={{
            title: "Challenges",
            headerBackTitle: "Back"
          }}
        />
        <Stack.Screen
          name="challenges/new"
          options={{
            title: "New Challenge",
            headerBackTitle: "Back"
          }}
        />
        <Stack.Screen
          name="challenges/[id]"
          options={{
            title: "Edit Challenge",
            headerBackTitle: "Back"
          }}
        />
        <Stack.Screen
          name="challenges/judgement"
          options={{
            title: "Challenge Judgement",
            headerBackTitle: "Back"
          }}
        />
        <Stack.Screen
          name="notifications/index"
          options={{
            title: "Notifications",
            headerBackTitle: "Back"
          }}
        />
        <Stack.Screen
          name="schedules/index"
          options={{
            title: "Schedules",
            headerBackTitle: "Back"
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}
