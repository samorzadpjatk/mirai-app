import { defaultConfig } from "@tamagui/config/v4";
import { themes } from "./themes";
import { createTamagui, createFont } from "tamagui";

const ibmPlexSansFont = createFont({
  family: 'IBMPlexSans',
  size: defaultConfig.fonts.body.size,
  lineHeight: defaultConfig.fonts.body.lineHeight,
  weight: {
    1: '100',
    2: '200',
    3: '300',
    4: '400',
    5: '500',
    6: '600',
    7: '700',
    8: '800',
    9: '900',
  },
  letterSpacing: defaultConfig.fonts.body.letterSpacing,
  face: {
    100: { normal: 'IBMPlexSans_100Thin' },
    200: { normal: 'IBMPlexSans_200ExtraLight' },
    300: { normal: 'IBMPlexSans_300Light' },
    400: { normal: 'IBMPlexSans_400Regular' },
    500: { normal: 'IBMPlexSans_500Medium' },
    600: { normal: 'IBMPlexSans_600SemiBold' },
    700: { normal: 'IBMPlexSans_700Bold' },
  },
});

const tamaguiConfig = createTamagui({
  ...defaultConfig,
  themes,
  fonts: {
    ...defaultConfig.fonts,
    body: ibmPlexSansFont,
    heading: ibmPlexSansFont,
  },
});

export type AppConfig = typeof tamaguiConfig;

declare module "tamagui" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
