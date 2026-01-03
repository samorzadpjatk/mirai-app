import { createThemes, defaultComponentThemes } from '@tamagui/theme-builder'
import * as Colors from '@tamagui/colors'

const CMYK_WHITE = '#ffffff'
const CMYK_BLACK = '#000000'
const CMYK_VIOLET = '#6647ff'

const darkPalette = [
  CMYK_BLACK,
  '#1a132f',
  '#241946',
  '#2d1f5c',
  '#362572',
  '#3f2b88',
  '#49319e',
  '#5237b4',
  '#5b3dca',
  '#6443e0',
  '#ff4d4d',
  CMYK_WHITE,
]

const lightPalette = [
  CMYK_WHITE,
  '#f8f5ff',
  '#f1ebff',
  '#e7dcff',
  '#ddccff',
  '#d2bbff',
  '#ffc8d0',
  '#ffb0b8',
  '#ff98a0',
  '#ff8088',
  CMYK_VIOLET,
  CMYK_BLACK,
]

const fontFamily = 'IBM Plex Sans'

const lightShadows = {
  shadow1: 'rgba(0,0,0,0.04)',
  shadow2: 'rgba(0,0,0,0.08)',
  shadow3: 'rgba(0,0,0,0.16)',
  shadow4: 'rgba(0,0,0,0.24)',
  shadow5: 'rgba(0,0,0,0.32)',
  shadow6: 'rgba(0,0,0,0.4)',
}

const darkShadows = {
  shadow1: 'rgba(0,0,0,0.2)',
  shadow2: 'rgba(0,0,0,0.3)',
  shadow3: 'rgba(0,0,0,0.4)',
  shadow4: 'rgba(0,0,0,0.5)',
  shadow5: 'rgba(0,0,0,0.6)',
  shadow6: 'rgba(0,0,0,0.7)',
}

// we're adding some example sub-themes for you to show how they are done, "success" "warning", "error":

const builtThemes = createThemes({
  componentThemes: defaultComponentThemes,

  base: {
    palette: {
      dark: darkPalette,
      light: lightPalette,
    },

    extra: {
      light: {
        ...Colors.gray,
        ...Colors.green,
        ...Colors.red,
        ...Colors.yellow,
        ...lightShadows,
        bodyFont: fontFamily,
        headingFont: fontFamily,
        shadowColor: lightShadows.shadow1,
      },
      dark: {
        ...Colors.grayDark,
        ...Colors.greenDark,
        ...Colors.redDark,
        ...Colors.yellowDark,
        ...darkShadows,
        bodyFont: fontFamily,
        headingFont: fontFamily,
        shadowColor: darkShadows.shadow1,
      },
    },
  },

  accent: {
    palette: {
      dark: ['#140f29','#1f183b','#2a224d','#352c5f','#403671','#4b4083','#564a95','#6154a7','#6b5eb9','#7568cb','#ff4d4d',CMYK_WHITE],
      light: ['#f1ebff','#e4dbff','#d7cbff','#cabaff','#bdabff','#b09bff','#a38cff','#967cff','#896dff',CMYK_VIOLET,'#ff6f6f',CMYK_BLACK],
    },
  },

  childrenThemes: {
    warning: {
      palette: {
        dark: Object.values(Colors.yellowDark),
        light: Object.values(Colors.yellow),
      },
    },

    error: {
      palette: {
        dark: Object.values(Colors.redDark),
        light: Object.values(Colors.red),
      },
    },

    success: {
      palette: {
        dark: Object.values(Colors.greenDark),
        light: Object.values(Colors.green),
      },
    },
  },

  // optionally add more, can pass palette or template

  // grandChildrenThemes: {
  //   alt1: {
  //     template: 'alt1',
  //   },
  //   alt2: {
  //     template: 'alt2',
  //   },
  //   surface1: {
  //     template: 'surface1',
  //   },
  //   surface2: {
  //     template: 'surface2',
  //   },
  //   surface3: {
  //     template: 'surface3',
  //   },
  // },
})

export const themeFonts = {
  body: fontFamily,
  heading: fontFamily,
}

export type Themes = typeof builtThemes

// the process.env conditional here is optional but saves web client-side bundle
// size by leaving out themes JS. tamagui automatically hydrates themes from CSS
// back into JS for you, and the bundler plugins set TAMAGUI_ENVIRONMENT. so
// long as you are using the Vite, Next, Webpack plugins this should just work,
// but if not you can just export builtThemes directly as themes:
export const themes: Themes =
  process.env.TAMAGUI_ENVIRONMENT === 'client' &&
  process.env.NODE_ENV === 'production'
    ? ({} as unknown as Themes)
    : builtThemes
