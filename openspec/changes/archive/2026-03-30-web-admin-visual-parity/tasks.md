## 1. Design Tokens Package

- [x] 1.1 Create `packages/shared/design-tokens/` directory structure
- [x] 1.2 Create `packages/shared/design-tokens/colors.ts` with all color tokens from native app
- [x] 1.3 Create `packages/shared/design-tokens/spacing.ts` with spacing scale (xs through xxxl)
- [x] 1.4 Create `packages/shared/design-tokens/typography.ts` with font families and size scale
- [x] 1.5 Create `packages/shared/design-tokens/borderRadius.ts` with radius values
- [x] 1.6 Create `packages/shared/design-tokens/index.ts` barrel export
- [x] 1.7 Update `packages/shared/package.json` to export design-tokens subpath

## 2. Web Dark Theme Setup

- [x] 2.1 Install `react-icons` package in `apps/admin-web`
- [x] 2.2 Update `apps/admin-web/src/styles/global.css` to import design tokens
- [x] 2.3 Configure Tailwind `@theme` with dark background colors (`#17181c`, `#1b2828`)
- [x] 2.4 Configure Tailwind `@theme` with primary (`#00ced1`) and accent (`#E533FF`) colors
- [x] 2.5 Configure Tailwind `@theme` with dark-appropriate text colors
- [x] 2.6 Update base body styles to use dark background

## 3. Dashboard Tile Updates

- [x] 3.1 Update `AdminTile.tsx` to accept accent color prop
- [x] 3.2 Replace emoji icons with Ionicons in `AdminTile.tsx`
- [x] 3.3 Define tile configuration with per-tile accent colors matching native
- [x] 3.4 Update `Dashboard.tsx` to pass accent colors to tiles
- [x] 3.5 Update tile styling for dark theme (dark card background, light text)
- [x] 3.6 Implement responsive grid (2 cols mobile, 3-4 tablet, 4 desktop)

## 4. Navigation Restructure

- [x] 4.1 Remove sidebar from `AdminApp.tsx` default layout
- [x] 4.2 Create `MobileNav.tsx` bottom navigation component
- [x] 4.3 Add bottom nav to mobile viewport (< 768px)
- [x] 4.4 Update `Header.tsx` with back navigation for detail pages
- [x] 4.5 Update routing to make dashboard the landing page
- [x] 4.6 Add safe-area-inset padding for mobile bottom nav

## 5. Component Dark Theme Updates

- [x] 5.1 Update `Header.tsx` styling for dark theme
- [x] 5.2 Update detail page containers to use dark card colors
- [x] 5.3 Update any remaining light-themed components
- [x] 5.4 Verify text contrast on all pages

## 6. Testing and Verification

- [x] 6.1 Visual comparison: web dashboard vs native dashboard
- [x] 6.2 Test responsive layout at mobile, tablet, desktop breakpoints
- [x] 6.3 Test navigation flow: dashboard → detail → back to dashboard
- [x] 6.4 Verify all Ionicons render correctly
- [x] 6.5 Check color token values match native app exactly
