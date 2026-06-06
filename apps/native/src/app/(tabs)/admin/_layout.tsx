import { orpc } from "@mirai-app/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { colors } from "~/styles";

const backgroundColor = "#17181c";

export default function AdminLayout() {
  const { data: user } = useQuery(orpc.user.getMy.queryOptions({ input: {} }));

  // Check if user has admin role based on the user object
  const hasAdminAccess = user?.role === "ADMIN" || user?.role === "MODERATOR";
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
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor },
      }}
    >
      {/* Protected admin routes - only accessible to users with admin or moderator role */}
      <Stack.Protected guard={hasAdminAccess}>
        <Stack.Screen
          name="index"
          options={{
            title: "Admin Panel",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="users/index"
          options={{
            title: "Users",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="houses/index"
          options={{
            title: "Houses",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="users/new"
          options={{
            title: "Create User",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="users/edit/[userId]"
          options={{
            title: "Edit User",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="groups/index"
          options={{
            title: "Groups",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="groups/new"
          options={{
            title: "Create Group",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="groups/edit/[groupId]"
          options={{
            title: "Edit Group",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="coins/index"
          options={{
            title: "Coins",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="coins/add"
          options={{
            title: "Add Coins",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="coins/remove"
          options={{
            title: "Remove Coins",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="transactions/index"
          options={{
            title: "Transactions",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="challenges/index"
          options={{
            title: "Challenges",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="challenges/new"
          options={{
            title: "New Challenge",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="challenges/[id]"
          options={{
            title: "Edit Challenge",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="challenges/judgement"
          options={{
            title: "Challenge Judgement",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="challenges/submissions"
          options={{
            title: "Challenge submissions",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="challenges/staff-vote"
          options={{
            title: "Staff voting",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="activity/index"
          options={{
            title: "Activity",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="activity/new"
          options={{
            title: "Create Activity",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="activity/edit/[activityId]"
          options={{
            title: "Edit Activity",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="notifications/index"
          options={{
            title: "Notifications",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="notifications/new"
          options={{
            title: "Create Notification",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="schedules/index"
          options={{
            title: "Schedules",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="rewards/index"
          options={{
            title: "Rewards",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="rewards/new"
          options={{
            title: "Create Reward",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="rewards/edit/[rewardId]"
          options={{
            title: "Edit Reward",
            headerBackTitle: "Back",
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}
