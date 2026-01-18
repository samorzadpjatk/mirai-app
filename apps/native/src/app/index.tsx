import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { useAuth } from "@integral-2025-app/auth/client";
import { useRouter } from "expo-router";
import { Calendar, Megaphone, UtensilsCrossed, CreditCard, BookOpen } from "@tamagui/lucide-icons";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import LoadingScreen from "../components/LoadingScreen";
import AppNavbar from "../components/AppNavbar";
import BottomMenu from "../components/BottomMenu";

export default function Home() {
  const { session, isLoading, signOut } = useAuth();
  const router = useRouter();
  const trpc = useTRPC();

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

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Navbar */}
        <AppNavbar />

        {/* Main Content */}
        <ScrollView
          style={styles.mainContent}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Wintegral Hero Card */}
          <TouchableOpacity style={styles.heroCard} activeOpacity={0.98}>
            <View style={styles.heroGradient} />
            <View style={styles.heroImageContainer}>
              <Image
                source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuByOUlLig-2IjrfVROMuWxtOKTaZJU93hKFSYG9rS9MpgZkPTGUYJ3ji7QskaEGx50eApLToqbB8SILw6jsYVnTOt8-DIr1oK0pDhGvd3n7kHjsvxVZdjn8uR-uqg3gGZ3xC1V0stUKkQ891sc4VqnGOUSw7VrMtyf4-hpwyAO6kcnRGCMk9TnoyO32RFtLjifjMyhRu_0Ez7YpR5KU2SJsYOcksKYeFIwnzmG2GRW9FOmhM2YCxvKA8nfCEDr7bgna-W6_OLyKsF0" }}
                style={styles.heroImage}
              />
            </View>
            <View style={styles.heroContent}>
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroTitle}>WINTEGRAL 2026</Text>
                <Text style={styles.heroSubtitle}>Bridge academic life & social adventures</Text>
              </View>
              <TouchableOpacity style={styles.heroButton}>
                <Text style={styles.heroButtonText}>VIEW TRIP</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Quick Info Cards */}
          <View style={styles.quickCardsGrid}>
            {/* Next Class Card */}
            <View style={[styles.quickCard, styles.quickCardGlass]}>
              <View style={styles.quickCardHeader}>
                <View style={styles.iconWrapperPrimary}>
                  <Calendar size={20} color="#00ced1" />
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>IN 15M</Text>
                </View>
              </View>
              <View style={styles.quickCardContent}>
                <Text style={styles.quickCardLabel}>Next Class</Text>
                <Text style={styles.quickCardTitle}>RBD</Text>
                <Text style={styles.quickCardSubtitle}>Room A/1 • 10:15 AM</Text>
              </View>
            </View>

            {/* Campus News Card */}
            <View style={styles.quickCard}>
              <View style={styles.iconWrapperMagenta}>
                <Megaphone size={20} color="#E533FF" />
              </View>
              <View style={styles.quickCardContent}>
                <Text style={styles.quickCardLabelMagenta}>Campus News</Text>
                <Text style={styles.quickCardTitleSmall}>Hackathon 2026 registration is now open!</Text>
                <Text style={styles.quickCardTime}>2 hours ago</Text>
              </View>
            </View>
          </View>

          {/* Recent Activity Section */}
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>

            <View style={styles.activityList}>
              {/* Activity Item 1 */}
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, styles.activityIconPrimary]}>
                  <UtensilsCrossed size={20} color="#00ced1" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Cafeteria Menu Updated</Text>
                  <Text style={styles.activitySubtitle}>Check today's specials</Text>
                </View>
                <Text style={styles.activityTime}>09:30</Text>
              </View>

              {/* Activity Item 2 */}
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, styles.activityIconMagenta]}>
                  <CreditCard size={20} color="#E533FF" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Payment Confirmed</Text>
                  <Text style={styles.activitySubtitle}>Winter Trip Deposit</Text>
                </View>
                <Text style={styles.activityTime}>Yesterday</Text>
              </View>

              {/* Activity Item 3 */}
              <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <BookOpen size={20} color="rgba(255, 255, 255, 0.7)" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Library Books Due</Text>
                  <Text style={styles.activitySubtitle}>Return by Friday 5 PM</Text>
                </View>
                <Text style={styles.activityTime}>Yesterday</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Floating Bottom Navigation */}
        <BottomMenu activeTab="home" />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#17181c",
  },
  mainContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 120,
    gap: 24,
  },
  heroCard: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1b2828",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  heroGradient: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    zIndex: 10,
  },
  heroImageContainer: {
    width: "100%",
    aspectRatio: 16 / 10,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    zIndex: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  heroTextContainer: {
    gap: 4,
    flex: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#00ced1",
    fontWeight: "500",
  },
  heroButton: {
    backgroundColor: "#00ced1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: "#00ced1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  heroButtonText: {
    color: "#17181c",
    fontWeight: "bold",
    fontSize: 12,
  },
  quickCardsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  quickCard: {
    flex: 1,
    backgroundColor: "#1b2828",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    minHeight: 160,
    justifyContent: "space-between",
  },
  quickCardGlass: {
    backgroundColor: "rgba(27, 40, 40, 0.7)",
    borderColor: "rgba(0, 206, 209, 0.3)",
  },
  quickCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconWrapperPrimary: {
    padding: 8,
    backgroundColor: "rgba(0, 206, 209, 0.1)",
    borderRadius: 8,
  },
  iconWrapperMagenta: {
    padding: 8,
    backgroundColor: "rgba(229, 51, 255, 0.1)",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  badge: {
    backgroundColor: "rgba(0, 206, 209, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#00ced1",
  },
  quickCardContent: {
    gap: 2,
  },
  quickCardLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  quickCardLabelMagenta: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#E533FF",
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  quickCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  quickCardTitleSmall: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
    lineHeight: 18,
  },
  quickCardSubtitle: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  quickCardTime: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
  },
  activitySection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 2,
    paddingHorizontal: 4,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(27, 40, 40, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
  },
  activityIconPrimary: {
    backgroundColor: "rgba(0, 206, 209, 0.1)",
  },
  activityIconMagenta: {
    backgroundColor: "rgba(229, 51, 255, 0.1)",
  },
  activityContent: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
  activitySubtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  activityTime: {
    fontSize: 10,
    fontWeight: "500",
    color: "#475569",
  },
});
