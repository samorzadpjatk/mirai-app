import {
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Linking,
  Alert,
  Dimensions,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { WebView } from "react-native-webview";
import Pdf from "react-native-pdf";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FullScreenModal } from "~/components/common/ui";
import { useFileDownload } from "~/hooks/files";
import { useTripResources, useSelectedTrip } from "~/hooks/trips";
import { useLocalSearchParams } from "expo-router";
import LoadingScreen from "../../../components/LoadingScreen";
import { YStack, XStack, Text } from "@mirai-app/ui";

// Color values for React Native styles
const colors = {
  backgroundDark: "#17181c",
  primary: "#00ced1",
  accentMagenta: "#E533FF",
  white: "#ffffff",
  slate400: "#94a3b8",
  slate500: "#64748b",
  cardDark: "#1b2828",
  magentaOpacity10: "rgba(229, 51, 255, 0.1)",
  magentaOpacity30: "rgba(229, 51, 255, 0.3)",
  primaryOpacity20: "rgba(0, 206, 209, 0.2)",
  primaryOpacity30: "rgba(0, 206, 209, 0.3)",
  primaryOpacity80: "rgba(0, 206, 209, 0.8)",
};

// Spacing values
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Border radius values
const borderRadius = {
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// Typography values
const typography = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  bold: "700" as const,
  medium: "500" as const,
};

// Type-safe icon name helper
const getIconName = (
  iconName: string | null,
  fallback: keyof typeof Ionicons.glyphMap,
): keyof typeof Ionicons.glyphMap => {
  if (!iconName) return fallback;
  return iconName as keyof typeof Ionicons.glyphMap;
};

export default function TripInfoScreen() {
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [isPdfModalVisible, setIsPdfModalVisible] = useState(false);
  const [isInsuranceModalVisible, setIsInsuranceModalVisible] = useState(false);
  const [pdfModalTitle, setPdfModalTitle] = useState("");
  const [pdfModalUri, setPdfModalUri] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const paramTripId =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];
  const { selectedTripId } = useSelectedTrip();
  const tripId = selectedTripId ?? paramTripId;

  const { getResource, insurance, isLoading, isError } =
    useTripResources(tripId);

  // File download hooks for images and PDFs
  const heroImageDownload = useFileDownload();
  const mapBgImageDownload = useFileDownload();
  const mapPdfDownload = useFileDownload();
  const infopackDownload = useFileDownload();

  // Download images on component mount
  useEffect(() => {
    if (!isLoading) {
      const heroResource = getResource("HERO_IMAGE");
      const mapBgResource = getResource("MAP_BG_IMAGE");

      if (heroResource?.storagePath) {
        heroImageDownload.download({ storagePath: heroResource.storagePath });
      }

      if (mapBgResource?.storagePath) {
        mapBgImageDownload.download({ storagePath: mapBgResource.storagePath });
      }
    }
  }, [getResource, heroImageDownload, isLoading, mapBgImageDownload]);

  void getResource;

  if (isLoading) {
    return <LoadingScreen message="Loading trip info..." />;
  }

  if (isError || !tripId) {
    return (
      <YStack
        flex={1}
        backgroundColor="$backgroundDark"
        justifyContent="center"
        alignItems="center"
      >
        <Text color="$white" fontSize="$base" textAlign="center">
          Failed to load trip information
        </Text>
      </YStack>
    );
  }

  const handleWhatsAppPress = () => {
    const whatsappResource = getResource("WHATSAPP");
    if (whatsappResource?.url) {
      Linking.openURL(whatsappResource.url);
    }
  };

  const handleInfopakPress = async () => {
    const infopackResource = getResource("INFOPACK");
    if (infopackResource?.storagePath) {
      try {
        const result = await infopackDownload.download({
          storagePath: infopackResource.storagePath,
        });
        setPdfModalTitle("Infopack");
        setPdfModalUri(result.uri);
        setIsPdfModalVisible(true);
      } catch {
        Alert.alert(
          "Error",
          "Could not open the infopack. Please try again later.",
        );
      }
    }
  };

  const handleSosPress = () => {
    const sosResource = getResource("SOS");
    if (sosResource?.description) {
      Alert.alert("Numer alarmowy", sosResource.description);
    } else {
      Alert.alert("Numer alarmowy", "W razie nagłego wypadku zadzwoń na 112.");
    }
  };

  const handleMapPress = () => {
    setIsMapModalVisible(true);
  };

  const handlePdfMapPress = async () => {
    const pdfMapResource = getResource("PDF_MAP");
    if (pdfMapResource?.storagePath) {
      try {
        const result = await mapPdfDownload.download({
          storagePath: pdfMapResource.storagePath,
        });
        setPdfModalTitle("PDF Map");
        setPdfModalUri(result.uri);
        setIsPdfModalVisible(true);
      } catch {
        Alert.alert("Error", "Could not open the map. Please try again later.");
      }
    }
  };

  const handleInsurancePress = () => {
    setIsInsuranceModalVisible(true);
  };

  const handleInsuranceCallPress = () => {
    if (insurance?.phoneNumber) {
      Linking.openURL(`tel:${insurance.phoneNumber}`).catch(() => {
        Alert.alert("Błąd", "Nie udało się rozpocząć połączenia.");
      });
    }
  };

  const handleInsuranceCopyPress = () => {
    if (insurance?.phoneDisplay) {
      Alert.alert("Numer alarmowy", insurance.phoneDisplay);
    }
  };

  return (
    <>
      <StatusBar style="light" />
      <YStack flex={1} backgroundColor="$backgroundDark">
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: spacing.lg,
            paddingBottom: spacing.xxxl * 2 + insets.bottom,
            paddingHorizontal: spacing.lg,
            gap: spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Header */}
          <YStack height={192} borderRadius={borderRadius.xl} overflow="hidden">
            <ImageBackground
              source={{
                uri:
                  heroImageDownload.file?.uri ??
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuAHhLaOxCenvDHeXPGxGdnYhEumFOLH5A9Wh5fAb63uNUkITSveOg2w84W1Q72tKNnm3nhMAdZEyYc_wtTSqm7mjn2XpnVUwdc4O1eHaoLbQxVFProgk7Jnuc3k0sW4fg5BKzNzg56WwaR-MesVKcfLd3fOfPxZGRKaV_PLrsgOyhirvj2CqfkrxBZpmQNCwGq56LVrNMBKRUwNzDK0bd7ttYLsQDQlxhJ2mEsvE1Mx4HrVpg3u58_JdMp0ZOzRu_9PjH43rDEbQfY",
              }}
              style={{ width: "100%", height: "100%" }}
              imageStyle={{ borderRadius: borderRadius.xl }}
            >
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(23, 24, 28, 0.4)",
                }}
              />
              <YStack
                flex={1}
                padding={spacing.lg}
                justifyContent="space-between"
              >
                <YStack
                  style={{ backgroundColor: colors.primary }}
                  paddingHorizontal={spacing.md}
                  paddingVertical={spacing.xs}
                  borderRadius={borderRadius.full}
                  alignSelf="flex-start"
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: typography.bold,
                      color: colors.backgroundDark,
                      textTransform: "uppercase",
                      letterSpacing: 2,
                    }}
                  >
                    Live Now
                  </Text>
                </YStack>
                <YStack gap={spacing.xs}>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: typography.bold,
                      color: colors.white,
                    }}
                  >
                    {getResource("HERO_IMAGE")?.label ?? "Trip Info"}
                  </Text>
                  <Text
                    style={{
                      fontSize: typography.xs,
                      fontWeight: typography.medium,
                      color: colors.primaryOpacity80,
                    }}
                  >
                    Feb 20 - Mar 01, 2026
                  </Text>
                </YStack>
              </YStack>
            </ImageBackground>
          </YStack>

          {/* Main Bento Grid */}
          <YStack gap={spacing.lg}>
            {/* Map Tiles Row */}
            <XStack gap={spacing.md}>
              {/* Interactive Ski Map */}
              {getResource("INTERACTIVE_MAP") && (
                <TouchableOpacity
                  style={{
                    flex: 1,
                    height: 176,
                    borderRadius: borderRadius.xl,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: colors.primaryOpacity20,
                  }}
                  onPress={handleMapPress}
                  activeOpacity={0.8}
                >
                  <ImageBackground
                    source={{
                      uri:
                        mapBgImageDownload.file?.uri ??
                        "https://lh3.googleusercontent.com/aida-public/AB6AXuCHzNKnjzWDXauSdVPNidYoUGd1qjJ403upT8jZBMcs9oyIqPM11hjsbBSIBs6u_5chLFgfVG4mejWXsgPfu_9y0N8bJxBpErgmUNG7fARqfhlQfGNLvemBM4ALBIIQtp1MG4TRaFWaGLDvqRFdhCmezlqGrCMgWMXBj7CGZDysg-TDAt24y1EddpxoxP890kL_wo4ggi8Pc5lqtBPHTTMhwkZH45PhexYqQ-Vy8-aF5Sl8kDbpffkx6-Kq0GdoDqOmvcskgXS7JxQ",
                    }}
                    style={{ width: "100%", height: "100%" }}
                    imageStyle={{ borderRadius: borderRadius.xl, opacity: 0.4 }}
                  >
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(39, 41, 53, 0.85)",
                      }}
                    />
                    <YStack
                      flex={1}
                      padding={spacing.xl}
                      justifyContent="space-between"
                    >
                      <YStack
                        width={40}
                        height={40}
                        borderRadius={borderRadius.md}
                        style={{ backgroundColor: colors.primaryOpacity20 }}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Ionicons
                          name={getIconName(
                            getResource("INTERACTIVE_MAP")?.iconName ?? null,
                            "map",
                          )}
                          size={24}
                          color={colors.primary}
                        />
                      </YStack>
                      <Text
                        style={{
                          fontSize: typography.lg,
                          fontWeight: typography.bold,
                          color: colors.white,
                        }}
                      >
                        {getResource("INTERACTIVE_MAP")?.label ??
                          "Interactive Map"}
                      </Text>
                      <Text
                        style={{
                          fontSize: typography.xs,
                          color: colors.slate400,
                        }}
                      >
                        Navigate trails & lifts
                      </Text>
                      <XStack alignItems="center" gap={spacing.xs}>
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: typography.bold,
                            color: colors.primary,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                          }}
                        >
                          Explore Map
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={colors.primary}
                        />
                      </XStack>
                    </YStack>
                  </ImageBackground>
                </TouchableOpacity>
              )}

              {/* PDF Map */}
              {getResource("PDF_MAP") && (
                <TouchableOpacity
                  style={{
                    flex: 1,
                    height: 176,
                    borderRadius: borderRadius.xl,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: colors.primaryOpacity20,
                  }}
                  onPress={() => void handlePdfMapPress()}
                  activeOpacity={0.8}
                  disabled={mapPdfDownload.status === "loading"}
                >
                  <YStack
                    flex={1}
                    style={{ backgroundColor: colors.cardDark }}
                    padding={spacing.xl}
                    justifyContent="space-between"
                  >
                    <YStack
                      width={48}
                      height={48}
                      borderRadius={borderRadius.md}
                      style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Ionicons
                        name={getIconName(
                          getResource("PDF_MAP")?.iconName ?? null,
                          "document-text",
                        )}
                        size={28}
                        color={colors.white}
                      />
                    </YStack>
                    <YStack gap={4}>
                      <XStack alignItems="center" gap={spacing.xs}>
                        <Text
                          style={{
                            fontSize: typography.lg,
                            fontWeight: typography.bold,
                            color: colors.white,
                          }}
                        >
                          {getResource("PDF_MAP")?.label ?? "PDF Map"}
                        </Text>
                        {mapPdfDownload.file ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color="#10b981"
                          />
                        ) : (
                          <Ionicons
                            name="download"
                            size={14}
                            color={colors.slate400}
                          />
                        )}
                      </XStack>
                      <Text
                        style={{
                          fontSize: 10,
                          color: colors.slate400,
                          lineHeight: 14,
                        }}
                      >
                        {mapPdfDownload.status === "loading"
                          ? "Downloading..."
                          : mapPdfDownload.file
                            ? "Downloaded"
                            : "Tap to Download"}
                      </Text>
                    </YStack>
                  </YStack>
                </TouchableOpacity>
              )}
            </XStack>

            {/* Grid Row */}
            <XStack gap={spacing.md}>
              {/* Infopak Tile */}
              {getResource("INFOPACK") && (
                <TouchableOpacity
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    backgroundColor: colors.cardDark,
                    borderRadius: borderRadius.xl,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.05)",
                    padding: spacing.xl,
                    justifyContent: "space-between",
                  }}
                  onPress={() => void handleInfopakPress()}
                  activeOpacity={0.8}
                  disabled={infopackDownload.status === "loading"}
                >
                  <YStack
                    width={48}
                    height={48}
                    borderRadius={borderRadius.md}
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Ionicons
                      name={getIconName(
                        getResource("INFOPACK")?.iconName ?? null,
                        "document-text",
                      )}
                      size={28}
                      color={colors.white}
                    />
                  </YStack>
                  <YStack gap={4}>
                    <XStack alignItems="center" gap={spacing.xs}>
                      <Text
                        style={{
                          fontSize: typography.base,
                          fontWeight: typography.bold,
                          color: colors.white,
                        }}
                      >
                        {getResource("INFOPACK")?.label ?? "Infopack"}
                      </Text>
                      {infopackDownload.file ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color="#10b981"
                        />
                      ) : (
                        <Ionicons
                          name="download"
                          size={14}
                          color={colors.slate400}
                        />
                      )}
                    </XStack>
                    <Text
                      style={{
                        fontSize: 10,
                        color: colors.slate400,
                        lineHeight: 14,
                      }}
                    >
                      {infopackDownload.status === "loading"
                        ? "Downloading..."
                        : infopackDownload.file
                          ? "Downloaded"
                          : "Tap to Download"}
                    </Text>
                  </YStack>
                </TouchableOpacity>
              )}

              {/* WhatsApp Tile */}
              {getResource("WHATSAPP") && (
                <TouchableOpacity
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    backgroundColor: colors.cardDark,
                    borderRadius: borderRadius.xl,
                    borderWidth: 1,
                    borderColor: colors.magentaOpacity30,
                    padding: spacing.xl,
                    justifyContent: "space-between",
                    shadowColor: colors.accentMagenta,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.2,
                    shadowRadius: 20,
                    elevation: 4,
                  }}
                  onPress={handleWhatsAppPress}
                  activeOpacity={0.8}
                >
                  <YStack
                    width={48}
                    height={48}
                    borderRadius={borderRadius.md}
                    style={{ backgroundColor: colors.magentaOpacity10 }}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Ionicons
                      name={getIconName(
                        getResource("WHATSAPP")?.iconName ?? null,
                        "chatbubble",
                      )}
                      size={28}
                      color={colors.accentMagenta}
                    />
                  </YStack>
                  <YStack gap={4}>
                    <Text
                      style={{
                        fontSize: typography.base,
                        fontWeight: typography.bold,
                        color: colors.white,
                      }}
                    >
                      {getResource("WHATSAPP")?.label ?? "WhatsApp"}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        color: colors.accentMagenta,
                        fontWeight: typography.medium,
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                      }}
                    >
                      Join Trip Community
                    </Text>
                  </YStack>
                </TouchableOpacity>
              )}
            </XStack>

            {/* Section Header */}
            <XStack
              alignItems="center"
              gap={spacing.md}
              paddingTop={spacing.lg}
            >
              <Text
                style={{
                  fontSize: typography.xs,
                  fontWeight: typography.bold,
                  color: colors.slate500,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                Essential Resources
              </Text>
              <YStack
                flex={1}
                height={1}
                style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
              />
            </XStack>

            {/* Smaller Action Tiles */}
            <XStack gap={spacing.md}>
              {getResource("SOS") && (
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(39, 41, 53, 0.5)",
                    borderRadius: borderRadius.lg,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.05)",
                    padding: spacing.lg,
                    alignItems: "center",
                    gap: spacing.sm,
                  }}
                  onPress={handleSosPress}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={getIconName(
                      getResource("SOS")?.iconName ?? null,
                      "alert-circle",
                    )}
                    size={24}
                    color={colors.primary}
                  />
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: typography.bold,
                      color: colors.white,
                      textTransform: "uppercase",
                    }}
                  >
                    {getResource("SOS")?.label ?? "SOS"}
                  </Text>
                </TouchableOpacity>
              )}

              {insurance && (
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(39, 41, 53, 0.5)",
                    borderRadius: borderRadius.lg,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.05)",
                    padding: spacing.lg,
                    alignItems: "center",
                    gap: spacing.sm,
                  }}
                  onPress={handleInsurancePress}
                  activeOpacity={0.8}
                >
                  <Ionicons name="medkit" size={24} color={colors.primary} />
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: typography.bold,
                      color: colors.white,
                      textTransform: "uppercase",
                    }}
                  >
                    {insurance.label ?? "Insurance"}
                  </Text>
                </TouchableOpacity>
              )}
            </XStack>
          </YStack>
        </ScrollView>

        {/* Map Modal with WebView */}
        <FullScreenModal
          visible={isMapModalVisible}
          title={getResource("INTERACTIVE_MAP")?.label ?? "Interactive Map"}
          onClose={() => setIsMapModalVisible(false)}
        >
          <WebView
            source={{
              uri:
                getResource("INTERACTIVE_MAP")?.url ??
                "https://infosnow.ch/~apgmontagne/?id=45&lang=en&tab=map-wi&sat=&tv=",
            }}
            style={{
              flex: 1,
              backgroundColor: colors.backgroundDark,
            }}
            startInLoadingState={true}
            scalesPageToFit={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </FullScreenModal>

        {/* PDF Modal */}
        <FullScreenModal
          visible={isPdfModalVisible}
          title={pdfModalTitle}
          onClose={() => {
            setIsPdfModalVisible(false);
            setPdfModalUri(null);
          }}
        >
          {isPdfModalVisible && pdfModalUri && (
            <Pdf
              key={pdfModalUri}
              source={{ uri: pdfModalUri }}
              style={{
                flex: 1,
                width: Dimensions.get("window").width,
                backgroundColor: colors.backgroundDark,
              }}
              trustAllCerts={false}
              minScale={1}
              maxScale={8}
              onLoadComplete={() => {
                // PDF loaded successfully
              }}
              onError={() => {
                Alert.alert("Error", "Could not load PDF");
              }}
              enablePaging={false}
            />
          )}
        </FullScreenModal>

        {/* Insurance Modal */}
        {insurance && (
          <FullScreenModal
            visible={isInsuranceModalVisible}
            title={insurance.label}
            onClose={() => setIsInsuranceModalVisible(false)}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                padding: spacing.lg,
                paddingBottom: spacing.xxxl,
                gap: spacing.md,
              }}
              showsVerticalScrollIndicator={false}
            >
              <XStack gap={spacing.md}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    gap: spacing.sm,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: spacing.md,
                    borderRadius: borderRadius.full,
                    backgroundColor: colors.primary,
                  }}
                  onPress={handleInsuranceCallPress}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="call"
                    size={18}
                    color={colors.backgroundDark}
                  />
                  <Text
                    style={{
                      fontSize: typography.xs,
                      fontWeight: typography.bold,
                      color: colors.backgroundDark,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Zadzwoń
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    gap: spacing.sm,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: spacing.md,
                    borderRadius: borderRadius.full,
                    borderWidth: 1,
                    borderColor: colors.primaryOpacity30,
                    backgroundColor: "rgba(39, 41, 53, 0.4)",
                  }}
                  onPress={handleInsuranceCopyPress}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="copy-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text
                    style={{
                      fontSize: typography.xs,
                      fontWeight: typography.bold,
                      color: colors.primary,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Kopiuj numer
                  </Text>
                </TouchableOpacity>
              </XStack>

              {insurance.steps?.map(
                (step: {
                  id: string;
                  title: string;
                  text: string;
                  requiredInfo?: string[];
                  exampleCall?: string;
                  additionalText?: string;
                }) => (
                  <YStack
                    key={step.id}
                    borderRadius={borderRadius.lg}
                    borderWidth={1}
                    borderColor="rgba(255, 255, 255, 0.06)"
                    style={{ backgroundColor: "rgba(39, 41, 53, 0.5)" }}
                    padding={spacing.lg}
                    gap={spacing.sm}
                  >
                    <Text
                      style={{
                        fontSize: typography.xs,
                        fontWeight: typography.bold,
                        color: colors.primary,
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                      }}
                    >
                      {step.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: typography.sm,
                        color: colors.white,
                        lineHeight: 22,
                      }}
                    >
                      {step.text}
                    </Text>

                    {step.requiredInfo && step.requiredInfo.length > 0 && (
                      <>
                        <Text
                          style={{
                            fontSize: typography.xs,
                            fontWeight: typography.bold,
                            color: colors.slate400,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                          }}
                        >
                          Podczas rozmowy konieczne będzie podanie:
                        </Text>
                        {step.requiredInfo.map(
                          (info: string, index: number) => (
                            <Text
                              key={index}
                              style={{
                                fontSize: typography.sm,
                                color: colors.white,
                                lineHeight: 22,
                                paddingLeft: spacing.sm,
                              }}
                            >
                              - {info}
                            </Text>
                          ),
                        )}
                      </>
                    )}

                    {step.exampleCall && (
                      <>
                        <Text
                          style={{
                            fontSize: typography.xs,
                            fontWeight: typography.bold,
                            color: colors.slate400,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                          }}
                        >
                          Następnie krótko opiszcie sytuację, np.:
                        </Text>
                        <Text
                          style={{
                            fontSize: typography.sm,
                            color: colors.primaryOpacity80,
                            lineHeight: 22,
                            fontStyle: "italic",
                          }}
                        >
                          "{step.exampleCall}"
                        </Text>
                      </>
                    )}

                    {step.additionalText && (
                      <Text
                        style={{
                          fontSize: typography.sm,
                          color: colors.white,
                          lineHeight: 22,
                        }}
                      >
                        {step.additionalText}
                      </Text>
                    )}
                  </YStack>
                ),
              )}

              {insurance.hospitalName && (
                <YStack
                  borderRadius={borderRadius.lg}
                  borderWidth={1}
                  borderColor="rgba(255, 255, 255, 0.06)"
                  style={{ backgroundColor: "rgba(39, 41, 53, 0.5)" }}
                  padding={spacing.lg}
                  gap={spacing.sm}
                >
                  <Text
                    style={{
                      fontSize: typography.xs,
                      fontWeight: typography.bold,
                      color: colors.primary,
                      textTransform: "uppercase",
                      letterSpacing: 1.5,
                    }}
                  >
                    Szpital
                  </Text>
                  <Text
                    style={{
                      fontSize: typography.sm,
                      color: colors.white,
                      lineHeight: 22,
                    }}
                  >
                    Najbliższy szpital to {insurance.hospitalName}
                    {insurance.hospitalAddress &&
                      `, znajduje się w ${insurance.hospitalAddress}`}
                    {insurance.hospitalDistance &&
                      ` (${insurance.hospitalDistance})`}
                  </Text>
                </YStack>
              )}
            </ScrollView>
          </FullScreenModal>
        )}
      </YStack>
    </>
  );
}
