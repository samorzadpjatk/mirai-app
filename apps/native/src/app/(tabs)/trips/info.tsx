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
  const [pdfModalTitle, setPdfModalTitle] = useState("");
  const [pdfModalUri, setPdfModalUri] = useState<string>("");
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();
  const params = useLocalSearchParams();
  const paramTripId = typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];
  const { selectedTripId } = useSelectedTrip();
  const tripId = selectedTripId ?? paramTripId;

  const { getResource, resources, isLoading, isError } = useTripResources(tripId);
  const { trip } = useTripDetails(tripId);

  // File download hooks for images and PDFs
  const mapBgImageDownload = useFileDownload();
  const mapPdfDownload = useFileDownload();
  const infopackDownload = useFileDownload();

  const { download: downloadMapBg } = mapBgImageDownload;

  useEffect(() => {
    if (!isLoading) {
      const mapBgResource = getResource("MAP_BG_IMAGE");

      if (mapBgResource?.storagePath) {
        downloadMapBg({ storagePath: mapBgResource.storagePath }).catch(() => {
          /* no-op */
        });
      }
    }
  }, [tripId, isLoading, getResource, downloadMapBg]);

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
  const contactResource = getResource("CONTACT");

  const handleWhatsAppPress = () => {
    if (whatsappResource?.url) {
      Linking.openURL(whatsappResource.url).catch(() => {
        /* no-op */
      });
    }
  };

  const handleContactPress = () => {
    if (contactResource?.value) {
      Linking.openURL(`tel:${contactResource.value}`).catch(() => {
        Alert.alert("Błąd", "Nie udało się rozpocząć połączenia.");
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

  const interactiveMapUrl = interactiveMapResource?.url ?? "";
  const heroTitle = trip?.name ?? (heroResource?.label || "Trip Info");
  const heroSubtitle = formatTripDateRange(trip?.startDate, trip?.endDate);
  const heroBadge = trip ? getTripStatus(trip.startDate, trip.endDate) : null;
  const hasResources = resources.length > 0;

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
            imageStoragePath={heroResource?.storagePath ?? trip?.backgroundImagePath}
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
            {/* Map Tiles Row — omitted entirely when the trip has no map, so
                the grid does not open with an empty gap. */}
            {interactiveMapUrl || pdfMapResource ? (
              <View testID="trip-info-map-row" style={styles.gridRow}>
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
            ) : null}

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

            {/* Contact Tile */}
            {contactResource?.value ? (
              <TouchableOpacity
                testID="trip-info-contact-tile"
                style={styles.contactTile}
                onPress={handleContactPress}
                activeOpacity={0.8}
              >
                <View style={styles.bentoIconWrapper}>
                  <Ionicons
                    name={getIconName(contactResource.iconName, "call")}
                    size={28}
                    color={colors.white}
                  />
                </View>
                <View style={styles.bentoContent}>
                  <Text style={styles.bentoTitle}>{contactResource.label || "Kontakt"}</Text>
                  <Text style={styles.contactNumber}>
                    {contactResource.description || contactResource.value}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null}
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
    // The contact tile is the only full-width tile: a square one would take
    // half the screen for a single phone number.
    contactTile: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: palette.primaryOpacity20,
      padding: spacing.xl,
    },
    contactNumber: {
      fontSize: typography.sm,
      fontWeight: typography.medium,
      color: palette.primaryOpacity80,
    },
    whatsappSubtitle: {
      fontSize: 10,
      color: palette.accentMagenta,
      fontWeight: typography.medium,
      lineHeight: 14,
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
  });
