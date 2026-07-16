import { Image } from "expo-image";
import { StyleSheet } from "react-native";
import { useTripTheme } from "~/theme/TripThemeProvider";
import deckBg from "../../../assets/textures/deck-bg.jpg";

/** Full-screen pirate deck background. Renders nothing unless the active trip theme is PIRATE. */
export function DeckBackground() {
  const { themeKey } = useTripTheme();
  if (themeKey !== "PIRATE") return null;
  return (
    <Image
      source={deckBg}
      style={StyleSheet.absoluteFillObject}
      contentFit="cover"
      pointerEvents="none"
    />
  );
}
