import { config } from "@tamagui/config/v3";
import { createTamagui } from "tamagui";

const tamaguiConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    light: {
      ...config.themes.light,
      background: "#f2b138", // --color-background from light_theme.css
      color: "#3b1100", // --gray-12 from light_theme.css
      red: "#d91807", // --red-9 from light_theme.css
      gray: "#db6700", // --gray-9 from light_theme.css
    },
    dark: {
      ...config.themes.dark,
      background: "#26190d", // --color-background from dark_theme.css
      color: "#feebcf", // --gray-12 from dark_theme.css
      red: "#ea4631", // --red-9 from dark_theme.css
      gray: "#986300", // --gray-9 from dark_theme.css
    },
  },
});

export type AppConfig = typeof tamaguiConfig;

declare module "tamagui" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
