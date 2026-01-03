import { YStack, Button } from "tamagui";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { useAuth } from "@integral-2025-app/auth/client";
import { useRouter } from "expo-router";
import { LogOut, Users } from "@tamagui/lucide-icons";
import Header from "../components/Header";
import LoadingScreen from "../components/LoadingScreen";
import Footer from "../components/Footer";

export default function Home() {
  const { session, isLoading, signOut } = useAuth();
  const router = useRouter();

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
              View Users (tRPC Example)
            </Button>
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
