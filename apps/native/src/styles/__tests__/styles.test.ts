import { colors } from "../colors";
import { commonStyles } from "../commonStyles";
import {
  borderRadius as exportedBorderRadius,
  colors as exportedColors,
  commonStyles as exportedCommonStyles,
  shadows as exportedShadows,
  spacing as exportedSpacing,
  typography as exportedTypography,
  theme,
} from "../index";
import { textStyles, viewStyles } from "../judgement";
import { shadows } from "../shadows";
import { borderRadius, spacing } from "../spacing";
import { typography } from "../typography";

describe("colors", () => {
  it("should export colors object", () => {
    expect(colors).toBeDefined();
    expect(typeof colors).toBe("object");
  });

  it("should have primary colors", () => {
    expect(colors.primary).toBe("#00ced1");
    expect(colors.accentMagenta).toBe("#E533FF");
  });

  it("should have background colors", () => {
    expect(colors.backgroundLight).toBe("#f1f1f4");
    expect(colors.backgroundDark).toBe("#17181c");
    expect(colors.cardDark).toBe("#1b2828");
    expect(colors.surfaceDark).toBe("#272935");
  });

  it("should have border colors", () => {
    expect(colors.borderDark).toBe("#395556");
    expect(colors.borderWhite5).toBe("rgba(255, 255, 255, 0.05)");
    expect(colors.borderWhite10).toBe("rgba(255, 255, 255, 0.1)");
  });

  it("should have text colors", () => {
    expect(colors.white).toBe("#ffffff");
    expect(colors.textPrimary).toBe("#ffffff");
    expect(colors.textSecondary).toBe("#9ca3af");
    expect(colors.textTertiary).toBe("#64748b");
    expect(colors.textMuted).toBe("#475569");
  });

  it("should have gray scale colors", () => {
    expect(colors.gray50).toBe("#f9fafb");
    expect(colors.gray100).toBe("#f1f1f4");
    expect(colors.gray200).toBe("#e5e7eb");
    expect(colors.gray300).toBe("#d1d5db");
    expect(colors.gray400).toBe("#9ca3af");
    expect(colors.gray500).toBe("#6b7280");
    expect(colors.gray600).toBe("#4b5563");
    expect(colors.gray700).toBe("#374151");
    expect(colors.gray800).toBe("#1f2937");
    expect(colors.gray900).toBe("#111827");
  });

  it("should have slate colors", () => {
    expect(colors.slate400).toBe("#94a3b8");
    expect(colors.slate500).toBe("#64748b");
    expect(colors.slate600).toBe("#475569");
    expect(colors.slate800).toBe("#1e293b");
  });

  it("should have red colors", () => {
    expect(colors.red300).toBe("#fecaca");
    expect(colors.red400).toBe("#f87171");
    expect(colors.red700).toBe("#b91c1c");
    expect(colors.red900).toBe("#7f1d1d");
  });

  it("should have green/success colors", () => {
    expect(colors.success).toBe("#22c55e");
    expect(colors.green400).toBe("#4ade80");
    expect(colors.green700).toBe("#16a34a");
  });

  it("should have warning/orange/yellow colors", () => {
    expect(colors.warning).toBe("#f59e0b");
    expect(colors.orange400).toBe("#fb923c");
    expect(colors.yellow400).toBe("#facc15");
  });

  it("should have danger color", () => {
    expect(colors.danger).toBe("#ef4444");
  });

  it("should have primary opacity variants", () => {
    expect(colors.primaryOpacity10).toBe("rgba(0, 206, 209, 0.1)");
    expect(colors.primaryOpacity12).toBe("rgba(0, 206, 209, 0.12)");
    expect(colors.primaryOpacity20).toBe("rgba(0, 206, 209, 0.2)");
    expect(colors.primaryOpacity30).toBe("rgba(0, 206, 209, 0.3)");
    expect(colors.primaryOpacity80).toBe("rgba(0, 206, 209, 0.8)");
  });

  it("should have magenta opacity variants", () => {
    expect(colors.magentaOpacity10).toBe("rgba(229, 51, 255, 0.1)");
    expect(colors.magentaOpacity20).toBe("rgba(229, 51, 255, 0.2)");
    expect(colors.magentaOpacity30).toBe("rgba(229, 51, 255, 0.3)");
    expect(colors.magentaOpacity80).toBe("rgba(229, 51, 255, 0.8)");
  });

  it("should have transparent variants", () => {
    expect(colors.blackOpacity40).toBe("rgba(0, 0, 0, 0.4)");
    expect(colors.cardDarkOpacity40).toBe("rgba(27, 40, 40, 0.4)");
    expect(colors.cardDarkOpacity70).toBe("rgba(27, 40, 40, 0.7)");
    expect(colors.backgroundDarkOpacity50).toBe("rgba(23, 24, 28, 0.5)");
    expect(colors.backgroundDarkOpacity80).toBe("rgba(23, 24, 28, 0.8)");
    expect(colors.red900Opacity30).toBe("rgba(127, 29, 29, 0.3)");
  });

  it("should have blue variants", () => {
    expect(colors.blue100).toBe("#dbeafe");
    expect(colors.blue400).toBe("#60a5fa");
    expect(colors.blue500).toBe("#3b82f6");
    expect(colors.blue700).toBe("#1d4ed8");
  });

  it("should have sky variants", () => {
    expect(colors.sky400).toBe("#38bdf8");
    expect(colors.sky500).toBe("#0ea5e9");
    expect(colors.sky700).toBe("#0284c7");
  });

  it("should have orange variants", () => {
    expect(colors.orange500).toBe("#f97316");
    expect(colors.orange700).toBe("#c2410c");
  });

  it("should have emerald variants", () => {
    expect(colors.emerald400).toBe("#4ade80");
    expect(colors.emerald500).toBe("#22c55e");
    expect(colors.emerald700).toBe("#16a34a");
  });

  it("should have zinc variants", () => {
    expect(colors.zinc100).toBe("#f4f4f5");
    expect(colors.zinc700).toBe("#52525b");
    expect(colors.zinc800).toBe("#27272a");
    expect(colors.zinc900).toBe("#18181b");
  });

  it("should have white opacity variants", () => {
    expect(colors.whiteOpacity90).toBe("rgba(255, 255, 255, 0.9)");
    expect(colors.whiteOpacity70).toBe("rgba(255, 255, 255, 0.7)");
    expect(colors.whiteOpacity40).toBe("rgba(255, 255, 255, 0.4)");
    expect(colors.whiteOpacity20).toBe("rgba(255, 255, 255, 0.2)");
    expect(colors.whiteOpacity18).toBe("rgba(255, 255, 255, 0.18)");
    expect(colors.whiteOpacity15).toBe("rgba(255, 255, 255, 0.15)");
    expect(colors.whiteOpacity12).toBe("rgba(255, 255, 255, 0.12)");
    expect(colors.whiteOpacity10).toBe("rgba(255, 255, 255, 0.1)");
    expect(colors.whiteOpacity8).toBe("rgba(255, 255, 255, 0.08)");
    expect(colors.whiteOpacity6).toBe("rgba(255, 255, 255, 0.06)");
    expect(colors.whiteOpacity5).toBe("rgba(255, 255, 255, 0.05)");
    expect(colors.whiteOpacity4).toBe("rgba(255, 255, 255, 0.04)");
  });

  it("should have background variants", () => {
    expect(colors.backgroundDarkAlt).toBe("#102222");
    expect(colors.backgroundDarkOpacity45).toBe("rgba(15, 23, 42, 0.45)");
    expect(colors.backgroundDarkOpacity55).toBe("rgba(10, 11, 13, 0.55)");
  });

  it("should have card variants", () => {
    expect(colors.cardDarkOpacity45).toBe("rgba(39, 41, 53, 0.45)");
  });

  it("should have status colors", () => {
    expect(colors.statusHidden).toBe("#64748b");
    expect(colors.statusVisible).toBe("#0ea5e9");
    expect(colors.statusActive).toBe("#22c55e");
    expect(colors.statusVotingPhase).toBe("#f59e0b");
    expect(colors.statusCompleted).toBe("#10b981");
  });

  it("should have success opacity variants", () => {
    expect(colors.successOpacity08).toBe("rgba(16, 185, 129, 0.08)");
    expect(colors.successOpacity12).toBe("rgba(16, 185, 129, 0.12)");
    expect(colors.successOpacity20).toBe("rgba(16, 185, 129, 0.2)");
    expect(colors.successOpacity35).toBe("rgba(34, 197, 94, 0.35)");
    expect(colors.successOpacity45).toBe("rgba(16, 185, 129, 0.5)");
    expect(colors.successOpacity50).toBe("rgba(16, 185, 129, 0.5)");
    expect(colors.successOpacity90).toBe("rgba(34, 197, 94, 0.9)");
  });

  it("should have danger opacity variants", () => {
    expect(colors.dangerOpacity12).toBe("rgba(239, 68, 68, 0.12)");
    expect(colors.dangerOpacity15).toBe("rgba(239, 68, 68, 0.15)");
    expect(colors.dangerOpacity35).toBe("rgba(239, 68, 68, 0.35)");
    expect(colors.dangerOpacity45).toBe("rgba(239, 68, 68, 0.45)");
    expect(colors.dangerOpacity50).toBe("rgba(239, 68, 68, 0.5)");
    expect(colors.dangerOpacity85).toBe("rgba(239, 68, 68, 0.85)");
  });

  it("should have sky opacity variants", () => {
    expect(colors.skyOpacity10).toBe("rgba(14, 165, 233, 0.1)");
    expect(colors.skyOpacity14).toBe("rgba(14, 165, 233, 0.14)");
    expect(colors.skyOpacity35).toBe("rgba(14, 165, 233, 0.35)");
  });

  it("should have red opacity variants for borders", () => {
    expect(colors.redOpacity500).toBe("rgba(220, 38, 38, 0.55)");
    expect(colors.redOpacity500Background).toBe("rgba(220, 38, 38, 0.14)");
  });

  it("should have slate opacity variants", () => {
    expect(colors.slateOpacity35).toBe("rgba(148, 163, 184, 0.35)");
    expect(colors.slate300).toBe("#cbd5e1");
  });

  it("should have overlay colors", () => {
    expect(colors.blackOpacity38).toBe("rgba(0, 0, 0, 0.38)");
    expect(colors.blackOpacity12).toBe("rgba(0, 0, 0, 0.12)");
  });

  it("should have border colors", () => {
    expect(colors.borderZinc700).toBe("rgba(48, 54, 61, 1)");
    expect(colors.borderWhite18).toBe("rgba(255, 255, 255, 0.18)");
  });
});

describe("spacing", () => {
  it("should export spacing object", () => {
    expect(spacing).toBeDefined();
    expect(typeof spacing).toBe("object");
  });

  it("should have correct spacing values", () => {
    expect(spacing.xs).toBe(4);
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(12);
    expect(spacing.lg).toBe(16);
    expect(spacing.xl).toBe(20);
    expect(spacing.xxl).toBe(24);
    expect(spacing.xxxl).toBe(32);
  });

  it("should export borderRadius object", () => {
    expect(borderRadius).toBeDefined();
    expect(typeof borderRadius).toBe("object");
  });

  it("should have correct borderRadius values", () => {
    expect(borderRadius.sm).toBe(8);
    expect(borderRadius.md).toBe(12);
    expect(borderRadius.lg).toBe(16);
    expect(borderRadius.xl).toBe(20);
    expect(borderRadius.full).toBe(9999);
  });
});

describe("typography", () => {
  it("should export typography object", () => {
    expect(typography).toBeDefined();
    expect(typeof typography).toBe("object");
  });

  it("should have correct font sizes", () => {
    expect(typography.xs).toBe(10);
    expect(typography.sm).toBe(12);
    expect(typography.base).toBe(14);
    expect(typography.lg).toBe(16);
    expect(typography.xl).toBe(18);
    expect(typography.xxl).toBe(20);
    expect(typography.xxxl).toBe(24);
    expect(typography.huge).toBe(36);
  });

  it("should have correct font weights", () => {
    expect(typography.light).toBe("300");
    expect(typography.normal).toBe("400");
    expect(typography.medium).toBe("500");
    expect(typography.semibold).toBe("600");
    expect(typography.bold).toBe("700");
  });

  it("should have correct line heights", () => {
    expect(typography.tight).toBe(1.2);
    expect(typography.normalLine).toBe(1.5);
    expect(typography.relaxed).toBe(1.75);
  });
});

describe("shadows", () => {
  it("should export shadows object", () => {
    expect(shadows).toBeDefined();
    expect(typeof shadows).toBe("object");
  });

  it("should have small shadow with correct properties", () => {
    expect(shadows.small).toEqual({
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    });
  });

  it("should have medium shadow with correct properties", () => {
    expect(shadows.medium).toEqual({
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    });
  });

  it("should have large shadow with correct properties", () => {
    expect(shadows.large).toEqual({
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    });
  });

  it("should have xl shadow with correct properties", () => {
    expect(shadows.xl).toEqual({
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 30,
      elevation: 20,
    });
  });

  it("should have primaryGlow shadow with correct properties", () => {
    expect(shadows.primaryGlow).toEqual({
      shadowColor: "#00ced1",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 15,
      elevation: 8,
    });
  });

  it("should have primaryGlowStrong shadow with correct properties", () => {
    expect(shadows.primaryGlowStrong).toEqual({
      shadowColor: "#00ced1",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 8,
    });
  });
});

describe("commonStyles", () => {
  it("should export commonStyles object", () => {
    expect(commonStyles).toBeDefined();
    expect(typeof commonStyles).toBe("object");
  });

  it("should have container style", () => {
    expect(commonStyles.container).toBeDefined();
    expect(commonStyles.container.flex).toBe(1);
    expect(commonStyles.container.backgroundColor).toBe(colors.backgroundDark);
  });

  it("should have card styles", () => {
    expect(commonStyles.card).toBeDefined();
    expect(commonStyles.card.backgroundColor).toBe(colors.cardDark);
    expect(commonStyles.card.borderRadius).toBe(borderRadius.md);
    expect(commonStyles.card.padding).toBe(spacing.lg);
    expect(commonStyles.card.borderWidth).toBe(1);
    expect(commonStyles.card.borderColor).toBe(colors.borderWhite5);
  });

  it("should have cardGlass style", () => {
    expect(commonStyles.cardGlass).toBeDefined();
    expect(commonStyles.cardGlass.backgroundColor).toBe(colors.cardDarkOpacity70);
    expect(commonStyles.cardGlass.borderRadius).toBe(borderRadius.md);
    expect(commonStyles.cardGlass.borderWidth).toBe(1);
    expect(commonStyles.cardGlass.borderColor).toBe(colors.primaryOpacity30);
  });

  it("should have text styles", () => {
    expect(commonStyles.textPrimary).toBeDefined();
    expect(commonStyles.textPrimary.color).toBe(colors.textPrimary);
    expect(commonStyles.textPrimary.fontSize).toBe(typography.base);

    expect(commonStyles.textSecondary).toBeDefined();
    expect(commonStyles.textSecondary.color).toBe(colors.textSecondary);
    expect(commonStyles.textSecondary.fontSize).toBe(typography.sm);

    expect(commonStyles.textBold).toBeDefined();
    expect(commonStyles.textBold.fontWeight).toBe(typography.bold);

    expect(commonStyles.textUppercase).toBeDefined();
    expect(commonStyles.textUppercase.textTransform).toBe("uppercase");
  });

  it("should have heading styles", () => {
    expect(commonStyles.h1).toBeDefined();
    expect(commonStyles.h1.fontSize).toBe(typography.huge);
    expect(commonStyles.h1.fontWeight).toBe(typography.bold);
    expect(commonStyles.h1.color).toBe(colors.white);
    expect(commonStyles.h1.letterSpacing).toBe(-0.5);

    expect(commonStyles.h2).toBeDefined();
    expect(commonStyles.h2.fontSize).toBe(typography.xxxl);
    expect(commonStyles.h2.fontWeight).toBe(typography.bold);
    expect(commonStyles.h2.color).toBe(colors.white);

    expect(commonStyles.h3).toBeDefined();
    expect(commonStyles.h3.fontSize).toBe(typography.xl);
    expect(commonStyles.h3.fontWeight).toBe(typography.bold);
    expect(commonStyles.h3.color).toBe(colors.white);

    expect(commonStyles.h4).toBeDefined();
    expect(commonStyles.h4.fontSize).toBe(typography.lg);
    expect(commonStyles.h4.fontWeight).toBe(typography.bold);
    expect(commonStyles.h4.color).toBe(colors.white);
  });

  it("should have label styles", () => {
    expect(commonStyles.label).toBeDefined();
    expect(commonStyles.label.fontSize).toBe(typography.xs);
    expect(commonStyles.label.fontWeight).toBe(typography.bold);
    expect(commonStyles.label.color).toBe(colors.slate400);
    expect(commonStyles.label.textTransform).toBe("uppercase");
    expect(commonStyles.label.letterSpacing).toBe(2);

    expect(commonStyles.labelPrimary).toBeDefined();
    expect(commonStyles.labelPrimary.fontSize).toBe(typography.xs);
    expect(commonStyles.labelPrimary.fontWeight).toBe(typography.bold);
    expect(commonStyles.labelPrimary.color).toBe(colors.primary);
    expect(commonStyles.labelPrimary.textTransform).toBe("uppercase");
    expect(commonStyles.labelPrimary.letterSpacing).toBe(-0.5);
  });

  it("should have button styles", () => {
    expect(commonStyles.button).toBeDefined();
    expect(commonStyles.button.backgroundColor).toBe(colors.primary);
    expect(commonStyles.button.paddingVertical).toBe(spacing.lg);
    expect(commonStyles.button.paddingHorizontal).toBe(spacing.xl);
    expect(commonStyles.button.borderRadius).toBe(borderRadius.md);
    expect(commonStyles.button.alignItems).toBe("center");
    expect(commonStyles.button.justifyContent).toBe("center");

    expect(commonStyles.buttonText).toBeDefined();
    expect(commonStyles.buttonText.color).toBe(colors.backgroundDark);
    expect(commonStyles.buttonText.fontSize).toBe(typography.lg);
    expect(commonStyles.buttonText.fontWeight).toBe(typography.bold);
  });

  it("should have icon wrapper styles", () => {
    expect(commonStyles.iconWrapper).toBeDefined();
    expect(commonStyles.iconWrapper.padding).toBe(spacing.sm);
    expect(commonStyles.iconWrapper.borderRadius).toBe(borderRadius.sm);
    expect(commonStyles.iconWrapper.alignItems).toBe("center");
    expect(commonStyles.iconWrapper.justifyContent).toBe("center");

    expect(commonStyles.iconWrapperPrimary).toBeDefined();
    expect(commonStyles.iconWrapperPrimary.padding).toBe(spacing.sm);
    expect(commonStyles.iconWrapperPrimary.backgroundColor).toBe(colors.primaryOpacity10);
    expect(commonStyles.iconWrapperPrimary.borderRadius).toBe(borderRadius.sm);

    expect(commonStyles.iconWrapperMagenta).toBeDefined();
    expect(commonStyles.iconWrapperMagenta.padding).toBe(spacing.sm);
    expect(commonStyles.iconWrapperMagenta.backgroundColor).toBe(colors.magentaOpacity10);
    expect(commonStyles.iconWrapperMagenta.borderRadius).toBe(borderRadius.sm);
  });

  it("should have flex utility styles", () => {
    expect(commonStyles.flexRow).toBeDefined();
    expect(commonStyles.flexRow.flexDirection).toBe("row");

    expect(commonStyles.flexColumn).toBeDefined();
    expect(commonStyles.flexColumn.flexDirection).toBe("column");

    expect(commonStyles.flexCenter).toBeDefined();
    expect(commonStyles.flexCenter.alignItems).toBe("center");
    expect(commonStyles.flexCenter.justifyContent).toBe("center");

    expect(commonStyles.flexBetween).toBeDefined();
    expect(commonStyles.flexBetween.justifyContent).toBe("space-between");

    expect(commonStyles.flex1).toBeDefined();
    expect(commonStyles.flex1.flex).toBe(1);
  });

  it("should have gap utility styles", () => {
    expect(commonStyles.gap4).toBeDefined();
    expect(commonStyles.gap4.gap).toBe(spacing.xs);

    expect(commonStyles.gap8).toBeDefined();
    expect(commonStyles.gap8.gap).toBe(spacing.sm);

    expect(commonStyles.gap12).toBeDefined();
    expect(commonStyles.gap12.gap).toBe(spacing.md);

    expect(commonStyles.gap16).toBeDefined();
    expect(commonStyles.gap16.gap).toBe(spacing.lg);

    expect(commonStyles.gap24).toBeDefined();
    expect(commonStyles.gap24.gap).toBe(spacing.xxl);
  });

  it("should have margin utility styles", () => {
    expect(commonStyles.mb8).toBeDefined();
    expect(commonStyles.mb8.marginBottom).toBe(spacing.sm);

    expect(commonStyles.mb12).toBeDefined();
    expect(commonStyles.mb12.marginBottom).toBe(spacing.md);

    expect(commonStyles.mb16).toBeDefined();
    expect(commonStyles.mb16.marginBottom).toBe(spacing.lg);

    expect(commonStyles.mb24).toBeDefined();
    expect(commonStyles.mb24.marginBottom).toBe(spacing.xxl);

    expect(commonStyles.mt8).toBeDefined();
    expect(commonStyles.mt8.marginTop).toBe(spacing.sm);

    expect(commonStyles.mt16).toBeDefined();
    expect(commonStyles.mt16.marginTop).toBe(spacing.lg);

    expect(commonStyles.mt24).toBeDefined();
    expect(commonStyles.mt24.marginTop).toBe(spacing.xxl);
  });

  it("should have padding utility styles", () => {
    expect(commonStyles.p16).toBeDefined();
    expect(commonStyles.p16.padding).toBe(spacing.lg);

    expect(commonStyles.p24).toBeDefined();
    expect(commonStyles.p24.padding).toBe(spacing.xxl);

    expect(commonStyles.px16).toBeDefined();
    expect(commonStyles.px16.paddingHorizontal).toBe(spacing.lg);

    expect(commonStyles.py16).toBeDefined();
    expect(commonStyles.py16.paddingVertical).toBe(spacing.lg);
  });

  it("should have border utility styles", () => {
    expect(commonStyles.borderPrimary).toBeDefined();
    expect(commonStyles.borderPrimary.borderWidth).toBe(1);
    expect(commonStyles.borderPrimary.borderColor).toBe(colors.primaryOpacity30);

    expect(commonStyles.borderWhite5).toBeDefined();
    expect(commonStyles.borderWhite5.borderWidth).toBe(1);
    expect(commonStyles.borderWhite5.borderColor).toBe(colors.borderWhite5);
  });

  it("should have shadow utility styles", () => {
    expect(commonStyles.shadowSmall).toBeDefined();
    expect(commonStyles.shadowSmall).toEqual(shadows.small);

    expect(commonStyles.shadowMedium).toBeDefined();
    expect(commonStyles.shadowMedium).toEqual(shadows.medium);

    expect(commonStyles.shadowLarge).toBeDefined();
    expect(commonStyles.shadowLarge).toEqual(shadows.large);

    expect(commonStyles.shadowXL).toBeDefined();
    expect(commonStyles.shadowXL).toEqual(shadows.xl);

    expect(commonStyles.shadowPrimaryGlow).toBeDefined();
    expect(commonStyles.shadowPrimaryGlow).toEqual(shadows.primaryGlow);
  });
});

describe("index exports", () => {
  it("should export colors", () => {
    expect(exportedColors).toBeDefined();
    expect(exportedColors).toBe(colors);
  });

  it("should export spacing", () => {
    expect(exportedSpacing).toBeDefined();
    expect(exportedSpacing).toBe(spacing);
  });

  it("should export borderRadius", () => {
    expect(exportedBorderRadius).toBeDefined();
    expect(exportedBorderRadius).toBe(borderRadius);
  });

  it("should export typography", () => {
    expect(exportedTypography).toBeDefined();
    expect(exportedTypography).toBe(typography);
  });

  it("should export shadows", () => {
    expect(exportedShadows).toBeDefined();
    expect(exportedShadows).toBe(shadows);
  });

  it("should export commonStyles", () => {
    expect(exportedCommonStyles).toBeDefined();
    expect(exportedCommonStyles).toBe(commonStyles);
  });

  it("should export theme object with all style modules", () => {
    expect(theme).toBeDefined();
    expect(typeof theme).toBe("object");
    expect(theme.colors).toBe(colors);
    expect(theme.spacing).toBe(spacing);
    expect(theme.borderRadius).toBe(borderRadius);
    expect(theme.typography).toBe(typography);
    expect(theme.shadows).toBe(shadows);
  });
});

describe("judgement styles", () => {
  describe("viewStyles", () => {
    it("should export viewStyles object", () => {
      expect(viewStyles).toBeDefined();
      expect(typeof viewStyles).toBe("object");
    });

    it("should have container style", () => {
      expect(viewStyles.container).toBeDefined();
      expect(viewStyles.container.flex).toBe(1);
      expect(viewStyles.container.backgroundColor).toBe(colors.backgroundDark);
    });

    it("should have centered style", () => {
      expect(viewStyles.centered).toBeDefined();
      expect(viewStyles.centered.justifyContent).toBe("center");
      expect(viewStyles.centered.alignItems).toBe("center");
    });

    it("should have header style", () => {
      expect(viewStyles.header).toBeDefined();
      expect(viewStyles.header.flexDirection).toBe("row");
      expect(viewStyles.header.alignItems).toBe("center");
    });

    it("should have backButton style", () => {
      expect(viewStyles.backButton).toBeDefined();
      expect(viewStyles.backButton.width).toBe(40);
      expect(viewStyles.backButton.height).toBe(40);
      expect(viewStyles.backButton.borderRadius).toBe(borderRadius.md);
    });

    it("should have cardStack style", () => {
      expect(viewStyles.cardStack).toBeDefined();
      expect(viewStyles.cardStack.flex).toBe(1);
      expect(viewStyles.cardStack.alignItems).toBe("center");
    });

    it("should have card style", () => {
      expect(viewStyles.card).toBeDefined();
      expect(viewStyles.card.width).toBe("100%");
      expect(viewStyles.card.backgroundColor).toBe(colors.cardDark);
      expect(viewStyles.card.borderRadius).toBe(borderRadius.xl);
    });

    it("should have cardBack style", () => {
      expect(viewStyles.cardBack).toBeDefined();
      expect(viewStyles.cardBack.position).toBe("absolute");
      expect(viewStyles.cardBack.width).toBe("100%");
    });

    it("should have cardHeader style", () => {
      expect(viewStyles.cardHeader).toBeDefined();
      expect(viewStyles.cardHeader.flexDirection).toBe("row");
      expect(viewStyles.cardHeader.alignItems).toBe("center");
    });

    it("should have groupAvatar style", () => {
      expect(viewStyles.groupAvatar).toBeDefined();
      expect(viewStyles.groupAvatar.width).toBe(48);
      expect(viewStyles.groupAvatar.height).toBe(48);
      expect(viewStyles.groupAvatar.borderRadius).toBe(borderRadius.full);
    });

    it("should have mediaWrapper style", () => {
      expect(viewStyles.mediaWrapper).toBeDefined();
      expect(viewStyles.mediaWrapper.borderRadius).toBe(borderRadius.lg);
      expect(viewStyles.mediaWrapper.overflow).toBe("hidden");
    });

    it("should have mediaImage style", () => {
      expect(viewStyles.mediaImage).toBeDefined();
      expect(viewStyles.mediaImage.width).toBe("100%");
      expect(viewStyles.mediaImage.height).toBe(260);
    });

    it("should have mediaBadge style", () => {
      expect(viewStyles.mediaBadge).toBeDefined();
      expect(viewStyles.mediaBadge.position).toBe("absolute");
      expect(viewStyles.mediaBadge.flexDirection).toBe("row");
    });

    it("should have videoPlaceholder style", () => {
      expect(viewStyles.videoPlaceholder).toBeDefined();
      expect(viewStyles.videoPlaceholder.height).toBe(260);
      expect(viewStyles.videoPlaceholder.alignItems).toBe("center");
    });

    it("should have fullscreenImageContainer style", () => {
      expect(viewStyles.fullscreenImageContainer).toBeDefined();
      expect(viewStyles.fullscreenImageContainer.flex).toBe(1);
      expect(viewStyles.fullscreenImageContainer.backgroundColor).toBe(colors.backgroundDark);
    });

    it("should have fullscreenImage style", () => {
      expect(viewStyles.fullscreenImage).toBeDefined();
      expect(viewStyles.fullscreenImage.width).toBe("100%");
      expect(viewStyles.fullscreenImage.height).toBe("100%");
    });

    it("should have textBlock style", () => {
      expect(viewStyles.textBlock).toBeDefined();
      expect(viewStyles.textBlock.backgroundColor).toBe(colors.backgroundDarkOpacity50);
      expect(viewStyles.textBlock.borderRadius).toBe(borderRadius.md);
    });

    it("should have locationBlock style", () => {
      expect(viewStyles.locationBlock).toBeDefined();
      expect(viewStyles.locationBlock.flexDirection).toBe("row");
      expect(viewStyles.locationBlock.alignItems).toBe("center");
    });

    it("should have cardPlaceholder style", () => {
      expect(viewStyles.cardPlaceholder).toBeDefined();
      expect(viewStyles.cardPlaceholder.flex).toBe(1);
      expect(viewStyles.cardPlaceholder.alignItems).toBe("center");
    });

    it("should have stamp style", () => {
      expect(viewStyles.stamp).toBeDefined();
      expect(viewStyles.stamp.position).toBe("absolute");
      expect(viewStyles.stamp.top).toBe(spacing.lg);
    });

    it("should have stampApprove style", () => {
      expect(viewStyles.stampApprove).toBeDefined();
      expect(viewStyles.stampApprove.right).toBe(spacing.lg);
      expect(viewStyles.stampApprove.borderColor).toBe(colors.primary);
    });

    it("should have stampReject style", () => {
      expect(viewStyles.stampReject).toBeDefined();
      expect(viewStyles.stampReject.right).toBe(spacing.lg);
      expect(viewStyles.stampReject.borderColor).toBe(colors.red400);
    });

    it("should have actions style", () => {
      expect(viewStyles.actions).toBeDefined();
      expect(viewStyles.actions.flexDirection).toBe("row");
      expect(viewStyles.actions.justifyContent).toBe("space-between");
    });

    it("should have actionButton style", () => {
      expect(viewStyles.actionButton).toBeDefined();
      expect(viewStyles.actionButton.width).toBe(64);
      expect(viewStyles.actionButton.height).toBe(64);
      expect(viewStyles.actionButton.borderRadius).toBe(borderRadius.full);
    });

    it("should have rejectButton style", () => {
      expect(viewStyles.rejectButton).toBeDefined();
      expect(viewStyles.rejectButton.backgroundColor).toBe(colors.red400);
    });

    it("should have approveButton style", () => {
      expect(viewStyles.approveButton).toBeDefined();
      expect(viewStyles.approveButton.backgroundColor).toBe(colors.primary);
    });

    it("should have emptyCard style", () => {
      expect(viewStyles.emptyCard).toBeDefined();
      expect(viewStyles.emptyCard.alignItems).toBe("center");
      expect(viewStyles.emptyCard.justifyContent).toBe("center");
    });

    it("should have rejectReasonBackdrop style", () => {
      expect(viewStyles.rejectReasonBackdrop).toBeDefined();
      expect(viewStyles.rejectReasonBackdrop.flex).toBe(1);
      expect(viewStyles.rejectReasonBackdrop.backgroundColor).toBe(colors.backgroundDarkOpacity80);
    });

    it("should have rejectReasonCard style", () => {
      expect(viewStyles.rejectReasonCard).toBeDefined();
      expect(viewStyles.rejectReasonCard.backgroundColor).toBe(colors.cardDark);
      expect(viewStyles.rejectReasonCard.borderRadius).toBe(borderRadius.lg);
    });

    it("should have rejectReasonInput style", () => {
      expect(viewStyles.rejectReasonInput).toBeDefined();
      expect(viewStyles.rejectReasonInput.backgroundColor).toBe(colors.surfaceDark);
      expect(viewStyles.rejectReasonInput.color).toBe(colors.white);
    });

    it("should have rejectReasonActions style", () => {
      expect(viewStyles.rejectReasonActions).toBeDefined();
      expect(viewStyles.rejectReasonActions.flexDirection).toBe("row");
      expect(viewStyles.rejectReasonActions.justifyContent).toBe("flex-end");
    });
  });

  describe("textStyles", () => {
    it("should export textStyles object", () => {
      expect(textStyles).toBeDefined();
      expect(typeof textStyles).toBe("object");
    });

    it("should have headerTitle style", () => {
      expect(textStyles.headerTitle).toBeDefined();
      expect(textStyles.headerTitle.color).toBe(colors.white);
      expect(textStyles.headerTitle.fontSize).toBe(typography.lg);
      expect(textStyles.headerTitle.fontWeight).toBe(typography.bold);
    });

    it("should have headerSubtitle style", () => {
      expect(textStyles.headerSubtitle).toBeDefined();
      expect(textStyles.headerSubtitle.color).toBe(colors.textSecondary);
      expect(textStyles.headerSubtitle.fontSize).toBe(typography.sm);
    });

    it("should have groupName style", () => {
      expect(textStyles.groupName).toBeDefined();
      expect(textStyles.groupName.color).toBe(colors.white);
      expect(textStyles.groupName.fontWeight).toBe(typography.bold);
    });

    it("should have groupHint style", () => {
      expect(textStyles.groupHint).toBeDefined();
      expect(textStyles.groupHint.color).toBe(colors.textSecondary);
      expect(textStyles.groupHint.fontSize).toBe(typography.sm);
    });

    it("should have mediaBadgeText style", () => {
      expect(textStyles.mediaBadgeText).toBeDefined();
      expect(textStyles.mediaBadgeText.color).toBe(colors.white);
      expect(textStyles.mediaBadgeText.fontWeight).toBe(typography.bold);
    });

    it("should have textContent style", () => {
      expect(textStyles.textContent).toBeDefined();
      expect(textStyles.textContent.color).toBe(colors.white);
      expect(textStyles.textContent.fontSize).toBe(typography.base);
    });

    it("should have locationText style", () => {
      expect(textStyles.locationText).toBeDefined();
      expect(textStyles.locationText.color).toBe(colors.textSecondary);
      expect(textStyles.locationText.fontSize).toBe(typography.sm);
    });

    it("should have cardPlaceholderText style", () => {
      expect(textStyles.cardPlaceholderText).toBeDefined();
      expect(textStyles.cardPlaceholderText.color).toBe(colors.textSecondary);
    });

    it("should have stampTextApprove style", () => {
      expect(textStyles.stampTextApprove).toBeDefined();
      expect(textStyles.stampTextApprove.color).toBe(colors.primary);
      expect(textStyles.stampTextApprove.fontWeight).toBe(typography.bold);
    });

    it("should have stampTextReject style", () => {
      expect(textStyles.stampTextReject).toBeDefined();
      expect(textStyles.stampTextReject.color).toBe(colors.red400);
      expect(textStyles.stampTextReject.fontWeight).toBe(typography.bold);
    });

    it("should have actionHintText style", () => {
      expect(textStyles.actionHintText).toBeDefined();
      expect(textStyles.actionHintText.color).toBe(colors.textSecondary);
      expect(textStyles.actionHintText.textTransform).toBe("uppercase");
    });

    it("should have emptyTitle style", () => {
      expect(textStyles.emptyTitle).toBeDefined();
      expect(textStyles.emptyTitle.color).toBe(colors.white);
      expect(textStyles.emptyTitle.fontWeight).toBe(typography.bold);
    });

    it("should have emptyText style", () => {
      expect(textStyles.emptyText).toBeDefined();
      expect(textStyles.emptyText.color).toBe(colors.textSecondary);
      expect(textStyles.emptyText.textAlign).toBe("center");
    });

    it("should have rejectReasonTitle style", () => {
      expect(textStyles.rejectReasonTitle).toBeDefined();
      expect(textStyles.rejectReasonTitle.color).toBe(colors.white);
      expect(textStyles.rejectReasonTitle.fontWeight).toBe(typography.bold);
    });

    it("should have rejectReasonSubtitle style", () => {
      expect(textStyles.rejectReasonSubtitle).toBeDefined();
      expect(textStyles.rejectReasonSubtitle.color).toBe(colors.textSecondary);
      expect(textStyles.rejectReasonSubtitle.fontSize).toBe(typography.sm);
    });

    it("should have rejectReasonCancelText style", () => {
      expect(textStyles.rejectReasonCancelText).toBeDefined();
      expect(textStyles.rejectReasonCancelText.color).toBe(colors.white);
    });

    it("should have rejectReasonConfirmText style", () => {
      expect(textStyles.rejectReasonConfirmText).toBeDefined();
      expect(textStyles.rejectReasonConfirmText.color).toBe(colors.white);
      expect(textStyles.rejectReasonConfirmText.fontWeight).toBe(typography.bold);
    });
  });
});
