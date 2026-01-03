import { YStack, XStack, H1, Text, View, Button, Spinner } from "tamagui";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { useAuth } from "@integral-2025-app/auth/client";
import { useRouter } from "expo-router";
import { LogOut, User, Users, Castle, Coins, Receipt } from "@tamagui/lucide-icons";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";

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
    return (
      <YStack
        flex={1}
        backgroundColor="$background"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner size="large" color="$red9" />
        <Text color="$gray11" marginTop="$4">
          Loading...
        </Text>
      </YStack>
    );
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
  const hasAdminAccess = currentUser?.isAdmin || currentUser?.isModerator || currentUser?.isServiceAccount;

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
          <YStack space="$4" alignItems="center">
            <View
              width={120}
              height={120}
              borderRadius={60}
              borderWidth={6}
              borderColor="$red9"
              overflow="hidden"
              animation="quick"
              enterStyle={{ scale: 0, opacity: 0 }}
              scale={1}
              opacity={1}
            >
              <View width="100%" height="50%" backgroundColor="white" />
              <View width="100%" height="50%" backgroundColor="$red9" />
            </View>
            <YStack space="$2" alignItems="center">
              <H1
                color="$color"
                fontSize="$11"
                fontWeight="900"
                textAlign="center"
                letterSpacing={-1}
                animation="quick"
                enterStyle={{ y: -20, opacity: 0 }}
                y={0}
                opacity={1}
              >
                Welcome Back!
              </H1>
              <XStack space="$2" alignItems="center">
                <User size={16} color="$gray11" />
                <Text
                  color="$gray11"
                  fontSize="$4"
                  fontWeight="600"
                  opacity={0.8}
                >
                  {session?.user?.email ?? "User"}
                </Text>
              </XStack>
            </YStack>
          </YStack>

          <YStack space="$3">
            {/* Admin/Moderator only features */}
            {hasAdminAccess && (
              <>
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
              </>
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

          <YStack flex={1} justifyContent="flex-end" alignItems="center">
            <Text
              color="$gray11"
              fontSize="$2"
              opacity={0.5}
              textAlign="center"
            >
              PJapp Native • v0.0.0
            </Text>
          </YStack>
        </YStack>
      </YStack>
    </>
  );
}
