import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Linking,
  Modal,
  Pressable,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaTop } from "~/components/SafeAreaWrapper";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { WebView } from "react-native-webview";
import Pdf from "react-native-pdf";
import { Directory, File, Paths } from "expo-file-system/next";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "../../../styles";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";

const MAP_PDF_URL =
  "https://piste-maps.co.uk/Piste-Maps/Switzerland/Verbier-Piste-Ski-Map-2024-25.pdf";
const MAP_PDF_FILE_NAME = "Verbier-Piste-Ski-Map-2024-25.pdf";
const INFOPACK_PDF_URL =
  "https://supabase.sspj.online/storage/v1/object/public/files-public/infopack/wintegral-infopack-20022026.pdf";
const INFOPACK_PDF_FILE_NAME = "wintegral-infopack-20022026.pdf";

export default function TripInfoScreen() {
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [isPdfModalVisible, setIsPdfModalVisible] = useState(false);
  const [isInsuranceModalVisible, setIsInsuranceModalVisible] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pdfModalTitle, setPdfModalTitle] = useState("Ski Map PDF");
  const [isMapDownloading, setIsMapDownloading] = useState(false);
  const [isInfopackDownloading, setIsInfopackDownloading] = useState(false);
  const [isPdfDownloaded, setIsPdfDownloaded] = useState(false);
  const [isInfopackDownloaded, setIsInfopackDownloaded] = useState(false);
  const insets = useAppSafeAreaInsets();

  // Check if files are downloaded on component mount
  useEffect(() => {
    const checkDownloadedFiles = () => {
      try {
        const pdfDir = new Directory(Paths.document, "pdfs");

        // Check PDF Map
        const pdfFile = new File(pdfDir, MAP_PDF_FILE_NAME);
        setIsPdfDownloaded(pdfFile.exists);

        // Check Infopack
        const infopackFile = new File(pdfDir, INFOPACK_PDF_FILE_NAME);
        setIsInfopackDownloaded(infopackFile.exists);

        console.log("PDF downloaded:", pdfFile.exists);
        console.log("Infopack downloaded:", infopackFile.exists);
      } catch (error) {
        console.error("Error checking downloaded files:", error);
      }
    };

    checkDownloadedFiles();
  }, []);

  const handleWhatsAppPress = () => {
    // Open WhatsApp group link
    const whatsappUrl = "https://sspj.online/wintegral-whatsapp";
    Linking.openURL(whatsappUrl).catch(() => {
      console.error("Failed to open WhatsApp");
    });
  };

  const handleInfopakPress = async () => {
    try {
      setIsInfopackDownloading(true);

      const pdfDir = new Directory(Paths.document, "pdfs");
      if (!pdfDir.exists) {
        void pdfDir.create();
      }

      const file = new File(pdfDir, INFOPACK_PDF_FILE_NAME);

      if (file.exists) {
        setPdfModalTitle("Infopack PDF");
        setPdfUri(file.uri);
        setIsPdfModalVisible(true);
        setIsInfopackDownloading(false);
        return;
      }

      try {
        const downloadedFile = await File.downloadFileAsync(
          INFOPACK_PDF_URL,
          pdfDir,
        );
        setPdfModalTitle("Infopack PDF");
        setPdfUri(downloadedFile.uri);
        setIsPdfModalVisible(true);
        setIsInfopackDownloaded(true);
      } catch (downloadError) {
        const maybeDownloadError = downloadError as
          | { code?: string }
          | undefined;
        if (maybeDownloadError?.code === "ERR_DESTINATION_ALREADY_EXISTS") {
          const existingFile = new File(pdfDir, INFOPACK_PDF_FILE_NAME);
          setPdfModalTitle("Infopack PDF");
          setPdfUri(existingFile.uri);
          setIsPdfModalVisible(true);
          setIsInfopackDownloaded(true);
          return;
        }

        throw downloadError;
      }
    } catch (error) {
      console.error("Error handling Infopack PDF:", error);
      Alert.alert(
        "Error",
        "Could not open the infopack. Please try again later.",
      );
    } finally {
      setIsInfopackDownloading(false);
    }
  };

  const handleSosPress = () => {
    Alert.alert("Numer alarmowy", "W razie nagłego wypadku zadzwoń na 112.");
  };

  const handleMapPress = () => {
    setIsMapModalVisible(true);
  };

  const handlePdfMapPress = async () => {
    try {
      setIsMapDownloading(true);

      // Create a folder inside internal storage
      const pdfDir = new Directory(Paths.document, "pdfs");

      // Check if directory exists, if not create it
      if (!pdfDir.exists) {
        void pdfDir.create();
      }

      const file = new File(pdfDir, MAP_PDF_FILE_NAME);

      console.log("Checking if file exists:", file.uri);
      console.log("File exists:", file.exists);

      // Check if file already exists
      if (file.exists) {
        // File already downloaded, just open it
        console.log("PDF already exists, opening:", file.uri);
        setPdfModalTitle("Ski Map PDF");
        setPdfUri(file.uri);
        setIsPdfModalVisible(true);
        setIsMapDownloading(false);
        return;
      }

      // Download the file using static method
      console.log("Downloading PDF from:", MAP_PDF_URL);

      try {
        const downloadedFile = await File.downloadFileAsync(MAP_PDF_URL, pdfDir);
        console.log("PDF downloaded, file path:", downloadedFile.uri);
        console.log("Downloaded file uri:", downloadedFile.uri);

        // Open the downloaded PDF immediately
        setPdfModalTitle("Ski Map PDF");
        setPdfUri(downloadedFile.uri);
        setIsPdfModalVisible(true);
        setIsPdfDownloaded(true); // Update download status
      } catch (downloadError) {
        console.error("Download error:", downloadError);

        // If error is about file already existing, just open it
        const maybeDownloadError = downloadError as
          | { code?: string }
          | undefined;
        if (maybeDownloadError?.code === "ERR_DESTINATION_ALREADY_EXISTS") {
          console.log("File already exists, opening existing file");
          // Try to find the actual downloaded file
          const existingFile = new File(pdfDir, MAP_PDF_FILE_NAME);
          setPdfModalTitle("Ski Map PDF");
          setPdfUri(existingFile.uri);
          setIsPdfModalVisible(true);
          setIsPdfDownloaded(true); // Update download status
          return;
        }

        throw downloadError;
      }
    } catch (error) {
      console.error("Error handling PDF:", error);
      Alert.alert("Error", "Could not open the map. Please try again later.");
    } finally {
      setIsMapDownloading(false);
    }
  };

  const handleInsurancePress = () => {
    setIsInsuranceModalVisible(true);
  };

  const handleInsuranceCallPress = () => {
    Linking.openURL("tel:+48225640625").catch(() => {
      Alert.alert("Błąd", "Nie udało się rozpocząć połączenia.");
    });
  };

  const handleInsuranceCopyPress = () => {
    Alert.alert("Numer alarmowy", "+48 22 564 06 25");
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
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAHhLaOxCenvDHeXPGxGdnYhEumFOLH5A9Wh5fAb63uNUkITSveOg2w84W1Q72tKNnm3nhMAdZEyYc_wtTSqm7mjn2XpnVUwdc4O1eHaoLbQxVFProgk7Jnuc3k0sW4fg5BKzNzg56WwaR-MesVKcfLd3fOfPxZGRKaV_PLrsgOyhirvj2CqfkrxBZpmQNCwGq56LVrNMBKRUwNzDK0bd7ttYLsQDQlxhJ2mEsvE1Mx4HrVpg3u58_JdMp0ZOzRu_9PjH43rDEbQfY",
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
                  <Text style={styles.heroTitle}>Verbier-La Tzoumaz</Text>
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
              <TouchableOpacity
                style={styles.mapTile}
                onPress={handleMapPress}
                activeOpacity={0.8}
              >
                <ImageBackground
                  source={{
                    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHzNKnjzWDXauSdVPNidYoUGd1qjJ403upT8jZBMcs9oyIqPM11hjsbBSIBs6u_5chLFgfVG4mejWXsgPfu_9y0N8bJxBpErgmUNG7fARqfhlQfGNLvemBM4ALBIIQtp1MG4TRaFWaGLDvqRFdhCmezlqGrCMgWMXBj7CGZDysg-TDAt24y1EddpxoxP890kL_wo4ggi8Pc5lqtBPHTTMhwkZH45PhexYqQ-Vy8-aF5Sl8kDbpffkx6-Kq0GdoDqOmvcskgXS7JxQ",
                  }}
                  style={styles.mapBackground}
                  imageStyle={{ borderRadius: borderRadius.xl, opacity: 0.4 }}
                >
                  <View style={styles.mapGradient} />
                  <View style={styles.mapContent}>
                    <View style={styles.mapIconWrapper}>
                      <Ionicons name="map" size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.mapTitle}>Interactive Skimap</Text>
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

              {/* PDF Map */}
              <TouchableOpacity
                style={styles.mapTile}
                onPress={() => void handlePdfMapPress()}
                activeOpacity={0.8}
                disabled={isMapDownloading}
              >
                <View style={styles.pdfMapContent}>
                  <View style={styles.pdfMapIconWrapper}>
                    <Ionicons
                      name="document-text"
                      size={28}
                      color={colors.white}
                    />
                  </View>
                  <View style={styles.pdfMapTextContainer}>
                    <View style={styles.pdfMapTitleRow}>
                      <Text style={styles.mapTitle}>PDF Map</Text>
                      {isPdfDownloaded ? (
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
                      {isMapDownloading
                        ? "Downloading..."
                        : isPdfDownloaded
                          ? "Downloaded"
                          : "Tap to Download"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Grid Row */}
            <View style={styles.gridRow}>
              {/* Infopak Tile */}
              <TouchableOpacity
                style={styles.bentoTile}
                onPress={() => void handleInfopakPress()}
                activeOpacity={0.8}
                disabled={isInfopackDownloading}
              >
                <View style={styles.bentoIconWrapper}>
                  <Ionicons
                    name="document-text"
                    size={28}
                    color={colors.white}
                  />
                </View>
                <View style={styles.bentoContent}>
                  <View style={styles.bentoTitleRow}>
                    <Text style={styles.bentoTitle}>Infopack</Text>
                    {isInfopackDownloaded ? (
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
                    {isInfopackDownloading
                      ? "Downloading..."
                      : isInfopackDownloaded
                        ? "Downloaded"
                        : "Tap to Download"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* WhatsApp Tile */}
              <TouchableOpacity
                style={styles.whatsappTile}
                onPress={handleWhatsAppPress}
                activeOpacity={0.8}
              >
                <View style={styles.whatsappIconWrapper}>
                  <Ionicons
                    name="chatbubble"
                    size={28}
                    color={colors.accentMagenta}
                  />
                </View>
                <View style={styles.bentoContent}>
                  <Text style={styles.bentoTitle}>WhatsApp</Text>
                  <Text style={styles.whatsappSubtitle}>
                    Join Trip Community
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Essential Resources</Text>
              <View style={styles.sectionDivider} />
            </View>

            {/* Smaller Action Tiles */}
            <View style={styles.resourceGrid}>
              <TouchableOpacity
                style={styles.resourceTile}
                onPress={handleSosPress}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="alert-circle"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.resourceText}>SOS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resourceTile}
                onPress={handleInsurancePress}
                activeOpacity={0.8}
              >
                <Ionicons name="medkit" size={24} color={colors.primary} />
                <Text style={styles.resourceText}>Insurance</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Map Modal with WebView */}
        <Modal
          visible={isMapModalVisible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setIsMapModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <SafeAreaTop style={styles.modalSafeArea}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Interactive Ski Map</Text>
                <Pressable
                  onPress={() => setIsMapModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={colors.white} />
                </Pressable>
              </View>
            </SafeAreaTop>

            {/* WebView */}
            <WebView
              source={{
                uri: "https://infosnow.ch/~apgmontagne/?id=45&lang=en&tab=map-wi&sat=&tv=",
              }}
              style={styles.webView}
              startInLoadingState={true}
              scalesPageToFit={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          </View>
        </Modal>

        {/* PDF Modal */}
        <Modal
          visible={isPdfModalVisible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setIsPdfModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <SafeAreaTop style={styles.modalSafeArea}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{pdfModalTitle}</Text>
                <Pressable
                  onPress={() => setIsPdfModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={colors.white} />
                </Pressable>
              </View>
            </SafeAreaTop>

            {/* PDF Viewer */}
            {pdfUri && (
              <Pdf
                source={{ uri: pdfUri }}
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
          </View>
        </Modal>

        {/* Insurance Modal */}
        <Modal
          visible={isInsuranceModalVisible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setIsInsuranceModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <SafeAreaTop style={styles.modalSafeArea}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ubezpieczenie / Kontakt</Text>
                <Pressable
                  onPress={() => setIsInsuranceModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={colors.white} />
                </Pressable>
              </View>
            </SafeAreaTop>

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

              <View style={styles.insuranceCard}>
                <Text style={styles.insuranceCardTitle}>Krok 1</Text>
                <Text style={styles.insuranceText}>
                  Poproście o pomoc osobę z obsługi stoku lub innego narciarza i
                  poinformujcie ich o zdarzeniu.
                </Text>
              </View>

              <View style={styles.insuranceCard}>
                <Text style={styles.insuranceCardTitle}>Krok 2</Text>
                <Text style={styles.insuranceText}>
                  Skontaktujcie się z ubezpieczycielem WIENER dzwoniąc pod numer
                  alarmowy: +48 22 564 06 25
                </Text>
                <Text style={styles.insuranceLabel}>
                  Podczas rozmowy konieczne będzie podanie:
                </Text>
                <Text style={styles.insuranceListItem}>
                  - imienia i nazwiska,
                </Text>
                <Text style={styles.insuranceListItem}>- daty urodzenia,</Text>
                <Text style={styles.insuranceListItem}>
                  - numeru polisy: COR700416,
                </Text>
                <Text style={styles.insuranceListItem}>
                  - numeru umowy generalnej: 500008713.
                </Text>
                <Text style={styles.insuranceLabel}>
                  Następnie krótko opiszcie sytuację, np.:
                </Text>
                <Text style={styles.insuranceQuote}>
                  "Jestem na wyjeździe w Verbier, doznałem kontuzji, ratownicy
                  zwożą mnie na dół."
                </Text>
                <Text style={styles.insuranceText}>
                  Operator udzieli instrukcji, wskaże odpowiednią placówkę
                  medyczną lub przyjmie zgłoszenie zdarzenia.
                </Text>
              </View>

              <View style={styles.insuranceCard}>
                <Text style={styles.insuranceCardTitle}>Krok 3</Text>
                <Text style={styles.insuranceText}>
                  Poinformujcie pilota lub członka naszej kadry (bezpośrednio
                  lub przez znajomych), co się stało. Jesteśmy na miejscu, aby
                  Was wspierać — zawsze możecie na nas liczyć!
                </Text>
                <Text style={styles.insuranceText}>
                  Najbliższy szpital to Vigimed, znajduje się w Rue du Léman 18
                  B, 1920 Martigny (ok. 30km od La Tzoumaz).
                </Text>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
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

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  modalSafeArea: {
    backgroundColor: colors.cardDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryOpacity10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryOpacity10,
    alignItems: "center",
    justifyContent: "center",
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
