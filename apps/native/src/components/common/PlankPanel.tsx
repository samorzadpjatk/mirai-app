import { Image } from "expo-image";
import { StyleSheet } from "react-native";
import { useTripTheme } from "~/theme/TripThemeProvider";
import plankPanel from "../../../assets/textures/plank-panel.png";

/**
 * Riveted wooden plank-panel surface for card backgrounds on the pirate theme
 * (the "crate" look). Renders nothing on other themes. Absolute fill behind
 * card content, cropped with `contentFit="cover"` so tall cards don't stretch
 * the artwork; pass `radius` to match the card's borderRadius. Place it as the
 * FIRST child of the card container, before the content.
 */
export function PlankPanel({ radius = 0 }: { radius?: number }) {
  const { themeKey } = useTripTheme();

  if (themeKey !== "PIRATE") {
    return null;
  }

  return (
    <Image
      source={plankPanel}
      style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
      contentFit="cover"
      pointerEvents="none"
    />
  );
}
