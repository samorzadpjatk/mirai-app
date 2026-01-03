import { YStack, Button } from "tamagui";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { useAuth } from "@integral-2025-app/auth/client";
import { useRouter } from "expo-router";
import { LogOut, User, Users, Castle, Coins, Receipt, Bell } from "@tamagui/lucide-icons";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import Header from "../components/Header";
import LoadingScreen from "../components/LoadingScreen";
import Footer from "../components/Footer";

export default function Home() {
  const { session, isLoading, signOut } = useAuth();
  const router = useRouter();
  const trpc = useTRPC();
  
  // Fetch current user to check their role
  const { data: currentUser } = useQuery(
    trpc.user.getMy.queryOptions()
  );

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/auth/login");
    }
  }, [isLoading, session, router]);

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (!session) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/auth/login");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  // Check if user has admin/moderator privileges
  // Admin, Moderator, or Service Account can access admin features
  const hasAdminAccess = currentUser?.isAdmin ?? currentUser?.isModerator ?? currentUser?.isServiceAccount;

  return (
    <>
      <StatusBar style="auto" />
      <YStack
        backgroundColor="$background"
        flex={1}
        padding="$6"
        paddingTop="$12"
      >
        <YStack space="$6" flex={1}>
          <Header
            title="Welcome Back!"
            showUserEmail
            userEmail={session?.user?.email ?? "User"}
          />

          <YStack space="$3">
            {/* Admin/Moderator only features */}
            {hasAdminAccess && (
              <YStack space="$3">
                <Button
                  size="$4"
                  backgroundColor="$blue9"
                  color="white"
                  fontWeight="700"
                  icon={Users}
                  onPress={() => router.push("/users")}
                  hoverStyle={{ backgroundColor: "$blue10" }}
                  pressStyle={{ backgroundColor: "$blue8", scale: 0.98 }}
                  animation="quick"
                >
                  View Users
                </Button>
                <Button
                  size="$4"
                  backgroundColor="$purple9"
                  color="white"
                  fontWeight="700"
                  icon={Castle}
                  onPress={() => router.push("/groups")}
                  hoverStyle={{ backgroundColor: "$purple10" }}
                  pressStyle={{ backgroundColor: "$purple8", scale: 0.98 }}
                  animation="quick"
                >
                  View Guilds
                </Button>
                <Button
                  size="$4"
                  backgroundColor="$yellow9"
                  color="white"
                  fontWeight="700"
                  icon={Coins}
                  onPress={() => router.push("/coins")}
                  hoverStyle={{ backgroundColor: "$yellow10" }}
                  pressStyle={{ backgroundColor: "$yellow8", scale: 0.98 }}
                  animation="quick"
                >
                  Coin Operations
                </Button>
                <Button
                  size="$4"
                  backgroundColor="$green9"
                  color="white"
                  fontWeight="700"
                  icon={Receipt}
                  onPress={() => router.push("/transactions")}
                  hoverStyle={{ backgroundColor: "$green10" }}
                  pressStyle={{ backgroundColor: "$green8", scale: 0.98 }}
                  animation="quick"
                >
                  Transaction History
                </Button>
                <Button
                  size="$4"
                  backgroundColor="$orange9"
                  color="white"
                  fontWeight="700"
                  icon={Bell}
                  onPress={() => router.push("/notifications")}
                  hoverStyle={{ backgroundColor: "$orange10" }}
                  pressStyle={{ backgroundColor: "$orange8", scale: 0.98 }}
                  animation="quick"
                >
                  Notifications
                </Button>
              </YStack>
            )}
            
            {/* Available to all users */}
            <Button
              size="$4"
              backgroundColor="$red9"
              color="white"
              fontWeight="700"
              icon={LogOut}
              onPress={handleSignOut}
              hoverStyle={{ backgroundColor: "$red10" }}
              pressStyle={{ backgroundColor: "$red8", scale: 0.98 }}
              animation="quick"
            >
              Sign Out
            </Button>
          </YStack>

          <Footer appName="PJapp Native" version="v0.0.0" />
        </YStack>
      </YStack>
    </>
  );
}
