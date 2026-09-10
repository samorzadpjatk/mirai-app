import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Pdf from "react-native-pdf";
import { WebView } from "react-native-webview";
import { DeckBackground } from "~/components/common/DeckBackground";
import { EmptyState, FullScreenModal } from "~/components/common/ui";
import { InteractiveMapTile, TripInfoHero, getIconName } from "~/components/tripInfo";
import { useFileDownload } from "~/hooks/files";
import { useSelectedTrip, useTripDetails, useTripResources } from "~/hooks/trips";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";
import { formatTripDateRange, getTripStatus } from "~/utils/trip";
import LoadingScreen from "../../../components/LoadingScreen";
import { borderRadius, colors, spacing, typography } from "../../../styles";

export default function TripInfoScreen() {
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [isPdfModalVisible, setIsPdfModalVisible] = useState(false);
  const [isInsuranceModalVisible, setIsInsuranceModalVisible] = useState(false);
  const [pdfModalTitle, setPdfModalTitle] = useState("");
  const [pdfModalUri, setPdfModalUri] = useState<string>("");
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();
  const params = useLocalSearchParams();
  const paramTripId = typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];
  const { selectedTripId } = useSelectedTrip();
  const tripId = selectedTripId ?? paramTripId;

  const { getResource, resources, insurance, isLoading, isError } = useTripResources(tripId);
  const { trip } = useTripDetails(tripId);

  // File download hooks for images and PDFs
  const heroImageDownload = useFileDownload();
  const mapBgImageDownload = useFileDownload();
  const mapPdfDownload = useFileDownload();
  const infopackDownload = useFileDownload();

  const { download: downloadHero } = heroImageDownload;
  const { download: downloadMapBg } = mapBgImageDownload;

  useEffect(() => {
    if (!isLoading) {
      const heroResource = getResource("HERO_IMAGE");
      const mapBgResource = getResource("MAP_BG_IMAGE");

      if (heroResource?.storagePath) {
        downloadHero({ storagePath: heroResource.storagePath }).catch(() => {
          /* no-op */
        });
      }

      if (mapBgResource?.storagePath) {
        downloadMapBg({ storagePath: mapBgResource.storagePath }).catch(() => {
          /* no-op */
        });
      }
    }
  }, [tripId, isLoading, getResource, downloadHero, downloadMapBg]);

  // Check if PDFs are downloaded on component mount
  useEffect(() => {
    if (!isLoading) {
      getResource("PDF_MAP");
      getResource("INFOPACK");

      // Note: File existence checking will be handled by the download hook's cache mechanism
    }
  }, [isLoading, getResource]);

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

  const heroResource = getResource("HERO_IMAGE");
  const interactiveMapResource = getResource("INTERACTIVE_MAP");
  const pdfMapResource = getResource("PDF_MAP");
  const infopackResource = getResource("INFOPACK");
  const whatsappResource = getResource("WHATSAPP");
  const sosResource = getResource("SOS");

  const handleWhatsAppPress = () => {
    if (whatsappResource?.url) {
      Linking.openURL(whatsappResource.url).catch(() => {
        /* no-op */
      });
    }
  };

  const handleInfopakPress = async () => {
    if (infopackResource?.storagePath) {
      try {
        const result = await infopackDownload.download({
          storagePath: infopackResource.storagePath,
        });
        setPdfModalTitle(infopackResource.label || "Infopack");
        setPdfModalUri(result.uri);
        setIsPdfModalVisible(true);
      } catch {
        Alert.alert("Error", "Could not open the infopack. Please try again later.");
      }
    }
  };

  const handleSosPress = () => {
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
    if (pdfMapResource?.storagePath) {
      try {
        const result = await mapPdfDownload.download({
          storagePath: pdfMapResource.storagePath,
        });
        setPdfModalTitle(pdfMapResource.label || "PDF Map");
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

  const interactiveMapUrl = interactiveMapResource?.url ?? "";
  const heroTitle = trip?.name ?? (heroResource?.label || "Trip Info");
  const heroSubtitle = formatTripDateRange(trip?.startDate, trip?.endDate);
  const heroBadge = trip ? getTripStatus(trip.startDate, trip.endDate) : null;
  const hasResources = resources.length > 0 || Boolean(insurance);
  const hasEssentialResources = Boolean(sosResource) || Boolean(insurance);

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        <DeckBackground />
        <ScrollView
          style={styles.mainContent}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: 96 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Header */}
          <TripInfoHero
            title={heroTitle}
            subtitle={heroSubtitle}
            badge={heroBadge}
            imageUri={heroImageDownload.file?.uri}
          />

          {hasResources ? null : (
            <EmptyState
              icon="information-circle-outline"
              title="No trip info yet"
              subtitle="Your organisers haven't published any resources for this trip. Check back closer to departure."
            />
          )}

          {/* Main Bento Grid */}
          <View style={styles.bentoGrid}>
            {/* Map Tiles Row */}
            <View style={styles.gridRow}>
              {/* Interactive Map */}
              {interactiveMapUrl ? (
                <InteractiveMapTile
                  label={interactiveMapResource?.label || "Interactive Map"}
                  subtitle={interactiveMapResource?.description}
                  iconName={getIconName(interactiveMapResource?.iconName, "map")}
                  backgroundUri={mapBgImageDownload.file?.uri}
                  onPress={handleMapPress}
                />
              ) : null}

              {/* PDF Map */}
              {pdfMapResource ? (
                <TouchableOpacity
                  testID="trip-info-pdf-map-tile"
                  style={styles.mapTile}
                  onPress={() => void handlePdfMapPress()}
                  activeOpacity={0.8}
                  disabled={mapPdfDownload.status === "loading"}
                >
                  <View style={styles.pdfMapContent}>
                    <View style={styles.pdfMapIconWrapper}>
                      <Ionicons
                        name={getIconName(pdfMapResource.iconName, "document-text")}
                        size={28}
                        color={colors.white}
                      />
                    </View>
                    <View style={styles.pdfMapTextContainer}>
                      <View style={styles.pdfMapTitleRow}>
                        <Text style={styles.mapTitle}>{pdfMapResource.label || "PDF Map"}</Text>
                        {mapPdfDownload.file ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color={colors.statusCompleted}
                          />
                        ) : (
                          <Ionicons name="download" size={14} color={colors.slate400} />
                        )}
                      </View>
                      <Text style={styles.pdfMapSubtitle}>
                        {mapPdfDownload.status === "loading"
                          ? "Downloading..."
                          : mapPdfDownload.file
                            ? "Downloaded"
                            : "Tap to Download"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Grid Row */}
            <View style={styles.gridRow}>
              {/* Infopak Tile */}
              {infopackResource ? (
                <TouchableOpacity
                  testID="trip-info-infopack-tile"
                  style={styles.bentoTile}
                  onPress={() => void handleInfopakPress()}
                  activeOpacity={0.8}
                  disabled={infopackDownload.status === "loading"}
                >
                  <View style={styles.bentoIconWrapper}>
                    <Ionicons
                      name={getIconName(infopackResource.iconName, "document-text")}
                      size={28}
                      color={colors.white}
                    />
                  </View>
                  <View style={styles.bentoContent}>
                    <View style={styles.bentoTitleRow}>
                      <Text style={styles.bentoTitle}>{infopackResource.label || "Infopack"}</Text>
                      {infopackDownload.file ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={colors.statusCompleted}
                        />
                      ) : (
                        <Ionicons name="download" size={14} color={colors.slate400} />
                      )}
                    </View>
                    <Text style={styles.bentoSubtitle}>
                      {infopackDownload.status === "loading"
                        ? "Downloading..."
                        : infopackDownload.file
                          ? "Downloaded"
                          : "Tap to Download"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : null}

              {/* WhatsApp Tile */}
              {whatsappResource?.url ? (
                <TouchableOpacity
                  testID="trip-info-whatsapp-tile"
                  style={styles.whatsappTile}
                  onPress={handleWhatsAppPress}
                  activeOpacity={0.8}
                >
                  <View style={styles.whatsappIconWrapper}>
                    <Ionicons
                      name={getIconName(whatsappResource.iconName, "chatbubble")}
                      size={28}
                      color={palette.accentMagenta}
                    />
                  </View>
                  <View style={styles.bentoContent}>
                    <Text style={styles.bentoTitle}>{whatsappResource.label || "WhatsApp"}</Text>
                    {whatsappResource.description ? (
                      <Text style={styles.whatsappSubtitle} numberOfLines={2}>
                        {whatsappResource.description}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Section Header */}
            {hasEssentialResources ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Essential Resources</Text>
                <View style={styles.sectionDivider} />
              </View>
            ) : null}

            {/* Smaller Action Tiles */}
            <View style={styles.resourceGrid}>
              {sosResource ? (
                <TouchableOpacity
                  testID="trip-info-sos-tile"
                  style={styles.resourceTile}
                  onPress={handleSosPress}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={getIconName(sosResource.iconName, "alert-circle")}
                    size={24}
                    color={palette.primary}
                  />
                  <Text style={styles.resourceText}>{sosResource.label || "SOS"}</Text>
                </TouchableOpacity>
              ) : null}

              {insurance ? (
                <TouchableOpacity
                  testID="trip-info-insurance-tile"
                  style={styles.resourceTile}
                  onPress={handleInsurancePress}
                  activeOpacity={0.8}
                >
                  <Ionicons name="medkit" size={24} color={palette.primary} />
                  <Text style={styles.resourceText}>{insurance.label || "Insurance"}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </ScrollView>

        {/* Map Modal with WebView */}
        <FullScreenModal
          visible={isMapModalVisible}
          title={interactiveMapResource?.label || "Interactive Map"}
          onClose={() => setIsMapModalVisible(false)}
        >
          {interactiveMapUrl ? (
            <WebView
              testID="trip-info-map-webview"
              source={{ uri: interactiveMapUrl }}
              style={styles.webView}
              startInLoadingState={true}
              scalesPageToFit={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          ) : (
            <EmptyState
              icon="map-outline"
              title="No map available"
              subtitle="No interactive map has been published for this trip yet."
            />
          )}
        </FullScreenModal>

        {/* PDF Modal */}
        <FullScreenModal
          visible={isPdfModalVisible}
          title={pdfModalTitle}
          onClose={() => {
            setIsPdfModalVisible(false);
            setPdfModalUri("");
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
              onLoadComplete={() => {
                /* no-op */
              }}
              onError={(_error) => {
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
                  <Ionicons name="call" size={18} color={colors.backgroundDark} />
                  <Text style={styles.insuranceActionText}>Zadzwoń</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.insuranceActionSecondary}
                  onPress={handleInsuranceCopyPress}
                  activeOpacity={0.85}
                >
                  <Ionicons name="copy-outline" size={18} color={palette.primary} />
                  <Text style={styles.insuranceActionSecondaryText}>Kopiuj numer</Text>
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
                      <Text style={styles.insuranceQuote}>"{step.exampleCall}"</Text>
                    </>
                  )}

                  {step.additionalText && (
                    <Text style={styles.insuranceText}>{step.additionalText}</Text>
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

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
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

    // Hero Header lives in ~/components/tripInfo/TripInfoHero

    // Bento Grid
    bentoGrid: {
      gap: spacing.lg,
    },

    // The interactive map tile lives in ~/components/tripInfo/InteractiveMapTile
    mapTitle: {
      fontSize: typography.lg,
      fontWeight: typography.bold,
      color: colors.white,
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
      borderColor: palette.primaryOpacity20,
    },
    pdfMapContent: {
      flex: 1,
      backgroundColor: palette.cardDark,
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
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.05)",
      padding: spacing.xl,
      justifyContent: "space-between",
    },
    whatsappTile: {
      flex: 1,
      aspectRatio: 1,
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: palette.magentaOpacity30,
      padding: spacing.xl,
      justifyContent: "space-between",
      shadowColor: palette.accentMagenta,
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
      backgroundColor: palette.magentaOpacity10,
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
      color: palette.accentMagenta,
      fontWeight: typography.medium,
      lineHeight: 14,
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
      paddingBottom: 96,
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
      backgroundColor: palette.primary,
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
      borderColor: palette.primaryOpacity30,
      backgroundColor: "rgba(39, 41, 53, 0.4)",
    },
    insuranceActionSecondaryText: {
      fontSize: typography.xs,
      fontWeight: typography.bold,
      color: palette.primary,
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
      color: palette.primary,
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
      color: palette.primaryOpacity80,
      lineHeight: 22,
      fontStyle: "italic",
    },
  });
