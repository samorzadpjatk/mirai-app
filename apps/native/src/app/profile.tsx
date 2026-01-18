import { View, Text, TouchableOpacity, ScrollView, useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@integral-2025-app/auth/client";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut, Users, Castle, Coins, Receipt, Bell, ArrowLeft, Trophy } from "@tamagui/lucide-icons";

export default function Profile() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const trpc = useTRPC();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { data: currentUser } = useQuery(
    trpc.user.getMy.queryOptions()
  );

  const hasAdminAccess = currentUser?.isAdmin ?? currentUser?.isModerator ?? currentUser?.isServiceAccount;

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/auth/login");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  const menuItems = [
    { icon: Trophy, label: "Trip Challenges", route: "/challenges" },
    { icon: Users, label: "View Users", route: "/users" },
    { icon: Castle, label: "View Guilds", route: "/groups" },
    { icon: Coins, label: "Coin Operations", route: "/coins" },
    { icon: Receipt, label: "Transaction History", route: "/transactions" },
    { icon: Bell, label: "Notifications", route: "/notifications" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center gap-4 border-b border-black/5 dark:border-white/5">
            <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft size={24} color={isDark ? "#fff" : "#17181c"} />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-slate-900 dark:text-white font-display">
                Profile
            </Text>
        </View>

        <ScrollView className="flex-1 p-6">
            <View className="items-center mb-8">
                <View className="w-24 h-24 bg-primary/20 rounded-full items-center justify-center mb-4">
                    <Text className="text-4xl font-bold text-primary font-display">
                        {session?.user?.email?.[0]?.toUpperCase() ?? "U"}
                    </Text>
                </View>
                <Text className="text-xl font-bold text-slate-900 dark:text-white mb-1 font-display">
                    {currentUser?.name ?? "User"}
                </Text>
                <Text className="text-sm text-slate-500 font-body">
                    {session?.user?.email}
                </Text>
            </View>

            {/* Challenges Section - Always visible */}
            <View className="mb-8">
                <Text className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 font-display">
                    Trip Features
                </Text>
                <TouchableOpacity 
                    onPress={() => router.push("/challenges")}
                    className="flex-row items-center gap-4 p-4 rounded-xl bg-white dark:bg-card-dark border border-black/5 dark:border-white/5 mb-4"
                >
                    <View className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 items-center justify-center">
                        <Trophy size={20} color="#00ced1" />
                    </View>
                    <Text className="flex-1 font-bold text-slate-900 dark:text-white font-body">
                        Trip Challenges
                    </Text>
                </TouchableOpacity>
            </View>

            {hasAdminAccess && (
                <View className="mb-8">
                    <Text className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 font-display">
                        Admin Features
                    </Text>
                    <View className="space-y-3">
                        {menuItems.slice(1).map((item, index) => (
                            <TouchableOpacity 
                                key={index}
                                onPress={() => router.push(item.route as any)}
                                className="flex-row items-center gap-4 p-4 rounded-xl bg-white dark:bg-card-dark border border-black/5 dark:border-white/5"
                            >
                                <View className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 items-center justify-center">
                                    <item.icon size={20} color="#00ced1" />
                                </View>
                                <Text className="flex-1 font-bold text-slate-900 dark:text-white font-body">
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            <TouchableOpacity 
                onPress={handleSignOut}
                className="flex-row items-center gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20"
            >
                <View className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 items-center justify-center">
                    <LogOut size={20} color="#ef4444" />
                </View>
                <Text className="flex-1 font-bold text-red-600 dark:text-red-400 font-body">
                    Sign Out
                </Text>
            </TouchableOpacity>
        </ScrollView>
    </SafeAreaView>
  );
}
