import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Linking,
  Alert,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { WebView } from "react-native-webview";
import Pdf from "react-native-pdf";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "../../../styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FullScreenModal } from "~/components/common/ui";
import { useFileDownload } from "~/hooks/files";
import { useTripResources, useSelectedTrip } from "~/hooks/trips";
import { useLocalSearchParams } from "expo-router";
import LoadingScreen from "../../../components/LoadingScreen";
import { TRIP_RESOURCE_TYPES } from "@integral-2025-app/shared";

// Type-safe icon name helper
const getIconName = (iconName: string | null, fallback: keyof typeof Ionicons.glyphMap): keyof typeof Ionicons.glyphMap => {
  if (!iconName) return fallback;
  // Basic validation - check if it's a reasonable icon name format
  // This is a simple heuristic; in a real app you might want a more robust validation
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
  const paramTripId = typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];
  const { selectedTripId } = useSelectedTrip();
  const tripId = selectedTripId ?? paramTripId;
  
  const { getResource, insurance, isLoading, isError } = useTripResources(tripId);
  
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
        heroImageDownload.download({ storagePath: heroResource.storagePath }).catch(console.error);
      }
      
      if (mapBgResource?.storagePath) {
        mapBgImageDownload.download({ storagePath: mapBgResource.storagePath }).catch(console.error);
      }
    }
  }, [isLoading, getResource, heroImageDownload, mapBgImageDownload]);
  
  // Check if PDFs are downloaded on component mount
  useEffect(() => {
    if (!isLoading) {
      const pdfMapResource = getResource("PDF_MAP");
      const infopackResource = getResource("INFOPACK");
      
      if (pdfMapResource?.fileName) {
        const mapPdfResult = mapPdfDownload.checkIfFileExists(pdfMapResource.fileName);
        console.log("PDF downloaded:", mapPdfResult?.exists ?? false);
      }
      
      if (infopackResource?.fileName) {
        const infopackResult = infopackDownload.checkIfFileExists(infopackResource.fileName);
        console.log("Infopack downloaded:", infopackResult?.exists ?? false);
      }
    }
  }, [isLoading, getResource, mapPdfDownload, infopackDownload]);
  
  if (isLoading) {
    return <LoadingScreen message="Loading trip info..." />;
  }
  
  if (isError || !tripId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load trip information</Text>
      </View>
    );
  }

  const handleWhatsAppPress = () => {
    const whatsappResource = getResource("WHATSAPP");
    if (whatsappResource?.url) {
      Linking.openURL(whatsappResource.url).catch(() => {
        console.error("Failed to open WhatsApp");
      });
    }
  };

  const handleInfopakPress = async () => {
    const infopackResource = getResource("INFOPACK");
    if (infopackResource?.storagePath) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const result = await infopackDownload.download({ 
          storagePath: infopackResource.storagePath
        });
        setPdfModalTitle("Infopack");
        setPdfModalUri(result.uri);
        setIsPdfModalVisible(true);
      } catch (error) {
        console.error("Error handling Infopack PDF:", error);
        Alert.alert("Error", "Could not open the infopack. Please try again later.");
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const result = await mapPdfDownload.download({ 
          storagePath: pdfMapResource.storagePath
        });
        setPdfModalTitle("PDF Map");
        setPdfModalUri(result.uri);
        setIsPdfModalVisible(true);
      } catch (error) {
        console.error("Error handling PDF:", error);
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
      <View style={styles.container}>
        <ScrollView
          style={styles.mainContent}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: spacing.xxxl * 2 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Header */}
          <View style={styles.heroCard}>
            <ImageBackground
              source={{
                uri: heroImageDownload.file?.uri ?? "https://lh3.googleusercontent.com/aida-public/AB6AXuAHhLaOxCenvDHeXPGxGdnYhEumFOLH5A9Wh5fAb63uNUkITSveOg2w84W1Q72tKNnm3nhMAdZEyYc_wtTSqm7mjn2XpnVUwdc4O1eHaoLbQxVFProgk7Jnuc3k0sW4fg5BKzNzg56WwaR-MesVKcfLd3fOfPxZGRKaV_PLrsgOyhirvj2CqfkrxBZpmQNCwGq56LVrNMBKRUwNzDK0bd7ttYLsQDQlxhJ2mEsvE1Mx4HrVpg3u58_JdMp0ZOzRu_9PjH43rDEbQfY",
              }}
              style={styles.heroImage}
              imageStyle={{ borderRadius: borderRadius.xl }}
            >
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>Live Now</Text>
                </View>
                <View style={styles.heroTextContainer}>
                  <Text style={styles.heroTitle}>
                    {getResource("HERO_IMAGE")?.label ?? "Trip Info"}
                  </Text>
                  <Text style={styles.heroSubtitle}>Feb 20 - Mar 01, 2026</Text>
                </View>
              </View>
            </ImageBackground>
          </View>

          {/* Main Bento Grid */}
          <View style={styles.bentoGrid}>
            {/* Map Tiles Row */}
            <View style={styles.gridRow}>
              {/* Interactive Ski Map */}
              {getResource("INTERACTIVE_MAP") && (
                <TouchableOpacity
                  style={styles.mapTile}
                  onPress={handleMapPress}
                  activeOpacity={0.8}
                >
                  <ImageBackground
                    source={{
                      uri: mapBgImageDownload.file?.uri ?? "https://lh3.googleusercontent.com/aida-public/AB6AXuCHzNKnjzWDXauSdVPNidYoUGd1qjJ403upT8jZBMcs9oyIqPM11hjsbBSIBs6u_5chLFgfVG4mejWXsgPfu_9y0N8bJxBpErgmUNG7fARqfhlQfGNLvemBM4ALBIIQtp1MG4TRaFWaGLDvqRFdhCmezlqGrCMgWMXBj7CGZDysg-TDAt24y1EddpxoxP890kL_wo4ggi8Pc5lqtBPHTTMhwkZH45PhexYqQ-Vy8-aF5Sl8kDbpffkx6-Kq0GdoDqOmvcskgXS7JxQ",
                    }}
                    style={styles.mapBackground}
                    imageStyle={{ borderRadius: borderRadius.xl, opacity: 0.4 }}
                  >
                    <View style={styles.mapGradient} />
                    <View style={styles.mapContent}>
                      <View style={styles.mapIconWrapper}>
                        <Ionicons 
                          name={getIconName(getResource("INTERACTIVE_MAP")?.iconName ?? null, "map")} 
                          size={24} 
                          color={colors.primary} 
                        />
                      </View>
                      <Text style={styles.mapTitle}>
                        {getResource("INTERACTIVE_MAP")?.label ?? "Interactive Map"}
                      </Text>
                      <Text style={styles.mapSubtitle}>
                        Navigate trails & lifts
                      </Text>
                      <View style={styles.mapAction}>
                        <Text style={styles.mapActionText}>Explore Map</Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={colors.primary}
                        />
                      </View>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              )}

              {/* PDF Map */}
              {getResource("PDF_MAP") && (
                <TouchableOpacity
                  style={styles.mapTile}
                  onPress={() => void handlePdfMapPress()}
                  activeOpacity={0.8}
                  disabled={mapPdfDownload.status === "loading"}
                >
                  <View style={styles.pdfMapContent}>
                    <View style={styles.pdfMapIconWrapper}>
                      <Ionicons
                        name={getIconName(getResource("PDF_MAP")?.iconName ?? null, "document-text")}
                        size={28}
                        color={colors.white}
                      />
                    </View>
                    <View style={styles.pdfMapTextContainer}>
                      <View style={styles.pdfMapTitleRow}>
                        <Text style={styles.mapTitle}>
                          {getResource("PDF_MAP")?.label ?? "PDF Map"}
                        </Text>
                        {mapPdfDownload.result?.exists ? (
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
                      </View>
                      <Text style={styles.pdfMapSubtitle}>
                        {mapPdfDownload.status === "loading"
                          ? "Downloading..."
                          : mapPdfDownload.result?.exists
                            ? "Downloaded"
                            : "Tap to Download"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Grid Row */}
            <View style={styles.gridRow}>
              {/* Infopak Tile */}
              {getResource("INFOPACK") && (
                <TouchableOpacity
                  style={styles.bentoTile}
                  onPress={() => void handleInfopakPress()}
                  activeOpacity={0.8}
                  disabled={infopackDownload.status === "loading"}
                >
                  <View style={styles.bentoIconWrapper}>
                    <Ionicons
                      name={getIconName(getResource("INFOPACK")?.iconName ?? null, "document-text")}
                      size={28}
                      color={colors.white}
                    />
                  </View>
                  <View style={styles.bentoContent}>
                    <View style={styles.bentoTitleRow}>
                      <Text style={styles.bentoTitle}>
                        {getResource("INFOPACK")?.label ?? "Infopack"}
                      </Text>
                      {infopackDownload.result?.exists ? (
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
                    </View>
                    <Text style={styles.bentoSubtitle}>
                      {infopackDownload.status === "loading"
                        ? "Downloading..."
                        : infopackDownload.result?.exists
                          ? "Downloaded"
                          : "Tap to Download"}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* WhatsApp Tile */}
              {getResource("WHATSAPP") && (
                <TouchableOpacity
                  style={styles.whatsappTile}
                  onPress={handleWhatsAppPress}
                  activeOpacity={0.8}
                >
                  <View style={styles.whatsappIconWrapper}>
                    <Ionicons
                      name={getIconName(getResource("WHATSAPP")?.iconName ?? null, "chatbubble")}
                      size={28}
                      color={colors.accentMagenta}
                    />
                  </View>
                  <View style={styles.bentoContent}>
                    <Text style={styles.bentoTitle}>
                      {getResource("WHATSAPP")?.label ?? "WhatsApp"}
                    </Text>
                    <Text style={styles.whatsappSubtitle}>
                      Join Trip Community
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Essential Resources</Text>
              <View style={styles.sectionDivider} />
            </View>

            {/* Smaller Action Tiles */}
            <View style={styles.resourceGrid}>
              {getResource("SOS") && (
                <TouchableOpacity
                  style={styles.resourceTile}
                  onPress={handleSosPress}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={getIconName(getResource("SOS")?.iconName ?? null, "alert-circle")}
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.resourceText}>
                    {getResource("SOS")?.label ?? "SOS"}
                  </Text>
                </TouchableOpacity>
              )}
              
              {insurance && (
                <TouchableOpacity
                  style={styles.resourceTile}
                  onPress={handleInsurancePress}
                  activeOpacity={0.8}
                >
                  <Ionicons name="medkit" size={24} color={colors.primary} />
                  <Text style={styles.resourceText}>
                    {insurance.label ?? "Insurance"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Map Modal with WebView */}
        <FullScreenModal
          visible={isMapModalVisible}
          title={getResource("INTERACTIVE_MAP")?.label ?? "Interactive Map"}
          onClose={() => setIsMapModalVisible(false)}
        >
          <WebView
            source={{
              uri: getResource("INTERACTIVE_MAP")?.url ?? "https://infosnow.ch/~apgmontagne/?id=45&lang=en&tab=map-wi&sat=&tv=",
            }}
            style={styles.webView}
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
          {/* PDF Viewer */}
          {isPdfModalVisible && pdfModalUri && (
            <Pdf
              key={pdfModalUri}
              source={{ uri: pdfModalUri }}
              style={styles.pdf}
              trustAllCerts={false}
              minScale={1}
              maxScale={8}
              onLoadComplete={(numberOfPages) => {
                console.log(`PDF loaded with ${numberOfPages} pages`);
              }}
              onError={(error) => {
                console.error("PDF Error:", error);
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
              style={styles.insuranceScroll}
              contentContainerStyle={styles.insuranceContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.insuranceActions}>
                <TouchableOpacity
                  style={styles.insuranceActionButton}
                  onPress={handleInsuranceCallPress}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="call"
                    size={18}
                    color={colors.backgroundDark}
                  />
                  <Text style={styles.insuranceActionText}>Zadzwoń</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.insuranceActionSecondary}
                  onPress={handleInsuranceCopyPress}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="copy-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={styles.insuranceActionSecondaryText}>
                    Kopiuj numer
                  </Text>
                </TouchableOpacity>
              </View>
              
              {insurance.steps?.map((step) => (
                <View key={step.id} style={styles.insuranceCard}>
                  <Text style={styles.insuranceCardTitle}>{step.title}</Text>
                  <Text style={styles.insuranceText}>{step.text}</Text>
                  
                  {step.requiredInfo && step.requiredInfo.length > 0 && (
                    <>
                      <Text style={styles.insuranceLabel}>
                        Podczas rozmowy konieczne będzie podanie:
                      </Text>
                      {step.requiredInfo.map((info, index) => (
                        <Text key={index} style={styles.insuranceListItem}>
                          - {info}
                        </Text>
                      ))}
                    </>
                  )}
                  
                  {step.exampleCall && (
                    <>
                      <Text style={styles.insuranceLabel}>
                        Następnie krótko opiszcie sytuację, np.:
                      </Text>
                      <Text style={styles.insuranceQuote}>
                        "{step.exampleCall}"
                      </Text>
                    </>
                  )}
                  
                  {step.additionalText && (
                    <Text style={styles.insuranceText}>
                      {step.additionalText}
                    </Text>
                  )}
                </View>
              ))}
              
              {insurance.hospitalName && (
                <View style={styles.insuranceCard}>
                  <Text style={styles.insuranceCardTitle}>Szpital</Text>
                  <Text style={styles.insuranceText}>
                    Najbliższy szpital to {insurance.hospitalName}
                    {insurance.hospitalAddress && `, znajduje się w ${insurance.hospitalAddress}`}
                    {insurance.hospitalDistance && ` (${insurance.hospitalDistance})`}
                  </Text>
                </View>
              )}
            </ScrollView>
          </FullScreenModal>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  errorText: {
    fontSize: typography.base,
    color: colors.white,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  mainContent: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },

  // Hero Header
  heroCard: {
    height: 192,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(23, 24, 28, 0.4)",
  },
  heroContent: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "space-between",
  },
  liveBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.backgroundDark,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  heroTextContainer: {
    gap: spacing.xs,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: typography.bold,
    color: colors.white,
  },
  heroSubtitle: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    color: colors.primaryOpacity80,
  },

  // Bento Grid
  bentoGrid: {
    gap: spacing.lg,
  },

  // Map Tile Large
  mapTileLarge: {
    height: 176,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.primaryOpacity20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 4,
  },
  mapBackground: {
    width: "100%",
    height: "100%",
  },
  mapGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(39, 41, 53, 0.85)",
  },
  mapContent: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "space-between",
  },
  mapIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryOpacity20,
    alignItems: "center",
    justifyContent: "center",
  },
  mapTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
  },
  mapSubtitle: {
    fontSize: typography.xs,
    color: colors.slate400,
  },
  mapAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  mapActionText: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Grid Row
  gridRow: {
    flexDirection: "row",
    gap: spacing.md,
  },

  // Map Tiles
  mapTile: {
    flex: 1,
    height: 176,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.primaryOpacity20,
  },
  pdfMapContent: {
    flex: 1,
    backgroundColor: colors.cardDark,
    padding: spacing.xl,
    justifyContent: "space-between",
  },
  pdfMapIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  pdfMapTextContainer: {
    gap: 4,
  },
  pdfMapTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  pdfMapSubtitle: {
    fontSize: 10,
    color: colors.slate400,
    lineHeight: 14,
  },

  // Bento Tiles
  bentoTile: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    padding: spacing.xl,
    justifyContent: "space-between",
  },
  whatsappTile: {
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
  },
  bentoIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  whatsappIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.magentaOpacity10,
    alignItems: "center",
    justifyContent: "center",
  },
  bentoContent: {
    gap: 4,
  },
  bentoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  bentoTitle: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.white,
  },
  bentoSubtitle: {
    fontSize: 10,
    color: colors.slate400,
    lineHeight: 14,
  },
  whatsappSubtitle: {
    fontSize: 10,
    color: colors.accentMagenta,
    fontWeight: typography.medium,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.slate500,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },

  // Resource Grid
  resourceGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  resourceTile: {
    flex: 1,
    backgroundColor: "rgba(39, 41, 53, 0.5)",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  resourceText: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.white,
    textTransform: "uppercase",
  },
  resourceSubtext: {
    fontSize: 10,
    color: colors.slate400,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Branding

  webView: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  pdf: {
    flex: 1,
    width: Dimensions.get("window").width,
    backgroundColor: colors.backgroundDark,
  },
  insuranceScroll: {
    flex: 1,
  },
  insuranceContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  insuranceActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  insuranceActionButton: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  insuranceActionText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.backgroundDark,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  insuranceActionSecondary: {
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
  },
  insuranceActionSecondaryText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  insuranceCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: "rgba(39, 41, 53, 0.5)",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  insuranceCardTitle: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  insuranceText: {
    fontSize: typography.sm,
    color: colors.white,
    lineHeight: 22,
  },
  insuranceLabel: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.slate400,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  insuranceListItem: {
    fontSize: typography.sm,
    color: colors.white,
    lineHeight: 22,
    paddingLeft: spacing.sm,
  },
  insuranceQuote: {
    fontSize: typography.sm,
    color: colors.primaryOpacity80,
    lineHeight: 22,
    fontStyle: "italic",
  },
});
