import { Image } from "expo-image";
import { StyleSheet } from "react-native";
import { useTripTheme } from "~/theme/TripThemeProvider";
import woodTexture from "../../../assets/textures/wood.png";

/**
 * Wood-grain overlay for card surfaces on the pirate theme. Renders nothing on
 * other themes. Sits behind card content as an absolute fill; pass `radius` to
 * match the card's borderRadius so the texture clips itself (no overflow:hidden
 * needed, so card shadows are preserved). Place it as the FIRST child of the
 * card container, before the content.
 */
export function WoodTexture({ radius = 0 }: { radius?: number }) {
  const { themeKey } = useTripTheme();
  if (themeKey !== "PIRATE") return null;
  return (
    <Image
      source={woodTexture}
      style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
      contentFit="cover"
      pointerEvents="none"
    />
  );
}
